import json
import logging
import math
import re
from dataclasses import dataclass, field
from typing import Literal

from models.voice_profile import VoiceProfile
from services.llm.router import llm_call, parse_json_response
from services.stylometrics.divergence import mtld_delta_score as _mtld_delta
from services.stylometrics.divergence import pos_jsd_score as _pos_jsd
from services.stylometrics.features import compute_mtld, compute_pos_distribution
from services.stylometrics.signature import signature_vocab_score as _sig_vocab
from services.voice_dna.embedder import embed_text
from services.voice_dna.pillar import loo_percentile

logger = logging.getLogger(__name__)

# 11-dimension weights (sum = 1.00)
# Dims 1-7: structural surface dimensions
# Dim 8: topic coherence (content embedding LOO percentile)
# Dims 9-11: implicit stylometric dimensions
# signature_vocab raised 0.07→0.10; hook lowered 0.13→0.10 to compensate.
# Signature vocabulary is the strongest single-author identity signal and was
# previously underweighted relative to generic hook-type matching.
DIMENSION_WEIGHTS = {
    "hook_style_score":         0.10,
    "structural_pattern_score": 0.13,
    "vocabulary_register_score":0.10,
    "sentence_rhythm_score":    0.10,
    "paragraph_structure_score":0.07,
    "cta_style_score":          0.07,
    "emotional_register_score": 0.09,
    "style_embedding_score":    0.08,
    "mtld_score":               0.08,
    "pos_jsd_score":            0.08,
    "signature_vocab_score":    0.10,
}

_SENTENCE_SPLIT = re.compile(r"[.!?]+")
_SPECIFICITY = re.compile(r"\b\d+[\.\d]*%?|\$\d+|\d+[KkMmBb]\b|[A-Z][a-z]+\s+[A-Z][a-z]+")
_READER_ADDR = re.compile(r"\byou\b|\byour\b|\byou're\b|\byou've\b|\byou'll\b", re.IGNORECASE)

_HOOK_LABELS: dict[str, str] = {
    "bold_statement": "bold declarative statement",
    "question": "direct question",
    "story": "personal story",
    "contrarian": "contrarian take",
    "data_point": "data point or stat",
    "direct_address": "direct address to reader",
}
_PATTERN_LABELS: dict[str, str] = {
    "problem_insight_proof": "problem → insight → proof",
    "story_lesson": "story → lesson",
    "list_format": "list format",
    "contrarian_claim_evidence": "contrarian claim → evidence",
    "how_to": "step-by-step how-to",
    "observation_question": "observation → question",
}
_CTA_LABELS: dict[str, str] = {
    "implicit_question": "implicit reflection question",
    "explicit_call": "explicit CTA",
    "no_cta": "no CTA",
    "reflection_prompt": "reflection prompt",
}
_TONE_LABELS: dict[str, str] = {
    "analytical": "analytical",
    "pragmatic": "pragmatic",
    "provocative": "provocative",
    "inspirational": "inspirational",
    "conversational": "conversational",
}


@dataclass
class VoiceMatchResult:
    overall_score: int
    hook_style_score: float
    structural_pattern_score: float
    vocabulary_register_score: float
    sentence_rhythm_score: float
    paragraph_structure_score: float
    cta_style_score: float
    emotional_register_score: float
    style_embedding_score: float = 0.5   # topic coherence via LOO percentile
    mtld_score: float = 0.5              # lexical diversity match
    pos_jsd_score: float = 0.5          # POS fingerprint similarity
    signature_vocab_score: float = 0.5  # signature phrase presence


@dataclass
class DimensionDetail:
    key: str
    label: str
    score: float  # 0.0–1.0
    rating: Literal["strong", "fair", "weak"]
    post_label: str      # what this content does
    profile_label: str   # what the Voice DNA expects
    guidance: str        # one-line actionable tip


@dataclass
class VoiceMatchDetailed:
    overall_score: int
    word_count: int
    summary: str
    dimensions: list[DimensionDetail] = field(default_factory=list)


# ── Embedding similarity helpers ─────────────────────────────────────────────

def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


def _compute_style_embedding_score(
    post_embedding: list[float],
    cluster_centroids: list[list[float]] | None,
    loo_dist: list[float] | None = None,
    cluster_id: int | None = None,
) -> float:
    """Topic-coherence score via LOO-calibrated cosine similarity.

    Finds the nearest (or assigned) cluster centroid, computes cosine similarity,
    then converts that similarity to a percentile within the author's own
    intra-corpus LOO distribution - so 1.0 means the post is as topically
    coherent as the best post in the training corpus.

    Falls back to rescaled raw similarity when LOO distribution is unavailable.
    """
    if not cluster_centroids:
        return 0.5
    if cluster_id is not None and 0 <= cluster_id < len(cluster_centroids):
        centroid = cluster_centroids[cluster_id]
    else:
        similarities = [_cosine_similarity(post_embedding, c) for c in cluster_centroids]
        centroid = cluster_centroids[similarities.index(max(similarities))]
    sim = _cosine_similarity(post_embedding, centroid)

    if loo_dist:
        return loo_percentile(sim, loo_dist)
    # Legacy fallback: rescale [0.5, 1.0] → [0.0, 1.0]
    return max(0.0, min(1.0, (sim - 0.5) * 2.0))


# ── Deterministic scorers ──────────────────────────────────────────────────────

def _split_sentences(text: str) -> list[str]:
    return [s.strip() for s in _SENTENCE_SPLIT.split(text) if s.strip()]


def _compute_sentence_rhythm_score(post: str, profile_rhythm: dict) -> float:
    import statistics as _stats

    sentences = _split_sentences(post)
    if not sentences:
        return 0.5
    lengths = [len(s.split()) for s in sentences]
    avg_length = sum(lengths) / len(lengths)
    short_ratio = sum(1 for ln in lengths if ln < 8) / len(lengths)

    profile_avg = profile_rhythm.get("avg_length", 12)
    profile_short = profile_rhythm.get("short_ratio", 0.4)
    profile_std = profile_rhythm.get("length_std")

    avg_score = max(0.0, 1.0 - abs(avg_length - profile_avg) / max(profile_avg, 5))
    short_score = max(0.0, 1.0 - abs(short_ratio - profile_short))

    if profile_std is not None and len(lengths) > 1:
        post_std = _stats.stdev(lengths)
        # Variance score: ±50% of profile_std is acceptable; outside that decays to 0
        variance_score = max(0.0, 1.0 - abs(post_std - profile_std) / max(profile_std, 2.0))
        return avg_score * 0.4 + short_score * 0.3 + variance_score * 0.3

    # Legacy path: profiles built before length_std was added
    return avg_score * 0.6 + short_score * 0.4


def _compute_paragraph_score(post: str, profile_para: dict) -> float:
    paragraphs = [p.strip() for p in post.split("\n\n") if p.strip()]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in post.split("\n") if p.strip()]
    if not paragraphs:
        return 0.5
    single_line_count = sum(1 for p in paragraphs if "\n" not in p)
    actual_ratio = single_line_count / len(paragraphs)
    profile_ratio = profile_para.get("single_line_ratio", 0.7)
    return max(0.0, 1.0 - abs(actual_ratio - profile_ratio))


def _compute_vocab_score(post: str, profile_vocab: dict) -> float:
    words = post.split()
    if not words:
        return 0.5

    avg_word_len = sum(len(w.strip(".,!?;:\"'")) for w in words) / len(words)
    profile_avg_word_len = profile_vocab.get("avg_word_length", 4.5)
    # ±3 chars = 0 score; perfect match = 1.0
    word_len_score = max(0.0, 1.0 - abs(avg_word_len - profile_avg_word_len) / 3.0)

    sentences = _split_sentences(post)
    if not sentences:
        return word_len_score

    # Specificity comparison (present in profile from P1 upgrade)
    if "specificity_score" in profile_vocab:
        specific_count = sum(1 for s in sentences if _SPECIFICITY.search(s))
        actual_specificity = specific_count / len(sentences)
        spec_score = max(0.0, 1.0 - abs(actual_specificity - profile_vocab["specificity_score"]))

        if "reader_address_frequency" in profile_vocab:
            addressed = sum(1 for s in sentences if _READER_ADDR.search(s))
            actual_ra = addressed / len(sentences)
            ra_score = max(0.0, 1.0 - abs(actual_ra - profile_vocab["reader_address_frequency"]))
            return word_len_score * 0.6 + spec_score * 0.2 + ra_score * 0.2

        return word_len_score * 0.7 + spec_score * 0.3

    return word_len_score


# ── LLM classification (one call, four dimensions) ────────────────────────────

async def _classify_post(post: str) -> dict:
    prompt = f"""Classify this LinkedIn post across four dimensions. Return ONLY valid JSON, no preamble.

POST:
{post[:1500]}

{{
  "hook_type": "<bold_statement|question|story|contrarian|data_point|direct_address>",
  "structural_pattern": "<problem_insight_proof|story_lesson|list_format|contrarian_claim_evidence|how_to|observation_question>",
  "cta_style": "<implicit_question|explicit_call|no_cta|reflection_prompt>",
  "tone": "<analytical|pragmatic|provocative|inspirational|conversational>"
}}"""
    response = await llm_call(
        task="scoring",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=100,
        json_mode=True,
    )
    try:
        return parse_json_response(response.content)
    except json.JSONDecodeError:
        logger.error(f"Classification parse failed: {response.content[:200]}")
        return {}


# ── Profile-vs-classification scoring ─────────────────────────────────────────

def _score_hook(
    hook_type: str | None,
    hook_dist: dict,
    variant_type: str = "A",
) -> float:
    if not hook_type or not hook_dist:
        return 0.5
    sorted_hooks = sorted(hook_dist.items(), key=lambda kv: kv[1], reverse=True)
    if not sorted_hooks:
        return 0.5
    if variant_type == "B" and len(sorted_hooks) >= 2:
        # Variant B is scored against the secondary hook to reward genuine diversity
        target_hook, target_freq = sorted_hooks[1]
        return hook_dist.get(hook_type, 0.05) / target_freq if target_freq > 0 else 0.5
    dominant_freq = sorted_hooks[0][1]
    if dominant_freq == 0:
        return 0.5
    return hook_dist.get(hook_type, 0.05) / dominant_freq


def _score_structural_pattern(pattern: str | None, pattern_data: dict) -> float:
    if not pattern or not pattern_data:
        return 0.5
    if pattern == pattern_data.get("dominant", ""):
        return 1.0
    alternatives = [a.get("pattern", "") for a in pattern_data.get("alternatives", [])]
    return 0.60 if pattern in alternatives else 0.25


def _score_cta(cta_style: str | None, cta_data: dict) -> float:
    if not cta_style or not cta_data:
        return 0.5
    return 1.0 if cta_style == cta_data.get("dominant", "") else 0.35


def _score_emotional_register(tone: str | None, emotional_data: dict) -> float:
    if not tone or not emotional_data:
        return 0.5
    dominant_freq = max(emotional_data.values(), default=0.0)
    if dominant_freq == 0:
        return 0.5
    return emotional_data.get(tone, 0.05) / dominant_freq


# ── Shared core ───────────────────────────────────────────────────────────────

async def _score_post_core(
    post: str,
    profile: VoiceProfile,
    variant_type: str = "A",
    cluster_id: int | None = None,
) -> tuple[VoiceMatchResult, dict]:
    """Run all 11 scoring dimensions and return (result, classification_dict).

    variant_type: "A" scores hook against dominant, "B" against secondary.
    cluster_id: when provided (known from few-shot), uses that centroid directly.
    """
    import asyncio as _asyncio

    # ── Deterministic surface scores (synchronous, no I/O) ────────────────────
    sentence_rhythm_score = _compute_sentence_rhythm_score(
        post, profile.sentence_rhythm or {}
    )
    paragraph_structure_score = _compute_paragraph_score(
        post, profile.paragraph_structure or {}
    )
    vocabulary_register_score = _compute_vocab_score(
        post, profile.vocabulary_register or {}
    )

    # ── I/O: embed + classify in parallel ────────────────────────────────────
    post_embedding, classification = await _asyncio.gather(
        embed_text(post),
        _classify_post(post),
    )

    hook_style_score = _score_hook(
        classification.get("hook_type"),
        profile.hook_distribution or {},
        variant_type=variant_type,
    )
    structural_pattern_score = _score_structural_pattern(
        classification.get("structural_pattern"), profile.structural_pattern or {}
    )
    cta_style_score = _score_cta(
        classification.get("cta_style"), profile.cta_style or {}
    )
    emotional_register_score = _score_emotional_register(
        classification.get("tone"), profile.emotional_register or {}
    )

    # ── Dim 8: topic coherence via LOO-calibrated centroid similarity ─────────
    centroids: list | None = profile.cluster_centroids if isinstance(profile.cluster_centroids, list) else None
    loo_dist: list | None = profile.loo_distribution if isinstance(profile.loo_distribution, list) else None
    style_embedding_score = _compute_style_embedding_score(
        post_embedding, centroids, loo_dist=loo_dist, cluster_id=cluster_id
    )

    # ── Dims 9-11: implicit stylometric dimensions ────────────────────────────
    stylo_raw = profile.stylometric_profile
    stylo: dict = stylo_raw if isinstance(stylo_raw, dict) else {}
    post_mtld = compute_mtld(post)
    mtld_s = _mtld_delta(
        post_mtld,
        stylo.get("mtld_mean", 50.0),
        stylo.get("mtld_std", 10.0),
    )

    post_pos = compute_pos_distribution(post)
    pos_s = _pos_jsd(post_pos, stylo.get("pos_distribution", {}))

    lex_sig_raw = profile.lexical_signature
    lex_sig: dict = lex_sig_raw if isinstance(lex_sig_raw, dict) else {}
    sig_phrases = lex_sig.get("signature_phrases", [])
    sig_phrases = sig_phrases if isinstance(sig_phrases, list) else []
    sig_s = _sig_vocab(post, sig_phrases)

    scores = {
        "hook_style_score": hook_style_score,
        "structural_pattern_score": structural_pattern_score,
        "vocabulary_register_score": vocabulary_register_score,
        "sentence_rhythm_score": sentence_rhythm_score,
        "paragraph_structure_score": paragraph_structure_score,
        "cta_style_score": cta_style_score,
        "emotional_register_score": emotional_register_score,
        "style_embedding_score": style_embedding_score,
        "mtld_score": mtld_s,
        "pos_jsd_score": pos_s,
        "signature_vocab_score": sig_s,
    }

    weighted = sum(scores[k] * DIMENSION_WEIGHTS[k] for k in DIMENSION_WEIGHTS)
    overall = min(100, max(0, round(weighted * 100)))

    result = VoiceMatchResult(
        overall_score=overall,
        hook_style_score=hook_style_score,
        structural_pattern_score=structural_pattern_score,
        vocabulary_register_score=vocabulary_register_score,
        sentence_rhythm_score=sentence_rhythm_score,
        paragraph_structure_score=paragraph_structure_score,
        cta_style_score=cta_style_score,
        emotional_register_score=emotional_register_score,
        style_embedding_score=style_embedding_score,
        mtld_score=mtld_s,
        pos_jsd_score=pos_s,
        signature_vocab_score=sig_s,
    )
    return result, classification


# ── Dimension detail builders ──────────────────────────────────────────────────

def _rating(score: float) -> Literal["strong", "fair", "weak"]:
    if score >= 0.75:
        return "strong"
    if score >= 0.50:
        return "fair"
    return "weak"


def _build_dimension_details(
    post: str,
    profile: VoiceProfile,
    classification: dict,
    result: VoiceMatchResult,
) -> list[DimensionDetail]:
    details: list[DimensionDetail] = []

    # ── Hook Style ──────────────────────────────────────────────────────────
    hook_type = classification.get("hook_type", "")
    hook_dist = profile.hook_distribution or {}
    dominant_hook = max(hook_dist, key=lambda k: hook_dist[k]) if hook_dist else ""
    dominant_hook_freq = hook_dist.get(dominant_hook, 0)
    hook_score = result.hook_style_score
    if hook_score >= 0.75:
        hook_guidance = (
            f"Opens with {_HOOK_LABELS.get(hook_type, hook_type)} - your signature opening."
        )
    elif hook_type == dominant_hook:
        hook_guidance = "Hook style matches but is slightly under-represented in your DNA."
    else:
        hook_guidance = (
            f"Used {_HOOK_LABELS.get(hook_type, hook_type) or 'unknown hook'}, but you typically open "
            f"with {_HOOK_LABELS.get(dominant_hook, dominant_hook) or 'your signature hook'}. "
            "Rewrite the first line."
        )
    details.append(DimensionDetail(
        key="hook_style",
        label="Hook Style",
        score=hook_score,
        rating=_rating(hook_score),
        post_label=_HOOK_LABELS.get(hook_type, hook_type) or "unknown",
        profile_label=f"{_HOOK_LABELS.get(dominant_hook, dominant_hook)} ({dominant_hook_freq * 100:.0f}% of your posts)",
        guidance=hook_guidance,
    ))

    # ── Structural Pattern ───────────────────────────────────────────────────
    pattern = classification.get("structural_pattern", "")
    pattern_data = profile.structural_pattern or {}
    dominant_pattern = pattern_data.get("dominant", "")
    alt_patterns = [a.get("pattern", "") for a in pattern_data.get("alternatives", [])]
    pat_score = result.structural_pattern_score
    if pat_score >= 0.75:
        pat_guidance = f"Follows your {_PATTERN_LABELS.get(dominant_pattern, dominant_pattern)} structure."
    elif pattern in alt_patterns:
        pat_guidance = "Close to your style - a minor restructure would lift the score."
    else:
        pat_guidance = (
            f"Uses {_PATTERN_LABELS.get(pattern, pattern) or 'unknown structure'} but your DNA expects "
            f"{_PATTERN_LABELS.get(dominant_pattern, dominant_pattern) or 'your dominant pattern'}."
        )
    details.append(DimensionDetail(
        key="structural_pattern",
        label="Structure",
        score=pat_score,
        rating=_rating(pat_score),
        post_label=_PATTERN_LABELS.get(pattern, pattern) or "unknown",
        profile_label=_PATTERN_LABELS.get(dominant_pattern, dominant_pattern) or "unknown",
        guidance=pat_guidance,
    ))

    # ── Vocabulary Register ───────────────────────────────────────────────────
    words = post.split()
    post_avg_word_len = (
        sum(len(w.strip(".,!?;:\"'")) for w in words) / len(words) if words else 0.0
    )
    vocab_data = profile.vocabulary_register or {}
    profile_avg_word_len = vocab_data.get("avg_word_length", 4.5)
    voc_score = result.vocabulary_register_score
    if voc_score >= 0.75:
        voc_guidance = "Word choice and complexity match your typical register."
    elif post_avg_word_len > profile_avg_word_len:
        voc_guidance = (
            f"Words are slightly more complex than usual "
            f"({post_avg_word_len:.1f} avg vs your {profile_avg_word_len:.1f}). "
            "Simplify some vocabulary."
        )
    else:
        voc_guidance = (
            f"Words are slightly simpler than usual "
            f"({post_avg_word_len:.1f} avg vs your {profile_avg_word_len:.1f}). "
            "Add more domain-specific language."
        )
    details.append(DimensionDetail(
        key="vocabulary_register",
        label="Vocabulary",
        score=voc_score,
        rating=_rating(voc_score),
        post_label=f"{post_avg_word_len:.1f} avg word length",
        profile_label=f"{profile_avg_word_len:.1f} avg word length",
        guidance=voc_guidance,
    ))

    # ── Sentence Rhythm ───────────────────────────────────────────────────────
    sentences = _split_sentences(post)
    if sentences:
        lengths = [len(s.split()) for s in sentences]
        post_avg_sent = sum(lengths) / len(lengths)
        post_short_ratio = sum(1 for ln in lengths if ln < 8) / len(lengths)
    else:
        post_avg_sent, post_short_ratio = 12.0, 0.4
    rhythm_data = profile.sentence_rhythm or {}
    profile_avg_sent = rhythm_data.get("avg_length", 12)
    profile_short_ratio = rhythm_data.get("short_ratio", 0.4)
    rhy_score = result.sentence_rhythm_score
    if rhy_score >= 0.75:
        rhy_guidance = "Sentence length and pacing match your voice."
    else:
        rhy_guidance = (
            f"Avg sentence: {post_avg_sent:.0f} words (your usual: ~{profile_avg_sent:.0f}). "
            f"Short sentences: {post_short_ratio * 100:.0f}% (your usual: {profile_short_ratio * 100:.0f}%)."
        )
    details.append(DimensionDetail(
        key="sentence_rhythm",
        label="Sentence Rhythm",
        score=rhy_score,
        rating=_rating(rhy_score),
        post_label=f"{post_avg_sent:.0f}-word avg, {post_short_ratio * 100:.0f}% short",
        profile_label=f"{profile_avg_sent:.0f}-word avg, {profile_short_ratio * 100:.0f}% short",
        guidance=rhy_guidance,
    ))

    # ── Paragraph Structure ───────────────────────────────────────────────────
    paragraphs = [p.strip() for p in post.split("\n\n") if p.strip()]
    if len(paragraphs) <= 1:
        paragraphs = [p.strip() for p in post.split("\n") if p.strip()]
    post_single_ratio = (
        sum(1 for p in paragraphs if "\n" not in p) / len(paragraphs) if paragraphs else 0.7
    )
    para_data = profile.paragraph_structure or {}
    profile_single_ratio = para_data.get("single_line_ratio", 0.7)
    para_score = result.paragraph_structure_score
    if para_score >= 0.75:
        para_guidance = "Line-break rhythm matches your typical post layout."
    elif post_single_ratio < profile_single_ratio:
        para_guidance = (
            f"{post_single_ratio * 100:.0f}% single-line paragraphs "
            f"(your usual: {profile_single_ratio * 100:.0f}%). Add more line breaks."
        )
    else:
        para_guidance = (
            f"{post_single_ratio * 100:.0f}% single-line paragraphs "
            f"(your usual: {profile_single_ratio * 100:.0f}%). Merge some short lines."
        )
    details.append(DimensionDetail(
        key="paragraph_structure",
        label="Paragraph Layout",
        score=para_score,
        rating=_rating(para_score),
        post_label=f"{post_single_ratio * 100:.0f}% single-line paragraphs",
        profile_label=f"{profile_single_ratio * 100:.0f}% single-line paragraphs",
        guidance=para_guidance,
    ))

    # ── CTA Style ─────────────────────────────────────────────────────────────
    cta = classification.get("cta_style", "")
    cta_data = profile.cta_style or {}
    dominant_cta = cta_data.get("dominant", "")
    cta_score = result.cta_style_score
    if cta_score >= 0.75:
        cta_guidance = f"Closes the way you usually do ({_CTA_LABELS.get(cta, cta)})."
    else:
        cta_guidance = (
            f"Closes with {_CTA_LABELS.get(cta, cta) or 'unknown CTA'}, but you usually use "
            f"{_CTA_LABELS.get(dominant_cta, dominant_cta) or 'your signature close'}."
        )
    details.append(DimensionDetail(
        key="cta_style",
        label="Closing / CTA",
        score=cta_score,
        rating=_rating(cta_score),
        post_label=_CTA_LABELS.get(cta, cta) or "unknown",
        profile_label=_CTA_LABELS.get(dominant_cta, dominant_cta) or "unknown",
        guidance=cta_guidance,
    ))

    # ── Emotional Register ────────────────────────────────────────────────────
    tone = classification.get("tone", "")
    emo_data = profile.emotional_register or {}
    dominant_tone = max(emo_data, key=lambda k: emo_data[k]) if emo_data else ""
    emo_score = result.emotional_register_score
    if emo_score >= 0.75:
        emo_guidance = f"Tone is {_TONE_LABELS.get(tone, tone)} - consistent with your voice."
    else:
        emo_guidance = (
            f"Reads as {_TONE_LABELS.get(tone, tone) or 'unknown tone'} here, but your writing usually feels "
            f"{_TONE_LABELS.get(dominant_tone, dominant_tone) or 'your usual tone'}."
        )
    details.append(DimensionDetail(
        key="emotional_register",
        label="Tone",
        score=emo_score,
        rating=_rating(emo_score),
        post_label=_TONE_LABELS.get(tone, tone) or "unknown",
        profile_label=_TONE_LABELS.get(dominant_tone, dominant_tone) or "unknown",
        guidance=emo_guidance,
    ))

    return details


def _build_summary(overall: int, dimensions: list[DimensionDetail]) -> str:
    strong = [d for d in dimensions if d.rating == "strong"]
    weak = [d for d in dimensions if d.rating == "weak"]
    if overall >= 80:
        if not weak:
            return (
                f"This content sounds strongly like you ({overall}% match). "
                "Your voice is well-preserved across all dimensions."
            )
        weak_label = weak[0].label.lower()
        return f"Strong match at {overall}%. Minor drift in {weak_label} - see below for a quick fix."
    if overall >= 65:
        strong_str = " and ".join(d.label for d in strong[:2]) if strong else "some dimensions"
        weak_str = ", ".join(d.label for d in weak[:2]) if weak else "a few areas"
        verb = "are" if len(strong) != 1 else "is"
        return (
            f"Solid match at {overall}%. {strong_str} {verb} on-point, "
            f"but {weak_str} diverge from your DNA."
        )
    weak_str = ", ".join(d.label for d in weak[:3]) if weak else "multiple dimensions"
    return (
        f"This content scores {overall}% - it diverges from your voice in: {weak_str}. "
        "See the breakdown below."
    )


# ── Public API ─────────────────────────────────────────────────────────────────

async def score_post(
    generated_post: str,
    profile: VoiceProfile,
    variant_type: str = "A",
    cluster_id: int | None = None,
) -> VoiceMatchResult:
    """Score a generated post against the user's voice profile."""
    result, _ = await _score_post_core(
        generated_post, profile, variant_type=variant_type, cluster_id=cluster_id
    )
    return result


async def score_post_detailed(
    post: str,
    profile: VoiceProfile,
    variant_type: str = "A",
) -> VoiceMatchDetailed:
    """Full scoring with per-dimension labels and guidance. Used by DNA-Match feature."""
    result, classification = await _score_post_core(post, profile, variant_type=variant_type)
    word_count = len(post.split())
    dimensions = _build_dimension_details(post, profile, classification, result)
    summary = _build_summary(result.overall_score, dimensions)
    return VoiceMatchDetailed(
        overall_score=result.overall_score,
        word_count=word_count,
        summary=summary,
        dimensions=dimensions,
    )


async def score_all(posts: list[str], profile: VoiceProfile) -> list[VoiceMatchResult]:
    import asyncio
    return list(await asyncio.gather(*[score_post(p, profile) for p in posts]))

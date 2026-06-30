"""Deep fingerprint extraction - Layer 1 of the voice DNA upgrade.

Extracts four dimensions that surface statistics cannot capture:
  - lexical_signature: unique phrases, absent LinkedIn clichés, signature metaphors
  - argument_templates: the recurring reasoning structures this person uses
  - belief_stances: what they consistently believe across topics
  - epistemic_style: how confident they write, their persona, self-reference rate
"""
import asyncio
import json
import logging
import re
from collections import Counter

from services.llm.router import llm_call, parse_json_response

logger = logging.getLogger(__name__)

SAMPLE_SIZE = 25

# Common LinkedIn filler phrases - a good writer usually avoids most of these.
_LINKEDIN_CLICHES = [
    "game changer", "game-changer", "paradigm shift", "think outside the box",
    "synergy", "leverage", "circle back", "move the needle", "deep dive",
    "bandwidth", "low-hanging fruit", "boil the ocean", "value add",
    "at the end of the day", "it is what it is", "hustle", "grind",
    "excited to announce", "thrilled to share", "humbled and honored",
    "grateful for this opportunity", "in today's world", "in this day and age",
    "the reality is", "the truth is", "let that sink in", "unpopular opinion",
    "hot take", "change the world", "make an impact", "add value",
    "thought leader", "influencer", "ecosystem", "holistic", "proactive",
]

_HEDGE_PATTERNS = re.compile(
    r"\b(I think|I believe|I feel|maybe|perhaps|possibly|probably|seems like|it seems|not sure|I'm not|might be)\b",
    re.IGNORECASE,
)
_SELF_REF = re.compile(r"\b(I |my |me |I've|I'm|I'd|I'll|mine)\b", re.IGNORECASE)
_SENTENCE_SPLIT = re.compile(r"[.!?]+")


# ── Deterministic helpers ──────────────────────────────────────────────────────

def _extract_ngrams(text: str, n: int) -> list[str]:
    words = re.findall(r"\b[a-z][a-z''-]{2,}\b", text.lower())
    return [" ".join(words[i : i + n]) for i in range(len(words) - n + 1)]


def _compute_signature_phrases(posts: list[str], top_n: int = 30) -> list[str]:
    """Return phrases that appear in ≥2 posts and are not generic LinkedIn filler."""
    bigram_counts: Counter = Counter()
    trigram_counts: Counter = Counter()
    cliche_set = set(_LINKEDIN_CLICHES)

    for post in posts:
        bigrams = set(_extract_ngrams(post, 2))
        trigrams = set(_extract_ngrams(post, 3))
        bigram_counts.update(bigrams)
        trigram_counts.update(trigrams)

    candidates: list[tuple[str, int]] = []
    for phrase, count in {**bigram_counts, **trigram_counts}.items():
        if count >= 2 and phrase not in cliche_set:
            # Skip stopword-only phrases
            words = phrase.split()
            if any(len(w) > 4 for w in words):
                candidates.append((phrase, count))

    candidates.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in candidates[:top_n]]


def _compute_absent_vocabulary(posts: list[str]) -> list[str]:
    """Return LinkedIn clichés this person never uses."""
    corpus = " ".join(posts).lower()
    return [phrase for phrase in _LINKEDIN_CLICHES if phrase not in corpus]


def _compute_hedge_frequency(posts: list[str]) -> float:
    total_sentences = 0
    hedged_sentences = 0
    for post in posts:
        sentences = [s for s in _SENTENCE_SPLIT.split(post) if s.strip()]
        total_sentences += len(sentences)
        hedged_sentences += sum(1 for s in sentences if _HEDGE_PATTERNS.search(s))
    return round(hedged_sentences / max(total_sentences, 1), 3)


def _compute_self_reference_rate(posts: list[str]) -> float:
    total_sentences = 0
    self_ref_sentences = 0
    for post in posts:
        sentences = [s for s in _SENTENCE_SPLIT.split(post) if s.strip()]
        total_sentences += len(sentences)
        self_ref_sentences += sum(1 for s in sentences if _SELF_REF.search(s))
    return round(self_ref_sentences / max(total_sentences, 1), 3)


# ── LLM-backed extractors ──────────────────────────────────────────────────────

def _posts_preview(posts: list[str], n: int = 20) -> str:
    import random
    sample = random.sample(posts, min(n, len(posts)))
    return "\n---\n".join(p[:1500] for p in sample)


async def _extract_json_safe(task: str, prompt: str) -> dict | list:
    response = await llm_call(
        task="deep_extraction",
        messages=[{"role": "user", "content": prompt}],
        json_mode=True,
        max_tokens=1200,
    )
    try:
        return parse_json_response(response.content)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed for {task}: {e}\nRaw: {response.content[:200]}")
        return {}


async def extract_lexical_signature(posts: list[str]) -> dict:
    signature_phrases = _compute_signature_phrases(posts)
    absent_vocabulary = _compute_absent_vocabulary(posts)

    prompt = f"""Analyze these LinkedIn posts and identify this person's recurring metaphors, analogies, or imagery - phrases they use to explain concepts in a unique way.

Posts:
{_posts_preview(posts, 15)}

Return ONLY valid JSON:
{{
  "signature_metaphors": ["metaphor or analogy 1", "metaphor or analogy 2"]
}}

List up to 8 metaphors. If none are distinctive, return an empty list."""

    result = await _extract_json_safe("lexical_signature_metaphors", prompt)
    metaphors = result.get("signature_metaphors", []) if isinstance(result, dict) else []

    return {
        "signature_phrases": signature_phrases[:20],
        "absent_vocabulary": absent_vocabulary[:15],
        "signature_metaphors": metaphors,
    }


async def extract_argument_templates(posts: list[str]) -> list[dict]:
    prompt = f"""Analyze these LinkedIn posts and identify the 2–4 recurring argument structures this person uses.

Posts:
{_posts_preview(posts, 20)}

For each structure, describe:
- type: a short label (e.g. "problem_counterintuitive_proof", "story_then_lesson", "list_with_context")
- frequency: approximate fraction of posts using this structure (0.0 to 1.0)
- template: a concise description of the progression (e.g. "Hook → Problem setup (2-3 lines) → Counterintuitive insight → Specific evidence → Implication for reader")
- opening_signal: what the opening typically looks like

Return ONLY valid JSON array:
[
  {{"type": "...", "frequency": 0.0, "template": "...", "opening_signal": "..."}}
]"""

    result = await _extract_json_safe("argument_templates", prompt)
    if isinstance(result, list):
        return result[:4]
    if isinstance(result, dict):
        return result.get("templates", [])[:4]
    return []


async def extract_belief_stances(posts: list[str]) -> dict:
    prompt = f"""Analyze these LinkedIn posts and identify the consistent beliefs, positions, and worldviews this person expresses across multiple posts.

Posts:
{_posts_preview(posts, 20)}

Return ONLY valid JSON:
{{
  "positions": [
    {{
      "topic": "topic label (e.g. 'AI tools', 'remote work', 'management')",
      "stance": "one of: advocate/skeptic/pragmatist/contrarian/neutral",
      "summary": "one sentence describing their view",
      "evidence_count": <integer, how many posts reflect this>
    }}
  ]
}}

List 3–7 positions. Only include topics with clear, repeated evidence (evidence_count >= 2)."""

    result = await _extract_json_safe("belief_stances", prompt)
    if isinstance(result, dict):
        return result
    return {"positions": []}


async def extract_epistemic_style(posts: list[str]) -> dict:
    hedge_freq = _compute_hedge_frequency(posts)
    self_ref_rate = _compute_self_reference_rate(posts)

    prompt = f"""Analyze the writing persona and confidence style of these LinkedIn posts.

Posts:
{_posts_preview(posts, 15)}

Return ONLY valid JSON:
{{
  "persona": "one of: practitioner/theorist/storyteller/analyst/contrarian",
  "confidence_level": <float 0-1, 0=heavily hedged, 1=assertive and declarative>,
  "authority_basis": "one of: personal_experience/data_evidence/frameworks/observation/mixed"
}}"""

    result = await _extract_json_safe("epistemic_style", prompt)
    base = result if isinstance(result, dict) else {}

    return {
        "persona": base.get("persona", "practitioner"),
        "confidence_level": float(base.get("confidence_level", 1.0 - hedge_freq)),
        "self_reference_rate": self_ref_rate,
        "hedge_frequency": hedge_freq,
        "authority_basis": base.get("authority_basis", "personal_experience"),
    }


_ARG_TYPE_VALID_TYPES = {
    "story_lesson", "list_format", "contrarian_claim_evidence",
    "how_to", "observation_question", "problem_insight_proof",
}


async def _classify_batch(batch: list[str], batch_label: str) -> list[str]:
    items = json.dumps([{"index": j, "text": p[:400]} for j, p in enumerate(batch)], ensure_ascii=False)
    prompt = f"""Classify each LinkedIn post into exactly one structural type:
- story_lesson: tells a story then draws a lesson
- list_format: main structure is a list (numbered or bulleted)
- contrarian_claim_evidence: makes contrarian claim then proves it
- how_to: step-by-step instructional
- observation_question: makes observation then poses a question
- problem_insight_proof: describes problem, gives insight, proves it

Posts:
{items}

Return ONLY valid JSON:
{{"classifications": ["type_for_index_0", "type_for_index_1", ...]}}"""

    result = await _extract_json_safe(batch_label, prompt)
    raw_types = result.get("classifications", []) if isinstance(result, dict) else []

    types = [t if t in _ARG_TYPE_VALID_TYPES else "problem_insight_proof" for t in raw_types]
    # Pad if LLM returned fewer than batch size
    while len(types) < len(batch):
        types.append("problem_insight_proof")
    return types[: len(batch)]


async def classify_argument_types(posts: list[str]) -> list[str]:
    """Classify each post into one of 6 argument types. Returns list parallel to posts.

    Batches of 15 run concurrently instead of sequentially - for a 50-200
    post LinkedIn import (the recommended onboarding path), this was 4-14
    sequential LLM round trips and the dominant latency cost of the whole
    voice DNA build, since every other extraction stage is already a single
    parallel batch.
    """
    BATCH = 15
    batches = [posts[i : i + BATCH] for i in range(0, len(posts), BATCH)]
    results = await asyncio.gather(
        *[_classify_batch(batch, f"arg_type_batch_{i * BATCH}") for i, batch in enumerate(batches)]
    )
    all_types = [t for batch_types in results for t in batch_types]
    return all_types[: len(posts)]


# ── Orchestrator ───────────────────────────────────────────────────────────────

async def extract_deep_fingerprint(posts: list[str]) -> dict:
    """Run all four deep extractors in parallel. Returns dict with all four keys."""
    lexical, templates, beliefs, epistemic = await asyncio.gather(
        extract_lexical_signature(posts),
        extract_argument_templates(posts),
        extract_belief_stances(posts),
        extract_epistemic_style(posts),
        return_exceptions=True,
    )

    def _safe(result: object, fallback: object) -> object:
        if isinstance(result, Exception):
            logger.error(f"Deep extractor failed: {result}")
            return fallback
        return result

    return {
        "lexical_signature": _safe(lexical, {"signature_phrases": [], "absent_vocabulary": [], "signature_metaphors": []}),
        "argument_templates": _safe(templates, []),
        "belief_stances": _safe(beliefs, {"positions": []}),
        "epistemic_style": _safe(epistemic, {"persona": "practitioner", "confidence_level": 0.7, "self_reference_rate": 0.5, "hedge_frequency": 0.1, "authority_basis": "personal_experience"}),
    }

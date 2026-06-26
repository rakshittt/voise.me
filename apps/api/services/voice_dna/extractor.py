import asyncio
import json
import logging
import random
import re
from statistics import mean, stdev

from services.llm.router import llm_call

logger = logging.getLogger(__name__)

SAMPLE_SIZE = 20

_SPECIFICITY = re.compile(r"\b\d+[\.\d]*%?|\$\d+|\d+[KkMmBb]\b|[A-Z][a-z]+\s+[A-Z][a-z]+")
_READER_ADDR = re.compile(r"\byou\b|\byour\b|\byou're\b|\byou've\b|\byou'll\b", re.IGNORECASE)
_SENTENCE_SPLIT = re.compile(r"[.!?]+")
_PARA_SPLIT = re.compile(r"\n\s*\n")
_WORD_RE = re.compile(r"\b[a-zA-Z]+\b")


def _sample_posts(posts: list[str], n: int = SAMPLE_SIZE) -> list[str]:
    return random.sample(posts, min(n, len(posts)))


def _posts_to_json(posts: list[str]) -> str:
    return json.dumps([{"index": i, "text": p[:500]} for i, p in enumerate(posts)], ensure_ascii=False)


async def _extract_json(task: str, prompt: str) -> dict:
    response = await llm_call(task="extraction", messages=[{"role": "user", "content": prompt}], json_mode=True)
    try:
        return json.loads(response.content)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse failed for {task}: {e}\nRaw: {response.content[:200]}")
        return {}


# ── Deterministic helpers ──────────────────────────────────────────────────────

def _compute_specificity_score(posts: list[str]) -> float:
    scores: list[float] = []
    for post in posts:
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(post) if s.strip()]
        if not sentences:
            continue
        specific = sum(1 for s in sentences if _SPECIFICITY.search(s))
        scores.append(specific / len(sentences))
    return round(sum(scores) / len(scores), 3) if scores else 0.0


def _compute_reader_address_frequency(posts: list[str]) -> float:
    scores: list[float] = []
    for post in posts:
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(post) if s.strip()]
        if not sentences:
            continue
        addressed = sum(1 for s in sentences if _READER_ADDR.search(s))
        scores.append(addressed / len(sentences))
    return round(sum(scores) / len(scores), 3) if scores else 0.0


def _compute_sentence_length_std(posts: list[str]) -> float:
    all_lengths: list[int] = []
    for post in posts:
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(post) if s.strip()]
        all_lengths.extend(len(s.split()) for s in sentences)
    if len(all_lengths) < 2:
        return 6.0
    return round(stdev(all_lengths), 1)


def _compute_sentence_rhythm_stats(posts: list[str]) -> dict:
    """Fully deterministic sentence rhythm - no LLM estimation."""
    all_lengths: list[int] = []
    for post in posts:
        sentences = [s.strip() for s in _SENTENCE_SPLIT.split(post) if s.strip()]
        all_lengths.extend(len(s.split()) for s in sentences)
    if not all_lengths:
        return {"avg_length": 12.0, "short_ratio": 0.4, "long_ratio": 0.1, "length_std": 6.0}
    avg = sum(all_lengths) / len(all_lengths)
    short = sum(1 for length in all_lengths if length < 8) / len(all_lengths)
    long_ = sum(1 for length in all_lengths if length > 20) / len(all_lengths)
    return {
        "avg_length": round(avg, 1),
        "short_ratio": round(short, 3),
        "long_ratio": round(long_, 3),
        "length_std": round(stdev(all_lengths), 1) if len(all_lengths) >= 2 else 6.0,
    }


def _compute_paragraph_stats(posts: list[str]) -> dict:
    """Fully deterministic paragraph structure - no LLM estimation."""
    total = 0
    single_line = 0
    line_counts: list[int] = []

    for post in posts:
        # LinkedIn posts use double-newline between paragraphs
        paras = [p.strip() for p in _PARA_SPLIT.split(post) if p.strip()]
        # Fall back to single newline if no blank lines found
        if len(paras) <= 1:
            paras = [p.strip() for p in post.split("\n") if p.strip()]
        for para in paras:
            lines = [line.strip() for line in para.split("\n") if line.strip()]
            n_lines = max(len(lines), 1)
            total += 1
            line_counts.append(n_lines)
            if n_lines == 1:
                single_line += 1

    if total == 0:
        return {"single_line_ratio": 0.7, "avg_paragraph_length": 1.5}
    return {
        "single_line_ratio": round(single_line / total, 3),
        "avg_paragraph_length": round(mean(line_counts), 2),
    }


def _compute_avg_word_length(posts: list[str]) -> float:
    """Deterministic average character length per word across corpus."""
    words = []
    for post in posts:
        words.extend(_WORD_RE.findall(post))
    if not words:
        return 4.5
    return round(sum(len(w) for w in words) / len(words), 2)


def _first_line(post: str) -> str:
    """First non-empty line (the hook)."""
    for line in post.split("\n"):
        stripped = line.strip()
        if stripped:
            return stripped[:250]
    return post[:250]


def _last_lines(post: str, n: int = 3) -> str:
    """Last n non-empty lines (where the CTA lives)."""
    lines = [line.strip() for line in post.split("\n") if line.strip()]
    return " ".join(lines[-n:])[:300]


# ── LLM-backed extractors ──────────────────────────────────────────────────────

async def extract_hook_distribution(posts: list[str], sample: list[str] | None = None) -> dict:
    if sample is None:
        sample = _sample_posts(posts)
    # Only send the first line of each post - that's the hook
    hooks_json = json.dumps(
        [{"index": i, "hook": _first_line(p)} for i, p in enumerate(sample)],
        ensure_ascii=False,
    )
    prompt = f"""Classify the opening line of each LinkedIn post into exactly one hook category:
- bold_statement: declarative claim without hedging
- question: opening question to the reader
- story: personal narrative or scene-setting
- contrarian: contradicts conventional wisdom
- data_point: opening statistic or number
- direct_address: directly addresses the reader

Post opening lines:
{hooks_json}

Respond with ONLY valid JSON. No preamble.
Format: {{"classifications": ["category1", "category2", ...]}}"""

    result = await _extract_json("hook_distribution", prompt)
    classifications: list[str] = result.get("classifications", [])
    if not classifications:
        return {}
    total = len(classifications)
    counts: dict[str, int] = {}
    for c in classifications:
        counts[c] = counts.get(c, 0) + 1
    return {k: round(v / total, 3) for k, v in counts.items()}


async def extract_sentence_rhythm(posts: list[str], sample: list[str] | None = None) -> dict:
    """Fully deterministic - no LLM call needed."""
    return _compute_sentence_rhythm_stats(posts)


async def extract_paragraph_structure(posts: list[str], sample: list[str] | None = None) -> dict:
    """Fully deterministic - no LLM call needed."""
    return _compute_paragraph_stats(posts)


async def extract_vocabulary_register(posts: list[str], sample: list[str] | None = None) -> dict:
    if sample is None:
        sample = _sample_posts(posts)
    joined = "\n---\n".join(p[:1200] for p in sample[:10])
    prompt = f"""Analyze the vocabulary register of these LinkedIn posts.

Posts:
{joined}

Respond with ONLY valid JSON:
{{"formality_score": <float 0-1, 0=very casual 1=very formal>, "jargon_density": <float 0-1, ratio of industry-specific terms>}}"""

    result = await _extract_json("vocabulary_register", prompt)
    data = {
        "formality_score": float(result.get("formality_score", 0.5)),
        "jargon_density": float(result.get("jargon_density", 0.1)),
        # Computed deterministically from the actual corpus
        "avg_word_length": _compute_avg_word_length(posts),
        "specificity_score": _compute_specificity_score(posts),
        "reader_address_frequency": _compute_reader_address_frequency(posts),
    }
    return data


async def extract_structural_pattern(posts: list[str], sample: list[str] | None = None) -> dict:
    if sample is None:
        sample = _sample_posts(posts)
    # Use up to 1500 chars so the full structure is visible
    posts_json = json.dumps(
        [{"index": i, "text": p[:1500]} for i, p in enumerate(sample)],
        ensure_ascii=False,
    )
    prompt = f"""Analyze the structural pattern of these LinkedIn posts. Each post follows one of:
- problem_insight_proof: identifies problem, offers insight, proves it
- story_lesson: tells a story then draws lesson
- list_format: uses numbered or bulleted list as main format
- contrarian_claim_evidence: makes contrarian claim then backs it up
- how_to: step-by-step instructional format
- observation_question: makes observation then poses question

Posts:
{posts_json}

Respond with ONLY valid JSON:
{{"dominant": "pattern_name", "frequency": <float 0-1>, "alternatives": [{{"pattern": "name", "frequency": <float>}}]}}"""

    result = await _extract_json("structural_pattern", prompt)
    return {
        "dominant": result.get("dominant", "problem_insight_proof"),
        "frequency": float(result.get("frequency", 0.5)),
        "alternatives": result.get("alternatives", []),
    }


async def extract_cta_style(posts: list[str], sample: list[str] | None = None) -> dict:
    if sample is None:
        sample = _sample_posts(posts)
    # Only send the last 3 lines of each post - that's where CTAs live
    cta_json = json.dumps(
        [{"index": i, "ending": _last_lines(p)} for i, p in enumerate(sample)],
        ensure_ascii=False,
    )
    prompt = f"""Classify the ending of each LinkedIn post. Endings are:
- implicit_question: ends with a subtle or direct question
- explicit_call: direct call to action ("DM me", "share this", etc.)
- no_cta: no call to action, just ends with a statement or observation
- reflection_prompt: invites reader to reflect without a direct ask

Post endings:
{cta_json}

Respond with ONLY valid JSON:
{{"dominant": "style_name", "frequency": <float 0-1>, "none_ratio": <float 0-1>}}"""

    result = await _extract_json("cta_style", prompt)
    return {
        "dominant": result.get("dominant", "implicit_question"),
        "frequency": float(result.get("frequency", 0.5)),
        "none_ratio": float(result.get("none_ratio", 0.2)),
    }


async def extract_emotional_register(posts: list[str], sample: list[str] | None = None) -> dict:
    if sample is None:
        sample = _sample_posts(posts)
    joined = "\n---\n".join(p[:1200] for p in sample[:12])
    prompt = f"""Analyze the emotional register and tone of these LinkedIn posts. Score 0-1 for each:
- analytical: data-driven, logical reasoning
- pragmatic: practical, action-oriented, no-nonsense
- provocative: challenges, disrupts, deliberately controversial
- inspirational: uplifting, motivational
- conversational: casual, warm, like talking to a friend

Posts:
{joined}

Scores must sum to 1.0. Respond with ONLY valid JSON:
{{"analytical": <float>, "pragmatic": <float>, "provocative": <float>, "inspirational": <float>, "conversational": <float>}}"""

    result = await _extract_json("emotional_register", prompt)
    keys = ["analytical", "pragmatic", "provocative", "inspirational", "conversational"]
    raw = {k: float(result.get(k, 0.2)) for k in keys}

    # Normalise to sum to 1.0 in case LLM returns slightly off values
    total = sum(raw.values())
    if total > 0:
        return {k: round(v / total, 3) for k, v in raw.items()}
    return dict.fromkeys(keys, 0.2)


# ── Orchestrator ───────────────────────────────────────────────────────────────

async def extract_all_dimensions(posts: list[str]) -> dict:
    """Run all dimension extractors. Deterministic ones resolve immediately."""
    sample = _sample_posts(posts)

    results = await asyncio.gather(
        extract_hook_distribution(posts, sample=sample),
        extract_sentence_rhythm(posts, sample=sample),
        extract_paragraph_structure(posts, sample=sample),
        extract_vocabulary_register(posts, sample=sample),
        extract_structural_pattern(posts, sample=sample),
        extract_cta_style(posts, sample=sample),
        extract_emotional_register(posts, sample=sample),
        return_exceptions=True,
    )

    keys = [
        "hook_distribution",
        "sentence_rhythm",
        "paragraph_structure",
        "vocabulary_register",
        "structural_pattern",
        "cta_style",
        "emotional_register",
    ]

    output: dict = {}
    for key, result in zip(keys, results, strict=True):
        if isinstance(result, Exception):
            logger.error(f"Dimension extraction failed for {key}: {result}")
            output[key] = {}
        else:
            output[key] = result

    return output

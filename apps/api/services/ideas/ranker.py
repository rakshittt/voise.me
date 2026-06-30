"""Rank idea candidates on 5 axes and return top-N.

Axis weights:
  credibility  0.30  - is this topic in the creator's expertise list?
  novelty      0.25  - how different is this from their existing posts? (pgvector)
  resonance    0.20  - does this format get accepted by the creator?
  voice_fit    0.15  - does this match their dominant hook style?
  specificity  0.10  - does the hook contain concrete details?
"""
import asyncio
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_post import UserPost
from models.voice_profile import VoiceProfile
from schemas.ideas import IdeaItem
from services.ideas.candidate_generator import RawCandidate
from services.ideas.context_builder import IdeaContext
from services.voice_dna.embedder import embed_text

logger = logging.getLogger(__name__)

_WEIGHTS = {
    "credibility": 0.30,
    "novelty": 0.25,
    "resonance": 0.20,
    "voice_fit": 0.15,
    "specificity": 0.10,
}

_HOOK_STYLE_KEYWORDS: dict[str, list[str]] = {
    "bold_statement": ["never", "always", "wrong", "truth", "stop", "dead", "don't"],
    "question": ["?", "why", "what", "how", "when", "have you"],
    "statistic": ["%", "billion", "million", "x more", "x less", "study", "data"],
    "story": ["I ", "me ", "my ", "we ", "our ", "remember when", "years ago"],
    "observation": ["noticed", "seeing", "watch", "every", "most", "pattern"],
}


async def rank_candidates(
    candidates: list[RawCandidate],
    profile: VoiceProfile,
    context: IdeaContext,
    user_id: uuid.UUID,
    session: AsyncSession,
    top_n: int = 5,
) -> list[IdeaItem]:
    """Score all candidates and return the top_n as IdeaItem objects."""
    if not candidates:
        return []

    expertise_topics = [t.lower() for t in context["expertise_topics"]]
    resonance_map = _build_resonance_map(context)
    dominant_hook = _get_dominant_hook(profile)

    # Embed all hooks in parallel for novelty scoring
    hooks = [c.hook for c in candidates]
    try:
        hook_embeddings = await asyncio.gather(*[embed_text(h[:300]) for h in hooks])
    except Exception as e:
        logger.warning("Embedding failed for novelty scoring: %s - skipping novelty axis", e)
        hook_embeddings = [None] * len(candidates)

    # Fetch per-candidate novelty scores via pgvector
    novelty_scores = await _batch_novelty_scores(
        user_id, hook_embeddings, session  # type: ignore[arg-type]
    )

    scored: list[tuple[float, RawCandidate]] = []
    for i, candidate in enumerate(candidates):
        credibility = _score_credibility(candidate, expertise_topics)
        novelty = novelty_scores[i]
        resonance = _score_resonance(candidate, resonance_map)
        voice_fit = _score_voice_fit(candidate, dominant_hook)
        specificity = 1.0 if candidate.has_specific else 0.3

        total = (
            _WEIGHTS["credibility"] * credibility
            + _WEIGHTS["novelty"] * novelty
            + _WEIGHTS["resonance"] * resonance
            + _WEIGHTS["voice_fit"] * voice_fit
            + _WEIGHTS["specificity"] * specificity
        )
        scored.append((total, candidate))

    scored.sort(key=lambda x: x[0], reverse=True)

    return [
        IdeaItem(
            title=c.title,
            hook=c.hook,
            content_type=c.content_type,
            rationale=f"Grounded in: {c.topic_anchor}" if c.topic_anchor else "Matches your voice",
        )
        for _, c in scored[:top_n]
    ]


# ── Axis scorers ──────────────────────────────────────────────────────────────

def _score_credibility(candidate: RawCandidate, expertise_topics: list[str]) -> float:
    """Score based on how high in the expertise list the topic appears."""
    anchor = candidate.topic_anchor.lower()
    for i, topic in enumerate(expertise_topics):
        if topic in anchor or anchor in topic:
            # Position decay: rank 0 → 1.0, rank 14 → ~0.3
            return max(0.3, 1.0 - i * 0.05)
    # Anchor not found in expertise list - still plausible, just lower score
    return 0.2


def _score_resonance(
    candidate: RawCandidate,
    resonance_map: dict[str, float],
) -> float:
    """Score based on whether this format has performed well for this creator."""
    ctype = candidate.content_type.lower().replace("-", "_")
    if ctype in resonance_map:
        return resonance_map[ctype]
    # Unknown format: neutral
    return 0.5


def _score_voice_fit(candidate: RawCandidate, dominant_hook: str) -> float:
    """Heuristic: does the hook text match the creator's dominant hook style?"""
    hook_lower = candidate.hook.lower()
    keywords = _HOOK_STYLE_KEYWORDS.get(dominant_hook, [])
    if not keywords:
        return 0.5
    matches = sum(1 for kw in keywords if kw in hook_lower)
    return min(1.0, 0.3 + matches * 0.35)


# ── Novelty via pgvector ──────────────────────────────────────────────────────

async def _novelty_for_one(
    user_id: uuid.UUID,
    emb: list[float] | None,
    session: AsyncSession,
) -> float:
    if emb is None:
        return 0.5
    try:
        result = await session.execute(
            select(UserPost.content_embedding.cosine_distance(emb).label("dist"))
            .where(UserPost.user_id == user_id, UserPost.content_embedding.is_not(None))
            .order_by("dist")
            .limit(1)
        )
        row = result.fetchone()
        if row is None:
            return 0.5
        dist = float(row[0]) if row[0] is not None else 1.0
        # cosine distance [0, 2] → novelty [0, 1]: dist≥0.5 = fully novel
        return min(1.0, dist / 0.5)
    except Exception as e:
        logger.warning("Novelty pgvector query failed: %s", e)
        return 0.5


async def _batch_novelty_scores(
    user_id: uuid.UUID,
    embeddings: list[list[float] | None],
    session: AsyncSession,
) -> list[float]:
    """Run all pgvector nearest-neighbour queries against the shared session.

    Must be sequential, not gathered: AsyncSession raises InvalidRequestError
    ("concurrent operations are not permitted") if two coroutines call
    execute() on it at the same time - confirmed live, not theoretical. A
    previous version of this used asyncio.gather here, which intermittently
    threw on every candidate and silently fell back to a neutral 0.5 novelty
    score via the except clause below, plus contributed to the page feeling
    slow from the failed/retried queries.
    """
    return [await _novelty_for_one(user_id, emb, session) for emb in embeddings]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _build_resonance_map(context: IdeaContext) -> dict[str, float]:
    """
    Build {argument_type → score} from resonance signals.
    Score = accepted / (accepted + rejected), min-clamped at 0.1.
    """
    result: dict[str, float] = {}
    for sig in context["resonance_signals"]:
        total = sig["accepted_count"] + sig["rejected_count"]
        if total == 0:
            continue
        score = sig["accepted_count"] / total
        result[sig["argument_type"].lower().replace("-", "_")] = max(0.1, score)
    return result


def _get_dominant_hook(profile: VoiceProfile) -> str:
    hook_dist = profile.hook_distribution or {}
    if not hook_dist:
        return "bold_statement"
    return max(hook_dist, key=hook_dist.get)  # type: ignore[arg-type]

"""Hold-out eval harness for Voise profile quality measurement.

For each post held out during profile build:
  1. Summarize it to a topic idea (gpt-4o-mini)
  2. Generate a post for that idea using the just-built profile
  3. Embed both the generated and holdout posts
  4. Compute cosine similarity
  5. Store in voice_profile_evals

The aggregate mean similarity across all holdout posts is an automated measure
of how well the profile generalizes - a rising score over rebuilds means the
user's voice model is improving.
"""
import asyncio
import logging
import math
import uuid

from db.session import AsyncSessionLocal
from models.voice_profile_eval import VoiceProfileEval
from services.llm.router import llm_call
from services.voice_dna.embedder import embed_text

logger = logging.getLogger(__name__)


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x * x for x in a))
    mag_b = math.sqrt(sum(x * x for x in b))
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


async def _summarize_to_idea(post: str) -> str:
    """Extract the core topic idea from a post (gpt-4o-mini, one sentence)."""
    prompt = (
        "In one sentence (max 20 words), state the core topic or insight of this post. "
        "Return only that sentence, nothing else.\n\n"
        + post[:800]
    )
    response = await llm_call(
        task="titling",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=50,
    )
    return response.content.strip()


async def _generate_for_idea(
    user_id: uuid.UUID,
    idea_text: str,
) -> str | None:
    """Generate a post for the given idea using the user's voice profile.

    Opens its own DB session to avoid session-lifetime issues in background tasks.
    Returns the generated content or None if generation fails.
    """
    from sqlalchemy import select

    from models.voice_profile import VoiceProfile
    from services.generation.generator import _generate_one
    from services.generation.prompt_builder import VariantType

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(VoiceProfile).where(
                    VoiceProfile.user_id == user_id,
                    VoiceProfile.status == "ready",
                )
            )
            profile = result.scalar_one_or_none()
            if not profile:
                return None

            from services.generation.few_shot import get_similar_posts

            input_embedding = await embed_text(idea_text)
            few_shots = await get_similar_posts(
                user_id, input_embedding, limit=3, session=session, input_text=idea_text
            )

            variant: VariantType = "A"
            candidate = await _generate_one(profile, few_shots, variant, idea_text)
            return candidate.content
    except Exception as e:
        logger.warning(f"Eval harness generation failed: {e}")
        return None


async def _eval_one(
    user_id: uuid.UUID,
    profile_id: uuid.UUID,
    holdout_post: str,
) -> VoiceProfileEval | None:
    """Run a single holdout post through the eval pipeline."""
    try:
        idea = await _summarize_to_idea(holdout_post)
        generated = await _generate_for_idea(user_id, idea)
        if not generated:
            return None

        holdout_embedding, generated_embedding = await asyncio.gather(
            embed_text(holdout_post),
            embed_text(generated),
        )
        sim = _cosine_similarity(holdout_embedding, generated_embedding)

        return VoiceProfileEval(
            user_id=user_id,
            profile_id=profile_id,
            holdout_content=holdout_post,
            generated_content=generated,
            cosine_similarity=sim,
        )
    except Exception as e:
        logger.warning(f"Eval harness single post failed: {e}")
        return None


async def run_holdout_eval(
    user_id: uuid.UUID,
    profile_id: uuid.UUID,
    holdout_posts: list[str],
) -> None:
    """Run all holdout posts through the eval pipeline and persist results.

    Called as a background task after profile build completes.
    Failures are logged but never propagated - eval is non-blocking.
    """
    logger.info(f"Starting holdout eval for user {user_id}: {len(holdout_posts)} posts")

    evals: list[VoiceProfileEval] = []
    for post in holdout_posts:
        result = await _eval_one(user_id, profile_id, post)
        if result:
            evals.append(result)

    if not evals:
        logger.warning(f"Holdout eval produced no results for user {user_id}")
        return

    async with AsyncSessionLocal() as session:
        for ev in evals:
            session.add(ev)
        await session.commit()

    mean_sim = sum(e.cosine_similarity for e in evals) / len(evals)
    logger.info(
        f"Holdout eval complete for user {user_id}: "
        f"{len(evals)}/{len(holdout_posts)} succeeded, "
        f"mean cosine similarity = {mean_sim:.4f}"
    )

import asyncio
import hashlib
import logging
import random
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import AsyncSessionLocal
from models.idea_context import UserIdeaContext
from models.user_post import UserPost
from models.voice_profile import VoiceProfile
from services.cache.voice_profile_cache import set_cached_profile, set_cached_status
from services.stylometrics.features import compute_stylometric_profile
from services.voice_dna.deep_extractor import classify_argument_types, extract_deep_fingerprint
from services.voice_dna.embedder import compute_mean_embedding, embed_and_store_posts
from services.voice_dna.extractor import extract_all_dimensions
from services.voice_dna.parser import parse_posts
from services.voice_dna.pillar import compute_loo_distribution, compute_pillars

HOLDOUT_COUNT = 5  # posts reserved for eval; excluded from profile build
MIN_POSTS = 5

logger = logging.getLogger(__name__)


async def _expire_idea_context(user_id: uuid.UUID, session: AsyncSession) -> None:
    """Expire the cached idea context so the next /ideas/recommended call rebuilds it."""
    result = await session.execute(
        select(UserIdeaContext).where(UserIdeaContext.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if row is not None:
        row.expires_at = datetime.now(UTC)  # expire immediately
        row.cached_ideas = None
        await session.flush()


def _corpus_hash(posts: list[str]) -> str:
    corpus = "\n\n".join(sorted(posts))
    return hashlib.sha256(corpus.encode()).hexdigest()


def _confidence_level(post_count: int) -> str:
    if post_count >= 50:
        return "high"
    if post_count >= 25:
        return "medium"
    return "low"


async def build_voice_profile(
    user_id: uuid.UUID,
    raw_text: str,
    session: AsyncSession | None = None,
) -> None:
    """
    Full pipeline: parse → embed → extract dimensions → upsert voice_profiles.
    Sets status='ready' on success, 'failed' on error.
    Called as a background task - opens its own session so it is not
    affected by the request session being closed after the response.
    """
    if session is not None:
        await _run_build(user_id, raw_text, session)
        return
    async with AsyncSessionLocal() as session:
        await _run_build(user_id, raw_text, session)


async def _run_build(
    user_id: uuid.UUID,
    raw_text: str,
    session: AsyncSession,
) -> None:
    result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = VoiceProfile(user_id=user_id, status="building")
        session.add(profile)
        await session.flush()
    else:
        profile.status = "building"
        await session.flush()

    await set_cached_status(user_id, "building")

    try:
        # Step 1: Parse posts
        posts = parse_posts(raw_text)
        if len(posts) < MIN_POSTS:
            raise ValueError(f"Only {len(posts)} valid posts found (minimum {MIN_POSTS} required)")

        # Hold out posts for eval (only when we have enough headroom)
        holdout_posts: list[str] = []
        build_posts = posts
        if len(posts) > 15 + HOLDOUT_COUNT:
            indices = random.sample(range(len(posts)), HOLDOUT_COUNT)
            holdout_posts = [posts[i] for i in sorted(indices)]
            build_posts = [p for i, p in enumerate(posts) if i not in set(indices)]

        logger.info(
            f"Building voice profile for user {user_id}: "
            f"{len(build_posts)} build posts, {len(holdout_posts)} holdouts"
        )

        # Step 2: Embed build posts and store in user_posts
        embeddings, post_objects = await embed_and_store_posts(user_id, build_posts, session)

        # Step 3: Compute mean profile embedding
        mean_embedding = compute_mean_embedding(embeddings)

        # Steps 4+5: Run everything in parallel - clustering, arg classification,
        # surface dimensions, deep fingerprint, and stylometrics all fire at once.
        pillar_result, arg_types, dimensions, deep, stylometric_prof = await asyncio.gather(
            asyncio.to_thread(
                compute_pillars, embeddings, min(4, max(1, len(build_posts) // 10))
            ),
            classify_argument_types(build_posts),
            extract_all_dimensions(build_posts),
            extract_deep_fingerprint(build_posts),
            asyncio.to_thread(compute_stylometric_profile, build_posts),
        )
        for post_obj, cluster_id, arg_type in zip(
            post_objects, pillar_result.cluster_ids, arg_types, strict=True
        ):
            post_obj.cluster_id = cluster_id
            post_obj.argument_type = arg_type

        # LOO distribution - fast numpy, runs after pillar is available
        loo_dist = compute_loo_distribution(
            embeddings, pillar_result.cluster_ids, pillar_result.centroids
        )

        # Step 6: Upsert profile
        profile.status = "ready"
        profile.post_count = len(build_posts)
        profile.confidence_level = _confidence_level(len(build_posts))
        profile.hook_distribution = dimensions.get("hook_distribution")
        profile.sentence_rhythm = dimensions.get("sentence_rhythm")
        profile.paragraph_structure = dimensions.get("paragraph_structure")
        profile.vocabulary_register = dimensions.get("vocabulary_register")
        profile.structural_pattern = dimensions.get("structural_pattern")
        profile.cta_style = dimensions.get("cta_style")
        profile.emotional_register = dimensions.get("emotional_register")
        profile.content_pillars = {
            "k": pillar_result.k,
            "cluster_counts": pillar_result.cluster_counts,
        }
        profile.cluster_centroids = pillar_result.centroids
        profile.stylometric_profile = stylometric_prof
        profile.loo_distribution = loo_dist
        profile.lexical_signature = deep["lexical_signature"]
        profile.argument_templates = deep["argument_templates"]
        profile.belief_stances = deep["belief_stances"]
        profile.epistemic_style = deep["epistemic_style"]
        profile.profile_embedding = mean_embedding
        profile.raw_posts_hash = _corpus_hash(build_posts)
        profile.last_built_at = datetime.now(UTC)

        await session.commit()
        logger.info(
            f"Voice profile built successfully for user {user_id} "
            f"({len(build_posts)} posts, {len(holdout_posts)} holdouts)"
        )

        # Populate cache so the next generate/status call is a cache hit
        await set_cached_profile(profile)

        # Expire idea context so dashboard widget shows fresh ideas after rebuild
        await _expire_idea_context(user_id, session)

        # Run eval harness in background - non-blocking, failure is non-fatal
        if holdout_posts:
            try:
                from services.eval.harness import run_holdout_eval
                asyncio.create_task(run_holdout_eval(user_id, profile.id, holdout_posts))
            except Exception as e:
                logger.warning(f"Eval harness failed to start for user {user_id}: {e}")

    except Exception as e:
        logger.error(f"Voice profile build failed for user {user_id}: {e}")
        profile.status = "failed"
        await session.commit()
        await set_cached_status(user_id, "failed")


async def rebuild_voice_profile_from_stored(
    user_id: uuid.UUID,
    session: AsyncSession | None = None,
) -> None:
    """Re-run the analysis pipeline using already-stored post embeddings.

    No re-embedding is performed - uses existing user_posts rows.
    Call this when the extraction algorithms have been improved to refresh
    a profile without requiring the user to re-paste their posts.
    """
    if session is not None:
        await _run_rebuild(user_id, session)
        return
    async with AsyncSessionLocal() as owned_session:
        await _run_rebuild(user_id, owned_session)


async def _run_rebuild(user_id: uuid.UUID, session: AsyncSession) -> None:
    result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        raise ValueError(f"No voice profile for user {user_id}")

    profile.status = "building"
    await session.flush()

    try:
        posts_result = await session.execute(
            select(UserPost)
            .where(UserPost.user_id == user_id)
            .order_by(UserPost.created_at.desc())
        )
        all_post_objs = posts_result.scalars().all()

        # Deduplicate by content (keep most recently created)
        seen: set[str] = set()
        post_objs: list[UserPost] = []
        for p in all_post_objs:
            if p.content not in seen:
                seen.add(p.content)
                post_objs.append(p)

        posts = [p.content for p in post_objs]
        embeddings = [p.content_embedding for p in post_objs if p.content_embedding is not None]

        if len(posts) < MIN_POSTS:
            raise ValueError(f"Not enough stored posts to rebuild ({len(posts)} found, {MIN_POSTS} required)")

        logger.info(f"Rebuilding voice profile for user {user_id}: {len(posts)} stored posts")

        pillar_result, arg_types, dimensions, deep, stylometric_prof = await asyncio.gather(
            asyncio.to_thread(
                compute_pillars, embeddings, min(4, max(1, len(posts) // 10))
            ),
            classify_argument_types(posts),
            extract_all_dimensions(posts),
            extract_deep_fingerprint(posts),
            asyncio.to_thread(compute_stylometric_profile, posts),
        )

        for post_obj, cluster_id, arg_type in zip(post_objs, pillar_result.cluster_ids, arg_types, strict=False):
            post_obj.cluster_id = cluster_id
            post_obj.argument_type = arg_type

        loo_dist = compute_loo_distribution(
            embeddings, pillar_result.cluster_ids, pillar_result.centroids
        )
        mean_embedding = compute_mean_embedding(embeddings)

        profile.status = "ready"
        profile.post_count = len(posts)
        profile.confidence_level = _confidence_level(len(posts))
        profile.hook_distribution = dimensions.get("hook_distribution")
        profile.sentence_rhythm = dimensions.get("sentence_rhythm")
        profile.paragraph_structure = dimensions.get("paragraph_structure")
        profile.vocabulary_register = dimensions.get("vocabulary_register")
        profile.structural_pattern = dimensions.get("structural_pattern")
        profile.cta_style = dimensions.get("cta_style")
        profile.emotional_register = dimensions.get("emotional_register")
        profile.content_pillars = {
            "k": pillar_result.k,
            "cluster_counts": pillar_result.cluster_counts,
        }
        profile.cluster_centroids = pillar_result.centroids
        profile.stylometric_profile = stylometric_prof
        profile.loo_distribution = loo_dist
        profile.lexical_signature = deep["lexical_signature"]
        profile.argument_templates = deep["argument_templates"]
        profile.belief_stances = deep["belief_stances"]
        profile.epistemic_style = deep["epistemic_style"]
        profile.profile_embedding = mean_embedding
        profile.last_built_at = datetime.now(UTC)

        await session.commit()
        logger.info(f"Voice profile rebuilt successfully for user {user_id} ({len(posts)} posts)")

        await _expire_idea_context(user_id, session)

    except Exception as e:
        logger.error(f"Voice profile rebuild failed for user {user_id}: {e}")
        profile.status = "failed"
        await session.commit()
        raise

"""Label content pillar clusters with semantic topic strings."""
import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_post import UserPost
from models.voice_profile import VoiceProfile
from services.cache.voice_profile_cache import set_cached_profile
from services.llm.router import llm_call

logger = logging.getLogger(__name__)

_SAMPLES_PER_CLUSTER = 5


async def label_clusters(
    user_id: uuid.UUID,
    profile: VoiceProfile,
    session: AsyncSession,
) -> dict[str, str]:
    """Return {cluster_id_str: label} for every cluster in the profile.

    Makes a single LLM call with sample posts from all clusters.
    Returns cached labels from content_pillars if already present and complete.
    """
    pillars = profile.content_pillars or {}
    k = pillars.get("k", 0)
    if k == 0:
        return {}

    existing_labels = pillars.get("labels")
    if (
        existing_labels
        and isinstance(existing_labels, dict)
        and len(existing_labels) == k
    ):
        return existing_labels

    cluster_samples: dict[int, list[str]] = {}
    for cluster_id in range(k):
        result = await session.execute(
            select(UserPost.content)
            .where(UserPost.user_id == user_id, UserPost.cluster_id == cluster_id)
            .limit(_SAMPLES_PER_CLUSTER)
        )
        samples = [row[0] for row in result.fetchall()]
        if samples:
            cluster_samples[cluster_id] = samples

    if not cluster_samples:
        return {}

    blocks = []
    for cid, posts in cluster_samples.items():
        excerpts = "\n---\n".join(p[:400] for p in posts)
        blocks.append(f"CLUSTER {cid}:\n{excerpts}")

    prompt = (
        "You are analyzing a LinkedIn creator's content clusters.\n\n"
        "Below are sample posts from each cluster. For each cluster, assign a concise "
        "2-4 word topic label describing what the creator writes about in that cluster.\n\n"
        "Good label examples: 'B2B SaaS Growth', 'Hiring & Culture', 'AI Tools', "
        "'Startup Lessons', 'Personal Brand', 'Leadership'\n\n"
        "=" * 40 + "\n"
        + "\n\n".join(blocks)
        + "\n"
        + "=" * 40
        + f"\n\nReturn ONLY valid JSON: "
        f'{{"0": "label", "1": "label", ...}} for clusters 0 to {k - 1}.'
    )

    try:
        response = await llm_call(
            task="titling",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
            json_mode=True,
        )
        raw = json.loads(response.content)
        labels = {str(cid): v for cid, v in raw.items() if isinstance(v, str)}
        return labels
    except Exception as e:
        logger.warning("Cluster labelling failed: %s", e)
        return {str(i): f"Topic {i + 1}" for i in range(k)}


async def ensure_cluster_labels(
    user_id: uuid.UUID,
    profile: VoiceProfile,
    session: AsyncSession,
) -> dict[str, str]:
    """Label clusters if not already labelled; persist labels to content_pillars.

    If the profile came from Redis cache (not attached to this session), loads
    the DB object for the write and refreshes the Redis cache afterward.
    """
    labels = await label_clusters(user_id, profile, session)
    if not labels:
        return labels

    pillars = dict(profile.content_pillars or {})
    if pillars.get("labels") == labels:
        return labels

    # Labels changed - must write to DB. Load the actual ORM object (the profile
    # from cache is detached and won't be tracked by the session's unit-of-work).
    db_result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user_id))
    db_profile = db_result.scalar_one_or_none()
    if db_profile is not None:
        db_pillars = dict(db_profile.content_pillars or {})
        db_pillars["labels"] = labels
        db_profile.content_pillars = db_pillars
        await session.flush()
        # Refresh Redis cache so subsequent reads have the labels
        await set_cached_profile(db_profile)

    return labels

"""Voice profile Redis cache helpers.

Serializes VoiceProfile ORM objects to/from JSON so generation and router
reads can skip the DB on the hot path.
"""
import json
import logging
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from services.cache.client import get_redis
from services.cache.keys import voice_profile_key, voice_profile_status_key

if TYPE_CHECKING:
    from models.voice_profile import VoiceProfile

logger = logging.getLogger(__name__)

VP_TTL = 1800       # 30 min - profile changes only on rebuild
VP_STATUS_TTL = 15  # 15 sec - polled every 3s during build, needs fast staleness


def _profile_to_dict(profile: "VoiceProfile") -> dict:
    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "status": profile.status,
        "post_count": profile.post_count,
        "confidence_level": profile.confidence_level,
        "profile_type": profile.profile_type,
        "seed_answers": profile.seed_answers,
        "hook_distribution": profile.hook_distribution,
        "sentence_rhythm": profile.sentence_rhythm,
        "paragraph_structure": profile.paragraph_structure,
        "vocabulary_register": profile.vocabulary_register,
        "structural_pattern": profile.structural_pattern,
        "cta_style": profile.cta_style,
        "emotional_register": profile.emotional_register,
        "last_built_at": profile.last_built_at.isoformat() if profile.last_built_at else None,
        "profile_embedding": profile.profile_embedding,
        "content_pillars": profile.content_pillars,
        "cluster_centroids": profile.cluster_centroids,
        "lexical_signature": profile.lexical_signature,
        "argument_templates": profile.argument_templates,
        "belief_stances": profile.belief_stances,
        "epistemic_style": profile.epistemic_style,
        "stylometric_profile": profile.stylometric_profile,
        "loo_distribution": profile.loo_distribution,
    }


def _dict_to_profile(data: dict) -> "VoiceProfile":
    from models.voice_profile import VoiceProfile
    p = VoiceProfile()
    p.id = uuid.UUID(data["id"])
    p.user_id = uuid.UUID(data["user_id"])
    p.status = data["status"]
    p.post_count = data.get("post_count", 0)
    p.confidence_level = data.get("confidence_level")
    p.profile_type = data.get("profile_type", "extracted")
    p.seed_answers = data.get("seed_answers")
    p.hook_distribution = data.get("hook_distribution")
    p.sentence_rhythm = data.get("sentence_rhythm")
    p.paragraph_structure = data.get("paragraph_structure")
    p.vocabulary_register = data.get("vocabulary_register")
    p.structural_pattern = data.get("structural_pattern")
    p.cta_style = data.get("cta_style")
    p.emotional_register = data.get("emotional_register")
    raw_dt = data.get("last_built_at")
    p.last_built_at = datetime.fromisoformat(raw_dt) if raw_dt else None
    p.profile_embedding = data.get("profile_embedding")
    p.content_pillars = data.get("content_pillars")
    p.cluster_centroids = data.get("cluster_centroids")
    p.lexical_signature = data.get("lexical_signature")
    p.argument_templates = data.get("argument_templates")
    p.belief_stances = data.get("belief_stances")
    p.epistemic_style = data.get("epistemic_style")
    p.stylometric_profile = data.get("stylometric_profile")
    p.loo_distribution = data.get("loo_distribution")
    return p


async def get_cached_profile(user_id: uuid.UUID) -> "VoiceProfile | None":
    redis = get_redis()
    if redis is None:
        return None
    try:
        raw = await redis.get(voice_profile_key(user_id))
        if raw:
            return _dict_to_profile(json.loads(raw))
    except Exception as e:
        logger.warning("Redis voice profile read failed: %s", e)
    return None


async def set_cached_profile(profile: "VoiceProfile") -> None:
    redis = get_redis()
    if redis is None:
        return
    try:
        await redis.setex(
            voice_profile_key(profile.user_id),
            VP_TTL,
            json.dumps(_profile_to_dict(profile)),
        )
        await redis.setex(
            voice_profile_status_key(profile.user_id),
            VP_STATUS_TTL,
            profile.status,
        )
    except Exception as e:
        logger.warning("Redis voice profile write failed: %s", e)


async def get_cached_status_and_profile(
    user_id: uuid.UUID,
) -> tuple[str | None, "VoiceProfile | None"]:
    """Fetch both cache keys in a single Redis round trip (MGET) instead of two GETs.

    Used by the /status polling endpoint, which needs the fast-expiring status
    key for freshness and the longer-lived profile key for the response body.
    """
    redis = get_redis()
    if redis is None:
        return None, None
    try:
        status_raw, profile_raw = await redis.mget(
            voice_profile_status_key(user_id), voice_profile_key(user_id)
        )
        profile = _dict_to_profile(json.loads(profile_raw)) if profile_raw else None
        return status_raw, profile
    except Exception as e:
        logger.warning("Redis voice profile status+profile read failed: %s", e)
        return None, None


async def set_cached_status(user_id: uuid.UUID, status_str: str) -> None:
    redis = get_redis()
    if redis is None:
        return
    try:
        await redis.setex(voice_profile_status_key(user_id), VP_STATUS_TTL, status_str)
    except Exception as e:
        logger.warning("Redis voice profile status write failed: %s", e)


async def get_cached_status(user_id: uuid.UUID) -> str | None:
    redis = get_redis()
    if redis is None:
        return None
    try:
        return await redis.get(voice_profile_status_key(user_id))
    except Exception as e:
        logger.warning("Redis voice profile status read failed: %s", e)
    return None


async def invalidate_profile_cache(user_id: uuid.UUID) -> None:
    redis = get_redis()
    if redis is None:
        return
    try:
        await redis.delete(voice_profile_key(user_id), voice_profile_status_key(user_id))
    except Exception as e:
        logger.warning("Redis voice profile invalidation failed: %s", e)

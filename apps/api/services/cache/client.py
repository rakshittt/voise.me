import logging

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def init_redis(url: str) -> None:
    global _redis
    _redis = aioredis.from_url(url, decode_responses=True, socket_connect_timeout=2)
    try:
        await _redis.ping()
        logger.info("Redis connected: %s", url)
    except Exception as e:
        logger.warning("Redis ping failed on startup - cache will be bypassed: %s", e)


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


def get_redis() -> aioredis.Redis | None:
    """Return the Redis client, or None if unavailable. Callers must handle None gracefully."""
    return _redis

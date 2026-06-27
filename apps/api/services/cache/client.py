import logging
import re

import redis.asyncio as aioredis
import redis.exceptions as redis_exc
from redis.asyncio.retry import Retry
from redis.backoff import ExponentialBackoff

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None

# Mask password in rediss://:TOKEN@host:port URLs for safe logging
_SECRET_RE = re.compile(r"(?<=:)[^:@]+(?=@)")


def _safe_url(url: str) -> str:
    return _SECRET_RE.sub("***", url)


async def init_redis(url: str) -> None:
    global _redis
    # Exponential backoff: 100ms base, 2s cap, 3 retries before propagating
    retry = Retry(ExponentialBackoff(cap=2.0, base=0.1), retries=3)
    _redis = aioredis.from_url(
        url,
        decode_responses=True,
        socket_connect_timeout=5,      # cloud round-trip budget
        socket_timeout=5,              # per-command ceiling
        retry=retry,
        retry_on_error=[
            redis_exc.BusyLoadingError,
            redis_exc.ConnectionError,
            redis_exc.TimeoutError,
        ],
        retry_on_timeout=True,
        max_connections=20,
    )
    try:
        await _redis.ping()
        logger.info("Redis connected: %s", _safe_url(url))
    except Exception as e:
        # Keep _redis set so the pool can reconnect on next use;
        # every caller already handles None/exception gracefully.
        logger.warning("Redis ping failed on startup - cache will be bypassed: %s", e)


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        await _redis.aclose()
        _redis = None


def get_redis() -> aioredis.Redis | None:
    """Return the Redis client, or None if unavailable. Callers must handle None gracefully."""
    return _redis

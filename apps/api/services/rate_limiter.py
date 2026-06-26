import logging
import time
from dataclasses import dataclass, field

from services.cache.client import get_redis
from services.cache.keys import rate_limit_key

logger = logging.getLogger(__name__)

LIMITS: dict[str, tuple[int, int]] = {
    "generate": (30, 3600),
    "voice_profile_build": (1, 600),
    "capture_upload": (20, 3600),
    "repurpose": (10, 3600),
    "dna_match": (20, 3600),
    "fetch_url": (10, 3600),
    "ideas": (10, 3600),
}

# ── In-memory fallback (single-instance only, used when Redis is unavailable) ──

@dataclass
class _WindowState:
    count: int = 0
    window_start: float = field(default_factory=time.monotonic)


_fallback_store: dict[tuple[str, str], _WindowState] = {}


def _check_in_memory(user_id: str, endpoint: str) -> tuple[bool, int]:
    max_calls, window_seconds = LIMITS[endpoint]
    key = (user_id, endpoint)
    now = time.monotonic()
    state = _fallback_store.get(key)
    if state is None or (now - state.window_start) >= window_seconds:
        _fallback_store[key] = _WindowState(count=1, window_start=now)
        return True, 0
    if state.count >= max_calls:
        retry_after = int(window_seconds - (now - state.window_start)) + 1
        return False, retry_after
    state.count += 1
    return True, 0


# ── Redis-backed fixed-window rate limiter ──────────────────────────────────

async def check_rate_limit(user_id: str, endpoint: str) -> tuple[bool, int]:
    """Return (allowed, retry_after_seconds). allowed=False means limit exceeded.

    Uses Redis for atomic cross-instance counting. Falls back to in-memory if
    Redis is unavailable so the app degrades gracefully rather than hard-failing.
    """
    if endpoint not in LIMITS:
        return True, 0

    max_calls, window_seconds = LIMITS[endpoint]

    redis = get_redis()
    if redis is None:
        logger.warning("Redis unavailable - using in-memory rate limiter for %s", endpoint)
        return _check_in_memory(user_id, endpoint)

    try:
        key = rate_limit_key(user_id, endpoint)
        count = await redis.incr(key)
        if count == 1:
            # First request in a new window - set expiry
            await redis.expire(key, window_seconds)
        if count > max_calls:
            ttl = await redis.ttl(key)
            retry_after = max(1, ttl)
            return False, retry_after
        return True, 0
    except Exception as e:
        logger.warning("Redis rate-limit check failed, falling back to in-memory: %s", e)
        return _check_in_memory(user_id, endpoint)

import logging
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.usage import Usage
from models.user import User
from services.cache.client import get_redis
from services.cache.keys import usage_count_key, usage_summary_key

logger = logging.getLogger(__name__)

UNLIMITED = -1

# -1 means unlimited. Starter is the only metered plan.
PLAN_LIMITS: dict[str, dict[str, int]] = {
    "starter": {"generate": 20, "repurpose": 5},
    "growth": {"generate": UNLIMITED, "repurpose": UNLIMITED},
    "pro": {"generate": UNLIMITED, "repurpose": UNLIMITED},
    "beta": {"generate": UNLIMITED, "repurpose": UNLIMITED},
}

# Trial users get Growth limits for the trial period
TRIAL_LIMITS = PLAN_LIMITS["growth"]
DEFAULT_LIMITS = PLAN_LIMITS["starter"]

USAGE_COUNT_TTL = 7200   # 2 hours - primed from DB, covers billing windows
USAGE_SUMMARY_TTL = 300  # 5 minutes - dashboard reads this frequently


def is_in_trial(user: User) -> bool:
    if user.trial_ends_at is None:
        return False
    now = datetime.now(UTC)
    trial_end = user.trial_ends_at
    if trial_end.tzinfo is None:
        trial_end = trial_end.replace(tzinfo=UTC)
    return now < trial_end


def trial_days_remaining(user: User) -> int:
    if not is_in_trial(user):
        return 0
    now = datetime.now(UTC)
    trial_end = user.trial_ends_at
    if trial_end.tzinfo is None:
        trial_end = trial_end.replace(tzinfo=UTC)
    return max(0, (trial_end - now).days)


def _billing_period_start(user: User) -> datetime:
    """Returns start of current billing month (day user signed up, rolling)."""
    now = datetime.now(UTC)
    created = user.created_at
    if created is None:
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    day = min(created.day, 28)
    try:
        start = now.replace(day=day, hour=0, minute=0, second=0, microsecond=0)
    except ValueError:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if start > now:
        if now.month == 1:
            start = start.replace(year=now.year - 1, month=12)
        else:
            start = start.replace(month=now.month - 1)

    return start


async def _get_db_usage_count(
    user_id, action: str, period_start: datetime, session: AsyncSession
) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(Usage)
        .where(
            Usage.user_id == user_id,
            Usage.action == action,
            Usage.created_at >= period_start,
        )
    )
    return int(result.scalar_one())


async def check_usage_limit(
    user: User,
    action: str,
    session: AsyncSession,
) -> tuple[bool, int, int]:
    """
    Returns (allowed, used, limit).
    allowed=False means the user is at or over limit.
    Trial users get Growth-tier limits for the duration of the trial.

    Uses Redis as a fast counter; falls back to DB if Redis is unavailable.
    """
    if is_in_trial(user):
        limits = TRIAL_LIMITS
    else:
        plan = user.plan or "starter"
        limits = PLAN_LIMITS.get(plan, DEFAULT_LIMITS)

    limit = limits.get(action, DEFAULT_LIMITS.get(action, 5))

    if limit == UNLIMITED:
        return True, 0, UNLIMITED

    period_start = _billing_period_start(user)
    period_key = period_start.strftime("%Y%m%d")
    cache_key = usage_count_key(user.id, action, period_key)

    redis = get_redis()
    if redis is not None:
        try:
            raw = await redis.get(cache_key)
            if raw is not None:
                used = int(raw)
                return used < limit, used, limit
            # Cache miss - prime from DB and store
            used = await _get_db_usage_count(user.id, action, period_start, session)
            await redis.setex(cache_key, USAGE_COUNT_TTL, used)
            return used < limit, used, limit
        except Exception as e:
            logger.warning("Redis usage count check failed, falling back to DB: %s", e)

    # Pure DB fallback
    used = await _get_db_usage_count(user.id, action, period_start, session)
    return used < limit, used, limit


async def increment_usage_count(user_id, action: str, user: User) -> None:
    """Atomically increment the Redis usage counter after a successful action.

    Called from log_usage so the cache stays consistent without a DB round-trip.
    """
    redis = get_redis()
    if redis is None:
        return
    try:
        period_start = _billing_period_start(user)
        period_key = period_start.strftime("%Y%m%d")
        cache_key = usage_count_key(user_id, action, period_key)
        exists = await redis.exists(cache_key)
        if exists:
            await redis.incr(cache_key)
        # If key doesn't exist yet, it'll be primed on the next check_usage_limit call
        # Invalidate summary cache so dashboard shows updated numbers
        await redis.delete(usage_summary_key(user_id, period_key))
    except Exception as e:
        logger.warning("Redis usage increment failed: %s", e)

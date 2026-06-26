"""Single source of truth for all Redis cache key patterns."""
from uuid import UUID


def user_key(clerk_user_id: str) -> str:
    return f"user:{clerk_user_id}"


def jwks_key() -> str:
    return "jwks:clerk"


def voice_profile_key(user_id: UUID) -> str:
    return f"vp:{user_id}"


def voice_profile_status_key(user_id: UUID) -> str:
    return f"vp_status:{user_id}"


def edit_rules_key(user_id: UUID) -> str:
    return f"edit_rules:{user_id}"


def usage_count_key(user_id: UUID, action: str, period_start_date: str) -> str:
    return f"usage:{user_id}:{action}:{period_start_date}"


def usage_summary_key(user_id: UUID, period_start_date: str) -> str:
    return f"usage_summary:{user_id}:{period_start_date}"


def rate_limit_key(user_id: str, endpoint: str) -> str:
    return f"rl:{user_id}:{endpoint}"

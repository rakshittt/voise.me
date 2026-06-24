import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.usage import Usage
from models.user import User
from services.usage_limits import (
    PLAN_LIMITS,
    TRIAL_LIMITS,
    UNLIMITED,
    _billing_period_start,
    is_in_trial,
    trial_days_remaining,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/summary")
async def get_usage_summary(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    in_trial = is_in_trial(user)
    plan = user.plan or "starter"
    limits = TRIAL_LIMITS if in_trial else PLAN_LIMITS.get(plan, PLAN_LIMITS["starter"])
    period_start = _billing_period_start(user)

    result = await session.execute(
        select(Usage.action, func.count().label("n"))
        .where(Usage.user_id == user.id, Usage.created_at >= period_start)
        .group_by(Usage.action)
    )
    rows = result.all()
    counts: dict[str, int] = {row.action: row.n for row in rows}

    gen_limit = limits.get("generate", 20)
    rep_limit = limits.get("repurpose", 5)

    return {
        "plan": plan,
        "in_trial": in_trial,
        "trial_days_remaining": trial_days_remaining(user) if in_trial else 0,
        "generates_used": counts.get("generate", 0),
        "generates_limit": gen_limit,
        "generates_unlimited": gen_limit == UNLIMITED,
        "repurposes_used": counts.get("repurpose", 0),
        "repurposes_limit": rep_limit,
        "repurposes_unlimited": rep_limit == UNLIMITED,
        "billing_period_start": period_start.isoformat(),
    }

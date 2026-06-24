import logging
import uuid as _uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_admin_user
from db.session import get_session
from models.generation import Generation
from models.usage import Usage
from models.user import User
from models.voice_profile import VoiceProfile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

AdminUser = Annotated[User, Depends(get_admin_user)]
DB = Annotated[AsyncSession, Depends(get_session)]


# ── Overview stats ──────────────────────────────────────────────────────────

@router.get("/stats")
async def get_admin_stats(admin: AdminUser, session: DB) -> dict:
    now = datetime.now(UTC)
    thirty_days_ago = now - timedelta(days=30)
    seven_days_ago = now - timedelta(days=7)

    total_users = await session.scalar(select(func.count(User.id)))
    plan_counts = (await session.execute(
        select(User.plan, func.count(User.id)).group_by(User.plan)
    )).all()

    active_trials = await session.scalar(
        select(func.count(User.id)).where(User.trial_ends_at > now)
    )
    new_users_7d = await session.scalar(
        select(func.count(User.id)).where(User.created_at >= seven_days_ago)
    )
    new_users_30d = await session.scalar(
        select(func.count(User.id)).where(User.created_at >= thirty_days_ago)
    )

    total_generations = await session.scalar(select(func.count(Generation.id)))
    generations_7d = await session.scalar(
        select(func.count(Generation.id)).where(Generation.created_at >= seven_days_ago)
    )

    cost_total = await session.scalar(
        select(func.sum(Usage.cost_usd))
    ) or Decimal("0")
    cost_30d = await session.scalar(
        select(func.sum(Usage.cost_usd)).where(Usage.created_at >= thirty_days_ago)
    ) or Decimal("0")
    cost_7d = await session.scalar(
        select(func.sum(Usage.cost_usd)).where(Usage.created_at >= seven_days_ago)
    ) or Decimal("0")

    voices_built = await session.scalar(
        select(func.count(VoiceProfile.id)).where(VoiceProfile.status == "ready")
    )

    return {
        "users": {
            "total": total_users,
            "new_7d": new_users_7d,
            "new_30d": new_users_30d,
            "active_trials": active_trials,
            "by_plan": {row[0]: row[1] for row in plan_counts},
        },
        "generations": {
            "total": total_generations,
            "last_7d": generations_7d,
        },
        "voices_built": voices_built,
        "costs": {
            "total_usd": float(cost_total),
            "last_30d_usd": float(cost_30d),
            "last_7d_usd": float(cost_7d),
        },
    }


# ── User list ───────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    admin: AdminUser,
    session: DB,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    plan: str | None = Query(None),
    search: str | None = Query(None),
) -> dict:
    q = select(User).order_by(User.created_at.desc())
    count_q = select(func.count(User.id))

    if plan:
        q = q.where(User.plan == plan)
        count_q = count_q.where(User.plan == plan)
    if search:
        pattern = f"%{search}%"
        q = q.where(User.email.ilike(pattern) | User.name.ilike(pattern))
        count_q = count_q.where(User.email.ilike(pattern) | User.name.ilike(pattern))

    total = await session.scalar(count_q)
    offset = (page - 1) * per_page
    users = (await session.execute(q.offset(offset).limit(per_page))).scalars().all()

    # Fetch generation counts and last generation per user in one query
    gen_stats_rows = (await session.execute(
        select(
            Generation.user_id,
            func.count(Generation.id).label("total_generations"),
            func.max(Generation.created_at).label("last_generation_at"),
        ).group_by(Generation.user_id)
    )).all()
    gen_stats = {str(r.user_id): r for r in gen_stats_rows}

    now = datetime.now(UTC)
    result = []
    for u in users:
        gs = gen_stats.get(str(u.id))
        trial_remaining = None
        if u.trial_ends_at and u.trial_ends_at > now:
            trial_remaining = (u.trial_ends_at - now).days
        result.append({
            "id": str(u.id),
            "email": u.email,
            "name": u.name,
            "plan": u.plan,
            "is_admin": u.is_admin,
            "created_at": u.created_at.isoformat(),
            "trial_ends_at": u.trial_ends_at.isoformat() if u.trial_ends_at else None,
            "trial_days_remaining": trial_remaining,
            "total_generations": gs.total_generations if gs else 0,
            "last_active_at": gs.last_generation_at.isoformat() if gs and gs.last_generation_at else None,
        })

    return {
        "users": result,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, -(-total // per_page)),  # ceiling division
    }


# ── Single user detail ──────────────────────────────────────────────────────

@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin: AdminUser, session: DB) -> dict:
    try:
        uid = _uuid.UUID(user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid user ID") from e

    result = await session.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    generations_total = await session.scalar(
        select(func.count(Generation.id)).where(Generation.user_id == uid)
    )
    cost_total = await session.scalar(
        select(func.sum(Usage.cost_usd)).where(Usage.user_id == uid)
    ) or Decimal("0")

    recent_usage = (await session.execute(
        select(Usage.action, func.count(Usage.id).label("count"), func.sum(Usage.cost_usd).label("cost"))
        .where(Usage.user_id == uid)
        .group_by(Usage.action)
    )).all()

    now = datetime.now(UTC)
    return {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat(),
        "trial_ends_at": user.trial_ends_at.isoformat() if user.trial_ends_at else None,
        "trial_days_remaining": (user.trial_ends_at - now).days if user.trial_ends_at and user.trial_ends_at > now else None,
        "stripe_customer_id": user.stripe_customer_id,
        "generations_total": generations_total,
        "cost_usd_total": float(cost_total),
        "usage_by_action": [
            {"action": r.action, "count": r.count, "cost_usd": float(r.cost or 0)}
            for r in recent_usage
        ],
    }


# ── Usage / cost breakdown ──────────────────────────────────────────────────

@router.get("/usage")
async def get_usage_breakdown(
    admin: AdminUser,
    session: DB,
    days: int = Query(30, ge=1, le=365),
) -> dict:
    since = datetime.now(UTC) - timedelta(days=days)

    by_action = (await session.execute(
        select(
            Usage.action,
            func.count(Usage.id).label("count"),
            func.sum(Usage.cost_usd).label("cost_usd"),
            func.sum(Usage.tokens_input + Usage.tokens_output).label("tokens"),
        )
        .where(Usage.created_at >= since)
        .group_by(Usage.action)
        .order_by(func.sum(Usage.cost_usd).desc())
    )).all()

    by_model = (await session.execute(
        select(
            Usage.model_used,
            func.count(Usage.id).label("count"),
            func.sum(Usage.cost_usd).label("cost_usd"),
        )
        .where(Usage.created_at >= since, Usage.model_used.is_not(None))
        .group_by(Usage.model_used)
        .order_by(func.sum(Usage.cost_usd).desc())
    )).all()

    # Daily cost trend (last `days` days)
    daily = (await session.execute(
        select(
            func.date_trunc("day", Usage.created_at).label("day"),
            func.sum(Usage.cost_usd).label("cost_usd"),
            func.count(Usage.id).label("calls"),
        )
        .where(Usage.created_at >= since)
        .group_by(func.date_trunc("day", Usage.created_at))
        .order_by(func.date_trunc("day", Usage.created_at))
    )).all()

    total_cost = sum(float(r.cost_usd or 0) for r in by_action)

    return {
        "period_days": days,
        "total_cost_usd": total_cost,
        "by_action": [
            {
                "action": r.action,
                "count": r.count,
                "cost_usd": float(r.cost_usd or 0),
                "tokens": int(r.tokens or 0),
            }
            for r in by_action
        ],
        "by_model": [
            {
                "model": r.model_used,
                "count": r.count,
                "cost_usd": float(r.cost_usd or 0),
            }
            for r in by_model
        ],
        "daily_trend": [
            {
                "date": r.day.strftime("%Y-%m-%d"),
                "cost_usd": float(r.cost_usd or 0),
                "calls": r.calls,
            }
            for r in daily
        ],
    }


# ── Promote / demote admin ──────────────────────────────────────────────────

@router.patch("/users/{user_id}/admin")
async def set_user_admin(
    user_id: str,
    body: dict,
    admin: AdminUser,
    session: DB,
) -> dict:
    try:
        uid = _uuid.UUID(user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid user ID") from e

    result = await session.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_admin = bool(body.get("is_admin", False))
    await session.commit()
    logger.info("Admin %s set is_admin=%s for user %s", admin.id, user.is_admin, uid)
    return {"id": str(user.id), "is_admin": user.is_admin}

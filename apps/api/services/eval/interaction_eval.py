"""Validation metrics for the behavioral feedback learning loop.

Primary signals:
  copy_without_edit_rate  - fraction of copy events where edit_distance == 0
  median_edit_distance    - median chars edited before copying

A rising copy_without_edit_rate and falling median_edit_distance over time means
the system is generating content closer to what the user wants on the first try.
Week-over-week comparison drives the trend label.
"""
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.interaction_event import InteractionEvent


async def get_copy_metrics(
    user_id: uuid.UUID,
    session: AsyncSession,
    lookback_days: int = 28,
) -> dict:
    """Return copy-without-edit rate, edit distance trend, and week-over-week direction.

    Returns a dict suitable for direct JSON response.
    """
    since = datetime.now(tz=UTC) - timedelta(days=lookback_days)

    result = await session.execute(
        select(
            InteractionEvent.edit_distance_from_original,
            InteractionEvent.created_at,
        )
        .where(
            InteractionEvent.user_id == user_id,
            InteractionEvent.event_type == "copied",
            InteractionEvent.created_at >= since,
        )
        .order_by(InteractionEvent.created_at.asc())
    )
    rows = result.all()

    if not rows:
        return {
            "has_data": False,
            "total_copies": 0,
            "copy_without_edit_rate": None,
            "median_edit_distance": None,
            "trend": "insufficient_data",
            "lookback_days": lookback_days,
        }

    total = len(rows)
    distances = [r[0] for r in rows if r[0] is not None]
    verbatim = sum(1 for d in distances if d == 0)
    copy_rate = verbatim / total if total > 0 else 0.0

    sorted_d = sorted(distances)
    n = len(sorted_d)
    if n == 0:
        median: float | None = None
    elif n % 2 == 1:
        median = float(sorted_d[n // 2])
    else:
        median = (sorted_d[n // 2 - 1] + sorted_d[n // 2]) / 2.0

    # Week-over-week: compare last 7 days to the prior 7 days
    now = datetime.now(tz=UTC)
    week_ago = now - timedelta(days=7)
    two_weeks_ago = now - timedelta(days=14)

    recent = [r for r in rows if r[1] >= week_ago]
    prior = [r for r in rows if two_weeks_ago <= r[1] < week_ago]

    trend = "insufficient_data"
    if len(recent) >= 3 and len(prior) >= 3:
        recent_rate = sum(1 for r in recent if (r[0] or 0) == 0) / len(recent)
        prior_rate = sum(1 for r in prior if (r[0] or 0) == 0) / len(prior)
        if recent_rate > prior_rate + 0.05:
            trend = "improving"
        elif recent_rate < prior_rate - 0.05:
            trend = "declining"
        else:
            trend = "stable"

    return {
        "has_data": True,
        "total_copies": total,
        "copy_without_edit_rate": round(copy_rate, 3),
        "median_edit_distance": median,
        "trend": trend,
        "lookback_days": lookback_days,
    }

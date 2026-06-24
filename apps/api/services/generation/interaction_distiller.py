"""Nightly distiller for interaction_events → exemplar quality_weight updates.

Signal weighting (per spec):
  copied with edit_distance == 0  → strongest positive → boost exemplar weight by BOOST_VERBATIM
  copied with edit_distance  > 0  → moderate positive  → boost by BOOST_EDITED
  regenerated                     → soft negative       → decay by DECAY_REGEN
  abandoned                       → soft negative       → decay by DECAY_ABANDON

Exemplar post IDs are read from generations.context_snapshot.exemplar_post_ids.
All deltas are accumulated per post then applied once, clamped to [WEIGHT_MIN, WEIGHT_MAX].
Runs as a background task after voice profile rebuild - not in real time.
"""
import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.generation import Generation
from models.interaction_event import InteractionEvent
from models.user_post import UserPost

logger = logging.getLogger(__name__)

WEIGHT_MIN = 0.5
WEIGHT_MAX = 3.0
BOOST_VERBATIM = 0.15   # copied with zero edits
BOOST_EDITED = 0.05     # copied after editing
DECAY_REGEN = -0.05     # user hit regenerate (rejected the variant)
DECAY_ABANDON = -0.03   # session abandoned without any copy


def _is_valid_uuid(s: str) -> bool:
    try:
        uuid.UUID(s)
        return True
    except ValueError:
        return False


async def distill_interaction_events(
    user_id: uuid.UUID,
    session: AsyncSession,
    lookback_days: int = 30,
) -> int:
    """Process recent interaction events and update exemplar UserPost quality_weights.

    Returns the count of interaction_event rows examined.
    """
    since = datetime.now(tz=UTC) - timedelta(days=lookback_days)

    rows_result = await session.execute(
        select(InteractionEvent, Generation.context_snapshot)
        .join(
            Generation,
            InteractionEvent.generation_id == Generation.id,
            isouter=True,
        )
        .where(
            InteractionEvent.user_id == user_id,
            InteractionEvent.created_at >= since,
            InteractionEvent.event_type.in_(["copied", "regenerated", "abandoned"]),
        )
        .order_by(InteractionEvent.created_at.asc())
    )
    rows = rows_result.all()

    if not rows:
        return 0

    # Accumulate net delta per exemplar post ID
    deltas: dict[str, float] = {}
    for event, context_snapshot in rows:
        if not context_snapshot:
            continue
        exemplar_ids: list[str] = context_snapshot.get("exemplar_post_ids", [])
        if not exemplar_ids:
            continue

        if event.event_type == "copied":
            delta = (
                BOOST_VERBATIM
                if (event.edit_distance_from_original or 0) == 0
                else BOOST_EDITED
            )
        elif event.event_type == "regenerated":
            delta = DECAY_REGEN
        else:  # abandoned
            delta = DECAY_ABANDON

        for post_id in exemplar_ids:
            deltas[post_id] = deltas.get(post_id, 0.0) + delta

    if not deltas:
        return len(rows)

    valid_ids = [uuid.UUID(pid) for pid in deltas if _is_valid_uuid(pid)]
    posts_result = await session.execute(
        select(UserPost).where(
            UserPost.user_id == user_id,
            UserPost.id.in_(valid_ids),
        )
    )
    posts = posts_result.scalars().all()

    updated = 0
    for post in posts:
        delta = deltas.get(str(post.id), 0.0)
        new_weight = max(WEIGHT_MIN, min(WEIGHT_MAX, post.quality_weight + delta))
        if abs(new_weight - post.quality_weight) > 0.001:
            post.quality_weight = new_weight
            updated += 1

    if updated:
        await session.flush()
        logger.info(
            f"Interaction distiller: updated quality_weight on {updated} posts "
            f"for user {user_id} ({len(rows)} events examined)"
        )
    return len(rows)


async def distill_for_user_bg(user_id: uuid.UUID) -> None:
    """Background task wrapper - opens its own DB session."""
    from db.session import AsyncSessionLocal

    async with AsyncSessionLocal() as session:
        try:
            count = await distill_interaction_events(user_id, session)
            await session.commit()
            logger.info(f"Interaction distill complete for user {user_id}: {count} events")
        except Exception as e:
            logger.error(f"Interaction distill failed for user {user_id}: {e}")

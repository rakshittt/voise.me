import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.interaction_event import InteractionEvent
from models.user import User
from schemas.interaction import InteractionEventRequest
from services.eval.interaction_eval import get_copy_metrics
from services.generation.interaction_distiller import distill_for_user_bg

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interaction", tags=["interaction"])


@router.post("/event", status_code=status.HTTP_201_CREATED)
async def record_event(
    request: InteractionEventRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    generation_id: uuid.UUID | None = None
    if request.generation_id:
        try:
            generation_id = uuid.UUID(request.generation_id)
        except ValueError:
            logger.warning(f"Invalid generation_id in interaction event: {request.generation_id}")

    event = InteractionEvent(
        user_id=user.id,
        generation_id=generation_id,
        variant_index=request.variant_index,
        event_type=request.event_type,
        rejection_reason=request.rejection_reason,
        edit_distance_from_original=request.edit_distance_from_original,
        word_count_delta=request.word_count_delta,
        time_to_action_ms=request.time_to_action_ms,
        session_id=request.session_id,
    )
    session.add(event)
    await session.commit()

    logger.info(
        f"Interaction event recorded: user={user.id}, type={request.event_type}, "
        f"generation={generation_id}, variant={request.variant_index}"
    )
    return {"recorded": True}


@router.post("/distill", status_code=status.HTTP_202_ACCEPTED)
async def trigger_distill(
    background_tasks: BackgroundTasks,
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    """Queue a distillation run for the current user's interaction events.

    Returns immediately; distillation runs in the background.
    """
    background_tasks.add_task(distill_for_user_bg, user.id)
    logger.info(f"On-demand distill queued for user {user.id}")
    return {"status": "queued"}


@router.get("/metrics")
async def get_metrics(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Return copy-without-edit rate and edit distance trend over the last 28 days."""
    return await get_copy_metrics(user.id, session)

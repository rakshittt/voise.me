"""Content calendar queue router.

Manages idea_queue items for the content planning calendar.
All endpoints are user-scoped; no cross-user data access.
"""
import logging
import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi import Query as QueryParam
from sqlalchemy import and_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.idea_queue import IdeaQueue
from models.user import User
from schemas.queue import CalendarResponse, PlanRequest, QueueItemCreate, QueueItemResponse, QueueListResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/queue", tags=["queue"])


@router.get("", response_model=QueueListResponse)
async def list_queue_items(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    unplanned_only: bool = QueryParam(False, description="Return only items without a planned_date"),  # noqa: B008
) -> QueueListResponse:
    """List all idea_queue items for the current user."""
    stmt = select(IdeaQueue).where(IdeaQueue.user_id == user.id)
    if unplanned_only:
        stmt = stmt.where(IdeaQueue.planned_date.is_(None))
    stmt = stmt.order_by(IdeaQueue.created_at.desc())
    result = await session.execute(stmt)
    items = result.scalars().all()
    return QueueListResponse(
        items=[QueueItemResponse.model_validate(i) for i in items],
        total=len(items),
    )


@router.post("", response_model=QueueItemResponse, status_code=status.HTTP_201_CREATED)
async def create_queue_item(
    body: QueueItemCreate,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QueueItemResponse:
    """Add a manually entered idea to the queue."""
    item = IdeaQueue(
        user_id=user.id,
        title=body.title,
        transcription=body.title,
        capture_method="manual",
        status="queued",
    )
    session.add(item)
    try:
        await session.commit()
    except SQLAlchemyError as e:
        logger.error("Failed to create queue item for user %s: %s", user.id, e)
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Failed to save idea") from e
    await session.refresh(item)
    return QueueItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_queue_item(
    item_id: uuid.UUID,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    """Delete an idea from the queue."""
    result = await session.execute(
        select(IdeaQueue).where(and_(IdeaQueue.id == item_id, IdeaQueue.user_id == user.id))
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    await session.delete(item)
    await session.commit()


@router.patch("/{item_id}/plan", response_model=QueueItemResponse)
async def plan_queue_item(
    item_id: uuid.UUID,
    body: PlanRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> QueueItemResponse:
    """Set or clear the planned_date for an idea. Pass null to unplan."""
    result = await session.execute(
        select(IdeaQueue).where(and_(IdeaQueue.id == item_id, IdeaQueue.user_id == user.id))
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Idea not found")
    item.planned_date = body.planned_date
    await session.commit()
    await session.refresh(item)
    return QueueItemResponse.model_validate(item)


@router.get("/calendar", response_model=CalendarResponse)
async def get_calendar_items(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    from_date: date = QueryParam(..., alias="from", description="Start date inclusive (YYYY-MM-DD)"),  # noqa: B008
    to_date: date = QueryParam(..., alias="to", description="End date inclusive (YYYY-MM-DD)"),  # noqa: B008
) -> CalendarResponse:
    """Return idea_queue items with planned_date in [from, to] range."""
    if (to_date - from_date).days > 92:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Date range cannot exceed 92 days")
    result = await session.execute(
        select(IdeaQueue).where(
            and_(
                IdeaQueue.user_id == user.id,
                IdeaQueue.planned_date >= from_date,
                IdeaQueue.planned_date <= to_date,
            )
        ).order_by(IdeaQueue.planned_date)
    )
    items = result.scalars().all()
    return CalendarResponse(
        items=[QueueItemResponse.model_validate(i) for i in items],
        from_date=from_date,
        to_date=to_date,
    )

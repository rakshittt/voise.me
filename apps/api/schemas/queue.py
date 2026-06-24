import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class QueueItemCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class PlanRequest(BaseModel):
    planned_date: date | None = Field(None, description="ISO date (YYYY-MM-DD) to plan, or null to unplan")


class QueueItemResponse(BaseModel):
    id: uuid.UUID
    title: str | None
    transcription: str
    capture_method: str
    status: str
    planned_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class QueueListResponse(BaseModel):
    items: list[QueueItemResponse]
    total: int


class CalendarResponse(BaseModel):
    items: list[QueueItemResponse]
    from_date: date
    to_date: date

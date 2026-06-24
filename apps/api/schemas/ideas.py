from typing import Literal

from pydantic import BaseModel, Field


class IdeaGenerateRequest(BaseModel):
    niche: str = Field(..., min_length=5, max_length=200)
    focus_topic: str | None = Field(None, max_length=200)
    count: int = Field(default=5, ge=1, le=8)


class IdeaEventRequest(BaseModel):
    title: str = Field(..., max_length=300)
    hook: str = Field(..., max_length=500)
    content_type: str = Field(..., max_length=50)
    rationale: str = Field(default="", max_length=300)
    event_type: Literal["accepted", "skipped", "written"]
    recommendation_score: float | None = Field(None, ge=0.0, le=1.0)


class IdeaItem(BaseModel):
    title: str
    hook: str
    content_type: str
    rationale: str


class IdeasResponse(BaseModel):
    ideas: list[IdeaItem]
    niche: str
    model: str


class CoverageEntrySchema(BaseModel):
    cluster_id: int
    label: str
    post_count: int
    last_30_days: int


class ResonanceSignalSchema(BaseModel):
    argument_type: str
    accepted_count: int
    rejected_count: int


class IdeaContextResponse(BaseModel):
    expertise_topics: list[str]
    coverage_map: list[CoverageEntrySchema]
    resonance_signals: list[ResonanceSignalSchema]
    cluster_labels: dict[str, str]
    built_at: str

from typing import Literal

from pydantic import BaseModel, Field


class DNAMatchRequest(BaseModel):
    content: str = Field(..., min_length=50, max_length=5000)


class DimensionDetailSchema(BaseModel):
    key: str
    label: str
    score: float
    rating: Literal["strong", "fair", "weak"]
    post_label: str
    profile_label: str
    guidance: str


class DNAMatchResponse(BaseModel):
    overall_score: int
    word_count: int
    summary: str
    dimensions: list[DimensionDetailSchema]

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class DataSourceResponse(BaseModel):
    id: uuid.UUID
    source_type: str
    label: str | None
    post_count: int
    added_at: datetime


class BuildProfileRequest(BaseModel):
    posts: str = Field(..., description="Raw text blob containing all LinkedIn posts")
    source_type: str | None = Field(None, description="Origin: linkedin_export | paste_text | url_import | transcript | pdf | manual")
    source_label: str | None = Field(None, max_length=500, description="Human-readable label (URL, filename, etc.)")


class AddPostsRequest(BaseModel):
    posts: str = Field(..., description="Raw text blob with new posts to add to corpus")
    source_type: str | None = Field(None, description="Origin: linkedin_export | paste_text | url_import | transcript | pdf | manual")
    source_label: str | None = Field(None, max_length=500, description="Human-readable label (URL, filename, etc.)")


class ParseLinkedInExportResponse(BaseModel):
    posts: list[str]
    count: int


class ParseTextSourceRequest(BaseModel):
    source_type: str = "text"  # "text" | "transcript"
    content: str = Field(..., min_length=100, max_length=500_000)


class ParseTextSourceResponse(BaseModel):
    chunks: list[str]
    count: int
    source_type: str


class FetchUrlRequest(BaseModel):
    url: str = Field(..., min_length=10, max_length=2000)


class FetchUrlResponse(BaseModel):
    chunks: list[str]
    count: int
    title: str
    source_url: str


class ParsePdfResponse(BaseModel):
    chunks: list[str]
    count: int
    page_count: int


class VoiceProfileStatusResponse(BaseModel):
    status: str
    confidence_level: str | None = None
    post_count: int = 0
    last_built_at: datetime | None = None
    profile_type: str = "extracted"


class SeedProfileRequest(BaseModel):
    """Questionnaire answers from a User B (no existing writing samples)."""
    content_type: Literal["story", "framework", "hot_take"] = Field(
        ...,
        description="Preferred content style",
    )
    writing_register: Literal["formal", "conversational", "casual"] = Field(
        ...,
        description="Writing register",
    )
    target_audience: str = Field(
        ...,
        min_length=3,
        max_length=200,
        description="Who the user writes for, in their own words",
    )
    style_anchor: Literal["A", "B", "C"] = Field(
        ...,
        description="Which sample post felt most 'them'",
    )
    posting_goal: Literal["thought_leadership", "job_seeking", "business_leads", "learning_in_public"] = Field(
        ...,
        description="Primary reason for posting",
    )
    tone_words: list[str] = Field(
        default_factory=list,
        max_length=3,
        description="Up to 3 adjectives describing the desired tone",
    )
    about_yourself: str | None = Field(
        None,
        min_length=30,
        max_length=1000,
        description="Free-text bio written by the user - used as a seed writing sample to anchor voice generation",
    )


class VoiceStrengthResponse(BaseModel):
    """Computed voice strength for a user - derived from edit + post counts, not stored."""
    level: str          # 'provisional' | 'learning' | 'established'
    profile_type: str   # 'seed' | 'extracted'
    edit_count: int
    posts_added: int    # posts added after initial build (voice_profiles.post_count for seeds; incremental for extracted)
    next_milestone: str # human-readable prompt for what action raises the level


class EvalScoreResponse(BaseModel):
    fidelity_score: float | None = None  # mean cosine similarity, 0.0–1.0; None if no evals yet
    fidelity_pct: int | None = None      # fidelity_score * 100, rounded
    eval_count: int = 0                  # number of holdout evals that contributed
    has_data: bool = False


class VoiceProfileResponse(BaseModel):
    id: uuid.UUID
    status: str
    post_count: int
    confidence_level: str | None = None
    profile_type: str = "extracted"
    seed_answers: dict | None = None
    hook_distribution: dict | None = None
    sentence_rhythm: dict | None = None
    paragraph_structure: dict | None = None
    vocabulary_register: dict | None = None
    structural_pattern: dict | None = None
    cta_style: dict | None = None
    emotional_register: dict | None = None
    last_built_at: datetime | None = None

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    input_text: str = Field(..., min_length=10, max_length=2000)
    input_type: Literal["idea", "queue_item"] = "idea"
    source_idea_id: uuid.UUID | None = None


class RepurposeRequest(BaseModel):
    source_text: str = Field(..., min_length=50, max_length=10000)


class DimensionScores(BaseModel):
    hook_style: float
    structural_pattern: float
    vocabulary_register: float
    sentence_rhythm: float
    paragraph_structure: float
    cta_style: float
    emotional_register: float = 0.0
    style_embedding: float = 0.5
    mtld: float = 0.5
    pos_jsd: float = 0.5
    signature_vocab: float = 0.5


class VariantResponse(BaseModel):
    content: str
    variant_type: str
    voice_match_score: int
    word_count: int
    dimension_scores: DimensionScores | None = None


class GenerateResponse(BaseModel):
    generation_id: uuid.UUID
    variants: list[VariantResponse]
    trial_extended: bool = False


class RepurposeResponse(BaseModel):
    generation_id: uuid.UUID
    content: str
    voice_match_score: int
    trial_extended: bool = False


class RegenerateVariantRequest(BaseModel):
    variant_index: int = Field(..., ge=0, le=2)
    # Rejection reasons accumulated client-side this session; injected as
    # temporary prompt rules that take priority over persisted edit rules.
    session_feedback: list[str] = []


class RegenerateVariantResponse(BaseModel):
    variant: VariantResponse


class GenerationHistoryItem(BaseModel):
    id: uuid.UUID
    input_text: str
    input_type: str
    variants: list[dict]
    created_at: datetime


class RefineRequest(BaseModel):
    current_content: str = Field(..., min_length=10, max_length=5000)
    instruction: str = Field(..., min_length=1, max_length=500)
    prior_instructions: list[str] = []


class RefineResponse(BaseModel):
    refined_content: str
    voice_match_score: int
    word_count: int


class EditFeedbackRequest(BaseModel):
    generation_id: uuid.UUID
    variant_index: int = Field(..., ge=0, le=2)
    generated_content: str = Field(..., min_length=1, max_length=5000)
    edited_content: str = Field(..., min_length=1, max_length=5000)


class EditFeedbackResponse(BaseModel):
    rules_inferred: int
    message: str



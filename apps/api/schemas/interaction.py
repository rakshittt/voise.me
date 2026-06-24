from typing import Literal

from pydantic import BaseModel

EventType = Literal[
    "variant_shown",
    "variant_selected",
    "rejected_on_sight",
    "regenerated",
    "edited",
    "copied",
    "abandoned",
]

RejectionReason = Literal["not_my_voice", "wrong_angle", "too_long", "disagree"]


class InteractionEventRequest(BaseModel):
    generation_id: str | None = None
    variant_index: int | None = None
    event_type: EventType
    rejection_reason: RejectionReason | None = None
    edit_distance_from_original: int | None = None
    word_count_delta: int | None = None
    time_to_action_ms: int | None = None
    session_id: str | None = None

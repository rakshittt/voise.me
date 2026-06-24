import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class InteractionEvent(Base):
    __tablename__ = "interaction_events"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    generation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generations.id", ondelete="SET NULL"), nullable=True
    )
    # 0, 1, 2 for variant-level events; NULL for generation-level events (abandoned)
    variant_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # variant_shown | variant_selected | rejected_on_sight | regenerated | edited | copied | abandoned
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # not_my_voice | wrong_angle | too_long | disagree - populated for regenerated/rejected_on_sight
    rejection_reason: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Char-level edit distance between content-at-copy-time and the original generated content.
    # 0 = copied without any edits (strongest positive signal).
    edit_distance_from_original: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Word count difference at copy time (positive = user added words, negative = removed).
    word_count_delta: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Milliseconds from variant_shown to this event - derived client-side.
    time_to_action_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Client-generated UUIDv4 that groups all events in one generate→interact session.
    session_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    # Append-only - no updated_at column.
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

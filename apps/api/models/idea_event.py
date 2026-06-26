import uuid

from sqlalchemy import DateTime, Float, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class IdeaEvent(Base):
    __tablename__ = "idea_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    # SHA256 of title+hook - stable identifier for a specific idea across calls
    idea_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # shown | accepted | skipped | written
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # Full idea snapshot at the time of the event
    # {"title": str, "hook": str, "content_type": str, "rationale": str}
    idea_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Ranked score assigned when idea was shown (0.0–1.0)
    recommendation_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Append-only - no updated_at
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), index=True
    )

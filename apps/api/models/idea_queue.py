import uuid
from datetime import date

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class IdeaQueue(Base):
    __tablename__ = "idea_queue"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str | None] = mapped_column(String(255))
    transcription: Mapped[str] = mapped_column(Text, nullable=False)
    audio_duration_seconds: Mapped[int | None] = mapped_column(Integer)
    capture_method: Mapped[str] = mapped_column(String(50), nullable=False, default="voice")
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="queued")
    generation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generations.id"), nullable=True
    )
    planned_date: Mapped[date | None] = mapped_column(Date(), nullable=True)
    captured_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

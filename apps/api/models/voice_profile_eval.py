import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class VoiceProfileEval(Base):
    __tablename__ = "voice_profile_evals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("voice_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    holdout_content: Mapped[str] = mapped_column(Text, nullable=False)
    generated_content: Mapped[str] = mapped_column(Text, nullable=False)
    # Cosine similarity between generated post embedding and holdout post embedding (0.0–1.0)
    cosine_similarity: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

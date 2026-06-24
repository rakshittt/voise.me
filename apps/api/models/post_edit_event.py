import uuid

import sqlalchemy as sa
from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class PostEditEvent(Base):
    __tablename__ = "post_edit_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    generation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generations.id", ondelete="SET NULL"), nullable=True
    )
    variant_index: Mapped[int] = mapped_column(Integer, nullable=False)
    generated_content: Mapped[str] = mapped_column(Text, nullable=False)
    edited_content: Mapped[str] = mapped_column(Text, nullable=False)
    # [{"rule": "avoid em dashes", "category": "punctuation", "example": "..."}]
    inferred_rules: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # Implicit preference strength: discard=0.0, save=0.7, edit-then-save=0.85, share=1.0
    preference_signal: Mapped[float | None] = mapped_column(sa.Float, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

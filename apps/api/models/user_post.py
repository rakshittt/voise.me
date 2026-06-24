import uuid

import sqlalchemy as sa
from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class UserPost(Base):
    __tablename__ = "user_posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_embedding: Mapped[list | None] = mapped_column(Vector(1536))
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    # Topic cluster assigned during voice profile build (0-based index). NULL until first build.
    cluster_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    # Structural argument type (story/list/contrarian/how_to/observation_question/problem_insight_proof)
    argument_type: Mapped[str | None] = mapped_column(sa.String(50), nullable=True, index=True)
    # Boosted by user edits (1.0 = unreviewed, 2.0 = edited/approved)
    quality_weight: Mapped[float] = mapped_column(sa.Float, nullable=False, default=1.0)
    # StyleDistance 768-dim style embedding - shadow mode, NULL until model is available
    style_embedding: Mapped[list | None] = mapped_column(Vector(768), nullable=True, default=None)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

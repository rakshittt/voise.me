import uuid

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class UserIdeaContext(Base):
    __tablename__ = "user_idea_contexts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    # Ordered list of topic strings: ["B2B SaaS", "Hiring", "AI Tools"]
    expertise_topics: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # [{"cluster_id": 0, "label": "B2B SaaS", "post_count": 12, "last_30_days": 2}]
    coverage_map: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # [{"argument_type": "story", "accepted_count": 5, "rejected_count": 1}]
    resonance_signals: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    # {"0": "B2B SaaS", "1": "Hiring"}
    cluster_labels: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    # Top-ranked ideas from the last /ideas/recommended run
    # [{title, hook, content_type, rationale}]
    cached_ideas: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    built_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

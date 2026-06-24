"""Add idea_events table for recommendation engine learning loop.

Revision ID: 016
Revises: 015
Create Date: 2026-06-24
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "idea_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("idea_hash", sa.String(64), nullable=False),
        sa.Column("event_type", sa.String(20), nullable=False),
        sa.Column(
            "idea_data",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment='{"title": str, "hook": str, "content_type": str, "rationale": str}',
        ),
        sa.Column("recommendation_score", sa.Float(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_idea_events_user_id", "idea_events", ["user_id"])
    op.create_index("ix_idea_events_idea_hash", "idea_events", ["idea_hash"])
    op.create_index("ix_idea_events_created_at", "idea_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_idea_events_created_at", table_name="idea_events")
    op.drop_index("ix_idea_events_idea_hash", table_name="idea_events")
    op.drop_index("ix_idea_events_user_id", table_name="idea_events")
    op.drop_table("idea_events")

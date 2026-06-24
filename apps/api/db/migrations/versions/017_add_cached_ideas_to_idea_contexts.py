"""Add cached_ideas column to user_idea_contexts for instant /ideas/top reads.

Revision ID: 017
Revises: 016
Create Date: 2026-06-24
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_idea_contexts",
        sa.Column(
            "cached_ideas",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment=(
                "Top-ranked ideas from the last /ideas/recommended run. "
                "[{title, hook, content_type, rationale}]. "
                "Expires with the parent context row (see expires_at)."
            ),
        ),
    )


def downgrade() -> None:
    op.drop_column("user_idea_contexts", "cached_ideas")

"""Add creator_context JSONB to users for author background injection.

Revision ID: 014
Revises: 013
Create Date: 2026-06-24
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "creator_context",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment=(
                'Author background injected into generation prompts. '
                'Expected keys: current_role, current_company, work_highlights, '
                'expertise_topics, credibility_markers'
            ),
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "creator_context")

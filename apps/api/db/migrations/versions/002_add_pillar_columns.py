"""add content pillar columns

Revision ID: 002
Revises: 001
Create Date: 2026-06-10
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "user_posts",
        sa.Column("cluster_id", sa.Integer, nullable=True),
    )
    op.create_index("idx_user_posts_cluster", "user_posts", ["user_id", "cluster_id"])

    op.add_column(
        "voice_profiles",
        sa.Column("content_pillars", postgresql.JSONB, nullable=True),
    )


def downgrade() -> None:
    op.drop_index("idx_user_posts_cluster", table_name="user_posts")
    op.drop_column("user_posts", "cluster_id")
    op.drop_column("voice_profiles", "content_pillars")

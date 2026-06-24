"""Add user_idea_contexts table for idea recommendation engine grounding.

Revision ID: 015
Revises: 014
Create Date: 2026-06-24
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_idea_contexts",
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
            unique=True,
        ),
        sa.Column(
            "expertise_topics",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment="Ordered list of topic strings the creator is credible on",
        ),
        sa.Column(
            "coverage_map",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment=(
                "Per-cluster coverage: "
                "[{cluster_id, label, post_count, last_30_days}]"
            ),
        ),
        sa.Column(
            "resonance_signals",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment=(
                "Argument types ranked by audience acceptance: "
                "[{argument_type, accepted_count, rejected_count}]"
            ),
        ),
        sa.Column(
            "cluster_labels",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
            comment='Semantic labels for content pillars: {"0": "B2B SaaS", ...}',
        ),
        sa.Column(
            "built_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_user_idea_contexts_user_id", "user_idea_contexts", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_idea_contexts_user_id", table_name="user_idea_contexts")
    op.drop_table("user_idea_contexts")

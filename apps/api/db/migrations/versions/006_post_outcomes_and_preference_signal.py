"""Create post_outcomes table; add preference_signal to post_edit_events.

Revision ID: 006
Revises: 005
Create Date: 2026-06-11
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── post_edit_events: implicit preference strength for DITTO training ─────
    # discard=0.0, save=0.7, edit-then-save=0.85, share=1.0
    op.add_column(
        "post_edit_events",
        sa.Column("preference_signal", sa.Float, nullable=True),
    )

    # ── post_outcomes: LinkedIn engagement metrics logged by the user ─────────
    op.create_table(
        "post_outcomes",
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
        sa.Column(
            "generation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("generations.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("impressions", sa.Integer, nullable=True),
        sa.Column("reactions", sa.Integer, nullable=True),
        sa.Column("comments", sa.Integer, nullable=True),
        sa.Column("reposts", sa.Integer, nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
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
    op.create_index("ix_post_outcomes_user_id", "post_outcomes", ["user_id"])
    op.create_index("ix_post_outcomes_generation_id", "post_outcomes", ["generation_id"])


def downgrade() -> None:
    op.drop_index("ix_post_outcomes_generation_id", table_name="post_outcomes")
    op.drop_index("ix_post_outcomes_user_id", table_name="post_outcomes")
    op.drop_table("post_outcomes")
    op.drop_column("post_edit_events", "preference_signal")

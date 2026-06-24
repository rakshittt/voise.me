"""Add cluster_centroids to voice_profiles; create voice_profile_evals table.

Revision ID: 005
Revises: 004
Create Date: 2026-06-11
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── voice_profiles: per-cluster centroid vectors ───────────────────────────
    # [[float, ...], [float, ...], ...]  - one unit-norm centroid per cluster
    op.add_column(
        "voice_profiles",
        sa.Column("cluster_centroids", postgresql.JSONB, nullable=True),
    )

    # ── voice_profile_evals: hold-out eval results ────────────────────────────
    op.create_table(
        "voice_profile_evals",
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
            "profile_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("voice_profiles.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("holdout_content", sa.Text, nullable=False),
        sa.Column("generated_content", sa.Text, nullable=False),
        sa.Column("cosine_similarity", sa.Float, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_voice_profile_evals_user_id", "voice_profile_evals", ["user_id"])
    op.create_index("ix_voice_profile_evals_profile_id", "voice_profile_evals", ["profile_id"])


def downgrade() -> None:
    op.drop_index("ix_voice_profile_evals_profile_id", table_name="voice_profile_evals")
    op.drop_index("ix_voice_profile_evals_user_id", table_name="voice_profile_evals")
    op.drop_table("voice_profile_evals")
    op.drop_column("voice_profiles", "cluster_centroids")

"""Add stylometric profile, LOO distribution, and style embedding column.

Revision ID: 007
Revises: 006
Create Date: 2026-06-12
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── voice_profiles: implicit stylometric fingerprint ──────────────────────
    # {"mtld_mean": float, "mtld_std": float, "pos_distribution": {tag: freq}}
    op.add_column(
        "voice_profiles",
        sa.Column("stylometric_profile", postgresql.JSONB, nullable=True),
    )
    # Sorted list of per-post LOO cosine similarities for percentile scoring
    op.add_column(
        "voice_profiles",
        sa.Column("loo_distribution", postgresql.JSONB, nullable=True),
    )

    # ── user_posts: StyleDistance 768-dim style embedding (shadow mode) ───────
    # NULL until StyleDistance ONNX model is activated; not used in scoring yet
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.add_column(
        "user_posts",
        sa.Column(
            "style_embedding",
            sa.Text,  # placeholder type - replaced below with VECTOR(768)
            nullable=True,
        ),
    )
    # Replace with proper pgvector type
    op.execute("ALTER TABLE user_posts DROP COLUMN style_embedding")
    op.execute("ALTER TABLE user_posts ADD COLUMN style_embedding vector(768)")


def downgrade() -> None:
    op.execute("ALTER TABLE user_posts DROP COLUMN IF EXISTS style_embedding")
    op.drop_column("voice_profiles", "loo_distribution")
    op.drop_column("voice_profiles", "stylometric_profile")

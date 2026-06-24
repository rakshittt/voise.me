"""add profile_type and seed_answers to voice_profiles

Revision ID: 010
Revises: 009
Create Date: 2026-06-17

profile_type:  'extracted' (default, all existing rows) or 'seed' (User B questionnaire path).
seed_answers:  JSONB snapshot of the questionnaire payload used to build a seed profile.
               NULL for extracted profiles.
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "voice_profiles",
        sa.Column(
            "profile_type",
            sa.String(20),
            nullable=False,
            server_default="extracted",
        ),
    )
    op.add_column(
        "voice_profiles",
        sa.Column("seed_answers", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.create_index(
        "ix_voice_profiles_profile_type",
        "voice_profiles",
        ["profile_type"],
    )


def downgrade() -> None:
    op.drop_index("ix_voice_profiles_profile_type", table_name="voice_profiles")
    op.drop_column("voice_profiles", "seed_answers")
    op.drop_column("voice_profiles", "profile_type")

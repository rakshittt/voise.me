"""Add trial_last_extended_date to users for daily trial-extension tracking.

Supports the engagement-based trial: base trial is 15 days, and each
calendar day the user generates a content piece, trial_ends_at is pushed
out by 1 day (capped at 30 days from signup). This column records the last
date credited, so a user can only earn one +1 day extension per day.

Revision ID: 021
Revises: 020
Create Date: 2026-06-30
"""
import sqlalchemy as sa
from alembic import op

revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "trial_last_extended_date",
            sa.Date(),
            nullable=True,
            comment="Last calendar date the trial was extended by 1 day for generation activity.",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "trial_last_extended_date")

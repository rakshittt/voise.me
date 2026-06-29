"""Extend all existing users' trial period from 14 to 30 days.

For any user where created_at + 30 days is still in the future, update
trial_ends_at to created_at + 30 days. Users whose 30-day window has
already passed are left untouched (their trial is over either way).

Revision ID: 018
Revises: 017
Create Date: 2026-06-29
"""
from alembic import op

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        UPDATE users
        SET trial_ends_at = created_at + INTERVAL '30 days'
        WHERE
            trial_ends_at IS NOT NULL
            AND created_at + INTERVAL '30 days' > NOW()
    """)


def downgrade() -> None:
    # Restore original 14-day windows for users still in trial
    op.execute("""
        UPDATE users
        SET trial_ends_at = created_at + INTERVAL '14 days'
        WHERE
            trial_ends_at IS NOT NULL
            AND created_at + INTERVAL '14 days' > NOW()
    """)

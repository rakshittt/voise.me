"""Add composite index on usage(user_id, created_at, action).

The usage summary query (hit on every dashboard load) filters by
(user_id, created_at) and groups by action. The existing
idx_usage_user_month index covers the filter but not the group key,
so this adds action to make the query a single index lookup.

Revision ID: 022
Revises: 021
Create Date: 2026-06-30
"""
import sqlalchemy as sa
from alembic import op

revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "idx_usage_user_month_action",
        "usage",
        ["user_id", "created_at", "action"],
    )


def downgrade() -> None:
    op.drop_index("idx_usage_user_month_action", table_name="usage")

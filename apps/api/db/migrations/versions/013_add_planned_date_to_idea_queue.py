"""Add planned_date to idea_queue for content calendar.

Revision ID: 013
Revises: 012
Create Date: 2026-06-18
"""
import sqlalchemy as sa
from alembic import op

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "idea_queue",
        sa.Column("planned_date", sa.Date(), nullable=True),
    )
    op.create_index("idx_idea_queue_planned_date", "idea_queue", ["user_id", "planned_date"])


def downgrade() -> None:
    op.drop_index("idx_idea_queue_planned_date", table_name="idea_queue")
    op.drop_column("idea_queue", "planned_date")

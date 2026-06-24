"""Make users.email nullable; normalize empty strings to NULL.

Revision ID: 004
Revises: 003
"""
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop NOT NULL first, then normalize empty strings to NULL
    op.alter_column("users", "email", nullable=True)
    op.execute("UPDATE users SET email = NULL WHERE email = ''")


def downgrade() -> None:
    # Revert empty emails back to empty string (required for NOT NULL)
    op.execute("UPDATE users SET email = '' WHERE email IS NULL")
    op.alter_column("users", "email", nullable=False)

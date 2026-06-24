"""Remove publish tracking and post_outcomes table.

Revision ID: 011
Revises: 010
Create Date: 2026-06-17
"""
from alembic import op

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_table("post_outcomes")
    op.drop_column("generations", "published")
    op.drop_column("generations", "published_at")
    op.drop_column("generations", "selected_variant_index")


def downgrade() -> None:
    import sqlalchemy as sa

    op.add_column(
        "generations",
        sa.Column("selected_variant_index", sa.Integer(), nullable=True),
    )
    op.add_column(
        "generations",
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "generations",
        sa.Column("published", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_table(
        "post_outcomes",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("generation_id", sa.dialects.postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("impressions", sa.Integer(), nullable=True),
        sa.Column("reactions", sa.Integer(), nullable=True),
        sa.Column("comments", sa.Integer(), nullable=True),
        sa.Column("reposts", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["generation_id"], ["generations.id"], ondelete="CASCADE"),
    )

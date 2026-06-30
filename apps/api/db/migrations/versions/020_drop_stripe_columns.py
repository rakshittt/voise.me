"""Drop stripe_customer_id / stripe_subscription_id from users.

Documents a schema change that was already applied directly to the database
(the live `users` table and `alembic_version` were already at this state,
but no migration file existed for it - this backfills the migration history
so `alembic upgrade head` is consistent across environments). Billing is on
hold; these columns are dropped along with Stripe usage.

Revision ID: 020
Revises: 018
Create Date: 2026-06-30
"""
import sqlalchemy as sa
from alembic import op

revision = "020"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("idx_users_stripe_customer", table_name="users", if_exists=True)
    op.drop_column("users", "stripe_customer_id")
    op.drop_column("users", "stripe_subscription_id")


def downgrade() -> None:
    op.add_column("users", sa.Column("stripe_subscription_id", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("stripe_customer_id", sa.String(255), nullable=True))
    op.create_index("idx_users_stripe_customer", "users", ["stripe_customer_id"])

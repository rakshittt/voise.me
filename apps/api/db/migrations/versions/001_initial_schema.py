"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-06-08
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("clerk_user_id", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("plan", sa.String(50), nullable=False, server_default="starter"),
        sa.Column("stripe_customer_id", sa.String(255), nullable=True),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("trial_ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("clerk_user_id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("idx_users_clerk_id", "users", ["clerk_user_id"])
    op.create_index("idx_users_stripe_customer", "users", ["stripe_customer_id"])

    op.create_table(
        "voice_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("status", sa.String(50), nullable=False, server_default="building"),
        sa.Column("post_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("confidence_level", sa.String(20), nullable=True),
        sa.Column("hook_distribution", postgresql.JSONB, nullable=True),
        sa.Column("sentence_rhythm", postgresql.JSONB, nullable=True),
        sa.Column("paragraph_structure", postgresql.JSONB, nullable=True),
        sa.Column("vocabulary_register", postgresql.JSONB, nullable=True),
        sa.Column("structural_pattern", postgresql.JSONB, nullable=True),
        sa.Column("cta_style", postgresql.JSONB, nullable=True),
        sa.Column("emotional_register", postgresql.JSONB, nullable=True),
        sa.Column("profile_embedding", sa.Text, nullable=True),  # managed as vector(1536) below
        sa.Column("raw_posts_hash", sa.String(64), nullable=True),
        sa.Column("spoken_samples", postgresql.JSONB, nullable=True),
        sa.Column("last_built_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    # Re-type the embedding column to vector(1536) after table creation
    op.execute("ALTER TABLE voice_profiles ALTER COLUMN profile_embedding TYPE vector(1536) USING NULL")
    op.create_index("idx_voice_profiles_user", "voice_profiles", ["user_id"], unique=True)

    op.create_table(
        "generations",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("input_text", sa.Text, nullable=False),
        sa.Column("input_type", sa.String(50), nullable=False),
        sa.Column("source_idea_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("variants", postgresql.JSONB, nullable=False),
        sa.Column("selected_variant_index", sa.Integer, nullable=True),
        sa.Column("published", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_generations_user", "generations", ["user_id"])
    op.create_index("idx_generations_created", "generations", ["user_id", "created_at"])

    op.create_table(
        "idea_queue",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(255), nullable=True),
        sa.Column("transcription", sa.Text, nullable=False),
        sa.Column("audio_duration_seconds", sa.Integer, nullable=True),
        sa.Column("capture_method", sa.String(50), nullable=False, server_default="voice"),
        sa.Column("status", sa.String(50), nullable=False, server_default="queued"),
        sa.Column("generation_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("captured_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["generation_id"], ["generations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_idea_queue_user_status", "idea_queue", ["user_id", "status"])

    op.create_table(
        "user_posts",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("content_embedding", sa.Text, nullable=True),
        sa.Column("word_count", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute("ALTER TABLE user_posts ALTER COLUMN content_embedding TYPE vector(1536) USING NULL")
    op.create_index("idx_user_posts_user", "user_posts", ["user_id"])
    # pgvector HNSW index for fast similarity search
    op.execute(
        "CREATE INDEX idx_user_posts_embedding ON user_posts "
        "USING hnsw (content_embedding vector_cosine_ops) "
        "WITH (m = 16, ef_construction = 64)"
    )

    op.create_table(
        "audio_uploads",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("idea_queue_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("r2_object_key", sa.String(500), nullable=False),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column("file_size_bytes", sa.Integer, nullable=True),
        sa.Column("transcription_status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["idea_queue_id"], ["idea_queue.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.execute(
        "CREATE INDEX idx_audio_uploads_pending ON audio_uploads (transcription_status) "
        "WHERE transcription_status = 'pending'"
    )

    op.create_table(
        "usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("model_used", sa.String(100), nullable=True),
        sa.Column("tokens_input", sa.Integer, nullable=True),
        sa.Column("tokens_output", sa.Integer, nullable=True),
        sa.Column("cost_usd", sa.Numeric(10, 6), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_usage_user_month", "usage", ["user_id", "created_at"])

    op.create_table(
        "processed_webhooks",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("stripe_event_id", sa.String(255), nullable=False),
        sa.Column("event_type", sa.String(100), nullable=False),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stripe_event_id"),
    )


def downgrade() -> None:
    op.drop_table("processed_webhooks")
    op.drop_table("usage")
    op.drop_table("audio_uploads")
    op.drop_table("user_posts")
    op.drop_table("idea_queue")
    op.drop_table("generations")
    op.drop_table("voice_profiles")
    op.drop_table("users")
    op.execute("DROP EXTENSION IF EXISTS vector")

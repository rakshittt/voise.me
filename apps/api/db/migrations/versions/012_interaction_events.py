"""Add interaction_events table and context_snapshot column on generations.

interaction_events is append-only. Every in-app action on a generated draft
lands here as a raw fact. Interpretation happens downstream (nightly distiller,
eval harness); the capture layer stores nothing derived.

context_snapshot on generations records which exemplars and edit rules were
active when the system produced this generation, making events reconstructable.

Revision ID: 012
Revises: 011
Create Date: 2026-06-17
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── generations: context at generation time ───────────────────────────────
    # {
    #   "profile_version_hash": "abc123..",   # first 12 chars of SHA-256 of profile JSONB
    #   "exemplar_post_ids": ["uuid", ...],   # up to 3 UserPost IDs used as few-shots
    #   "active_rule_count": 4,               # number of edit rules injected into prompt
    #   "active_rule_hashes": ["sha...", ...] # hashes of the injected rules (for dedup audit)
    # }
    op.add_column(
        "generations",
        sa.Column("context_snapshot", postgresql.JSONB, nullable=True),
    )

    # ── interaction_events ────────────────────────────────────────────────────
    op.create_table(
        "interaction_events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        # SET NULL so events survive if a generation row is ever cleaned up.
        sa.Column(
            "generation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("generations.id", ondelete="SET NULL"),
            nullable=True,
        ),
        # 0/1/2 for variant-level events; NULL for generation-level events (abandoned).
        sa.Column("variant_index", sa.Integer, nullable=True),
        # variant_shown | variant_selected | rejected_on_sight | regenerated
        # | edited | copied | abandoned
        sa.Column("event_type", sa.String(50), nullable=False),
        # Populated for regenerated / rejected_on_sight.
        # not_my_voice | wrong_angle | too_long | disagree
        sa.Column("rejection_reason", sa.String(50), nullable=True),
        # Char-level edit distance between content-at-copy and original generated content.
        # 0 = copied without touching a character - the strongest positive signal.
        sa.Column("edit_distance_from_original", sa.Integer, nullable=True),
        # Positive = user added words; negative = removed words.
        sa.Column("word_count_delta", sa.Integer, nullable=True),
        # Milliseconds from variant_shown to this event (client-derived).
        sa.Column("time_to_action_ms", sa.Integer, nullable=True),
        # Client-generated UUIDv4 grouping all events in one generate→interact session.
        sa.Column("session_id", sa.String(36), nullable=True),
        # Append-only - no updated_at.
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )

    # Indexes for the query patterns that will actually run:
    # - per-user event history (distiller, eval harness)
    op.create_index(
        "ix_interaction_events_user_id",
        "interaction_events",
        ["user_id"],
    )
    # - per-generation event history (reconstruct a single session)
    op.create_index(
        "ix_interaction_events_generation_id",
        "interaction_events",
        ["generation_id"],
    )
    # - per-type filtering across users (cross-user signal extraction, future)
    op.create_index(
        "ix_interaction_events_event_type",
        "interaction_events",
        ["event_type"],
    )
    # - time-range scans (nightly batch, eval cohort queries)
    op.create_index(
        "ix_interaction_events_created_at",
        "interaction_events",
        ["created_at"],
    )
    # - compound: per-user, per-type, time-ordered - the primary distiller query
    op.create_index(
        "ix_interaction_events_user_type_time",
        "interaction_events",
        ["user_id", "event_type", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_interaction_events_user_type_time", table_name="interaction_events")
    op.drop_index("ix_interaction_events_created_at", table_name="interaction_events")
    op.drop_index("ix_interaction_events_event_type", table_name="interaction_events")
    op.drop_index("ix_interaction_events_generation_id", table_name="interaction_events")
    op.drop_index("ix_interaction_events_user_id", table_name="interaction_events")
    op.drop_table("interaction_events")
    op.drop_column("generations", "context_snapshot")

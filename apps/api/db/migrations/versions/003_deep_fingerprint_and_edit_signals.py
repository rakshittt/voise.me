"""deep fingerprint columns and edit signal table

Revision ID: 003
Revises: 002
Create Date: 2026-06-10
"""
import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── voice_profiles: deep fingerprint columns ───────────────────────────────
    # {"signature_phrases": [...], "absent_vocabulary": [...], "signature_metaphors": [...]}
    op.add_column("voice_profiles", sa.Column("lexical_signature", postgresql.JSONB, nullable=True))
    # [{"type": "problem_insight_proof", "frequency": 0.4, "template": "..."}]
    op.add_column("voice_profiles", sa.Column("argument_templates", postgresql.JSONB, nullable=True))
    # {"positions": [{"topic": "AI", "stance": "pragmatist", "evidence_count": 8}]}
    op.add_column("voice_profiles", sa.Column("belief_stances", postgresql.JSONB, nullable=True))
    # {"confidence_level": 0.8, "persona": "practitioner", "self_reference_rate": 0.6, "hedge_frequency": 0.1}
    op.add_column("voice_profiles", sa.Column("epistemic_style", postgresql.JSONB, nullable=True))

    # ── user_posts: argument type + quality weight for hierarchical retrieval ──
    op.add_column("user_posts", sa.Column("argument_type", sa.String(50), nullable=True))
    op.add_column(
        "user_posts",
        sa.Column("quality_weight", sa.Float, nullable=False, server_default="1.0"),
    )
    op.create_index("idx_user_posts_arg_type", "user_posts", ["user_id", "argument_type"])

    # ── post_edit_events: captures user edits for supervised learning ──────────
    op.create_table(
        "post_edit_events",
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
            index=True,
        ),
        sa.Column(
            "generation_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("generations.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("variant_index", sa.Integer, nullable=False),
        sa.Column("generated_content", sa.Text, nullable=False),
        sa.Column("edited_content", sa.Text, nullable=False),
        # [{"rule": "avoid em dashes", "category": "punctuation"}, ...]
        sa.Column("inferred_rules", postgresql.JSONB, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("idx_edit_events_user_time", "post_edit_events", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("idx_edit_events_user_time", table_name="post_edit_events")
    op.drop_table("post_edit_events")
    op.drop_index("idx_user_posts_arg_type", table_name="user_posts")
    op.drop_column("user_posts", "quality_weight")
    op.drop_column("user_posts", "argument_type")
    op.drop_column("voice_profiles", "epistemic_style")
    op.drop_column("voice_profiles", "belief_stances")
    op.drop_column("voice_profiles", "argument_templates")
    op.drop_column("voice_profiles", "lexical_signature")

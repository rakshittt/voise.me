import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from db.session import Base


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="building")
    post_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    confidence_level: Mapped[str | None] = mapped_column(String(20))

    # JSONB structure: {"bold_statement": 0.78, "question": 0.15, ...}
    hook_distribution: Mapped[dict | None] = mapped_column(JSONB)
    # JSONB structure: {"avg_length": 11, "short_ratio": 0.6, "long_ratio": 0.15}
    sentence_rhythm: Mapped[dict | None] = mapped_column(JSONB)
    # JSONB structure: {"single_line_ratio": 0.82, "avg_paragraph_length": 1.3}
    paragraph_structure: Mapped[dict | None] = mapped_column(JSONB)
    # JSONB structure: {"formality_score": 0.3, "jargon_density": 0.1, "avg_word_length": 4.2}
    vocabulary_register: Mapped[dict | None] = mapped_column(JSONB)
    # JSONB structure: {"dominant": "problem_insight_proof", "frequency": 0.65, "alternatives": [...]}
    structural_pattern: Mapped[dict | None] = mapped_column(JSONB)
    # JSONB structure: {"dominant": "implicit_question", "frequency": 0.55, "none_ratio": 0.2}
    cta_style: Mapped[dict | None] = mapped_column(JSONB)
    # JSONB structure: {"analytical": 0.5, "pragmatic": 0.3, "provocative": 0.2}
    emotional_register: Mapped[dict | None] = mapped_column(JSONB)

    profile_embedding: Mapped[list | None] = mapped_column(Vector(1536))
    raw_posts_hash: Mapped[str | None] = mapped_column(String(64))

    # JSONB structure: {"k": 4, "cluster_counts": [12, 15, 8, 10]}
    content_pillars: Mapped[dict | None] = mapped_column(JSONB, default=None)
    # JSONB structure: [[float, ...], [float, ...], ...]  - one unit-norm centroid per cluster
    cluster_centroids: Mapped[list | None] = mapped_column(JSONB, default=None)

    # Deep fingerprint - Layer 1 of voice DNA upgrade
    # {"signature_phrases": [...], "absent_vocabulary": [...], "signature_metaphors": [...]}
    lexical_signature: Mapped[dict | None] = mapped_column(JSONB, default=None)
    # [{"type": "problem_insight_proof", "frequency": 0.4, "template": "Setup → Twist → Proof → Implication"}]
    argument_templates: Mapped[list | None] = mapped_column(JSONB, default=None)
    # {"positions": [{"topic": "AI tools", "stance": "pragmatist", "evidence_count": 8}]}
    belief_stances: Mapped[dict | None] = mapped_column(JSONB, default=None)
    # {"confidence_level": 0.8, "persona": "practitioner", "self_reference_rate": 0.6, "hedge_frequency": 0.1}
    epistemic_style: Mapped[dict | None] = mapped_column(JSONB, default=None)

    # 'extracted' (built from real posts) | 'seed' (built from questionnaire, User B path)
    profile_type: Mapped[str] = mapped_column(String(20), nullable=False, default="extracted")
    # Questionnaire payload used to generate a seed profile; NULL for extracted profiles.
    # {"content_type": str, "register": str, "target_audience": str, "style_anchor": str,
    #  "posting_goal": str, "tone_words": [str, ...]}
    seed_answers: Mapped[dict | None] = mapped_column(JSONB, default=None)

    # Reserved for future spoken-to-written translation model. NULL at MVP.
    spoken_samples: Mapped[dict | None] = mapped_column(JSONB, default=None)

    # Sprint 5: implicit stylometric fingerprint
    # {"mtld_mean": float, "mtld_std": float, "pos_distribution": {tag: freq}}
    stylometric_profile: Mapped[dict | None] = mapped_column(JSONB, default=None)
    # Sorted list of per-post LOO cosine similarities; used for percentile scoring
    loo_distribution: Mapped[list | None] = mapped_column(JSONB, default=None)

    last_built_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

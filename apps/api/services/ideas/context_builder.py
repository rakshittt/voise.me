"""Assemble the idea context: expertise topics, coverage map, resonance signals.

The idea context is the grounding layer for the recommendation engine. It answers:
- What does this creator credibly know? (expertise_topics)
- Which topics have they covered recently vs. neglected? (coverage_map)
- Which post formats have their audience responded best to? (resonance_signals)
"""
import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import TypedDict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.generation import Generation
from models.idea_context import UserIdeaContext
from models.interaction_event import InteractionEvent
from models.user import User
from models.user_post import UserPost
from models.voice_profile import VoiceProfile

logger = logging.getLogger(__name__)

_CONTEXT_TTL_HOURS = 24


class CoverageEntry(TypedDict):
    cluster_id: int
    label: str
    post_count: int
    last_30_days: int


class ResonanceSignal(TypedDict):
    argument_type: str
    accepted_count: int
    rejected_count: int


class IdeaContext(TypedDict):
    expertise_topics: list[str]
    coverage_map: list[CoverageEntry]
    resonance_signals: list[ResonanceSignal]
    cluster_labels: dict[str, str]
    built_at: str


async def get_or_build_context(
    user_id: uuid.UUID,
    profile: VoiceProfile,
    user: User,
    cluster_labels: dict[str, str],
    session: AsyncSession,
) -> IdeaContext:
    """Return cached context if fresh, otherwise rebuild and persist."""
    result = await session.execute(
        select(UserIdeaContext).where(UserIdeaContext.user_id == user_id)
    )
    row = result.scalar_one_or_none()

    now = datetime.now(UTC)
    if row is not None and row.expires_at > now:
        return IdeaContext(
            expertise_topics=row.expertise_topics or [],
            coverage_map=row.coverage_map or [],
            resonance_signals=row.resonance_signals or [],
            cluster_labels=row.cluster_labels or {},
            built_at=row.built_at.isoformat(),
        )

    ctx = await build_idea_context(user_id, profile, user, cluster_labels, session)
    await _persist_context(user_id, ctx, row, session)
    return ctx


async def build_idea_context(
    user_id: uuid.UUID,
    profile: VoiceProfile,
    user: User,
    cluster_labels: dict[str, str],
    session: AsyncSession,
) -> IdeaContext:
    """Compute fresh context from live data."""
    expertise_topics = _extract_expertise_topics(profile, user, cluster_labels)
    coverage_map = await _compute_coverage_map(user_id, profile, cluster_labels, session)
    resonance_signals = await _compute_resonance_signals(user_id, session)

    return IdeaContext(
        expertise_topics=expertise_topics,
        coverage_map=coverage_map,
        resonance_signals=resonance_signals,
        cluster_labels=cluster_labels,
        built_at=datetime.now(UTC).isoformat(),
    )


async def _persist_context(
    user_id: uuid.UUID,
    ctx: IdeaContext,
    existing: UserIdeaContext | None,
    session: AsyncSession,
) -> None:
    expires_at = datetime.now(UTC) + timedelta(hours=_CONTEXT_TTL_HOURS)
    built_at = datetime.now(UTC)

    if existing is not None:
        existing.expertise_topics = ctx["expertise_topics"]
        existing.coverage_map = ctx["coverage_map"]
        existing.resonance_signals = ctx["resonance_signals"]
        existing.cluster_labels = ctx["cluster_labels"]
        existing.built_at = built_at
        existing.expires_at = expires_at
    else:
        session.add(
            UserIdeaContext(
                user_id=user_id,
                expertise_topics=ctx["expertise_topics"],
                coverage_map=ctx["coverage_map"],
                resonance_signals=ctx["resonance_signals"],
                cluster_labels=ctx["cluster_labels"],
                built_at=built_at,
                expires_at=expires_at,
            )
        )
    await session.flush()


def _extract_expertise_topics(
    profile: VoiceProfile,
    user: User,
    cluster_labels: dict[str, str],
) -> list[str]:
    topics: list[str] = []

    # Creator context: explicit self-declared expertise
    ctx = user.creator_context or {}
    if isinstance(ctx, dict):
        if ctx.get("current_role"):
            topics.append(str(ctx["current_role"]))
        if ctx.get("industry"):
            topics.append(str(ctx["industry"]))
        for t in (ctx.get("expertise_topics") or [])[:5]:
            if t:
                topics.append(str(t))

    # Belief stances: topics they hold strong positions on
    stances = profile.belief_stances or {}
    positions = stances.get("positions", []) if isinstance(stances, dict) else []
    for pos in positions[:6]:
        topic = pos.get("topic", "")
        if topic:
            topics.append(topic)

    # Cluster labels (only clusters with ≥3 posts - weak clusters add noise)
    pillars = profile.content_pillars or {}
    counts = pillars.get("cluster_counts", [])
    for cid_str, label in cluster_labels.items():
        if not label:
            continue
        try:
            count = counts[int(cid_str)] if counts else 0
        except (IndexError, ValueError):
            count = 0
        if count >= 3:
            topics.append(label)

    # Deduplicate, preserving order and ignoring case
    seen: set[str] = set()
    result: list[str] = []
    for t in topics:
        key = t.lower().strip()
        if key and key not in seen:
            seen.add(key)
            result.append(t.strip())

    return result[:15]


async def _compute_coverage_map(
    user_id: uuid.UUID,
    profile: VoiceProfile,
    cluster_labels: dict[str, str],
    session: AsyncSession,
) -> list[CoverageEntry]:
    pillars = profile.content_pillars or {}
    k = pillars.get("k", 0)
    if k == 0:
        return []

    cutoff = datetime.now(UTC) - timedelta(days=30)

    # One query for all-time counts per cluster (replaces k sequential COUNTs)
    total_result = await session.execute(
        select(UserPost.cluster_id, func.count(UserPost.id).label("n"))
        .where(UserPost.user_id == user_id, UserPost.cluster_id.is_not(None))
        .group_by(UserPost.cluster_id)
    )
    totals: dict[int, int] = {row.cluster_id: row.n for row in total_result.all()}

    # One query for recent counts per cluster
    recent_result = await session.execute(
        select(UserPost.cluster_id, func.count(UserPost.id).label("n"))
        .where(
            UserPost.user_id == user_id,
            UserPost.cluster_id.is_not(None),
            UserPost.created_at >= cutoff,
        )
        .group_by(UserPost.cluster_id)
    )
    recents: dict[int, int] = {row.cluster_id: row.n for row in recent_result.all()}

    return [
        CoverageEntry(
            cluster_id=cid,
            label=cluster_labels.get(str(cid), f"Topic {cid + 1}"),
            post_count=totals.get(cid, 0),
            last_30_days=recents.get(cid, 0),
        )
        for cid in range(k)
    ]


async def _compute_resonance_signals(
    user_id: uuid.UUID,
    session: AsyncSession,
) -> list[ResonanceSignal]:
    """
    Determine which argument types the audience responds best to.

    Accepted = event_type='copied' AND edit_distance_from_original=0 (copy-without-edit).
    Rejected = event_type in ('regenerated', 'rejected_on_sight').
    Argument type is pulled from the variant's structural_pattern field.
    """
    result = await session.execute(
        select(
            InteractionEvent.event_type,
            InteractionEvent.variant_index,
            InteractionEvent.edit_distance_from_original,
            Generation.variants,
        )
        .join(Generation, Generation.id == InteractionEvent.generation_id)
        .where(
            InteractionEvent.user_id == user_id,
            InteractionEvent.generation_id.is_not(None),
            InteractionEvent.variant_index.is_not(None),
        )
        .limit(300)
    )
    rows = result.fetchall()

    accepted: dict[str, int] = {}
    rejected: dict[str, int] = {}

    for event_type, variant_index, edit_distance, variants in rows:
        if not isinstance(variants, list) or variant_index >= len(variants):
            continue
        variant = variants[variant_index]
        if not isinstance(variant, dict):
            continue
        arg_type = (
            variant.get("structural_pattern")
            or variant.get("argument_type")
            or "unknown"
        )

        if event_type == "copied" and edit_distance == 0:
            accepted[arg_type] = accepted.get(arg_type, 0) + 1
        elif event_type in ("regenerated", "rejected_on_sight"):
            rejected[arg_type] = rejected.get(arg_type, 0) + 1

    all_types = set(accepted.keys()) | set(rejected.keys())
    signals = [
        ResonanceSignal(
            argument_type=t,
            accepted_count=accepted.get(t, 0),
            rejected_count=rejected.get(t, 0),
        )
        for t in all_types
    ]
    return sorted(
        signals,
        key=lambda s: s["accepted_count"] - s["rejected_count"],
        reverse=True,
    )

import hashlib
import logging
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.idea_context import UserIdeaContext  # noqa: F401 - registers model for Alembic
from models.idea_event import IdeaEvent  # noqa: F401 - registers model for Alembic
from models.user import User
from models.voice_profile import VoiceProfile
from schemas.ideas import (
    IdeaContextResponse,
    IdeaEventRequest,
    IdeaGenerateRequest,
    IdeasResponse,
)
from services.cache.voice_profile_cache import get_cached_profile, set_cached_profile
from services.generation.idea_generator import generate_ideas
from services.ideas.candidate_generator import generate_candidates
from services.ideas.cluster_labeller import ensure_cluster_labels
from services.ideas.context_builder import get_or_build_context
from services.ideas.ranker import rank_candidates
from services.rate_limiter import check_rate_limit
from services.usage import log_usage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ideas", tags=["ideas"])


def _idea_hash(title: str, hook: str) -> str:
    return hashlib.sha256(f"{title}|{hook}".encode()).hexdigest()


async def _require_ready_profile(user_id: uuid.UUID, session: AsyncSession) -> VoiceProfile:
    profile = await get_cached_profile(user_id)
    if profile is not None:
        if profile.status != "ready":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Voice profile not ready. Build your Voice DNA first.",
            )
        return profile

    result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None or profile.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice profile not ready. Build your Voice DNA first.",
        )
    await set_cached_profile(profile)
    return profile


async def _store_cached_ideas(
    user_id: uuid.UUID,
    ideas: list,
    session: AsyncSession,
) -> None:
    """Persist top-ranked ideas to context cache so /ideas/top can read them instantly."""
    result = await session.execute(
        select(UserIdeaContext).where(UserIdeaContext.user_id == user_id)
    )
    row = result.scalar_one_or_none()
    if row is not None:
        row.cached_ideas = [i.model_dump() for i in ideas]
        await session.flush()


@router.get("/context", response_model=IdeaContextResponse, status_code=status.HTTP_200_OK)
async def get_idea_context(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> IdeaContextResponse:
    """Debug endpoint: returns the grounding context used to generate ideas for this user."""
    try:
        profile = await _require_ready_profile(user.id, session)
    except HTTPException as exc:
        raise exc from None

    cluster_labels = await ensure_cluster_labels(user.id, profile, session)
    ctx = await get_or_build_context(user.id, profile, user, cluster_labels, session)
    await session.commit()

    return IdeaContextResponse(
        expertise_topics=ctx["expertise_topics"],
        coverage_map=ctx["coverage_map"],
        resonance_signals=ctx["resonance_signals"],
        cluster_labels=ctx["cluster_labels"],
        built_at=ctx["built_at"],
    )


@router.get("/top", status_code=status.HTTP_200_OK)
async def get_top_idea(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Return the #1 ranked idea from the last /ideas/recommended call.

    Reads only from cache - zero LLM calls, fast enough for the dashboard widget.
    Returns {idea: null} if no cached results exist yet.
    """
    try:
        await _require_ready_profile(user.id, session)
    except HTTPException:
        return {"idea": None}

    result = await session.execute(
        select(UserIdeaContext).where(UserIdeaContext.user_id == user.id)
    )
    row = result.scalar_one_or_none()

    if row is None or row.cached_ideas is None or not row.cached_ideas:
        return {"idea": None}

    if row.expires_at and row.expires_at <= datetime.now(UTC):
        return {"idea": None}

    return {"idea": row.cached_ideas[0]}


@router.get("/recommended", status_code=status.HTTP_200_OK)
async def get_recommended_ideas(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    refresh: bool = False,
) -> dict:
    """Return top-5 context-grounded, ranked idea recommendations.

    Results are cached in the DB (24h TTL via UserIdeaContext.expires_at).
    Pass ?refresh=true to force a rebuild even if the cache is fresh.
    """
    try:
        await _require_ready_profile(user.id, session)
    except HTTPException:
        return {"ideas": [], "ready": False}

    # ── Fast path: serve from DB cache if fresh ──────────────────────────────
    if not refresh:
        try:
            cache_row = await session.execute(
                select(UserIdeaContext).where(UserIdeaContext.user_id == user.id)
            )
            ctx_row = cache_row.scalar_one_or_none()
            if (
                ctx_row is not None
                and ctx_row.cached_ideas
                and ctx_row.expires_at is not None
                and ctx_row.expires_at > datetime.now(UTC)
            ):
                return {"ideas": ctx_row.cached_ideas, "ready": True, "from_cache": True}
        except Exception as e:
            logger.warning("Cache read for ideas/recommended failed, regenerating: %s", e)

    # ── Slow path: run full pipeline ─────────────────────────────────────────
    try:
        profile = await _require_ready_profile(user.id, session)
        cluster_labels = await ensure_cluster_labels(user.id, profile, session)
        ctx = await get_or_build_context(user.id, profile, user, cluster_labels, session)

        candidates = await generate_candidates(profile=profile, context=ctx)
        if not candidates:
            logger.warning("No candidates generated for user %s", user.id)
            return {"ideas": [], "ready": True}

        ideas = await rank_candidates(
            candidates=candidates,
            profile=profile,
            context=ctx,
            user_id=user.id,
            session=session,
            top_n=5,
        )

        for idea in ideas:
            session.add(
                IdeaEvent(
                    user_id=user.id,
                    idea_hash=_idea_hash(idea.title, idea.hook),
                    event_type="shown",
                    idea_data=idea.model_dump(),
                    recommendation_score=None,
                )
            )

        await _store_cached_ideas(user.id, ideas, session)
        await session.commit()
        return {"ideas": [i.model_dump() for i in ideas], "ready": True}

    except Exception as e:
        logger.error("Recommended ideas pipeline failed for user %s: %s", user.id, e)
        return {"ideas": [], "ready": False}


@router.post("/events", status_code=status.HTTP_204_NO_CONTENT)
async def log_idea_event(
    request: IdeaEventRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> None:
    """Log an idea interaction event (accepted/skipped/written)."""
    session.add(
        IdeaEvent(
            user_id=user.id,
            idea_hash=_idea_hash(request.title, request.hook),
            event_type=request.event_type,
            idea_data={
                "title": request.title,
                "hook": request.hook,
                "content_type": request.content_type,
                "rationale": request.rationale,
            },
            recommendation_score=request.recommendation_score,
        )
    )
    await session.commit()


@router.post("", response_model=IdeasResponse, status_code=status.HTTP_200_OK)
async def generate_post_ideas(
    request: IdeaGenerateRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> IdeasResponse:
    allowed, retry_after = await check_rate_limit(str(user.id), "ideas")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Try again soon.",
            headers={"Retry-After": str(retry_after)},
        )

    profile = await _require_ready_profile(user.id, session)

    try:
        ideas, llm_response = await generate_ideas(
            profile=profile,
            niche=request.niche,
            focus_topic=request.focus_topic,
            count=request.count,
        )
    except ValueError as e:
        logger.error("Idea generation failed for user %s: %s", user.id, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Idea generation temporarily unavailable",
        ) from e

    await log_usage(
        user_id=user.id,
        action="ideas",
        session=session,
        model_used=llm_response.model,
        tokens_input=llm_response.input_tokens,
        tokens_output=llm_response.output_tokens,
    )
    await session.commit()

    return IdeasResponse(ideas=ideas, niche=request.niche, model=llm_response.model)

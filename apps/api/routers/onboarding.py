"""
Onboarding router - handles the User B (no writing samples) path.

POST /onboarding/seed-profile   Build a seed voice profile from questionnaire answers.
GET  /onboarding/style-anchors  Return the three style anchor posts for the questionnaire.
"""
import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import AsyncSessionLocal, get_session
from models.user import User
from models.user_post import UserPost
from models.voice_profile import VoiceProfile
from schemas.voice_profile import SeedProfileRequest, VoiceProfileStatusResponse
from services.voice_dna.seed_builder import STYLE_ANCHOR_POSTS, build_seed_profile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/onboarding", tags=["onboarding"])


async def _store_bio_as_post(user_id: uuid.UUID, bio_text: str) -> None:
    """Embed the user's bio and store it as a UserPost so few-shot retrieval can find it."""
    from services.voice_dna.embedder import embed_text
    async with AsyncSessionLocal() as session:
        try:
            embedding = await embed_text(bio_text)
            post = UserPost(
                user_id=user_id,
                content=bio_text,
                content_embedding=embedding,
            )
            session.add(post)
            await session.commit()
            logger.info("Stored bio as UserPost for seed user %s", user_id)
        except Exception as e:
            logger.warning("Failed to embed/store bio for user %s: %s", user_id, e)


@router.get("/style-anchors")
async def get_style_anchors() -> dict:
    """Return the three style anchor posts shown during User B onboarding.

    No auth required - this data is static and public.
    """
    return {
        key: {
            "label": anchor["label"],
            "preview": anchor["preview"],
        }
        for key, anchor in STYLE_ANCHOR_POSTS.items()
    }


@router.post("/seed-profile", response_model=VoiceProfileStatusResponse)
async def create_seed_profile(
    request: SeedProfileRequest,
    background_tasks: BackgroundTasks,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> VoiceProfileStatusResponse:
    """Create or overwrite a seed voice profile from questionnaire answers.

    A seed profile is immediately usable for generation, but is marked
    profile_type='seed' so the UI can display appropriate provisional messaging.
    It must never be scored or displayed as if it were an extracted fingerprint.

    Idempotent: calling this again replaces the previous seed profile.
    If the user already has an extracted profile, 409 is returned - they should
    use /voice-profile/add-posts to enrich, not overwrite with a seed.
    """
    try:
        result = await session.execute(
            select(VoiceProfile).where(VoiceProfile.user_id == user.id)
        )
        existing = result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error("DB error loading voice profile for user %s: %s", user.id, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable. Please try again.",
        ) from e

    if existing and existing.profile_type == "extracted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "You already have a voice profile built from real writing samples. "
                "Use 'Add Sources' to enrich it instead."
            ),
        )

    seed_fields = build_seed_profile(request)

    try:
        if existing is None:
            profile = VoiceProfile(
                id=uuid.uuid4(),
                user_id=user.id,
                status="ready",
                profile_type="seed",
                confidence_level="provisional",
                post_count=0,
                seed_answers=request.model_dump(),
                **seed_fields,
            )
            session.add(profile)
        else:
            # Overwrite existing seed profile fields
            existing.status = "ready"
            existing.profile_type = "seed"
            existing.confidence_level = "provisional"
            existing.seed_answers = request.model_dump()
            for field, value in seed_fields.items():
                setattr(existing, field, value)

        await session.commit()
    except SQLAlchemyError as e:
        logger.error("DB error saving seed profile for user %s: %s", user.id, e)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Failed to save profile. Please try again.",
        ) from e

    if request.about_yourself:
        background_tasks.add_task(_store_bio_as_post, user.id, request.about_yourself)

    logger.info(
        "Seed profile created for user %s (anchor=%s goal=%s bio_len=%s)",
        user.id,
        request.style_anchor,
        request.posting_goal,
        len(request.about_yourself) if request.about_yourself else 0,
    )

    return VoiceProfileStatusResponse(
        status="ready",
        confidence_level="provisional",
        post_count=0,
        profile_type="seed",
    )

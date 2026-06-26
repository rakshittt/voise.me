import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.user import User
from models.voice_profile import VoiceProfile
from schemas.dna_match import DimensionDetailSchema, DNAMatchRequest, DNAMatchResponse
from services.rate_limiter import check_rate_limit
from services.usage import log_usage
from services.voice_dna.scorer import score_post_detailed

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dna-match", tags=["dna-match"])


@router.post("/analyze", response_model=DNAMatchResponse)
async def analyze_content(
    request: DNAMatchRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> DNAMatchResponse:
    allowed, retry_after = await check_rate_limit(str(user.id), "dna_match")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="DNA-Match rate limit exceeded.",
            headers={"Retry-After": str(retry_after)},
        )

    result = await session.execute(
        select(VoiceProfile).where(VoiceProfile.user_id == user.id)
    )
    profile = result.scalar_one_or_none()
    if profile is None or profile.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Voice profile not ready. Build your Voice DNA first.",
        )

    detailed = await score_post_detailed(request.content, profile)

    await log_usage(
        user.id,
        "dna_match",
        session,
        model_used="gpt-4o-mini",
        tokens_input=0,
        tokens_output=0,
    )
    await session.commit()

    return DNAMatchResponse(
        overall_score=detailed.overall_score,
        word_count=detailed.word_count,
        summary=detailed.summary,
        dimensions=[
            DimensionDetailSchema(
                key=d.key,
                label=d.label,
                score=d.score,
                rating=d.rating,
                post_label=d.post_label,
                profile_label=d.profile_label,
                guidance=d.guidance,
            )
            for d in detailed.dimensions
        ],
    )

import logging
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.data_source import DataSource
from models.post_edit_event import PostEditEvent
from models.user import User
from models.user_post import UserPost
from models.voice_profile import VoiceProfile
from models.voice_profile_eval import VoiceProfileEval
from schemas.voice_profile import (
    AddPostsRequest,
    BuildProfileRequest,
    EvalScoreResponse,
    FetchUrlRequest,
    FetchUrlResponse,
    ParseLinkedInExportResponse,
    ParsePdfResponse,
    ParseTextSourceRequest,
    ParseTextSourceResponse,
    VoiceProfileResponse,
    VoiceProfileStatusResponse,
    VoiceStrengthResponse,
)
from services.cache.voice_profile_cache import (
    get_cached_profile,
    get_cached_status_and_profile,
    invalidate_profile_cache,
    set_cached_profile,
)
from services.generation.interaction_distiller import distill_for_user_bg
from services.rate_limiter import check_rate_limit
from services.voice_dna.builder import MIN_POSTS, build_voice_profile, rebuild_voice_profile_from_stored
from services.voice_dna.linkedin_parser import LinkedInParseError, parse_linkedin_export
from services.voice_dna.parser import parse_posts
from services.voice_dna.pdf_extractor import extract_pdf_text
from services.voice_dna.text_chunker import chunk_text
from services.voice_dna.url_fetcher import UrlFetchError, fetch_url

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice-profile", tags=["voice-profile"])


@router.post("/parse-linkedin-export", response_model=ParseLinkedInExportResponse)
async def parse_linkedin_export_endpoint(
    file: Annotated[UploadFile, File(description="LinkedIn data export ZIP or Shares.csv")],
    user: Annotated[User, Depends(get_current_user)],
) -> ParseLinkedInExportResponse:
    """Parse a LinkedIn GDPR data export and return the extracted post strings.

    Does not build the voice profile - just parses and returns posts for
    the frontend to preview before the user confirms the build.
    Accepts a ZIP (the full data export) or the Shares.csv file directly.
    Max file size: 10 MB.
    """
    MAX_BYTES = 10 * 1024 * 1024  # 10 MB
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 10 MB.",
        )

    try:
        posts = parse_linkedin_export(content, file.filename or "upload")
    except LinkedInParseError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e

    return ParseLinkedInExportResponse(posts=posts, count=len(posts))


@router.post("/parse-text-source", response_model=ParseTextSourceResponse)
async def parse_text_source(
    request: ParseTextSourceRequest,
    user: Annotated[User, Depends(get_current_user)],
) -> ParseTextSourceResponse:
    """Chunk pasted text (blog, newsletter, transcript) into post-sized segments.

    Returns preview chunks for the frontend - does NOT start a profile build.
    source_type: "text" for generic writing, "transcript" for speaker-turn detection.
    """
    allowed_types = {"text", "transcript"}
    if request.source_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"source_type must be one of: {', '.join(allowed_types)}",
        )
    chunks = chunk_text(request.content, source_type=request.source_type)
    return ParseTextSourceResponse(
        chunks=chunks,
        count=len(chunks),
        source_type=request.source_type,
    )


@router.post("/parse-pdf", response_model=ParsePdfResponse)
async def parse_pdf_endpoint(
    file: Annotated[UploadFile, File(description="PDF file - max 20 MB")],
    user: Annotated[User, Depends(get_current_user)],
) -> ParsePdfResponse:
    """Extract text from a PDF and return voice-DNA-ready chunks.

    Does not start a profile build - returns chunks for the frontend to preview.
    Accepts text-layer PDFs only; scanned-image PDFs are not supported.
    Max file size: 20 MB, max pages read: 150.
    """
    MAX_BYTES = 20 * 1024 * 1024
    content = await file.read(MAX_BYTES + 1)
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Maximum size is 20 MB.",
        )

    filename = (file.filename or "").lower()
    if not filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PDF files are accepted (.pdf).",
        )

    try:
        text, page_count = extract_pdf_text(content)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e

    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No readable text found in this PDF. It may be a scanned image. "
                "Try copying the text and using the 'Paste writing' option instead."
            ),
        )

    chunks = chunk_text(text, source_type="text")
    if len(chunks) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Not enough content extracted (got {len(chunks)} segments, need at least 3). "
                "The PDF may be mostly tables, images, or formatting with very little prose."
            ),
        )

    return ParsePdfResponse(chunks=chunks, count=len(chunks), page_count=page_count)


@router.post("/fetch-url", response_model=FetchUrlResponse)
async def fetch_url_endpoint(
    request: FetchUrlRequest,
    user: Annotated[User, Depends(get_current_user)],
) -> FetchUrlResponse:
    """Fetch a public URL, extract readable text, and chunk it for voice DNA training.

    Rate-limited to 10 requests per hour per user. Returns preview chunks
    without starting a profile build.
    """
    allowed, retry_after = await check_rate_limit(str(user.id), "fetch_url")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="URL fetch rate limit exceeded. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    try:
        text, title = await fetch_url(request.url)
    except UrlFetchError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e

    chunks = chunk_text(text, source_type="text")
    if len(chunks) < 3:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Not enough content extracted from this URL "
                f"(got {len(chunks)} segments, need at least 3). "
                "Try pasting the article text directly instead."
            ),
        )
    return FetchUrlResponse(
        chunks=chunks,
        count=len(chunks),
        title=title,
        source_url=request.url,
    )


@router.post("/build", status_code=status.HTTP_202_ACCEPTED)
async def build_profile(
    request: BuildProfileRequest,
    background_tasks: BackgroundTasks,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    allowed, retry_after = await check_rate_limit(str(user.id), "voice_profile_build")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Voice profile build rate limit exceeded. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )

    # Validate post count before kicking off background task
    posts = parse_posts(request.posts)
    if len(posts) < MIN_POSTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"At least {MIN_POSTS} valid posts required. Found {len(posts)} after filtering posts under 30 words.",
        )

    # Reject if already building
    try:
        result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user.id))
        existing = result.scalar_one_or_none()
    except SQLAlchemyError as e:
        logger.error(f"DB error checking voice profile status for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable. Please try again in a moment.",
        ) from e

    if existing and existing.status == "building":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A voice profile build is already in progress.",
        )

    background_tasks.add_task(build_voice_profile, user.id, request.posts)
    background_tasks.add_task(distill_for_user_bg, user.id)
    background_tasks.add_task(invalidate_profile_cache, user.id)

    session.add(
        DataSource(
            user_id=user.id,
            source_type=request.source_type or "unknown",
            label=request.source_label,
            post_count=len(posts),
        )
    )
    await session.commit()

    return {"status": "processing", "message": "Voice DNA build started"}


@router.post("/rebuild", status_code=status.HTTP_202_ACCEPTED)
async def rebuild_profile(
    background_tasks: BackgroundTasks,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Re-run analysis on stored posts with the latest algorithms.

    No re-pasting required - uses posts already in the database.
    """
    result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user.id))
    existing = result.scalar_one_or_none()
    if existing is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No voice profile found. Build one first.",
        )
    if existing.status == "building":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A profile build is already in progress.",
        )
    background_tasks.add_task(rebuild_voice_profile_from_stored, user.id)
    background_tasks.add_task(invalidate_profile_cache, user.id)
    return {"status": "processing", "message": "Voice DNA rebuild started"}


@router.get("/status", response_model=VoiceProfileStatusResponse)
async def get_profile_status(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> VoiceProfileStatusResponse:
    # Fast path: status (15s TTL, safe for 3s polling) + profile in one round trip
    cached_status, cached_profile = await get_cached_status_and_profile(user.id)
    if cached_status is not None and cached_profile is not None:
        return VoiceProfileStatusResponse(
            status=cached_profile.status,
            confidence_level=cached_profile.confidence_level,
            post_count=cached_profile.post_count,
            last_built_at=cached_profile.last_built_at,
            profile_type=cached_profile.profile_type,
        )

    result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user.id))
    profile = result.scalar_one_or_none()

    if profile is None:
        return VoiceProfileStatusResponse(status="not_started")

    await set_cached_profile(profile)
    return VoiceProfileStatusResponse(
        status=profile.status,
        confidence_level=profile.confidence_level,
        post_count=profile.post_count,
        last_built_at=profile.last_built_at,
        profile_type=profile.profile_type,
    )


@router.get("", response_model=VoiceProfileResponse)
async def get_profile(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> VoiceProfileResponse:
    profile = await get_cached_profile(user.id)

    if profile is None:
        result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user.id))
        profile = result.scalar_one_or_none()
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No voice profile found.")
        await set_cached_profile(profile)

    # hook_distribution is intentionally NULL for seed profiles (see
    # build_seed_profile docstring) - it is not a signal of "no profile".
    # The only real "not found" condition is no row existing at all, above.

    return VoiceProfileResponse(
        id=profile.id,
        status=profile.status,
        post_count=profile.post_count,
        confidence_level=profile.confidence_level,
        profile_type=profile.profile_type,
        seed_answers=profile.seed_answers,
        hook_distribution=profile.hook_distribution,
        sentence_rhythm=profile.sentence_rhythm,
        paragraph_structure=profile.paragraph_structure,
        vocabulary_register=profile.vocabulary_register,
        structural_pattern=profile.structural_pattern,
        cta_style=profile.cta_style,
        emotional_register=profile.emotional_register,
        last_built_at=profile.last_built_at,
    )


@router.get("/eval-score", response_model=EvalScoreResponse)
async def get_eval_score(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> EvalScoreResponse:
    """Return the mean cosine similarity from the most recent holdout eval batch.

    Uses the latest profile_id so stale evals from old builds don't pollute the number.
    """
    profile_result = await session.execute(
        select(VoiceProfile).where(VoiceProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()
    if profile is None or profile.status != "ready":
        return EvalScoreResponse()

    agg = await session.execute(
        select(
            func.avg(VoiceProfileEval.cosine_similarity),
            func.count(VoiceProfileEval.id),
        ).where(VoiceProfileEval.profile_id == profile.id)
    )
    row = agg.one()
    mean_sim, count = row[0], row[1]

    if count == 0 or mean_sim is None:
        return EvalScoreResponse()

    mean_sim = float(mean_sim)
    return EvalScoreResponse(
        fidelity_score=round(mean_sim, 4),
        fidelity_pct=min(100, max(0, round(mean_sim * 100))),
        eval_count=count,
        has_data=True,
    )


@router.get("/strength", response_model=VoiceStrengthResponse)
async def get_voice_strength(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> VoiceStrengthResponse:
    """Return the user's current voice strength level.

    Extracted profiles are always 'established' - the level only progresses for seed profiles.
    Seed profile levels: provisional (< 3 edits) → learning (3–14) → established (≥ 15 edits OR ≥ 15 posts).
    """
    profile_result = await session.execute(
        select(VoiceProfile).where(VoiceProfile.user_id == user.id)
    )
    profile = profile_result.scalar_one_or_none()

    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No voice profile found.")

    edit_count_result = await session.execute(
        select(func.count()).where(PostEditEvent.user_id == user.id)
    )
    edit_count = edit_count_result.scalar() or 0
    post_count = profile.post_count or 0

    if profile.profile_type == "extracted":
        return VoiceStrengthResponse(
            level="established",
            profile_type="extracted",
            edit_count=edit_count,
            posts_added=post_count,
            next_milestone="Your voice fingerprint is fully established.",
        )

    # Seed profile - level depends on interaction signals
    if edit_count >= 15 or post_count >= 15:
        level = "established"
        next_milestone = "Your voice is fully established. Keep writing!"
    elif edit_count >= 3:
        remaining = 15 - edit_count
        level = "learning"
        next_milestone = f"{remaining} more edit{'s' if remaining != 1 else ''} to reach established."
    else:
        remaining = 3 - edit_count
        level = "provisional"
        next_milestone = f"{remaining} more edit{'s' if remaining != 1 else ''} to start learning your voice."

    return VoiceStrengthResponse(
        level=level,
        profile_type="seed",
        edit_count=edit_count,
        posts_added=post_count,
        next_milestone=next_milestone,
    )


@router.put("/add-posts")
async def add_posts(
    request: AddPostsRequest,
    background_tasks: BackgroundTasks,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    new_posts = parse_posts(request.posts)
    if not new_posts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid posts found (minimum 30 words each).",
        )

    # Get current post count
    result = await session.execute(select(VoiceProfile).where(VoiceProfile.user_id == user.id))
    profile = result.scalar_one_or_none()
    old_count = profile.post_count if profile else 0

    new_count = old_count + len(new_posts)

    # Trigger full rebuild if corpus grew by ≥10 posts
    ds_record = DataSource(
        user_id=user.id,
        source_type=request.source_type or "unknown",
        label=request.source_label,
        post_count=len(new_posts),
    )

    if len(new_posts) >= 10 or old_count == 0:
        # Fetch existing posts from DB + new posts for full rebuild
        posts_result = await session.execute(select(UserPost.content).where(UserPost.user_id == user.id))
        existing_posts = [row[0] for row in posts_result.fetchall()]
        combined_raw = "\n\n".join(existing_posts + new_posts)
        # Clear existing user_posts to avoid duplicates
        await session.execute(delete(UserPost).where(UserPost.user_id == user.id))
        await session.flush()
        background_tasks.add_task(build_voice_profile, user.id, combined_raw)
        background_tasks.add_task(distill_for_user_bg, user.id)
        session.add(ds_record)
        await session.commit()
        return {"status": "processing", "new_posts_added": len(new_posts), "total_posts": new_count}

    # Otherwise just append posts without rebuilding profile dimensions
    from services.voice_dna.embedder import embed_and_store_posts
    background_tasks.add_task(embed_and_store_posts, user.id, new_posts)
    session.add(ds_record)
    await session.commit()
    return {"status": "appended", "new_posts_added": len(new_posts), "total_posts": new_count}

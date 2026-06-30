import logging
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user, invalidate_user_cache
from db.session import get_session
from models.generation import Generation
from models.user import User
from models.voice_profile import VoiceProfile
from schemas.generation import (
    DimensionScores,
    EditFeedbackRequest,
    EditFeedbackResponse,
    GenerateRequest,
    GenerateResponse,
    GenerationHistoryItem,
    RefineRequest,
    RefineResponse,
    RegenerateVariantRequest,
    RegenerateVariantResponse,
    RepurposeRequest,
    RepurposeResponse,
    VariantResponse,
)
from services.cache.voice_profile_cache import get_cached_profile, set_cached_profile
from services.generation.consistency import check_belief_consistency
from services.generation.edit_learner import (
    get_edit_rules_for_prompt,
    process_edit_event,
    session_feedback_to_rules,
)
from services.generation.few_shot import get_similar_posts
from services.generation.generator import VARIANTS, _generate_one, generate_variants
from services.generation.prompt_builder import build_refine_system_prompt, build_repurpose_prompt
from services.llm.router import llm_call
from services.rate_limiter import check_rate_limit
from services.usage import log_usage
from services.usage_limits import check_usage_limit, invalidate_trial_caches, maybe_extend_trial
from services.voice_dna.embedder import embed_text
from services.voice_dna.scorer import score_post

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/generate", tags=["generation"])


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


@router.post("", response_model=GenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate(
    request: GenerateRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> GenerateResponse:
    allowed, retry_after = await check_rate_limit(str(user.id), "generate")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Generation rate limit exceeded.",
            headers={"Retry-After": str(retry_after)},
        )

    usage_allowed, used, limit = await check_usage_limit(user, "generate", session)
    if not usage_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "limit_reached",
                "limit": limit,
                "used": used,
                "plan": user.plan,
            },
        )

    profile = await _require_ready_profile(user.id, session)

    # generate_variants returns scores (computed during refinement loop) and context_snapshot
    variants, scores, _embedding, context_snapshot = await generate_variants(
        user.id, profile, request.input_text, session,
        creator_context=user.creator_context,
    )

    # Belief consistency check on best variant (non-blocking - warn only)
    best_variant = max(zip(variants, scores, strict=True), key=lambda x: x[1].overall_score)
    belief_ok, belief_issue = await check_belief_consistency(
        best_variant[0].content, profile.belief_stances
    )
    if not belief_ok:
        logger.warning(f"Belief inconsistency for user {user.id}: {belief_issue}")

    # Persist to DB
    variants_json = [
        {
            "content": v.content,
            "variant_type": v.variant_type,
            "voice_match_score": s.overall_score,
            "word_count": v.word_count,
            "refined": v.refined,
            "dimension_scores": {
                "hook_style": s.hook_style_score,
                "structural_pattern": s.structural_pattern_score,
                "vocabulary_register": s.vocabulary_register_score,
                "sentence_rhythm": s.sentence_rhythm_score,
                "paragraph_structure": s.paragraph_structure_score,
                "cta_style": s.cta_style_score,
                "emotional_register": s.emotional_register_score,
                "style_embedding": s.style_embedding_score,
                "mtld": s.mtld_score,
                "pos_jsd": s.pos_jsd_score,
                "signature_vocab": s.signature_vocab_score,
            },
        }
        for v, s in zip(variants, scores, strict=True)
    ]

    generation = Generation(
        user_id=user.id,
        input_text=request.input_text[:500],
        input_type=request.input_type,
        source_idea_id=request.source_idea_id,
        variants=variants_json,
        context_snapshot=context_snapshot,
    )
    session.add(generation)

    # Log usage for each LLM call (3 generation + 3 scoring = 6 calls)
    for v in variants:
        await log_usage(
            user.id,
            "generate",
            session,
            model_used=v.llm_response.model,
            tokens_input=v.llm_response.input_tokens,
            tokens_output=v.llm_response.output_tokens,
            user=user,
        )

    trial_extended = maybe_extend_trial(user)

    await session.commit()
    await session.refresh(generation)

    if trial_extended:
        await invalidate_user_cache(user.clerk_user_id)
        await invalidate_trial_caches(user)

    return GenerateResponse(
        generation_id=generation.id,
        variants=[
            VariantResponse(
                content=item["content"],
                variant_type=item["variant_type"],
                voice_match_score=item["voice_match_score"],
                word_count=item["word_count"],
                dimension_scores=DimensionScores(**item["dimension_scores"]),
            )
            for item in variants_json
        ],
        trial_extended=trial_extended,
    )


@router.post("/repurpose", response_model=RepurposeResponse, status_code=status.HTTP_201_CREATED)
async def repurpose(
    request: RepurposeRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RepurposeResponse:
    allowed, retry_after = await check_rate_limit(str(user.id), "repurpose")
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Repurpose rate limit exceeded.",
            headers={"Retry-After": str(retry_after)},
        )

    usage_allowed, used, limit = await check_usage_limit(user, "repurpose", session)
    if not usage_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "limit_reached",
                "limit": limit,
                "used": used,
                "plan": user.plan,
            },
        )

    profile = await _require_ready_profile(user.id, session)

    # Embed source to find semantically similar posts from the user's history
    source_embedding = await embed_text(request.source_text[:1000])
    similar_posts, _ = await get_similar_posts(user.id, source_embedding, limit=3, session=session)

    edit_rules = await get_edit_rules_for_prompt(user.id, session)

    system_prompt, user_prompt = build_repurpose_prompt(
        profile,
        request.source_text,
        similar_posts=similar_posts,
        creator_context=user.creator_context,
        edit_rules=edit_rules,
    )
    response = await llm_call(
        task="repurpose",
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
        max_tokens=800,
    )
    content = response.content.strip()

    score_result = await score_post(content, profile)

    generation = Generation(
        user_id=user.id,
        input_text=request.source_text[:500],
        input_type="repurpose",
        variants=[
            {
                "content": content,
                "variant_type": "A",
                "voice_match_score": score_result.overall_score,
                "word_count": len(content.split()),
            }
        ],
    )
    session.add(generation)

    await log_usage(
        user.id,
        "repurpose",
        session,
        model_used=response.model,
        tokens_input=response.input_tokens,
        tokens_output=response.output_tokens,
        user=user,
    )

    trial_extended = maybe_extend_trial(user)

    await session.commit()
    await session.refresh(generation)

    if trial_extended:
        await invalidate_user_cache(user.clerk_user_id)
        await invalidate_trial_caches(user)

    return RepurposeResponse(
        generation_id=generation.id,
        content=content,
        voice_match_score=score_result.overall_score,
        trial_extended=trial_extended,
    )


@router.post("/{generation_id}/regenerate-variant", response_model=RegenerateVariantResponse)
async def regenerate_variant(
    generation_id: uuid.UUID,
    request: RegenerateVariantRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RegenerateVariantResponse:
    result = await session.execute(
        select(Generation).where(
            Generation.id == generation_id, Generation.user_id == user.id
        )
    )
    generation = result.scalar_one_or_none()
    if generation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation not found.")

    variants = list(generation.variants or [])
    if request.variant_index >= len(variants):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"variant_index {request.variant_index} out of range.",
        )

    profile = await _require_ready_profile(user.id, session)

    # Re-embed the original input and retrieve fresh few-shots (IDs not needed here)
    input_embedding = await embed_text(generation.input_text)
    few_shots, _ = await get_similar_posts(user.id, input_embedding, limit=3, session=session)

    # Fetch persisted edit rules; prepend session feedback as high-priority overrides
    edit_rules = await get_edit_rules_for_prompt(user.id, session)
    if request.session_feedback:
        edit_rules = session_feedback_to_rules(request.session_feedback) + edit_rules

    variant_type = VARIANTS[request.variant_index]
    new_variant = await _generate_one(profile, few_shots, variant_type, generation.input_text, edit_rules)
    score_result = await score_post(new_variant.content, profile)

    new_variant_dict = {
        "content": new_variant.content,
        "variant_type": new_variant.variant_type,
        "voice_match_score": score_result.overall_score,
        "word_count": new_variant.word_count,
        "dimension_scores": {
            "hook_style": score_result.hook_style_score,
            "structural_pattern": score_result.structural_pattern_score,
            "vocabulary_register": score_result.vocabulary_register_score,
            "sentence_rhythm": score_result.sentence_rhythm_score,
            "paragraph_structure": score_result.paragraph_structure_score,
            "cta_style": score_result.cta_style_score,
            "emotional_register": score_result.emotional_register_score,
            "style_embedding": score_result.style_embedding_score,
            "mtld": score_result.mtld_score,
            "pos_jsd": score_result.pos_jsd_score,
            "signature_vocab": score_result.signature_vocab_score,
        },
    }

    variants[request.variant_index] = new_variant_dict
    generation.variants = variants
    await session.commit()

    return RegenerateVariantResponse(
        variant=VariantResponse(
            content=new_variant_dict["content"],
            variant_type=new_variant_dict["variant_type"],
            voice_match_score=new_variant_dict["voice_match_score"],
            word_count=new_variant_dict["word_count"],
            dimension_scores=DimensionScores(**new_variant_dict["dimension_scores"]),
        )
    )


@router.post("/edit-feedback", response_model=EditFeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_edit_feedback(
    request: EditFeedbackRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> EditFeedbackResponse:
    """Capture a user's edit of a generated post.

    Infers edit rules from the before/after diff and stores them. These rules
    are injected into future generation prompts for this user, creating a
    personalized improvement loop that compounds over time.

    Also boosts quality_weight on user_posts that were used as few-shots
    for this generation (signals that the user approved this style direction).
    """
    # Verify the generation belongs to this user
    gen_result = await session.execute(
        select(Generation).where(
            Generation.id == request.generation_id,
            Generation.user_id == user.id,
        )
    )
    generation = gen_result.scalar_one_or_none()
    if generation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation not found.")

    event = await process_edit_event(
        user_id=user.id,
        generation_id=request.generation_id,
        variant_index=request.variant_index,
        generated_content=request.generated_content,
        edited_content=request.edited_content,
        session=session,
    )
    await session.commit()

    rules_count = len(event.inferred_rules or [])
    return EditFeedbackResponse(
        rules_inferred=rules_count,
        message=f"Edit captured. {rules_count} rule(s) learned for future generations.",
    )


@router.post("/{generation_id}/refine", response_model=RefineResponse)
async def refine_variant(
    generation_id: uuid.UUID,
    request: RefineRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> RefineResponse:
    """Refine a specific generated post via a natural-language instruction.

    Stateless per call: caller passes current_content (the version to edit)
    and prior_instructions (last 2 user turns) for light multi-turn context.
    The refined post is scored but not persisted - caller decides whether to copy or discard.
    """
    gen_result = await session.execute(
        select(Generation).where(Generation.id == generation_id, Generation.user_id == user.id)
    )
    generation = gen_result.scalar_one_or_none()
    if generation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Generation not found.")

    profile = await _require_ready_profile(user.id, session)
    edit_rules = await get_edit_rules_for_prompt(user.id, session)
    system_prompt = build_refine_system_prompt(profile, edit_rules)

    # Build the user message - include prior instructions for multi-turn coherence
    prior_context = ""
    if request.prior_instructions:
        prior_context = "Context - changes already applied to this post:\n" + "\n".join(
            f"  {i + 1}. {instr}" for i, instr in enumerate(request.prior_instructions[-2:])
        ) + "\n\n"

    user_message = (
        f"{prior_context}"
        f"Current post:\n\n{request.current_content}\n\n"
        f"Instruction: {request.instruction}"
    )

    response = await llm_call(
        task="generation",
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
        max_tokens=600,
    )
    refined = response.content.strip()
    score_result = await score_post(refined, profile)

    await log_usage(
        user.id,
        "generate",
        session,
        model_used=response.model,
        tokens_input=response.input_tokens,
        tokens_output=response.output_tokens,
    )

    return RefineResponse(
        refined_content=refined,
        voice_match_score=score_result.overall_score,
        word_count=len(refined.split()),
    )


@router.get("/history/stats")
async def get_history_stats(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    """Aggregate stats over the user's full generation history."""
    total: int = await session.scalar(
        select(func.count(Generation.id)).where(Generation.user_id == user.id)
    ) or 0

    # Pull scores from the 200 most recent generations to compute avg/best
    result = await session.execute(
        select(Generation.variants)
        .where(Generation.user_id == user.id)
        .order_by(Generation.created_at.desc())
        .limit(200)
    )
    all_scores = [
        v.get("voice_match_score", 0)
        for (variants,) in result.all()
        for v in (variants or [])
        if isinstance(v, dict) and v.get("voice_match_score", 0) > 0
    ]
    avg_score = round(sum(all_scores) / len(all_scores)) if all_scores else None
    best_score = max(all_scores) if all_scores else None

    return {"total": total, "avg_score": avg_score, "best_score": best_score}


@router.get("/history", response_model=list[GenerationHistoryItem])
async def get_history(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
    limit: int = 20,
    offset: int = 0,
) -> list[GenerationHistoryItem]:
    result = await session.execute(
        select(Generation)
        .where(Generation.user_id == user.id)
        .order_by(Generation.created_at.desc())
        .limit(min(limit, 100))
        .offset(offset)
    )
    generations = result.scalars().all()

    return [
        GenerationHistoryItem(
            id=g.id,
            input_text=g.input_text,
            input_type=g.input_type,
            variants=g.variants or [],
            created_at=g.created_at,
        )
        for g in generations
    ]

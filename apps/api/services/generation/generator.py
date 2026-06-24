"""Post generation with Generate → Score → Refine loop - Layer 4.

Pipeline per variant:
  1. Generate candidate using full deep fingerprint prompt
  2. Score against voice profile
  3. If score < REFINE_THRESHOLD, build specific critique and regenerate once
  4. Return the better of the two attempts
"""
import hashlib
import json
import logging
import uuid
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from models.voice_profile import VoiceProfile
from services.generation.edit_learner import get_edit_rules_for_prompt
from services.generation.few_shot import get_similar_posts
from services.generation.prompt_builder import (
    VariantType,
    build_critique_prompt,
    build_generation_prompt,
)
from services.llm.router import LLMResponse, llm_call
from services.stylometrics.features import compute_mtld
from services.voice_dna.embedder import embed_text
from services.voice_dna.scorer import VoiceMatchResult, score_post

logger = logging.getLogger(__name__)

VARIANTS: list[VariantType] = ["A", "B", "C"]
REFINE_THRESHOLD = 85  # score below this triggers one refinement attempt


@dataclass
class GeneratedVariant:
    content: str
    variant_type: str
    word_count: int
    llm_response: LLMResponse
    refined: bool = False  # True if a refinement pass was used


async def _generate_one(
    profile: VoiceProfile,
    few_shots: list[str],
    variant: VariantType,
    idea_text: str,
    edit_rules: list[dict] | None = None,
    critique: str | None = None,
    exemplar_synthesis: str = "",
    creator_context: dict | None = None,
) -> GeneratedVariant:
    system_prompt, user_prompt = build_generation_prompt(
        profile, few_shots, variant, idea_text,
        edit_rules=edit_rules, exemplar_synthesis=exemplar_synthesis,
        creator_context=creator_context,
    )
    messages = [{"role": "user", "content": user_prompt}]
    if critique:
        # Inject critique as an assistant/user exchange so the model sees what to fix
        messages = [
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": "(previous attempt was rejected for voice mismatch)"},
            {"role": "user", "content": critique},
        ]

    response = await llm_call(
        task="generation",
        system=system_prompt,
        messages=messages,
        max_tokens=600,
    )
    content = response.content.strip()
    return GeneratedVariant(
        content=content,
        variant_type=variant,
        word_count=len(content.split()),
        llm_response=response,
        refined=critique is not None,
    )


async def _synthesize_exemplars(few_shots: list[str]) -> str:
    """Condense 3 few-shot posts into shared stylistic patterns (gpt-4o-mini).

    Returns a compact pattern summary injected into the generation prompt.
    On failure returns empty string - generation continues without synthesis.
    """
    if not few_shots:
        return ""
    combined = "\n\n---\n\n".join(f"POST {i + 1}:\n{p[:600]}" for i, p in enumerate(few_shots))
    prompt = (
        "Read these LinkedIn posts by the same author. "
        "List exactly 4 concrete stylistic patterns that ALL of them share "
        "(openings, reasoning moves, formatting habits, vocabulary tendencies, closing style). "
        "Be specific and brief. Return a numbered list only.\n\n"
        + combined
    )
    try:
        response = await llm_call(
            task="titling",  # gpt-4o-mini task
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
        )
        return response.content.strip()
    except Exception as e:
        logger.warning(f"Exemplar synthesis failed (non-fatal): {e}")
        return ""


async def _generate_with_refinement(
    profile: VoiceProfile,
    few_shots: list[str],
    variant: VariantType,
    idea_text: str,
    edit_rules: list[dict],
    exemplar_synthesis: str = "",
    creator_context: dict | None = None,
) -> tuple[GeneratedVariant, VoiceMatchResult]:
    """Generate, score, and refine once if score is below threshold."""
    candidate = await _generate_one(
        profile, few_shots, variant, idea_text, edit_rules,
        exemplar_synthesis=exemplar_synthesis, creator_context=creator_context,
    )
    score = await score_post(candidate.content, profile, variant_type=variant)

    if score.overall_score >= REFINE_THRESHOLD:
        return candidate, score

    logger.info(
        f"Variant {variant} scored {score.overall_score} < {REFINE_THRESHOLD} - refining"
    )

    # Compute post MTLD for direction-aware critique (fast, CPU-only)
    post_mtld = compute_mtld(candidate.content)
    stylo = profile.stylometric_profile or {}
    profile_mtld_mean = stylo.get("mtld_mean", 50.0)

    critique = build_critique_prompt(
        candidate.content,
        {
            "overall_score": score.overall_score,
            "hook_style_score": score.hook_style_score,
            "structural_pattern_score": score.structural_pattern_score,
            "vocabulary_register_score": score.vocabulary_register_score,
            "sentence_rhythm_score": score.sentence_rhythm_score,
            "paragraph_structure_score": score.paragraph_structure_score,
            "cta_style_score": score.cta_style_score,
            "emotional_register_score": score.emotional_register_score,
            # Implicit dimensions - now surfaced in critique
            "signature_vocab_score": score.signature_vocab_score,
            "mtld_score": score.mtld_score,
            "pos_jsd_score": score.pos_jsd_score,
            "post_mtld": post_mtld,
            "profile_mtld_mean": profile_mtld_mean,
        },
        profile,
    )
    refined = await _generate_one(
        profile, few_shots, variant, idea_text, edit_rules,
        critique=critique, exemplar_synthesis=exemplar_synthesis,
        creator_context=creator_context,
    )
    refined_score = await score_post(refined.content, profile, variant_type=variant)

    # Keep whichever scored higher
    if refined_score.overall_score >= score.overall_score:
        logger.info(
            f"Variant {variant} refinement improved: {score.overall_score} → {refined_score.overall_score}"
        )
        return refined, refined_score

    logger.info(
        f"Variant {variant} refinement did not improve ({refined_score.overall_score}), keeping original"
    )
    return candidate, score


def _profile_version_hash(profile: VoiceProfile) -> str:
    data = {
        "hook_distribution": profile.hook_distribution,
        "sentence_rhythm": profile.sentence_rhythm,
        "structural_pattern": profile.structural_pattern,
        "vocabulary_register": profile.vocabulary_register,
        "lexical_signature": profile.lexical_signature,
    }
    return hashlib.sha256(
        json.dumps(data, sort_keys=True, default=str).encode()
    ).hexdigest()[:12]


def _rule_hash(rule: dict) -> str:
    return hashlib.sha256(json.dumps(rule, sort_keys=True).encode()).hexdigest()[:12]


def _build_context_snapshot(
    profile: VoiceProfile,
    exemplar_ids: list[str],
    rules: list[dict],
) -> dict:
    return {
        "profile_version_hash": _profile_version_hash(profile),
        "exemplar_post_ids": exemplar_ids,
        "active_rule_count": len(rules),
        "active_rule_hashes": [_rule_hash(r) for r in rules],
    }


async def generate_variants(
    user_id: uuid.UUID,
    profile: VoiceProfile,
    idea_text: str,
    session: AsyncSession,
    creator_context: dict | None = None,
) -> tuple[list[GeneratedVariant], list[VoiceMatchResult], list[float], dict]:
    """Embed idea → retrieve few-shots → generate 3 variants with refinement loop.

    Returns (variants, scores, input_embedding, context_snapshot).
    Scores are already computed here so the router doesn't need a second score pass.
    """
    input_embedding = await embed_text(idea_text)

    # Parallel: few-shot retrieval + edit rules fetch
    few_shots, few_shot_ids, edit_rules = await _gather_context(
        user_id, input_embedding, idea_text, session
    )

    logger.info(
        f"Generating 3 variants for user {user_id}: "
        f"{len(few_shots)} few-shots, {len(edit_rules)} edit rules"
    )

    # Synthesize shared stylistic patterns from exemplars (fast gpt-4o-mini call)
    exemplar_synthesis = await _synthesize_exemplars(few_shots)
    if exemplar_synthesis:
        logger.info(f"Exemplar synthesis produced {len(exemplar_synthesis)} chars")

    # Generate 3 variants sequentially to avoid rate limit bursts
    variants: list[GeneratedVariant] = []
    scores: list[VoiceMatchResult] = []
    for variant_type in VARIANTS:
        v, s = await _generate_with_refinement(
            profile, few_shots, variant_type, idea_text, edit_rules,
            exemplar_synthesis=exemplar_synthesis, creator_context=creator_context,
        )
        variants.append(v)
        scores.append(s)

    context_snapshot = _build_context_snapshot(profile, few_shot_ids, edit_rules)
    return variants, scores, input_embedding, context_snapshot


async def _gather_context(
    user_id: uuid.UUID,
    input_embedding: list[float],
    idea_text: str,
    session: AsyncSession,
) -> tuple[list[str], list[str], list[dict]]:
    import asyncio

    few_shots_coro = get_similar_posts(
        user_id, input_embedding, limit=3, session=session, input_text=idea_text
    )
    edit_rules_coro = get_edit_rules_for_prompt(user_id, session)
    (few_shots, few_shot_ids), edit_rules = await asyncio.gather(few_shots_coro, edit_rules_coro)
    return few_shots, few_shot_ids, edit_rules

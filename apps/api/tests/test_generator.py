import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.generation.generator import GeneratedVariant, generate_variants
from services.voice_dna.scorer import VoiceMatchResult


def _mock_profile():
    p = MagicMock()
    p.hook_distribution = {"bold_statement": 0.6, "question": 0.3}
    p.structural_pattern = {
        "dominant": "problem_insight_proof",
        "frequency": 0.6,
        "alternatives": [{"pattern": "story_lesson", "frequency": 0.3}],
    }
    p.sentence_rhythm = {"avg_length": 11.0, "short_ratio": 0.55, "long_ratio": 0.1}
    p.paragraph_structure = {"single_line_ratio": 0.8, "avg_paragraph_length": 1.2}
    p.vocabulary_register = {"formality_score": 0.3, "jargon_density": 0.05, "avg_word_length": 4.2}
    p.cta_style = {"dominant": "implicit_question", "frequency": 0.55, "none_ratio": 0.2}
    p.emotional_register = {"analytical": 0.5, "pragmatic": 0.3}
    # Deep fingerprint fields - None skips those sections
    p.lexical_signature = None
    p.argument_templates = None
    p.belief_stances = None
    p.epistemic_style = None
    return p


def _fake_llm_response(content="This is a test post with many words " * 10):
    r = MagicMock()
    r.content = content
    r.model = "gpt-4o"
    r.input_tokens = 500
    r.output_tokens = 100
    return r


def _fake_score(score: int = 80) -> VoiceMatchResult:
    return VoiceMatchResult(
        overall_score=score,
        hook_style_score=score / 100,
        structural_pattern_score=score / 100,
        vocabulary_register_score=score / 100,
        sentence_rhythm_score=score / 100,
        paragraph_structure_score=score / 100,
        cta_style_score=score / 100,
        emotional_register_score=score / 100,
    )


# get_similar_posts now returns (contents, id_strings)
_FAKE_IDS = [str(uuid.uuid4()), str(uuid.uuid4())]
_FAKE_POSTS_RETURN = (["Post A", "Post B"], _FAKE_IDS)
_EMPTY_POSTS_RETURN = ([], [])


@pytest.mark.asyncio
async def test_returns_three_variants():
    user_id = uuid.uuid4()
    profile = _mock_profile()
    session = MagicMock()

    fake_embedding = [0.1] * 1536
    fake_response = _fake_llm_response()

    with (
        patch("services.generation.generator.embed_text", AsyncMock(return_value=fake_embedding)),
        patch("services.generation.generator.get_similar_posts", AsyncMock(return_value=_FAKE_POSTS_RETURN)),
        patch("services.generation.generator.get_edit_rules_for_prompt", AsyncMock(return_value=[])),
        patch("services.generation.generator.llm_call", AsyncMock(return_value=fake_response)),
        patch("services.generation.generator.score_post", AsyncMock(return_value=_fake_score(80))),
    ):
        variants, scores, embedding, context_snapshot = await generate_variants(
            user_id, profile, "my idea", session
        )

    assert len(variants) == 3
    assert len(scores) == 3
    assert embedding == fake_embedding
    assert isinstance(context_snapshot, dict)
    assert "profile_version_hash" in context_snapshot
    assert "exemplar_post_ids" in context_snapshot
    for v in variants:
        assert isinstance(v, GeneratedVariant)
        assert v.content == fake_response.content.strip()
        assert v.word_count > 0


@pytest.mark.asyncio
async def test_variant_types_are_distinct():
    user_id = uuid.uuid4()
    profile = _mock_profile()
    session = MagicMock()

    fake_embedding = [0.1] * 1536
    call_count = {"n": 0}
    responses = ["Content A " * 20, "Content B " * 20, "Content C " * 20]

    async def fake_llm(**kwargs):
        r = MagicMock()
        r.content = responses[call_count["n"]]
        r.model = "gpt-4o"
        r.input_tokens = 10
        r.output_tokens = 10
        call_count["n"] += 1
        return r

    with (
        patch("services.generation.generator.embed_text", AsyncMock(return_value=fake_embedding)),
        patch("services.generation.generator.get_similar_posts", AsyncMock(return_value=_EMPTY_POSTS_RETURN)),
        patch("services.generation.generator.get_edit_rules_for_prompt", AsyncMock(return_value=[])),
        patch("services.generation.generator.llm_call", side_effect=fake_llm),
        # Score above REFINE_THRESHOLD (85) so no extra refinement LLM calls are made
        patch("services.generation.generator.score_post", AsyncMock(return_value=_fake_score(90))),
    ):
        variants, _, _, _ = await generate_variants(user_id, profile, "idea", session)

    types = [v.variant_type for v in variants]
    assert types == ["A", "B", "C"]


@pytest.mark.asyncio
async def test_word_count_computed_correctly():
    user_id = uuid.uuid4()
    profile = _mock_profile()
    session = MagicMock()

    post_content = "one two three four five"
    fake_response = MagicMock()
    fake_response.content = post_content
    fake_response.model = "gpt-4o"
    fake_response.input_tokens = 10
    fake_response.output_tokens = 5

    with (
        patch("services.generation.generator.embed_text", AsyncMock(return_value=[0.1] * 1536)),
        patch("services.generation.generator.get_similar_posts", AsyncMock(return_value=_EMPTY_POSTS_RETURN)),
        patch("services.generation.generator.get_edit_rules_for_prompt", AsyncMock(return_value=[])),
        patch("services.generation.generator.llm_call", AsyncMock(return_value=fake_response)),
        patch("services.generation.generator.score_post", AsyncMock(return_value=_fake_score(80))),
    ):
        variants, _, _, _ = await generate_variants(user_id, profile, "idea", session)

    assert variants[0].word_count == 5


@pytest.mark.asyncio
async def test_few_shot_retrieval_called_with_embedding():
    user_id = uuid.uuid4()
    profile = _mock_profile()
    session = MagicMock()
    fake_embedding = [0.5] * 1536

    mock_few_shots = AsyncMock(return_value=(["Some post"], [str(uuid.uuid4())]))
    fake_response = _fake_llm_response()

    with (
        patch("services.generation.generator.embed_text", AsyncMock(return_value=fake_embedding)),
        patch("services.generation.generator.get_similar_posts", mock_few_shots),
        patch("services.generation.generator.get_edit_rules_for_prompt", AsyncMock(return_value=[])),
        patch("services.generation.generator.llm_call", AsyncMock(return_value=fake_response)),
        patch("services.generation.generator.score_post", AsyncMock(return_value=_fake_score(80))),
    ):
        await generate_variants(user_id, profile, "test idea", session)

    mock_few_shots.assert_called_once_with(
        user_id, fake_embedding, limit=3, session=session, input_text="test idea"
    )

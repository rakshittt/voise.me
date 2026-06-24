import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.voice_dna.scorer import (
    VoiceMatchResult,
    _compute_paragraph_score,
    _compute_sentence_rhythm_score,
    _compute_vocab_score,
    _score_cta,
    _score_emotional_register,
    _score_hook,
    _score_structural_pattern,
    score_all,
    score_post,
)


def _mock_profile(
    hook_distribution=None,
    structural_pattern=None,
    vocabulary_register=None,
    sentence_rhythm=None,
    paragraph_structure=None,
    cta_style=None,
    emotional_register=None,
):
    p = MagicMock()
    p.hook_distribution = hook_distribution or {"bold_statement": 0.6, "question": 0.3}
    p.structural_pattern = structural_pattern or {"dominant": "problem_insight_proof", "alternatives": []}
    p.vocabulary_register = vocabulary_register or {
        "formality_score": 0.3, "jargon_density": 0.05, "avg_word_length": 4.5,
    }
    p.sentence_rhythm = sentence_rhythm or {"avg_length": 11.0, "short_ratio": 0.55}
    p.paragraph_structure = paragraph_structure or {"single_line_ratio": 0.8}
    p.cta_style = cta_style or {"dominant": "implicit_question"}
    p.emotional_register = emotional_register or {"analytical": 0.5, "pragmatic": 0.3, "provocative": 0.1,
                                                   "inspirational": 0.05, "conversational": 0.05}
    return p


def _classification_response(
    hook_type="bold_statement",
    structural_pattern="problem_insight_proof",
    cta_style="implicit_question",
    tone="analytical",
):
    r = MagicMock()
    r.content = json.dumps({
        "hook_type": hook_type,
        "structural_pattern": structural_pattern,
        "cta_style": cta_style,
        "tone": tone,
    })
    return r


# ── Deterministic scorer unit tests ───────────────────────────────────────────

def test_sentence_rhythm_perfect_match():
    post = "Short sentence. Another one. Yes. A longer sentence with more words here definitely."
    profile = {"avg_length": 7.0, "short_ratio": 0.6}
    score = _compute_sentence_rhythm_score(post, profile)
    assert 0.0 <= score <= 1.0


def test_sentence_rhythm_empty_post():
    score = _compute_sentence_rhythm_score("", {"avg_length": 11.0, "short_ratio": 0.5})
    assert score == 0.5


def test_paragraph_score_all_single_lines():
    post = "Line one.\n\nLine two.\n\nLine three."
    profile = {"single_line_ratio": 1.0}
    score = _compute_paragraph_score(post, profile)
    assert score == pytest.approx(1.0)


def test_paragraph_score_mismatch():
    # Two paragraphs each with internal newlines → single_line_ratio = 0.0
    post = "Line one.\nLine two.\nLine three.\n\nLine four.\nLine five.\nLine six."
    profile = {"single_line_ratio": 1.0}  # profile expects all single-line paragraphs
    score = _compute_paragraph_score(post, profile)
    # actual_ratio = 0.0, profile wants 1.0 → score = 0.0
    assert score == pytest.approx(0.0)


def test_vocab_score_matching_word_length():
    post = "Good work done well here today."  # avg ~4 chars/word
    profile = {"avg_word_length": 4.0}
    score = _compute_vocab_score(post, profile)
    assert score > 0.8


def test_vocab_score_with_specificity():
    post = "We grew 40% in Q1. Revenue hit $1M. Team size doubled."
    profile = {"avg_word_length": 4.5, "specificity_score": 0.8, "reader_address_frequency": 0.0}
    score = _compute_vocab_score(post, profile)
    assert 0.0 <= score <= 1.0


# ── Profile-vs-classification scoring unit tests ───────────────────────────────

def test_hook_score_dominant_match():
    dist = {"bold_statement": 0.7, "question": 0.3}
    assert _score_hook("bold_statement", dist) == pytest.approx(1.0)


def test_hook_score_non_dominant():
    dist = {"bold_statement": 0.7, "question": 0.3}
    score = _score_hook("question", dist)
    assert score == pytest.approx(0.3 / 0.7, rel=0.01)


def test_hook_score_unknown_type():
    dist = {"bold_statement": 0.7, "question": 0.3}
    score = _score_hook("data_point", dist)
    assert score == pytest.approx(0.05 / 0.7, rel=0.01)


def test_structural_pattern_dominant():
    data = {"dominant": "problem_insight_proof", "alternatives": [{"pattern": "story_lesson"}]}
    assert _score_structural_pattern("problem_insight_proof", data) == 1.0


def test_structural_pattern_alternative():
    data = {"dominant": "problem_insight_proof", "alternatives": [{"pattern": "story_lesson"}]}
    assert _score_structural_pattern("story_lesson", data) == 0.60


def test_structural_pattern_unknown():
    data = {"dominant": "problem_insight_proof", "alternatives": []}
    assert _score_structural_pattern("list_format", data) == 0.25


def test_cta_dominant_match():
    assert _score_cta("implicit_question", {"dominant": "implicit_question"}) == 1.0


def test_cta_non_dominant():
    assert _score_cta("no_cta", {"dominant": "implicit_question"}) == 0.35


def test_emotional_register_dominant():
    er = {"analytical": 0.5, "pragmatic": 0.3}
    assert _score_emotional_register("analytical", er) == pytest.approx(1.0)


def test_emotional_register_secondary():
    er = {"analytical": 0.5, "pragmatic": 0.3}
    assert _score_emotional_register("pragmatic", er) == pytest.approx(0.3 / 0.5, rel=0.01)


# ── Integration: score_post ────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_score_post_returns_voice_match_result():
    profile = _mock_profile()
    fake_response = _classification_response()

    with patch("services.voice_dna.scorer.llm_call", AsyncMock(return_value=fake_response)):
        result = await score_post("A LinkedIn post about leadership and growth.", profile)

    assert isinstance(result, VoiceMatchResult)
    assert 0 <= result.overall_score <= 100
    assert 0.0 <= result.hook_style_score <= 1.0
    assert 0.0 <= result.emotional_register_score <= 1.0


@pytest.mark.asyncio
async def test_score_post_high_when_all_match():
    """Classification matches profile exactly → LLM-derived dimensions all score 1.0."""
    profile = _mock_profile()
    # Classification matches profile perfectly
    fake_response = _classification_response(
        hook_type="bold_statement",       # dominant in profile
        structural_pattern="problem_insight_proof",  # dominant in profile
        cta_style="implicit_question",    # dominant in profile
        tone="analytical",                # dominant in profile
    )

    with patch("services.voice_dna.scorer.llm_call", AsyncMock(return_value=fake_response)):
        result = await score_post("Bold claim. Short. Simple. Does this work?", profile)

    # LLM dimensions all 1.0; deterministic dims may be lower; combined score should be reasonably high
    assert result.hook_style_score == pytest.approx(1.0)
    assert result.structural_pattern_score == pytest.approx(1.0)
    assert result.cta_style_score == pytest.approx(1.0)
    assert result.emotional_register_score == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_score_post_low_when_classification_mismatches():
    """Classification that doesn't appear in the profile distribution scores low."""
    profile = _mock_profile(
        hook_distribution={"bold_statement": 0.9, "question": 0.1},
        cta_style={"dominant": "implicit_question"},
        emotional_register={"analytical": 0.9, "pragmatic": 0.1},
    )
    # Rarest possible choices
    fake_response = _classification_response(
        hook_type="data_point",   # not in profile at all
        structural_pattern="list_format",  # not in profile
        cta_style="explicit_call",  # non-dominant
        tone="inspirational",       # not in profile
    )

    with patch("services.voice_dna.scorer.llm_call", AsyncMock(return_value=fake_response)):
        result = await score_post("1. First item. 2. Second item. 3. Third item.", profile)

    assert result.hook_style_score < 0.2
    assert result.cta_style_score == 0.35


@pytest.mark.asyncio
async def test_invalid_json_returns_default_scores():
    """Bad LLM JSON → all LLM dimensions default to 0.5; deterministic dims still computed."""
    profile = _mock_profile()
    bad_response = MagicMock()
    bad_response.content = "not valid json"

    with patch("services.voice_dna.scorer.llm_call", AsyncMock(return_value=bad_response)):
        result = await score_post("Some post content here.", profile)

    assert isinstance(result, VoiceMatchResult)
    # LLM-derived scores all at default 0.5
    assert result.hook_style_score == 0.5
    assert result.structural_pattern_score == 0.5
    assert result.cta_style_score == 0.5
    assert result.emotional_register_score == 0.5
    assert 0 <= result.overall_score <= 100


@pytest.mark.asyncio
async def test_score_all_makes_one_llm_call_per_post():
    profile = _mock_profile()
    fake_response = _classification_response()
    posts = ["Post A", "Post B", "Post C"]
    call_count = {"n": 0}

    async def fake_llm(*args, **kwargs):
        call_count["n"] += 1
        return fake_response

    with patch("services.voice_dna.scorer.llm_call", side_effect=fake_llm):
        results = await score_all(posts, profile)

    assert len(results) == 3
    assert call_count["n"] == 3  # one classification call per post
    for r in results:
        assert isinstance(r, VoiceMatchResult)

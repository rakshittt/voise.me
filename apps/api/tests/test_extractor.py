import json
from unittest.mock import AsyncMock, patch

import pytest

from services.llm.router import LLMResponse
from services.voice_dna.extractor import (
    extract_all_dimensions,
    extract_hook_distribution,
    extract_sentence_rhythm,
    extract_structural_pattern,
)


def _llm_response(content: str) -> LLMResponse:
    return LLMResponse(content=content, model="gpt-4o-mini", input_tokens=100, output_tokens=50)


def _posts(n: int = 25) -> list[str]:
    return ["word " * 50 for _ in range(n)]


@pytest.mark.asyncio
async def test_extract_hook_distribution_returns_valid_distribution():
    payload = {"classifications": ["bold_statement"] * 10 + ["question"] * 5 + ["story"] * 5}
    with patch("services.voice_dna.extractor.llm_call", new=AsyncMock(return_value=_llm_response(json.dumps(payload)))):
        result = await extract_hook_distribution(_posts())
    assert "bold_statement" in result
    assert abs(sum(result.values()) - 1.0) < 0.01


@pytest.mark.asyncio
async def test_extract_sentence_rhythm_returns_valid_dict():
    payload = {"avg_length": 11.5, "short_ratio": 0.45, "long_ratio": 0.1}
    with patch("services.voice_dna.extractor.llm_call", new=AsyncMock(return_value=_llm_response(json.dumps(payload)))):
        result = await extract_sentence_rhythm(_posts())
    assert "avg_length" in result
    assert "short_ratio" in result
    assert "long_ratio" in result


@pytest.mark.asyncio
async def test_extract_structural_pattern_returns_valid_dict():
    payload = {"dominant": "problem_insight_proof", "frequency": 0.6, "alternatives": []}
    with patch("services.voice_dna.extractor.llm_call", new=AsyncMock(return_value=_llm_response(json.dumps(payload)))):
        result = await extract_structural_pattern(_posts())
    assert result["dominant"] == "problem_insight_proof"
    assert 0.0 <= result["frequency"] <= 1.0


@pytest.mark.asyncio
async def test_extract_handles_invalid_json_gracefully():
    with patch("services.voice_dna.extractor.llm_call", new=AsyncMock(return_value=_llm_response("not json at all"))):
        result = await extract_hook_distribution(_posts())
    assert result == {}


@pytest.mark.asyncio
async def test_extract_all_dimensions_parallel():
    responses = {
        "hook_distribution": {"classifications": ["bold_statement"] * 20},
        "sentence_rhythm": {"avg_length": 10.0, "short_ratio": 0.5, "long_ratio": 0.1},
        "paragraph_structure": {"single_line_ratio": 0.8, "avg_paragraph_length": 1.2},
        "vocabulary_register": {"formality_score": 0.3, "jargon_density": 0.1, "avg_word_length": 4.2},
        "structural_pattern": {"dominant": "story_lesson", "frequency": 0.5, "alternatives": []},
        "cta_style": {"dominant": "implicit_question", "frequency": 0.55, "none_ratio": 0.2},
        "emotional_register": {"analytical": 0.4, "pragmatic": 0.3, "provocative": 0.1, "inspirational": 0.1, "conversational": 0.1},
    }

    call_count = 0

    async def mock_llm(task, messages, **kwargs):
        nonlocal call_count
        call_count += 1
        # Return the right payload based on which dimension is being extracted
        # (all use same mock for simplicity)
        return _llm_response(json.dumps(list(responses.values())[min(call_count - 1, 6)]))

    with patch("services.voice_dna.extractor.llm_call", new=mock_llm):
        result = await extract_all_dimensions(_posts())

    expected_keys = {"hook_distribution", "sentence_rhythm", "paragraph_structure",
                     "vocabulary_register", "structural_pattern", "cta_style", "emotional_register"}
    assert set(result.keys()) == expected_keys
    assert call_count == 7

import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.llm.router import LLMResponse
from services.voice_dna.builder import build_voice_profile
from services.voice_dna.pillar import PillarResult


def _posts_raw(n: int = 15) -> str:
    return "\n\n".join(["word " * 50 for _ in range(n)])


def _llm_response(content: str) -> LLMResponse:
    return LLMResponse(content=content, model="gpt-4o-mini", input_tokens=100, output_tokens=50)


@pytest.mark.asyncio
async def test_build_voice_profile_creates_ready_profile(mock_session):
    raw = _posts_raw(15)

    fake_embeddings = [[0.1] * 1536 for _ in range(15)]
    fake_post_objects = [MagicMock() for _ in range(15)]
    fake_centroid = [0.1] * 1536
    fake_pillar = PillarResult(cluster_ids=[0] * 15, k=1, cluster_counts=[15], centroids=[fake_centroid])
    dimensions_response = {
        "classifications": ["bold_statement"] * 15,
        "avg_length": 11.0, "short_ratio": 0.4, "long_ratio": 0.1,
        "single_line_ratio": 0.8, "avg_paragraph_length": 1.3,
        "formality_score": 0.3, "jargon_density": 0.1, "avg_word_length": 4.2,
        "dominant": "problem_insight_proof", "frequency": 0.6, "alternatives": [],
        "none_ratio": 0.2,
        "analytical": 0.4, "pragmatic": 0.3, "provocative": 0.1, "inspirational": 0.1, "conversational": 0.1,
    }
    fake_stylo = {"mtld_mean": 50.0, "mtld_std": 10.0, "pos_distribution": {}}
    fake_loo = [0.7, 0.8, 0.9]

    with (
        patch("services.voice_dna.builder.embed_and_store_posts", new=AsyncMock(return_value=(fake_embeddings, fake_post_objects))),
        patch("services.voice_dna.builder.compute_pillars", return_value=fake_pillar),
        patch("services.voice_dna.builder.compute_stylometric_profile", return_value=fake_stylo),
        patch("services.voice_dna.builder.compute_loo_distribution", return_value=fake_loo),
        patch("services.voice_dna.extractor.llm_call", new=AsyncMock(return_value=_llm_response(json.dumps(dimensions_response)))),
        patch("services.voice_dna.deep_extractor.llm_call", new=AsyncMock(return_value=_llm_response(json.dumps({"argument_type": "story"})))),
    ):
        await build_voice_profile(uuid.uuid4(), raw, mock_session)

    assert mock_session.commit.call_count >= 1
    # Profile was added to session
    added_profiles = [
        call.args[0] for call in mock_session.add.call_args_list
        if hasattr(call.args[0], "status")
    ]
    assert any(p.status == "ready" for p in added_profiles)


@pytest.mark.asyncio
async def test_build_voice_profile_sets_failed_on_error(mock_session):
    raw = _posts_raw(15)

    with patch("services.voice_dna.builder.embed_and_store_posts", new=AsyncMock(side_effect=Exception("OpenAI down"))):
        await build_voice_profile(uuid.uuid4(), raw, mock_session)

    added = [c.args[0] for c in mock_session.add.call_args_list if hasattr(c.args[0], "status")]
    assert any(p.status == "failed" for p in added)


@pytest.fixture
def mock_session():
    session = MagicMock()
    session.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=MagicMock(return_value=None)))
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    return session

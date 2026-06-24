import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.voice_dna.scorer import (
    DimensionDetail,
    VoiceMatchDetailed,
    _build_summary,
    _rating,
    score_post_detailed,
)

# ── Fixtures ───────────────────────────────────────────────────────────────────

def _mock_profile():
    p = MagicMock()
    p.hook_distribution = {"bold_statement": 0.6, "question": 0.3}
    p.structural_pattern = {
        "dominant": "problem_insight_proof",
        "frequency": 0.6,
        "alternatives": [{"pattern": "story_lesson", "frequency": 0.3}],
    }
    p.sentence_rhythm = {"avg_length": 11.0, "short_ratio": 0.55}
    p.paragraph_structure = {"single_line_ratio": 0.8}
    p.vocabulary_register = {"formality_score": 0.3, "jargon_density": 0.05, "avg_word_length": 4.2}
    p.cta_style = {"dominant": "implicit_question", "frequency": 0.55, "none_ratio": 0.2}
    p.emotional_register = {"analytical": 0.5, "pragmatic": 0.3}
    return p


def _classification_dict(
    hook_type="bold_statement",
    structural_pattern="problem_insight_proof",
    cta_style="implicit_question",
    tone="analytical",
) -> dict:
    # We patch _classify_post directly, which already returns a dict.
    return {
        "hook_type": hook_type,
        "structural_pattern": structural_pattern,
        "cta_style": cta_style,
        "tone": tone,
    }


SAMPLE_POST = " ".join(["word"] * 80)  # 80 words, passes min_length


# ── Unit: _rating ──────────────────────────────────────────────────────────────

def test_rating_strong():
    assert _rating(0.80) == "strong"
    assert _rating(0.75) == "strong"


def test_rating_fair():
    assert _rating(0.60) == "fair"
    assert _rating(0.50) == "fair"


def test_rating_weak():
    assert _rating(0.49) == "weak"
    assert _rating(0.0) == "weak"


# ── Unit: _build_summary ───────────────────────────────────────────────────────

def _make_dims(ratings: list[str]) -> list[DimensionDetail]:
    return [
        DimensionDetail(
            key=f"dim_{i}",
            label=f"Dim {i}",
            score={"strong": 0.9, "fair": 0.6, "weak": 0.3}[r],
            rating=r,  # type: ignore[arg-type]
            post_label="x",
            profile_label="y",
            guidance="tip",
        )
        for i, r in enumerate(ratings)
    ]


def test_summary_high_score_no_weak():
    dims = _make_dims(["strong"] * 7)
    s = _build_summary(85, dims)
    assert "strongly" in s
    assert "85%" in s


def test_summary_high_score_one_weak():
    dims = _make_dims(["strong"] * 6 + ["weak"])
    s = _build_summary(82, dims)
    assert "82%" in s
    assert "Dim 6" in s.lower() or "dim 6" in s.lower()


def test_summary_mid_score():
    dims = _make_dims(["strong", "strong", "weak", "weak", "fair", "fair", "fair"])
    s = _build_summary(70, dims)
    assert "70%" in s


def test_summary_low_score():
    dims = _make_dims(["weak"] * 5 + ["fair"] * 2)
    s = _build_summary(45, dims)
    assert "45%" in s
    assert "dim" in s.lower()


# ── Integration: score_post_detailed ──────────────────────────────────────────

@pytest.mark.asyncio
async def test_score_post_detailed_returns_correct_structure():
    profile = _mock_profile()
    with patch(
        "services.voice_dna.scorer._classify_post",
        AsyncMock(return_value=_classification_dict()),
    ):
        result = await score_post_detailed(SAMPLE_POST, profile)

    assert isinstance(result, VoiceMatchDetailed)
    assert 0 <= result.overall_score <= 100
    assert result.word_count == 80
    assert len(result.dimensions) == 7
    assert result.summary
    for d in result.dimensions:
        assert d.key in {
            "hook_style", "structural_pattern", "vocabulary_register",
            "sentence_rhythm", "paragraph_structure", "cta_style", "emotional_register",
        }
        assert d.rating in {"strong", "fair", "weak"}
        assert 0.0 <= d.score <= 1.0
        assert d.post_label
        assert d.profile_label
        assert d.guidance


@pytest.mark.asyncio
async def test_score_post_detailed_strong_match_guidance():
    """All dimensions match profile → all dimensions should be strong or fair."""
    profile = _mock_profile()
    with patch(
        "services.voice_dna.scorer._classify_post",
        AsyncMock(return_value=_classification_dict(
            hook_type="bold_statement",
            structural_pattern="problem_insight_proof",
            cta_style="implicit_question",
            tone="analytical",
        )),
    ):
        result = await score_post_detailed(SAMPLE_POST, profile)

    hook_dim = next(d for d in result.dimensions if d.key == "hook_style")
    assert hook_dim.rating in {"strong", "fair"}
    assert "bold" in hook_dim.guidance.lower() or "opening" in hook_dim.guidance.lower()


@pytest.mark.asyncio
async def test_score_post_detailed_mismatch_guidance():
    """Hook mismatch → guidance should mention both post and profile hook types."""
    profile = _mock_profile()
    with patch(
        "services.voice_dna.scorer._classify_post",
        AsyncMock(return_value=_classification_dict(
            hook_type="story",  # not in profile's distribution
            structural_pattern="problem_insight_proof",
            cta_style="implicit_question",
            tone="analytical",
        )),
    ):
        result = await score_post_detailed(SAMPLE_POST, profile)

    hook_dim = next(d for d in result.dimensions if d.key == "hook_style")
    assert hook_dim.rating == "weak"
    assert "story" in hook_dim.guidance.lower() or "bold" in hook_dim.guidance.lower()


@pytest.mark.asyncio
async def test_score_post_detailed_backward_compat_with_score_post():
    """score_post_detailed overall_score must match score_post for same input."""
    profile = _mock_profile()
    classification = _classification_dict()

    with patch(
        "services.voice_dna.scorer._classify_post",
        AsyncMock(return_value=classification),
    ):
        from services.voice_dna.scorer import score_post
        base_result = await score_post(SAMPLE_POST, profile)

    with patch(
        "services.voice_dna.scorer._classify_post",
        AsyncMock(return_value=classification),
    ):
        detailed_result = await score_post_detailed(SAMPLE_POST, profile)

    assert base_result.overall_score == detailed_result.overall_score


# ── Router tests ───────────────────────────────────────────────────────────────
# FastAPI resolves Depends() by function identity, so we use app.dependency_overrides
# (not patch) to replace get_current_user and get_session.

def _make_fake_session(profile_status: str = "ready"):
    fake_profile = MagicMock()
    fake_profile.status = profile_status

    async def _execute(_query):
        r = MagicMock()
        r.scalar_one_or_none.return_value = fake_profile
        return r

    session = MagicMock()
    session.execute = AsyncMock(side_effect=_execute)
    session.commit = AsyncMock()
    return session


def _fake_detailed() -> VoiceMatchDetailed:
    dim = lambda key, label: DimensionDetail(  # noqa: E731
        key=key, label=label, score=0.8, rating="strong",
        post_label="x", profile_label="y", guidance="tip",
    )
    return VoiceMatchDetailed(
        overall_score=78,
        word_count=80,
        summary="Solid match at 78%.",
        dimensions=[
            dim("hook_style", "Hook Style"),
            dim("structural_pattern", "Structure"),
            dim("vocabulary_register", "Vocabulary"),
            dim("sentence_rhythm", "Sentence Rhythm"),
            dim("paragraph_structure", "Paragraph Layout"),
            dim("cta_style", "Closing / CTA"),
            dim("emotional_register", "Tone"),
        ],
    )


def test_analyze_endpoint_happy_path():
    from fastapi.testclient import TestClient

    from auth import get_current_user
    from db.session import get_session
    from main import app

    fake_user = MagicMock()
    fake_user.id = uuid.uuid4()
    fake_user.plan = "pro"
    fake_user.trial_ends_at = None

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_session] = lambda: _make_fake_session("ready")

    with (
        patch("routers.dna_match.check_rate_limit", return_value=(True, 0)),
        patch("routers.dna_match.score_post_detailed", AsyncMock(return_value=_fake_detailed())),
        patch("routers.dna_match.log_usage", AsyncMock()),
    ):
        with TestClient(app) as client:
            resp = client.post(
                "/dna-match/analyze",
                json={"content": "word " * 60},
            )

    app.dependency_overrides.clear()

    assert resp.status_code == 200
    body = resp.json()
    assert body["overall_score"] == 78
    assert len(body["dimensions"]) == 7
    assert body["summary"] == "Solid match at 78%."


def test_analyze_endpoint_profile_not_ready():
    from fastapi.testclient import TestClient

    from auth import get_current_user
    from db.session import get_session
    from main import app

    fake_user = MagicMock()
    fake_user.id = uuid.uuid4()

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_session] = lambda: _make_fake_session("building")

    with patch("routers.dna_match.check_rate_limit", return_value=(True, 0)):
        with TestClient(app) as client:
            resp = client.post(
                "/dna-match/analyze",
                json={"content": "word " * 60},
            )

    app.dependency_overrides.clear()

    assert resp.status_code == 400
    assert "Voice profile not ready" in resp.json()["detail"]


def test_analyze_endpoint_rate_limited():
    from fastapi.testclient import TestClient

    from auth import get_current_user
    from db.session import get_session
    from main import app

    fake_user = MagicMock()
    fake_user.id = uuid.uuid4()

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_session] = lambda: _make_fake_session()

    with patch("routers.dna_match.check_rate_limit", return_value=(False, 120)):
        with TestClient(app) as client:
            resp = client.post(
                "/dna-match/analyze",
                json={"content": "word " * 60},
            )

    app.dependency_overrides.clear()

    assert resp.status_code == 429


def test_analyze_endpoint_content_too_short():
    from fastapi.testclient import TestClient

    from auth import get_current_user
    from db.session import get_session
    from main import app

    fake_user = MagicMock()
    fake_user.id = uuid.uuid4()

    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_session] = lambda: _make_fake_session()

    with patch("routers.dna_match.check_rate_limit", return_value=(True, 0)):
        with TestClient(app) as client:
            resp = client.post(
                "/dna-match/analyze",
                json={"content": "too short"},
            )

    app.dependency_overrides.clear()

    assert resp.status_code == 422

from unittest.mock import MagicMock

from services.generation.prompt_builder import build_generation_prompt, build_repurpose_prompt


def _mock_profile():
    p = MagicMock()
    p.hook_distribution = {"bold_statement": 0.6, "question": 0.3, "story": 0.1}
    p.structural_pattern = {
        "dominant": "problem_insight_proof",
        "frequency": 0.6,
        "alternatives": [{"pattern": "story_lesson", "frequency": 0.3}],
    }
    p.sentence_rhythm = {"avg_length": 11.0, "short_ratio": 0.55, "long_ratio": 0.1}
    p.paragraph_structure = {"single_line_ratio": 0.8, "avg_paragraph_length": 1.2}
    p.vocabulary_register = {"formality_score": 0.3, "jargon_density": 0.05, "avg_word_length": 4.2}
    p.cta_style = {"dominant": "implicit_question", "frequency": 0.55, "none_ratio": 0.2}
    p.emotional_register = {"analytical": 0.5, "pragmatic": 0.3, "provocative": 0.2}
    # Deep fingerprint fields - None means formatters skip these sections cleanly
    p.lexical_signature = None
    p.argument_templates = None
    p.belief_stances = None
    p.epistemic_style = None
    return p


def test_all_profile_fields_injected():
    profile = _mock_profile()
    system, user = build_generation_prompt(profile, ["Post one", "Post two"], "A", "My great idea")
    # Hook style renders its description ("declarative" from bold_statement)
    assert "bold_statement" in system or "declarative" in system
    # Emotional register appears (analytical from emotional_register mock)
    assert "analytical" in system.lower()
    # Few-shot exemplars are injected
    assert "Post one" in system
    assert "My great idea" in user


def test_three_distinct_variant_instructions():
    profile = _mock_profile()
    sys_a, _ = build_generation_prompt(profile, [], "A", "idea")
    sys_b, _ = build_generation_prompt(profile, [], "B", "idea")
    sys_c, _ = build_generation_prompt(profile, [], "C", "idea")
    # Each variant has a distinct instruction section
    assert sys_a != sys_b
    assert sys_b != sys_c


def test_missing_profile_fields_use_fallbacks():
    profile = MagicMock()
    profile.hook_distribution = None
    profile.structural_pattern = None
    profile.sentence_rhythm = None
    profile.paragraph_structure = None
    profile.vocabulary_register = None
    profile.cta_style = None
    profile.emotional_register = None
    profile.lexical_signature = None
    profile.argument_templates = None
    profile.belief_stances = None
    profile.epistemic_style = None
    # Should not raise
    system, user = build_generation_prompt(profile, [], "A", "idea")
    assert "ABSOLUTE RULES" in system
    assert "idea" in user


def test_repurpose_prompt_includes_source():
    profile = _mock_profile()
    system, user = build_repurpose_prompt(profile, "Long article content here " * 50)
    assert "Long article content here" in user
    assert "LinkedIn post" in system


def test_repurpose_truncates_long_source():
    profile = _mock_profile()
    long_text = "word " * 2000  # > 3000 chars
    _, user = build_repurpose_prompt(profile, long_text)
    assert len(user) < len(long_text) + 100

"""
Maps questionnaire answers (SeedProfileRequest) to a partial VoiceProfile field dict.

This is a PURE MAPPING - no database access, no async. The caller handles persistence.
Only fields the questionnaire can honestly inform are returned; everything else
stays NULL and converges toward real values via the edit loop over time.
"""
import logging

from schemas.voice_profile import SeedProfileRequest

logger = logging.getLogger(__name__)

# ── Style anchor posts ────────────────────────────────────────────────────────
# Shown to User B so they can pick the voice that feels closest to what they want.
# These must stay in sync with the frontend SeedQuestionnaireStep component.
# Each anchor maps to a persona + emotional-register seed.
STYLE_ANCHOR_POSTS: dict[str, dict] = {
    "A": {
        "label": "Direct & Experience-based",
        "preview": (
            "I've made this mistake 3 times and it cost me each time.\n\n"
            "When I started out, I thought the goal was to look like I had all the answers.\n\n"
            "It took years to realize: the people others actually trust "
            "are the ones who admit what they're still figuring out.\n\n"
            "Here's what changed when I stopped pretending:"
        ),
        "persona": "practitioner",
    },
    "B": {
        "label": "Structured & Insight-led",
        "preview": (
            "Most people get this backwards.\n\n"
            "The research consistently shows one thing: the approach "
            "that feels most natural is often the least effective.\n\n"
            "Here's what the data actually says - "
            "and why it changes how you should work:"
        ),
        "persona": "analyst",
    },
    "C": {
        "label": "Narrative & Relatable",
        "preview": (
            "Six months ago, I was stuck.\n\n"
            "Not in a dramatic way. Just quietly spinning, "
            "wondering if I was headed in the right direction.\n\n"
            "Then one conversation changed everything.\n\n"
            "This is what I learned:"
        ),
        "persona": "storyteller",
    },
}

# ── Field maps ────────────────────────────────────────────────────────────────

_STRUCTURAL_PATTERN: dict[str, dict] = {
    "story":     {"dominant": "story_lesson",          "frequency": 0.80, "alternatives": []},
    "framework": {"dominant": "problem_insight_proof", "frequency": 0.80, "alternatives": []},
    "hot_take":  {"dominant": "contrarian",            "frequency": 0.80, "alternatives": []},
}

_VOCABULARY_REGISTER: dict[str, dict] = {
    "formal":          {"formality_score": 0.75, "avg_word_length": 5.2, "jargon_density": 0.15},
    "conversational":  {"formality_score": 0.45, "avg_word_length": 4.5, "jargon_density": 0.08},
    "casual":          {"formality_score": 0.15, "avg_word_length": 3.9, "jargon_density": 0.05},
}

_SENTENCE_RHYTHM: dict[str, dict] = {
    "formal":          {"avg_length": 20, "short_ratio": 0.15, "long_ratio": 0.40},
    "conversational":  {"avg_length": 12, "short_ratio": 0.45, "long_ratio": 0.15},
    "casual":          {"avg_length":  8, "short_ratio": 0.65, "long_ratio": 0.05},
}

_PARAGRAPH_STRUCTURE: dict[str, dict] = {
    "formal":          {"single_line_ratio": 0.40, "avg_paragraph_length": 3.0},
    "conversational":  {"single_line_ratio": 0.65, "avg_paragraph_length": 1.8},
    "casual":          {"single_line_ratio": 0.80, "avg_paragraph_length": 1.3},
}

_CTA_STYLE: dict[str, dict] = {
    "formal":          {"dominant": "implicit_question", "frequency": 0.60, "none_ratio": 0.30},
    "conversational":  {"dominant": "question",          "frequency": 0.70, "none_ratio": 0.10},
    "casual":          {"dominant": "challenge",         "frequency": 0.50, "none_ratio": 0.20},
}

_GOAL_CONFIDENCE: dict[str, float] = {
    "thought_leadership": 0.80,
    "job_seeking":        0.60,
    "business_leads":     0.75,
    "learning_in_public": 0.50,
}

_GOAL_EMOTIONAL_REGISTER: dict[str, dict] = {
    "thought_leadership": {"analytical": 0.40, "pragmatic": 0.40, "inspirational": 0.20},
    "job_seeking":        {"professional": 0.40, "aspirational": 0.30, "personal": 0.30},
    "business_leads":     {"pragmatic": 0.50, "analytical": 0.30, "inspirational": 0.20},
    "learning_in_public": {"vulnerable": 0.40, "reflective": 0.30, "conversational": 0.30},
}

_PERSONA_SELF_REFERENCE: dict[str, float] = {
    "practitioner": 0.60,
    "analyst":      0.30,
    "storyteller":  0.55,
}

_PERSONA_HEDGE_FREQ: dict[str, float] = {
    "practitioner": 0.08,
    "analyst":      0.15,
    "storyteller":  0.10,
}


def build_seed_profile(answers: SeedProfileRequest) -> dict:
    """Return a partial dict of VoiceProfile field values derived from questionnaire answers.

    Fields that require real posts to extract (hook_distribution, lexical_signature,
    argument_templates, profile_embedding, cluster_centroids, loo_distribution,
    stylometric_profile) are NOT included - they stay NULL and fill in over time
    via the edit loop and any Sources imports the user adds later.
    """
    anchor = STYLE_ANCHOR_POSTS.get(answers.style_anchor, STYLE_ANCHOR_POSTS["A"])
    persona: str = anchor["persona"]
    confidence = _GOAL_CONFIDENCE.get(answers.posting_goal, 0.65)

    epistemic_style = {
        "persona": persona,
        "confidence_level": confidence,
        "self_reference_rate": _PERSONA_SELF_REFERENCE.get(persona, 0.45),
        "hedge_frequency": _PERSONA_HEDGE_FREQ.get(persona, 0.10),
    }

    emotional_register = _GOAL_EMOTIONAL_REGISTER.get(
        answers.posting_goal,
        {"pragmatic": 0.40, "analytical": 0.30, "conversational": 0.30},
    )

    # Single soft belief stance seeded from the stated audience.
    # evidence_count=0 signals this came from the questionnaire, not observed posts.
    belief_stances: dict = {
        "positions": [
            {
                "topic": answers.target_audience,
                "stance": "advocate",
                "evidence_count": 0,
            }
        ]
    }
    if answers.about_yourself:
        belief_stances["bio"] = answers.about_yourself

    fields = {
        "structural_pattern": _STRUCTURAL_PATTERN.get(
            answers.content_type,
            {"dominant": "problem_insight_proof", "frequency": 0.70, "alternatives": []},
        ),
        "vocabulary_register": _VOCABULARY_REGISTER.get(
            answers.writing_register, _VOCABULARY_REGISTER["conversational"]
        ),
        "sentence_rhythm": _SENTENCE_RHYTHM.get(
            answers.writing_register, _SENTENCE_RHYTHM["conversational"]
        ),
        "paragraph_structure": _PARAGRAPH_STRUCTURE.get(
            answers.writing_register, _PARAGRAPH_STRUCTURE["conversational"]
        ),
        "cta_style": _CTA_STYLE.get(
            answers.writing_register, _CTA_STYLE["conversational"]
        ),
        "emotional_register": emotional_register,
        "epistemic_style": epistemic_style,
        "belief_stances": belief_stances,
    }

    logger.info(
        "Seed profile mapped: content_type=%s register=%s anchor=%s goal=%s persona=%s",
        answers.content_type,
        answers.writing_register,
        answers.style_anchor,
        answers.posting_goal,
        persona,
    )
    return fields

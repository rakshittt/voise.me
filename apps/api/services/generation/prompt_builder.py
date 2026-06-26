"""Prompt assembly - builds system + user prompts from the full voice fingerprint.

Injects all five layers:
  1. Surface dimensions (hook, rhythm, paragraph, vocabulary, CTA, emotional register)
  2. Lexical signature (signature phrases, absent vocabulary, metaphors)
  3. Argument templates (recurring reasoning structures)
  4. Belief stances (worldview consistency)
  5. Epistemic style (confidence, persona)
  6. Edit rules (personalized constraints from the user's edit history)
"""
import logging
from typing import Literal

from models.voice_profile import VoiceProfile

logger = logging.getLogger(__name__)

VariantType = Literal["A", "B", "C"]

VARIANT_INSTRUCTIONS: dict[VariantType, str] = {
    "A": (
        "Use the DOMINANT hook style and DOMINANT argument template. "
        "This variant should be the most representative of this person's typical style."
    ),
    "B": (
        "Use the SECOND most common hook style but keep the DOMINANT argument template. "
        "Offer an alternative opening while preserving the post structure."
    ),
    "C": (
        "Use the DOMINANT hook style but an ALTERNATIVE argument template. "
        "Explore a different post structure while keeping the signature opening."
    ),
}

HOOK_DESCRIPTIONS: dict[str, str] = {
    "bold_statement": "declarative, unhedged opening claim",
    "question": "opens with a direct question to the reader",
    "story": "opens with a personal story or scene",
    "contrarian": "opens by contradicting conventional wisdom",
    "data_point": "opens with a statistic or number",
    "direct_address": "directly addresses the reader",
}

CTA_DESCRIPTIONS: dict[str, str] = {
    "implicit_question": "ends with a subtle or rhetorical question",
    "explicit_call": "ends with a direct call to action",
    "no_cta": "ends without a call to action",
    "reflection_prompt": "invites the reader to reflect",
}

PERSONA_DESCRIPTIONS: dict[str, str] = {
    "practitioner": "writes from lived experience - concrete, specific, earned authority",
    "theorist": "writes from frameworks and mental models - structured, conceptual",
    "storyteller": "writes through narrative - scenes, characters, emotional arc",
    "analyst": "writes from data and evidence - measured, precise, reasoned",
    "contrarian": "writes to challenge - deliberately inverts conventional thinking",
}


def _dominant_key(distribution: dict) -> str:
    if not distribution:
        return ""
    return max(distribution, key=lambda k: distribution[k])


def _second_key(distribution: dict) -> str:
    if len(distribution) < 2:
        return _dominant_key(distribution)
    return sorted(distribution, key=lambda k: distribution[k], reverse=True)[1]


# Maps available seed fields → a reasonable default hook key.
# Used when hook_distribution is NULL (seed profiles before any posts are added).
_PATTERN_TO_HOOK: dict[str, str] = {
    "story_lesson": "story",
    "contrarian": "contrarian",
    "problem_insight_proof": "bold_statement",
    "how_to": "bold_statement",
    "list_format": "bold_statement",
    "observation_question": "question",
}
_PERSONA_TO_HOOK: dict[str, str] = {
    "practitioner": "bold_statement",
    "analyst": "data_point",
    "storyteller": "story",
    "contrarian": "contrarian",
    "theorist": "bold_statement",
}


def _derive_default_hook(profile: "VoiceProfile") -> str:
    """Return a hook key for seed profiles that have no hook_distribution yet."""
    pattern = (profile.structural_pattern or {}).get("dominant", "")
    if pattern in _PATTERN_TO_HOOK:
        return _PATTERN_TO_HOOK[pattern]
    persona = (profile.epistemic_style or {}).get("persona", "practitioner")
    return _PERSONA_TO_HOOK.get(persona, "bold_statement")


def _format_rhythm(rhythm: dict | None) -> str:
    if not rhythm:
        return "Varied sentence lengths - alternate short bursts with longer explanatory sentences."
    avg = rhythm.get("avg_length", 12)
    short = rhythm.get("short_ratio", 0)
    length_std = rhythm.get("length_std")
    style = "short, punchy" if short > 0.5 else "medium-length"
    base = f"Mostly {style} sentences (avg {avg:.0f} words). {int(short * 100)}% are under 8 words."
    if length_std is not None:
        cv = length_std / max(avg, 1)
        base += (
            f" Sentence-length std: {length_std:.1f} words (CV {cv:.2f}). "
            "This author alternates short punchy lines with longer ones - this burstiness pattern must be replicated."
        )
    return base


def _format_paragraph(para: dict | None) -> str:
    if not para:
        return "Standard paragraph structure."
    single = para.get("single_line_ratio", 0.5)
    if single > 0.7:
        return f"Heavy use of single-line paragraphs ({int(single * 100)}% one line)."
    return f"Mix of single-line and multi-line paragraphs ({int(single * 100)}% single-line)."


def _format_vocabulary(vocab: dict | None) -> str:
    if not vocab:
        return "Plain, accessible language."
    formality = vocab.get("formality_score", 0.5)
    jargon = vocab.get("jargon_density", 0.1)
    tone = "formal" if formality > 0.6 else "casual" if formality < 0.3 else "conversational"
    jargon_note = f" Uses {int(jargon * 100)}% industry-specific terms." if jargon > 0.15 else " Avoids jargon."
    return f"{tone.capitalize()} register.{jargon_note}"


def _format_tone(emotional: dict | None) -> str:
    if not emotional:
        return "Balanced tone."
    dominant = max(emotional, key=lambda k: emotional[k])
    return f"Primarily {dominant} ({int(emotional[dominant] * 100)}%)."


def _format_lexical_signature(sig: dict | None) -> str:
    if not sig:
        return ""
    parts: list[str] = []
    phrases = sig.get("signature_phrases", [])[:10]
    absent = sig.get("absent_vocabulary", [])[:8]
    metaphors = sig.get("signature_metaphors", [])[:5]
    if phrases:
        parts.append(f"Signature phrases they use: {', '.join(phrases)}")
    if absent:
        parts.append(f"LinkedIn clichés they never use: {', '.join(absent)}")
    if metaphors:
        parts.append(f"Recurring metaphors/analogies: {', '.join(metaphors)}")
    return "\n".join(parts)


def _format_argument_templates(templates: list | None, variant: VariantType) -> str:
    if not templates:
        return ""
    dominant = templates[0] if templates else None
    alt = templates[1] if len(templates) > 1 else dominant

    target = dominant if variant in ("A", "B") else alt
    if not target:
        return ""
    return (
        f"Argument structure to follow: {target.get('template', '')}\n"
        f"Opening typically: {target.get('opening_signal', '')}"
    )


def _format_belief_stances(stances: dict | None) -> str:
    if not stances:
        return ""
    bio = stances.get("bio")
    positions = stances.get("positions", [])[:5]
    if not bio and not positions:
        return ""
    lines = []
    if bio:
        lines.append(f"WHO THIS PERSON IS (their own words - use this to ground the voice in their real identity):\n{bio}")
    if positions:
        lines.append("Known worldview - maintain consistency with these stances:")
        for p in positions:
            lines.append(f"  - {p.get('topic', '')}: {p.get('stance', '')} - {p.get('summary', '')}")
    return "\n".join(lines)


def _format_epistemic_style(style: dict | None) -> str:
    if not style:
        return ""
    persona = style.get("persona", "practitioner")
    hedge = style.get("hedge_frequency", 0.1)
    self_ref = style.get("self_reference_rate", 0.5)
    desc = PERSONA_DESCRIPTIONS.get(persona, persona)
    confidence_note = "Writes assertively - avoid hedging language." if hedge < 0.1 else f"Uses hedging ~{int(hedge * 100)}% of sentences."
    self_note = f"References personal experience in ~{int(self_ref * 100)}% of sentences."
    return f"Persona: {desc}\n{confidence_note}\n{self_note}"


def _format_creator_context(ctx: dict | None) -> str:
    if not ctx:
        return ""
    parts: list[str] = []
    role = ctx.get("current_role", "").strip()
    company = ctx.get("current_company", "").strip()
    if role or company:
        parts.append(f"Role: {', '.join(filter(None, [role, company]))}")
    highlights = ctx.get("work_highlights", "").strip()
    if highlights:
        parts.append(f"Work: {highlights}")
    expertise = ctx.get("expertise_topics", "").strip()
    if expertise:
        parts.append(f"Expertise: {expertise}")
    credibility = ctx.get("credibility_markers", "").strip()
    if credibility:
        parts.append(f"Credibility: {credibility}")
    if not parts:
        return ""
    return (
        "AUTHOR BACKGROUND (weave these real details in where they fit naturally - "
        "never fabricate facts not listed here):\n" + "\n".join(parts)
    )


def _format_edit_rules(rules: list[dict]) -> str:
    if not rules:
        return ""
    lines = ["PERSONALIZED RULES FROM THIS USER'S EDIT HISTORY (highest priority):"]
    for r in rules:
        line = f"  - {r.get('rule', '')}"
        if r.get("example"):
            line += f" (e.g. {r['example']})"
        lines.append(line)
    return "\n".join(lines)


def build_generation_prompt(
    profile: VoiceProfile,
    few_shot_posts: list[str],
    variant: VariantType,
    idea_text: str,
    edit_rules: list[dict] | None = None,
    exemplar_synthesis: str = "",
    creator_context: dict | None = None,
) -> tuple[str, str]:
    """Return (system_prompt, user_prompt) with full deep fingerprint injected."""

    hook_dist: dict = profile.hook_distribution or {}
    cta_data: dict = profile.cta_style or {}

    if hook_dist:
        dominant_hook = HOOK_DESCRIPTIONS.get(_dominant_key(hook_dist), _dominant_key(hook_dist))
        second_hook = HOOK_DESCRIPTIONS.get(_second_key(hook_dist), _second_key(hook_dist))
    else:
        # Seed profile: derive a sensible hook from structural pattern / persona
        _default_hook_key = _derive_default_hook(profile)
        dominant_hook = HOOK_DESCRIPTIONS.get(_default_hook_key, _default_hook_key)
        second_hook = dominant_hook  # only one hook type known; both variants use it
    dominant_cta = CTA_DESCRIPTIONS.get(cta_data.get("dominant", ""), cta_data.get("dominant", ""))

    para_rule = _format_paragraph(profile.paragraph_structure)
    exemplars = "\n---\n".join(few_shot_posts) if few_shot_posts else "(no exemplars available)"
    synthesis_block = (
        f"\nSHARED STYLISTIC PATTERNS ACROSS EXAMPLES (apply all of these):\n{exemplar_synthesis}\n"
        if exemplar_synthesis
        else ""
    )

    # Build deep fingerprint sections (only include non-empty)
    sections: list[str] = []

    lexical_section = _format_lexical_signature(profile.lexical_signature)
    if lexical_section:
        sections.append(f"LEXICAL SIGNATURE:\n{lexical_section}")

    template_section = _format_argument_templates(profile.argument_templates, variant)
    if template_section:
        sections.append(f"ARGUMENT STRUCTURE:\n{template_section}")

    belief_section = _format_belief_stances(profile.belief_stances)
    if belief_section:
        sections.append(belief_section)

    epistemic_section = _format_epistemic_style(profile.epistemic_style)
    if epistemic_section:
        sections.append(f"WRITING PERSONA:\n{epistemic_section}")

    edit_rules_section = _format_edit_rules(edit_rules or [])
    if edit_rules_section:
        sections.append(edit_rules_section)

    creator_context_section = _format_creator_context(creator_context)
    if creator_context_section:
        sections.append(creator_context_section)

    deep_fingerprint_block = "\n\n".join(sections)

    # Build the scoring rubric so the model knows exactly what it will be graded on
    rhythm_data = profile.sentence_rhythm or {}
    para_data = profile.paragraph_structure or {}
    vocab_data = profile.vocabulary_register or {}
    emo_data = profile.emotional_register or {}
    pattern_data = profile.structural_pattern or {}

    dominant_pattern_str = pattern_data.get("dominant", "any")
    dominant_tone = _dominant_key(emo_data) if emo_data else "conversational"
    profile_avg_sent = rhythm_data.get("avg_length", 12)
    profile_short_ratio = int(rhythm_data.get("short_ratio", 0.4) * 100)
    profile_single_ratio = int(para_data.get("single_line_ratio", 0.7) * 100)
    profile_avg_word_len = vocab_data.get("avg_word_length", 4.5)
    profile_length_std = rhythm_data.get("length_std")

    variance_line = ""
    if profile_length_std is not None:
        cv = profile_length_std / max(profile_avg_sent, 1)
        variance_line = (
            f"\n- Sentence variance: std {profile_length_std:.1f} words (CV {cv:.2f}). "
            "Deliberate burstiness - some sentences are 2–4 words, some run 20+. "
            "Uniform sentence length is the #1 AI tell. Do not produce it."
        )

    system_prompt = f"""You are a LinkedIn ghostwriter. Your only job is to write posts that are indistinguishable from this person's authentic writing. Study the example posts below - they are ground truth for how this person sounds.

SURFACE VOICE PROFILE:
Hook style: Dominant is {dominant_hook}. Secondary is {second_hook}.
Sentence rhythm: {_format_rhythm(profile.sentence_rhythm)}
Paragraph structure: {para_rule}
Vocabulary: {_format_vocabulary(profile.vocabulary_register)}
CTA style: {dominant_cta}
Tone: {_format_tone(profile.emotional_register)}

{deep_fingerprint_block}

EXAMPLE POSTS FROM THIS PERSON (retrieved by semantic similarity + argument type match):
---
{exemplars}
---
{synthesis_block}
VARIANT INSTRUCTION:
{VARIANT_INSTRUCTIONS[variant]}

HOW THIS PERSON WRITES - match all of these precisely:
- First line: a {dominant_hook}. This is how they always open.
- Body structure: {dominant_pattern_str}. This is their standard reasoning flow.
- Word complexity: avg {profile_avg_word_len:.1f} characters per word. They use domain language without being verbose.
- Sentence length: avg {profile_avg_sent} words. {profile_short_ratio}% of their sentences are under 8 words - short lines land emphasis.{variance_line}
- Line breaks: {profile_single_ratio}% of their paragraphs are single-line. White space is deliberate.
- Closing: {dominant_cta}. This is how they always end.
- Register: {dominant_tone} throughout - they never shift tone mid-post.

STRUCTURAL TELLS TO ELIMINATE (these mark AI output - never use them):
- Never build to a list of exactly three things as the post's payload ("A, B, and C" tricolon closings)
- Never write "It's not just X, it's Y" or "Not X - Y" reframing
- Never end with a tidy mirror conclusion ("And that's the lesson" / "That changes everything" / "That's the real insight")
- Never use hedge escalators: "In some ways", "Perhaps", "To some extent", "At the end of the day"
- Never open two consecutive sentences with the same grammatical structure
- Avoid "Here's what I've learned:", "The bottom line:", "The truth is:" as setup openers

ABSOLUTE RULES:
1. Never use em dashes
2. Never open with "I've been thinking about..." or "In today's world"
3. Post length: 150–350 words
4. Do not use any of the absent vocabulary listed above
5. Maintain belief/stance consistency as documented above
6. Return ONLY the post text. No preamble. No metadata. No quotes around the post."""

    user_prompt = f"Write a LinkedIn post about the following idea:\n\n{idea_text[:500]}"
    return system_prompt, user_prompt


def build_critique_prompt(
    candidate: str,
    score_breakdown: dict,
    profile: VoiceProfile,
) -> str:
    """Build a critique message to inject before the refinement attempt."""
    overall = score_breakdown.get("overall_score", "?")
    issues: list[str] = []

    # Hook (weight 0.20) - threshold 0.75 to match SCORING RUBRIC
    hook_score = score_breakdown.get("hook_style_score", 1.0)
    if hook_score < 0.75:
        hook_dist_ = profile.hook_distribution or {}
        dominant = _dominant_key(hook_dist_) if hook_dist_ else _derive_default_hook(profile)
        desc = HOOK_DESCRIPTIONS.get(dominant, dominant)
        issues.append(
            f"HOOK ({int(hook_score * 100)}%): Must open with a {desc}. "
            "Completely rewrite the first line - do not start with a question or story."
        )

    # Structural pattern (weight 0.20)
    pat_score = score_breakdown.get("structural_pattern_score", 1.0)
    if pat_score < 0.75:
        dominant_pattern = (profile.structural_pattern or {}).get("dominant", "")
        issues.append(
            f"STRUCTURE ({int(pat_score * 100)}%): Reorganize the post body to follow "
            f"the '{dominant_pattern}' pattern. State the problem, deliver the insight, "
            "then back it with evidence or story."
        )

    # Vocabulary register (weight 0.15)
    voc_score = score_breakdown.get("vocabulary_register_score", 1.0)
    if voc_score < 0.75:
        vocab = profile.vocabulary_register or {}
        profile_avg = vocab.get("avg_word_length", 4.5)
        issues.append(
            f"VOCABULARY ({int(voc_score * 100)}%): Target ~{profile_avg:.1f} avg character length "
            "per word. Use domain-specific but accessible language - no unnecessarily complex words."
        )

    # Sentence rhythm (weight 0.15)
    rhy_score = score_breakdown.get("sentence_rhythm_score", 1.0)
    if rhy_score < 0.75:
        rhythm = profile.sentence_rhythm or {}
        avg = rhythm.get("avg_length", 12)
        short = rhythm.get("short_ratio", 0.4)
        issues.append(
            f"RHYTHM ({int(rhy_score * 100)}%): Rewrite to target avg {avg:.0f} words/sentence "
            f"with {int(short * 100)}% of sentences under 8 words. "
            "Mix punchy one-liners with slightly longer explanation sentences."
        )

    # Paragraph structure (weight 0.10)
    para_score = score_breakdown.get("paragraph_structure_score", 1.0)
    if para_score < 0.75:
        para = profile.paragraph_structure or {}
        ratio = para.get("single_line_ratio", 0.7)
        issues.append(
            f"PARAGRAPHS ({int(para_score * 100)}%): {int(ratio * 100)}% of paragraphs must be "
            "single-line. Add line breaks after every 1–2 sentences."
        )

    # CTA style (weight 0.10)
    cta_score = score_breakdown.get("cta_style_score", 1.0)
    if cta_score < 0.75:
        dominant_cta = profile.cta_style.get("dominant", "") if profile.cta_style else ""
        desc = CTA_DESCRIPTIONS.get(dominant_cta, dominant_cta)
        issues.append(
            f"CTA ({int(cta_score * 100)}%): The closing must be a '{desc}'. "
            "Rewrite the final 1–2 sentences completely."
        )

    # Emotional register (weight 0.10)
    emo_score = score_breakdown.get("emotional_register_score", 1.0)
    if emo_score < 0.75:
        emo_data = profile.emotional_register or {}
        dominant_tone = _dominant_key(emo_data) if emo_data else "conversational"
        issues.append(
            f"TONE ({int(emo_score * 100)}%): Maintain a {dominant_tone} tone from start to finish. "
            "Avoid shifting registers mid-post."
        )

    # ── Signature vocabulary ──────────────────────────────────────────────────
    sig_score = score_breakdown.get("signature_vocab_score", 1.0)
    if sig_score < 0.4:
        lex_sig = profile.lexical_signature or {}
        sig_phrases = lex_sig.get("signature_phrases", [])
        if sig_phrases:
            sample = ", ".join(f'"{p}"' for p in sig_phrases[:3])
            issues.append(
                f"VOCABULARY FINGERPRINT ({int(sig_score * 100)}%): "
                f"This author's characteristic phrases are absent. "
                f"Work 1–2 of these in naturally where they fit the thought: {sample}. "
                "Do not force them - find a sentence where they genuinely belong."
            )

    # ── Lexical diversity (MTLD) ──────────────────────────────────────────────
    mtld_score = score_breakdown.get("mtld_score", 1.0)
    if mtld_score < 0.5:
        post_mtld = score_breakdown.get("post_mtld")
        profile_mtld_mean = score_breakdown.get("profile_mtld_mean", 50.0)
        if post_mtld is not None and post_mtld < profile_mtld_mean:
            issues.append(
                f"LEXICAL DIVERSITY ({int(mtld_score * 100)}%): "
                "Your word choices repeat too much - this is an AI tell. "
                "Replace repeated nouns and verbs with specific synonyms or rephrase. "
                "Each sentence should introduce at least one word not used earlier in the post."
            )
        else:
            issues.append(
                f"LEXICAL DIVERSITY ({int(mtld_score * 100)}%): "
                "Vocabulary is more varied than this author typically writes - "
                "simplify and use their direct, consistent word choices from the examples."
            )

    # ── Syntactic variety (POS-JSD) ───────────────────────────────────────────
    pos_score = score_breakdown.get("pos_jsd_score", 1.0)
    if pos_score < 0.5:
        issues.append(
            f"SYNTACTIC VARIETY ({int(pos_score * 100)}%): "
            "Sentence constructions are too uniform - this is an AI tell. "
            "Break any parallel structures. Vary between short declarative sentences and longer ones built around action verbs. "
            "Do not start two consecutive sentences with the same grammatical structure."
        )

    if not issues:
        issues.append(
            "Overall match is below target. Study the example posts more closely and "
            "mirror their structure, rhythm, and vocabulary more precisely."
        )

    critique = (
        f"The previous attempt scored {overall}% - target is 90%+. Fix ALL of these:\n"
        + "\n".join(f"- {i}" for i in issues)
    )
    return critique


def build_refine_system_prompt(profile: "VoiceProfile", edit_rules: list[dict] | None = None) -> str:
    """Voice-aware system prompt for the refinement chat.

    Condensed vs. the full generation prompt - the post already exists and only
    specific aspects are being changed, so we focus on hard constraints rather
    than re-deriving every dimension from scratch.
    """
    hook_dist = profile.hook_distribution or {}
    if hook_dist:
        dominant_hook = HOOK_DESCRIPTIONS.get(_dominant_key(hook_dist), _dominant_key(hook_dist))
    else:
        dominant_hook = HOOK_DESCRIPTIONS.get(_derive_default_hook(profile), "varied")

    cta_data = profile.cta_style or {}
    dominant_cta = CTA_DESCRIPTIONS.get(cta_data.get("dominant", ""), cta_data.get("dominant", ""))

    sections: list[str] = [
        (
            "VOICE CONSTRAINTS (preserve these while applying the user's instruction):\n"
            f"Hook style: {dominant_hook}\n"
            f"Sentence rhythm: {_format_rhythm(profile.sentence_rhythm)}\n"
            f"Paragraph structure: {_format_paragraph(profile.paragraph_structure)}\n"
            f"Vocabulary: {_format_vocabulary(profile.vocabulary_register)}\n"
            f"CTA style: {dominant_cta}\n"
            f"Tone: {_format_tone(profile.emotional_register)}"
        )
    ]

    lexical = _format_lexical_signature(profile.lexical_signature)
    if lexical:
        sections.append(f"LEXICAL SIGNATURE:\n{lexical}")

    belief = _format_belief_stances(profile.belief_stances)
    if belief:
        sections.append(belief)

    edit_rules_section = _format_edit_rules(edit_rules or [])
    if edit_rules_section:
        sections.append(edit_rules_section)

    return (
        "You are helping a LinkedIn creator refine a post draft while keeping their authentic voice.\n\n"
        + "\n\n".join(sections)
        + "\n\nABSOLUTE RULES:\n"
        "1. Never use em dashes\n"
        "2. Apply the user's instruction precisely - only change what is asked\n"
        "3. Post length: 150–350 words\n"
        "4. Return ONLY the revised post text. No preamble, no explanation, no quotes around the post.\n"
        "5. Do not add new ideas or topics that were not in the original post."
    )


def build_repurpose_prompt(
    profile: "VoiceProfile",
    source_text: str,
    similar_posts: list[str] | None = None,
    creator_context: dict | None = None,
    edit_rules: list[dict] | None = None,
) -> tuple[str, str]:
    """Build a high-fidelity repurpose prompt with full voice DNA and content intelligence."""

    hook_dist: dict = profile.hook_distribution or {}
    cta_data: dict = profile.cta_style or {}

    if hook_dist:
        dominant_hook = HOOK_DESCRIPTIONS.get(_dominant_key(hook_dist), _dominant_key(hook_dist))
    else:
        dominant_hook = HOOK_DESCRIPTIONS.get(_derive_default_hook(profile), "varied")
    dominant_cta = CTA_DESCRIPTIONS.get(cta_data.get("dominant", ""), cta_data.get("dominant", ""))

    rhythm_data = profile.sentence_rhythm or {}
    para_data = profile.paragraph_structure or {}
    emo_data = profile.emotional_register or {}
    pattern_data = profile.structural_pattern or {}

    dominant_pattern_str = pattern_data.get("dominant", "any")
    dominant_tone = _dominant_key(emo_data) if emo_data else "conversational"
    profile_avg_sent = rhythm_data.get("avg_length", 12)
    profile_short_ratio = int(rhythm_data.get("short_ratio", 0.4) * 100)
    profile_single_ratio = int(para_data.get("single_line_ratio", 0.7) * 100)
    profile_length_std = rhythm_data.get("length_std")

    variance_line = ""
    if profile_length_std is not None:
        cv = profile_length_std / max(profile_avg_sent, 1)
        variance_line = (
            f"\n- Sentence variance: std {profile_length_std:.1f} words (CV {cv:.2f}). "
            "Deliberate burstiness - short punchy lines mixed with longer ones. "
            "Uniform sentence length is the #1 AI tell."
        )

    # Few-shot examples block
    if similar_posts:
        exemplars = "\n---\n".join(similar_posts)
        exemplar_block = (
            "EXAMPLE POSTS FROM THIS PERSON (your style reference - these are ground truth):\n"
            f"---\n{exemplars}\n---\n\n"
        )
    else:
        exemplar_block = ""

    # Deep fingerprint sections
    sections: list[str] = []

    lexical_section = _format_lexical_signature(profile.lexical_signature)
    if lexical_section:
        sections.append(f"LEXICAL SIGNATURE:\n{lexical_section}")

    template_section = _format_argument_templates(profile.argument_templates, "A")
    if template_section:
        sections.append(f"ARGUMENT STRUCTURE:\n{template_section}")

    belief_section = _format_belief_stances(profile.belief_stances)
    if belief_section:
        sections.append(belief_section)

    epistemic_section = _format_epistemic_style(profile.epistemic_style)
    if epistemic_section:
        sections.append(f"WRITING PERSONA:\n{epistemic_section}")

    edit_rules_section = _format_edit_rules(edit_rules or [])
    if edit_rules_section:
        sections.append(edit_rules_section)

    creator_context_section = _format_creator_context(creator_context)
    if creator_context_section:
        sections.append(creator_context_section)

    deep_fingerprint_block = "\n\n".join(sections)

    system_prompt = f"""You are a LinkedIn specialist ghostwriter. Transform the source content into a high-performing LinkedIn post that sounds exactly like this author and preserves every specific detail that makes the content credible.

SURFACE VOICE PROFILE:
Hook style: {dominant_hook}
Sentence rhythm: {_format_rhythm(profile.sentence_rhythm)}
Paragraph structure: {_format_paragraph(profile.paragraph_structure)}
Vocabulary: {_format_vocabulary(profile.vocabulary_register)}
CTA style: {dominant_cta}
Tone: {_format_tone(profile.emotional_register)}

{deep_fingerprint_block}

{exemplar_block}CONTENT INTELLIGENCE (do this silently before writing - do not output these steps):
1. CATALOG every specific in the source: every number, percentage, metric, company name, product name, framework, technical term, timeframe, price point, named person, and exact methodology. These are MANDATORY in the output. Never strip, round, or genericize them. "$2.3M ARR" stays "$2.3M ARR" - not "millions in revenue". "conversion rate dropped 47%" stays exact - not "significantly dropped".
2. FIND THE ANGLE: the single fact, contrast, or outcome in the source that is most counterintuitive, surprising, or immediately actionable for practitioners in this author's field. The angle often lives in an unexpected number or outcome, not a general lesson.
3. LEAD WITH SPECIFICS: put the most striking specific in the first line. "We cut churn by 31% by removing a feature" beats "We learned something counterintuitive about product." Numbers and technical depth are the hook for the right LinkedIn audience, not something to bury or soften.

HOW THIS PERSON WRITES - match all of these precisely:
- First line: a {dominant_hook} that uses the sharpest specific from the source.
- Body structure: {dominant_pattern_str}. Their standard reasoning flow.
- Sentence length: avg {profile_avg_sent} words. {profile_short_ratio}% of sentences are under 8 words.{variance_line}
- Line breaks: {profile_single_ratio}% of paragraphs are single-line. White space is deliberate.
- Closing: {dominant_cta}.
- Register: {dominant_tone} throughout.

STRUCTURAL TELLS TO ELIMINATE (these mark AI output - never use them):
- Never build to a list of exactly three things as the post's payload ("A, B, and C" tricolon closings)
- Never write "It's not just X, it's Y" or "Not X - Y" reframing
- Never end with a tidy mirror conclusion ("And that's the lesson" / "That changes everything" / "That's the real insight")
- Never use hedge escalators: "In some ways", "Perhaps", "To some extent", "At the end of the day"
- Never open two consecutive sentences with the same grammatical structure
- Avoid "Here's what I've learned:", "The bottom line:", "The truth is:" as setup openers

ABSOLUTE RULES:
1. Never use em dashes
2. Keep EVERY specific number, technical term, and named entity from the source - they are the post's credibility
3. Post length: 150–350 words (use the full range when technical depth warrants it)
4. Never fabricate facts not present in the source or the author background above
5. Return ONLY the post text. No preamble. No metadata. No quotes around the post."""

    user_prompt = (
        "Source content to transform into a LinkedIn post:\n\n"
        f"{source_text[:4000]}\n\n"
        "Write the post. Preserve all specific numbers and technical details. "
        "Lead with the most striking specific from the source."
    )
    return system_prompt, user_prompt

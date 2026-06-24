import json
import logging
import time

from models.voice_profile import VoiceProfile
from schemas.ideas import IdeaItem
from services.generation.prompt_builder import (
    HOOK_DESCRIPTIONS,
    PERSONA_DESCRIPTIONS,
    _dominant_key,
)
from services.llm.router import LLMResponse, llm_call

logger = logging.getLogger(__name__)

# ── Per-user recommended ideas cache (in-memory, 6h TTL) ───────────────────
_recommended_cache: dict[str, tuple[list[IdeaItem], float]] = {}
_CACHE_TTL = 6 * 3600

_PERSONA_AUDIENCES = {
    "practitioner": "professionals who want real-world, experience-based insights",
    "analyst": "leaders and decision-makers who want data-driven clarity",
    "storyteller": "professionals who learn best through narrative and story",
    "theorist": "strategic thinkers who want frameworks and mental models",
    "contrarian": "professionals who want fresh perspectives that challenge conventional thinking",
}


def invalidate_recommended_cache(user_id: str) -> None:
    _recommended_cache.pop(user_id, None)


def _build_system_prompt(profile: VoiceProfile, niche: str, focus_topic: str | None) -> str:
    hook_dist = profile.hook_distribution or {}
    dominant_hook = _dominant_key(hook_dist)
    hook_desc = HOOK_DESCRIPTIONS.get(dominant_hook, "engaging opening")

    epistemic = profile.epistemic_style or {}
    persona_key = epistemic.get("persona", "practitioner") if isinstance(epistemic, dict) else "practitioner"
    persona_desc = PERSONA_DESCRIPTIONS.get(persona_key, "writes from lived experience")

    lex_sig = profile.lexical_signature or {}
    sig_phrases = (lex_sig.get("signature_phrases") or [])[:5] if isinstance(lex_sig, dict) else []

    belief_stances = profile.belief_stances or {}
    positions = (belief_stances.get("positions") or [])[:3] if isinstance(belief_stances, dict) else []
    topic_hints = [p.get("topic", "") for p in positions if p.get("topic")]

    lines = [
        "You are a content strategist who deeply understands this writer's voice.",
        "",
        "WRITER'S VOICE PROFILE:",
        f"- Persona: {persona_key} - {persona_desc}",
        f"- Dominant hook style: {dominant_hook} ({hook_desc})",
    ]

    if sig_phrases:
        lines.append(f"- Signature phrases they use: {', '.join(sig_phrases)}")

    if topic_hints:
        lines.append(f"- Topics they have strong opinions on: {', '.join(topic_hints)}")

    lines += [
        "",
        f"TARGET AUDIENCE / NICHE: {niche}",
    ]

    if focus_topic:
        lines.append(f"FOCUS AREA: {focus_topic}")

    lines += [
        "",
        "TASK: Generate exactly 5 specific, actionable LinkedIn post ideas for this writer.",
        "Each idea must:",
        "- Be something this specific writer would actually write (match their persona and hook style)",
        "- Be specific enough that the writer knows exactly what angle to take",
        "- Resonate with the stated target niche",
        "- Include a concrete hook line that reflects their dominant hook style",
        "",
        "Vary content types across the 5 ideas: Story, Insight, List, How-to, Contrarian, Observation",
        "",
        'Return ONLY valid JSON in this exact format (no markdown, no explanation):',
        '{"ideas": [{"title": "...", "hook": "...", "content_type": "...", "rationale": "..."}, ...]}',
        "",
        "Field rules:",
        "- title: 5-12 words, specific angle (not generic)",
        "- hook: The actual first sentence they would write (15-35 words, matches their hook style)",
        "- content_type: exactly one of: Story, Insight, List, How-to, Contrarian, Observation",
        "- rationale: 1 sentence (max 20 words) explaining why this fits their voice",
        "",
        "NEVER generate vague or generic ideas. Be specific. Be concrete.",
    ]

    return "\n".join(lines)


def _infer_niche(profile: VoiceProfile) -> str:
    epistemic = profile.epistemic_style or {}
    persona_key = epistemic.get("persona", "practitioner") if isinstance(epistemic, dict) else "practitioner"
    audience = _PERSONA_AUDIENCES.get(persona_key, "professionals")

    belief_stances = profile.belief_stances or {}
    positions = (belief_stances.get("positions") or [])[:2] if isinstance(belief_stances, dict) else []
    topics = [p.get("topic", "") for p in positions if p.get("topic")]

    if topics:
        return f"{audience} interested in {', '.join(topics)}"
    return audience


async def generate_recommended_ideas(
    profile: VoiceProfile,
    user_id: str,
) -> list[IdeaItem]:
    cached = _recommended_cache.get(user_id)
    if cached:
        ideas, ts = cached
        if time.time() - ts < _CACHE_TTL:
            return ideas

    niche = _infer_niche(profile)
    system = _build_system_prompt(profile, niche, focus_topic=None)

    response = await llm_call(
        task="generation",
        messages=[{"role": "user", "content": f"Generate 3 LinkedIn post ideas for this writer. Target audience: {niche}"}],
        system=system,
        max_tokens=900,
        json_mode=True,
    )

    try:
        raw = json.loads(response.content)
        ideas_data = raw.get("ideas", [])
        ideas = [
            IdeaItem(
                title=item.get("title", ""),
                hook=item.get("hook", ""),
                content_type=item.get("content_type", "Insight"),
                rationale=item.get("rationale", ""),
            )
            for item in ideas_data[:3]
            if item.get("title") and item.get("hook")
        ]
        _recommended_cache[user_id] = (ideas, time.time())
        return ideas
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error("Failed to parse recommended ideas for user %s: %s", user_id, e)
        return []


async def generate_ideas(
    profile: VoiceProfile,
    niche: str,
    focus_topic: str | None,
    count: int = 5,
) -> tuple[list[IdeaItem], LLMResponse]:
    system = _build_system_prompt(profile, niche, focus_topic)

    user_msg = f"Generate {count} LinkedIn post ideas for this writer targeting: {niche}"
    if focus_topic:
        user_msg += f"\nFocus specifically on: {focus_topic}"

    response = await llm_call(
        task="generation",
        messages=[{"role": "user", "content": user_msg}],
        system=system,
        max_tokens=1500,
        json_mode=True,
    )

    try:
        raw = json.loads(response.content)
        ideas_data = raw.get("ideas", [])
        ideas = [
            IdeaItem(
                title=item.get("title", ""),
                hook=item.get("hook", ""),
                content_type=item.get("content_type", "Insight"),
                rationale=item.get("rationale", ""),
            )
            for item in ideas_data[:count]
            if item.get("title") and item.get("hook")
        ]
        return ideas, response
    except (json.JSONDecodeError, KeyError, TypeError) as e:
        logger.error("Failed to parse idea generator response: %s", e)
        raise ValueError("Failed to parse ideas from LLM response") from e

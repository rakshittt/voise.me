"""Generate 15-20 grounded idea candidates from the user's idea context.

Candidates are grounded in:
  - Topics the user is credible on (expertise_topics from context)
  - Gaps in their recent coverage (coverage_map.last_30_days == 0)
  - Formats their audience has responded to (resonance_signals)
  - Their dominant hook style and epistemic persona
"""
import json
import logging

from models.voice_profile import VoiceProfile
from services.ideas.context_builder import IdeaContext
from services.llm.router import llm_call, parse_json_response

logger = logging.getLogger(__name__)

_CANDIDATE_COUNT = 15


class RawCandidate:
    __slots__ = ("title", "hook", "content_type", "topic_anchor", "has_specific")

    def __init__(
        self,
        title: str,
        hook: str,
        content_type: str,
        topic_anchor: str,
        has_specific: bool,
    ) -> None:
        self.title = title
        self.hook = hook
        self.content_type = content_type
        self.topic_anchor = topic_anchor
        self.has_specific = has_specific


async def generate_candidates(
    profile: VoiceProfile,
    context: IdeaContext,
) -> list[RawCandidate]:
    """Generate up to _CANDIDATE_COUNT grounded idea candidates."""
    prompt = _build_prompt(profile, context)

    try:
        response = await llm_call(
            task="generation",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2000,
            json_mode=True,
        )
        return _parse_candidates(response.content)
    except Exception as e:
        logger.error("Candidate generation failed: %s", e)
        return []


def _build_prompt(profile: VoiceProfile, context: IdeaContext) -> str:
    expertise = context["expertise_topics"][:10]
    coverage = context["coverage_map"]
    resonance = context["resonance_signals"]

    # Identify coverage gaps (topics not posted about in 30 days)
    gaps = [e["label"] for e in coverage if e["last_30_days"] == 0 and e["post_count"] > 0]
    # Topics with strong post history but zero recent = prime candidates
    neglected = [e["label"] for e in coverage if e["last_30_days"] == 0 and e["post_count"] >= 5]

    # Best-performing formats from resonance signals
    winning_formats = [
        s["argument_type"]
        for s in resonance
        if s["accepted_count"] > s["rejected_count"]
    ][:3]

    # Voice persona
    epistemic = profile.epistemic_style or {}
    persona = epistemic.get("persona", "practitioner") if isinstance(epistemic, dict) else "practitioner"

    # Dominant hook style
    hook_dist = profile.hook_distribution or {}
    dominant_hook = max(hook_dist, key=hook_dist.get) if hook_dist else "bold_statement"

    # Belief positions for authenticity anchoring
    stances = profile.belief_stances or {}
    positions = stances.get("positions", []) if isinstance(stances, dict) else []
    belief_lines = [
        f"  - {p.get('topic', '')}: {p.get('stance', '')} stance"
        for p in positions[:4]
        if p.get("topic") and p.get("stance")
    ]

    lines = [
        "You are generating LinkedIn post idea candidates for a specific creator.",
        "",
        "CREATOR PROFILE:",
        f"- Writing persona: {persona}",
        f"- Dominant hook style: {dominant_hook}",
    ]

    if belief_lines:
        lines.append("- Strong opinions on:")
        lines.extend(belief_lines)

    lines += [
        "",
        "EXPERTISE TOPICS (these are what the creator credibly knows):",
    ]
    for i, topic in enumerate(expertise, 1):
        lines.append(f"  {i}. {topic}")

    if neglected:
        lines += [
            "",
            "NEGLECTED TOPICS (strong history, but nothing posted in 30+ days - high-value gaps):",
        ]
        for t in neglected[:4]:
            lines.append(f"  - {t}")
    elif gaps:
        lines += [
            "",
            "COVERAGE GAPS (topics not posted recently - consider these):",
        ]
        for t in gaps[:4]:
            lines.append(f"  - {t}")

    if winning_formats:
        lines += [
            "",
            f"FORMATS THAT WORK FOR THIS CREATOR: {', '.join(winning_formats)}",
        ]

    lines += [
        "",
        f"TASK: Generate exactly {_CANDIDATE_COUNT} LinkedIn post idea candidates.",
        "",
        "Rules:",
        "1. Every idea MUST be grounded in one of the creator's expertise topics",
        "2. Ideas should be SPECIFIC - include a concrete angle, not a vague theme",
        "3. Vary content types: Story, Insight, List, How-to, Contrarian, Observation",
        "4. Hooks must match the creator's dominant hook style and persona",
        "5. At least 4 ideas should address neglected/gap topics if they exist",
        "6. NO generic LinkedIn advice ('10 tips for success', 'My journey', etc.)",
        "",
        "For each idea, flag has_specific=true if the hook contains: a number, a company name, a metric, a tool name, or a specific claim.",
        "",
        'Return ONLY valid JSON: {"ideas": [{"title": str, "hook": str (the actual first sentence, 15-40 words), "content_type": str, "topic_anchor": str (which expertise topic this is grounded in), "has_specific": bool}, ...]}',
    ]

    return "\n".join(lines)


def _parse_candidates(content: str) -> list[RawCandidate]:
    try:
        raw = parse_json_response(content)
        items = raw.get("ideas", [])
    except (json.JSONDecodeError, TypeError) as e:
        logger.error("Failed to parse candidate JSON: %s", e)
        return []

    candidates: list[RawCandidate] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        hook = str(item.get("hook", "")).strip()
        if not title or not hook:
            continue
        candidates.append(
            RawCandidate(
                title=title,
                hook=hook,
                content_type=str(item.get("content_type", "Insight")),
                topic_anchor=str(item.get("topic_anchor", "")),
                has_specific=bool(item.get("has_specific", False)),
            )
        )

    return candidates[:_CANDIDATE_COUNT]

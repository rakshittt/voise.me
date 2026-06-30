"""Belief consistency check - runs before a generated post is returned.

Detects if a candidate post contradicts any of the user's known stances.
"""
import logging

from services.llm.router import llm_call, parse_json_response

logger = logging.getLogger(__name__)


async def check_belief_consistency(
    candidate: str,
    belief_stances: dict | None,
) -> tuple[bool, str | None]:
    """Return (is_consistent, issue_or_None).

    Uses a fast LLM call to check if the candidate contradicts known stances.
    Returns True if consistent (no issues), False with description if a contradiction is detected.
    """
    if not belief_stances:
        return True, None

    positions = belief_stances.get("positions", [])
    if not positions:
        return True, None

    stances_summary = "\n".join(
        f"- {p.get('topic', '')}: {p.get('stance', '')} - {p.get('summary', '')}"
        for p in positions[:5]
    )

    prompt = f"""Does this LinkedIn post contradict any of the author's known positions?

KNOWN POSITIONS:
{stances_summary}

POST TO CHECK:
{candidate[:1000]}

Return ONLY valid JSON:
{{"contradicts": false, "issue": null}}
or
{{"contradicts": true, "issue": "brief description of the contradiction"}}"""

    try:
        response = await llm_call(
            task="scoring",
            messages=[{"role": "user", "content": prompt}],
            json_mode=True,
            max_tokens=100,
        )
        result = parse_json_response(response.content)
        if result.get("contradicts"):
            return False, result.get("issue", "Contradicts a known stance")
        return True, None
    except Exception as e:
        logger.warning(f"Belief consistency check failed (non-blocking): {e}")
        return True, None  # Fail open - don't block generation on this

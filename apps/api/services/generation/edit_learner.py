"""Edit-signal learning - Layer 2 of the voice DNA upgrade.

When a user edits a generated post, this service:
  1. Infers structured edit rules from the before/after diff (via LLM)
  2. Stores them on the PostEditEvent row
  3. Provides a query function to retrieve recent rules for prompt injection

The edit rules become a personalized, ever-growing instruction set that no
competitor can replicate without this user's edit history.
"""
import json
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.post_edit_event import PostEditEvent
from models.user_post import UserPost
from services.cache.client import get_redis
from services.cache.keys import edit_rules_key
from services.llm.router import llm_call
from services.voice_dna.embedder import embed_text

logger = logging.getLogger(__name__)

MAX_RULES_IN_PROMPT = 8
EDIT_RULES_TTL = 600  # 10 minutes
RECENT_EVENTS_WINDOW = 50

# Maps client rejection reason strings → temporary edit rule dicts injected into
# the regeneration prompt for this call only. Not persisted anywhere.
_REJECTION_REASON_RULES: dict[str, dict] = {
    "not_my_voice": {
        "rule": "The previous draft did not match this person's voice - study the example posts more carefully and be more faithful to their signature style",
        "category": "tone",
        "example": "",
    },
    "wrong_angle": {
        "rule": "The previous draft took the wrong angle on this topic - try a completely different entry point or framing",
        "category": "structure",
        "example": "",
    },
    "too_long": {
        "rule": "The previous draft was too long - write a shorter, more concise post (aim for 150–200 words)",
        "category": "length",
        "example": "",
    },
    "disagree": {
        "rule": "The user disagreed with the position taken - use a different stance, more neutral framing, or the opposite perspective",
        "category": "other",
        "example": "",
    },
}


def session_feedback_to_rules(reasons: list[str]) -> list[dict]:
    """Convert client rejection reason strings to temporary edit rule dicts.

    Prepend these to persisted edit rules so they take priority for this
    regeneration call. Not stored - purely in-prompt injection.
    """
    seen: set[str] = set()
    rules: list[dict] = []
    for reason in reasons:
        if reason in _REJECTION_REASON_RULES and reason not in seen:
            rules.append(_REJECTION_REASON_RULES[reason])
            seen.add(reason)
    return rules


async def infer_edit_rules(generated: str, edited: str) -> list[dict]:
    """Use LLM to infer what the user changed and distill it into reusable rules."""
    prompt = f"""A user edited an AI-generated LinkedIn post. Compare the two versions and identify the specific rules or preferences revealed by the edits.

GENERATED (before edit):
{generated[:1500]}

EDITED (after user changes):
{edited[:1500]}

Identify rules the user applied. Categories: punctuation, tone, structure, vocabulary, length, specificity, opening, closing, other.

Return ONLY valid JSON array (max 5 rules):
[
  {{
    "rule": "concise description of what to do or avoid",
    "category": "category name",
    "example": "brief example showing the change"
  }}
]

If the edits are minor or cosmetic (typo fixes, minor rephrasing), return an empty array []."""

    response = await llm_call(
        task="extraction",
        messages=[{"role": "user", "content": prompt}],
        json_mode=True,
        max_tokens=600,
    )
    try:
        result = json.loads(response.content)
        if isinstance(result, list):
            return result[:5]
        if isinstance(result, dict) and "rules" in result:
            return result["rules"][:5]
        return []
    except json.JSONDecodeError:
        logger.error(f"Edit rule parse failed: {response.content[:200]}")
        return []


async def process_edit_event(
    user_id: uuid.UUID,
    generation_id: uuid.UUID | None,
    variant_index: int,
    generated_content: str,
    edited_content: str,
    session: AsyncSession,
) -> PostEditEvent:
    """Infer rules from the edit and persist the event. Also boosts quality_weight
    of user_posts that are semantically close to the edited content."""
    rules = await infer_edit_rules(generated_content, edited_content)

    event = PostEditEvent(
        user_id=user_id,
        generation_id=generation_id,
        variant_index=variant_index,
        generated_content=generated_content,
        edited_content=edited_content,
        inferred_rules=rules,
    )
    session.add(event)
    await session.flush()

    # Insert the edited post as a high-quality training example (quality_weight=2.0)
    try:
        edited_embedding = await embed_text(edited_content)
        edited_post = UserPost(
            user_id=user_id,
            content=edited_content,
            content_embedding=edited_embedding,
            word_count=len(edited_content.split()),
            quality_weight=2.0,
        )
        session.add(edited_post)
        await session.flush()
        logger.info(f"Edited post added as training example for user {user_id}")
    except Exception as e:
        logger.warning(f"Failed to re-embed edited post for user {user_id}: {e}")

    # Invalidate cache so the next generation picks up the new rule immediately
    if redis := get_redis():
        try:
            await redis.delete(edit_rules_key(user_id))
        except Exception as e:
            logger.warning("Redis edit rules invalidation failed: %s", e)

    logger.info(f"Edit event stored for user {user_id}: {len(rules)} rules inferred")
    return event


async def get_edit_rules_for_prompt(
    user_id: uuid.UUID,
    session: AsyncSession,
) -> list[dict]:
    """Return deduplicated edit rules from recent events, ordered by recency.

    Used to inject personalized constraints into the generation prompt.
    Cached in Redis for 10 minutes; invalidated when a new edit event is stored.
    """
    redis = get_redis()
    if redis is not None:
        try:
            raw = await redis.get(edit_rules_key(user_id))
            if raw:
                return json.loads(raw)
        except Exception as e:
            logger.warning("Redis edit rules read failed: %s", e)

    result = await session.execute(
        select(PostEditEvent.inferred_rules)
        .where(
            PostEditEvent.user_id == user_id,
            PostEditEvent.inferred_rules.is_not(None),
        )
        .order_by(PostEditEvent.created_at.desc())
        .limit(RECENT_EVENTS_WINDOW)
    )
    rows = result.scalars().all()

    # Flatten and deduplicate by rule text (keep most recent occurrence)
    seen: set[str] = set()
    deduped: list[dict] = []
    for rules_list in rows:
        if not rules_list:
            continue
        for rule in rules_list:
            key = rule.get("rule", "").lower().strip()
            if key and key not in seen:
                seen.add(key)
                deduped.append(rule)
            if len(deduped) >= MAX_RULES_IN_PROMPT:
                break
        if len(deduped) >= MAX_RULES_IN_PROMPT:
            break

    if redis is not None:
        try:
            await redis.setex(edit_rules_key(user_id), EDIT_RULES_TTL, json.dumps(deduped))
        except Exception as e:
            logger.warning("Redis edit rules write failed: %s", e)

    return deduped

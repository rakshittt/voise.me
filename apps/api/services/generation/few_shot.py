"""Hierarchical few-shot retrieval - Layer 3 of the voice DNA upgrade.

Three-stage strategy:
  Stage 1: Find the topic cluster of the nearest post to the input (existing).
  Stage 2: Within that cluster, prefer posts with the same argument type as the
           input idea (new). This ensures examples are structurally relevant.
  Stage 3: Rank by quality_weight * cosine_similarity - edit-approved posts
           surface above unreviewed ones (new).
  Fallback: Global cosine similarity if cluster/argument-type results are thin.
"""
import asyncio
import uuid

from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user_post import UserPost
from services.voice_dna.deep_extractor import classify_argument_types


async def _detect_input_argument_type(idea_text: str) -> str:
    """Classify the generation input so we can match structurally similar examples."""
    types = await classify_argument_types([idea_text])
    return types[0] if types else "problem_insight_proof"


async def _no_arg_type() -> str | None:
    return None


async def get_similar_posts(
    user_id: uuid.UUID,
    input_embedding: list[float],
    limit: int = 3,
    session: AsyncSession = None,
    input_text: str | None = None,
) -> tuple[list[str], list[str]]:
    """Return top-`limit` user posts using 3-stage hierarchical retrieval.

    Returns (contents, post_id_strings).
    quality_weight boosting: posts the user has previously edited (weight=2.0)
    rank above unreviewed posts (weight=1.0) at equivalent cosine distance.
    """
    if not input_embedding:
        return [], []

    # Stage 1 (DB) and Stage 2 (LLM classification) are independent - run together.
    nearest_coro = session.execute(
        select(UserPost.cluster_id)
        .where(UserPost.user_id == user_id, UserPost.cluster_id.is_not(None))
        .order_by(UserPost.content_embedding.op("<=>")(input_embedding))
        .limit(1)
    )
    arg_type_coro = _detect_input_argument_type(input_text) if input_text else _no_arg_type()
    nearest_result, input_arg_type = await asyncio.gather(nearest_coro, arg_type_coro)
    nearest_cluster = nearest_result.scalar_one_or_none()

    # Stage 2+3 collapsed into one ordered query: argument-type matches sort
    # first (quality weight, then cosine distance within each group), so a
    # single LIMIT gives the same result as "matches, topped up with
    # non-matches" without a second round trip.
    if nearest_cluster is not None:
        base_query = (
            select(UserPost.id, UserPost.content)
            .where(UserPost.user_id == user_id, UserPost.cluster_id == nearest_cluster)
        )

        order_by = []
        if input_arg_type:
            order_by.append(case((UserPost.argument_type == input_arg_type, 0), else_=1))
        order_by += [
            (UserPost.quality_weight * -1),
            UserPost.content_embedding.op("<=>")(input_embedding),
        ]

        cluster_result = await session.execute(base_query.order_by(*order_by).limit(limit))
        cluster_posts: list[tuple[str, str]] = [
            (str(row[0]), row[1]) for row in cluster_result.fetchall()
        ]
        if len(cluster_posts) >= limit:
            return [c for _, c in cluster_posts], [i for i, _ in cluster_posts]

    # Fallback: global quality-weighted similarity
    result = await session.execute(
        select(UserPost.id, UserPost.content)
        .where(UserPost.user_id == user_id)
        .order_by(
            (UserPost.quality_weight * -1),
            UserPost.content_embedding.op("<=>")(input_embedding),
        )
        .limit(limit)
    )
    global_posts: list[tuple[str, str]] = [
        (str(row[0]), row[1]) for row in result.fetchall()
    ]
    return [c for _, c in global_posts], [i for i, _ in global_posts]

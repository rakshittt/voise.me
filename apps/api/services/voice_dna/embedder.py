import logging
import uuid

import openai
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import AsyncSessionLocal
from models.user_post import UserPost

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIM = 1536
BATCH_SIZE = 20


async def _embed_batch(texts: list[str]) -> list[list[float]]:
    client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.embeddings.create(model=EMBEDDING_MODEL, input=texts)
    return [item.embedding for item in sorted(response.data, key=lambda x: x.index)]


async def embed_and_store_posts(
    user_id: uuid.UUID,
    posts: list[str],
    session: AsyncSession | None = None,
) -> tuple[list[list[float]], list[UserPost]]:
    """Embed all posts in batches, store in user_posts.

    Returns (embeddings, post_objects) in the same order as the input posts
    so callers can assign cluster_ids directly to the ORM objects.
    When called as a background task (no session passed), opens its own session.
    """
    if session is None:
        async with AsyncSessionLocal() as owned_session:
            result = await _embed_and_store(user_id, posts, owned_session)
            await owned_session.commit()
            return result
    return await _embed_and_store(user_id, posts, session)


async def _embed_and_store(
    user_id: uuid.UUID,
    posts: list[str],
    session: AsyncSession,
) -> tuple[list[list[float]], list[UserPost]]:
    all_embeddings: list[list[float]] = []
    all_post_objects: list[UserPost] = []

    for i in range(0, len(posts), BATCH_SIZE):
        batch = posts[i : i + BATCH_SIZE]
        embeddings = await _embed_batch(batch)
        for text, embedding in zip(batch, embeddings, strict=True):
            word_count = len(text.split())
            post = UserPost(
                user_id=user_id,
                content=text,
                content_embedding=embedding,
                word_count=word_count,
            )
            session.add(post)
            all_post_objects.append(post)
        all_embeddings.extend(embeddings)
        logger.info(f"Embedded batch {i // BATCH_SIZE + 1} ({len(batch)} posts)")

    await session.flush()
    return all_embeddings, all_post_objects


def compute_mean_embedding(embeddings: list[list[float]]) -> list[float]:
    """Compute element-wise mean of a list of embedding vectors."""
    if not embeddings:
        return [0.0] * EMBEDDING_DIM
    dim = len(embeddings[0])
    n = len(embeddings)
    mean = [sum(embeddings[j][i] for j in range(n)) / n for i in range(dim)]
    return mean


async def embed_text(text: str) -> list[float]:
    """Embed a single text string. Used for generation input and few-shot retrieval."""
    results = await _embed_batch([text])
    return results[0]

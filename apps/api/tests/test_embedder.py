import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.voice_dna.embedder import EMBEDDING_DIM, compute_mean_embedding, embed_and_store_posts


def _fake_embeddings(n: int) -> list[list[float]]:
    return [[float(i)] * EMBEDDING_DIM for i in range(n)]


@pytest.mark.asyncio
async def test_embed_and_store_50_posts():
    posts = ["word " * 40 for _ in range(50)]

    async def fake_embed_batch(texts):
        return [[0.1] * EMBEDDING_DIM for _ in texts]

    mock_session = MagicMock()
    mock_session.add = MagicMock()
    mock_session.flush = AsyncMock()

    with patch("services.voice_dna.embedder._embed_batch", new=AsyncMock(return_value=[[0.1] * EMBEDDING_DIM for _ in range(20)])):
        # For 50 posts in batches of 20: 3 calls (20+20+10)
        call_count = 0
        async def counted_embed(texts):
            nonlocal call_count
            call_count += 1
            return [[float(call_count)] * EMBEDDING_DIM for _ in texts]

        with patch("services.voice_dna.embedder._embed_batch", new=counted_embed):
            embeddings, post_objects = await embed_and_store_posts(uuid.uuid4(), posts, mock_session)

    assert len(embeddings) == 50
    assert len(post_objects) == 50
    assert mock_session.add.call_count == 50
    mock_session.flush.assert_called_once()


def test_compute_mean_embedding():
    embs = [
        [1.0, 2.0, 3.0],
        [3.0, 4.0, 5.0],
    ]
    mean = compute_mean_embedding(embs)
    assert mean == [2.0, 3.0, 4.0]


def test_compute_mean_empty():
    result = compute_mean_embedding([])
    assert len(result) == EMBEDDING_DIM
    assert all(v == 0.0 for v in result)

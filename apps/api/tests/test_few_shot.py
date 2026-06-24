import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from services.generation.few_shot import get_similar_posts

_ID_A = str(uuid.uuid4())
_ID_B = str(uuid.uuid4())
_ID_C = str(uuid.uuid4())


def _cluster_result(cluster_id):
    """Mock execute result for the cluster-lookup query."""
    r = MagicMock()
    r.scalar_one_or_none.return_value = cluster_id
    return r


def _posts_result(posts: list[tuple[str, str]]):
    """Mock execute result for a posts query.

    Each element is (id_str, content). Pass uuid strings for id_str.
    """
    r = MagicMock()
    r.fetchall.return_value = [(uuid.UUID(p[0]), p[1]) for p in posts]
    return r


@pytest.mark.asyncio
async def test_returns_same_cluster_posts_when_cluster_has_enough():
    user_id = uuid.uuid4()
    fake_embedding = [0.1] * 1536

    mock_session = MagicMock()
    # Call 1: cluster lookup → cluster 0
    # Call 2: same-cluster posts → 3 posts
    mock_session.execute = AsyncMock(
        side_effect=[
            _cluster_result(0),
            _posts_result([(_ID_A, "Post A"), (_ID_B, "Post B"), (_ID_C, "Post C")]),
        ]
    )

    contents, ids = await get_similar_posts(user_id, fake_embedding, limit=3, session=mock_session)
    assert contents == ["Post A", "Post B", "Post C"]
    assert ids == [_ID_A, _ID_B, _ID_C]
    assert mock_session.execute.call_count == 2


@pytest.mark.asyncio
async def test_falls_back_to_global_when_cluster_insufficient():
    user_id = uuid.uuid4()
    fake_embedding = [0.1] * 1536

    mock_session = MagicMock()
    # Call 1: cluster lookup → cluster 0
    # Call 2: same-cluster posts → only 1 (not enough)
    # Call 3: global fallback → 3 posts
    mock_session.execute = AsyncMock(
        side_effect=[
            _cluster_result(0),
            _posts_result([(_ID_A, "Post A")]),
            _posts_result([(_ID_A, "Post A"), (_ID_B, "Post B"), (_ID_C, "Post C")]),
        ]
    )

    contents, ids = await get_similar_posts(user_id, fake_embedding, limit=3, session=mock_session)
    assert contents == ["Post A", "Post B", "Post C"]
    assert ids == [_ID_A, _ID_B, _ID_C]
    assert mock_session.execute.call_count == 3


@pytest.mark.asyncio
async def test_falls_back_to_global_when_no_cluster_ids():
    """Posts with no cluster_id assigned (profile built before clustering) use global lookup."""
    user_id = uuid.uuid4()
    fake_embedding = [0.1] * 1536

    mock_session = MagicMock()
    # Call 1: cluster lookup → None (no cluster assigned)
    # Call 2: global fallback
    mock_session.execute = AsyncMock(
        side_effect=[
            _cluster_result(None),
            _posts_result([(_ID_A, "Post A"), (_ID_B, "Post B"), (_ID_C, "Post C")]),
        ]
    )

    contents, ids = await get_similar_posts(user_id, fake_embedding, limit=3, session=mock_session)
    assert contents == ["Post A", "Post B", "Post C"]
    assert ids == [_ID_A, _ID_B, _ID_C]
    assert mock_session.execute.call_count == 2


@pytest.mark.asyncio
async def test_empty_embedding_returns_empty():
    user_id = uuid.uuid4()
    mock_session = MagicMock()
    contents, ids = await get_similar_posts(user_id, [], session=mock_session)
    assert contents == []
    assert ids == []
    mock_session.execute.assert_not_called()


@pytest.mark.asyncio
async def test_empty_corpus_returns_empty_list():
    user_id = uuid.uuid4()
    fake_embedding = [0.1] * 1536

    mock_session = MagicMock()
    mock_session.execute = AsyncMock(
        side_effect=[
            _cluster_result(None),
            _posts_result([]),
        ]
    )

    contents, ids = await get_similar_posts(user_id, fake_embedding, session=mock_session)
    assert contents == []
    assert ids == []

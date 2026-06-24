import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from db.session import get_session


@pytest.mark.asyncio
async def test_session_opens_and_closes():
    gen = get_session()
    session = await gen.__anext__()
    assert isinstance(session, AsyncSession)
    result = await session.execute(text("SELECT 1 AS one"))
    row = result.fetchone()
    assert row[0] == 1
    # Close cleanly
    try:
        await gen.aclose()
    except StopAsyncIteration:
        pass

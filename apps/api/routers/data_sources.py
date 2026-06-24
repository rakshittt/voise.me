import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.data_source import DataSource
from models.user import User
from schemas.voice_profile import DataSourceResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/data-sources", tags=["data-sources"])

DB = Annotated[AsyncSession, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=list[DataSourceResponse])
async def list_data_sources(user: CurrentUser, session: DB) -> list[DataSourceResponse]:
    result = await session.execute(
        select(DataSource)
        .where(DataSource.user_id == user.id)
        .order_by(DataSource.added_at.desc())
    )
    return list(result.scalars().all())

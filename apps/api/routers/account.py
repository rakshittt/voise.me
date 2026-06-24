import logging
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db.session import get_session
from models.data_source import DataSource
from models.generation import Generation
from models.usage import Usage
from models.user import User
from models.voice_profile import VoiceProfile
from schemas.account import CreatorContext, CreatorContextResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/account", tags=["account"])


@router.delete("")
async def delete_account(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict[str, str]:
    user_id = current_user.id

    await session.execute(delete(DataSource).where(DataSource.user_id == user_id))
    await session.execute(delete(Usage).where(Usage.user_id == user_id))
    await session.execute(delete(Generation).where(Generation.user_id == user_id))
    await session.execute(delete(VoiceProfile).where(VoiceProfile.user_id == user_id))
    await session.execute(delete(User).where(User.id == user_id))
    await session.commit()

    logger.info("Account deleted for user %s", user_id)
    return {"status": "deleted"}


@router.get("/context", response_model=CreatorContextResponse)
async def get_creator_context(
    current_user: Annotated[User, Depends(get_current_user)],
) -> CreatorContextResponse:
    raw = current_user.creator_context or {}
    return CreatorContextResponse(creator_context=CreatorContext(**{k: raw.get(k, "") for k in CreatorContext.model_fields}))


@router.put("/context", response_model=CreatorContextResponse)
async def update_creator_context(
    payload: CreatorContext,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CreatorContextResponse:
    current_user.creator_context = payload.model_dump()
    await session.commit()
    logger.info("Creator context updated for user %s", current_user.id)
    return CreatorContextResponse(creator_context=payload)

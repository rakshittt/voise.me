import logging
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from models.usage import Usage

logger = logging.getLogger(__name__)


async def log_usage(
    user_id: uuid.UUID,
    action: str,
    session: AsyncSession,
    model_used: str | None = None,
    tokens_input: int = 0,
    tokens_output: int = 0,
) -> None:
    cost = settings.calculate_cost(model_used or "", tokens_input, tokens_output)
    row = Usage(
        user_id=user_id,
        action=action,
        model_used=model_used,
        tokens_input=tokens_input,
        tokens_output=tokens_output,
        cost_usd=Decimal(str(round(cost, 6))),
    )
    session.add(row)
    logger.debug(f"usage logged: user={user_id} action={action} model={model_used} cost=${cost:.6f}")

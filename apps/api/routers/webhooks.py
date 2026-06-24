import logging
from typing import Annotated

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import get_session
from models.processed_webhook import ProcessedWebhook
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

PLAN_MAP: dict[str, str] = {
    settings.STRIPE_PRICE_GROWTH: "growth",
    settings.STRIPE_PRICE_PRO: "pro",
    settings.STRIPE_PRICE_BETA: "beta",
}


async def _mark_processed(event_id: str, session: AsyncSession) -> None:
    session.add(ProcessedWebhook(stripe_event_id=event_id))
    await session.flush()


async def _is_processed(event_id: str, session: AsyncSession) -> bool:
    result = await session.execute(
        select(ProcessedWebhook).where(ProcessedWebhook.stripe_event_id == event_id)
    )
    return result.scalar_one_or_none() is not None


async def _get_user_by_customer(customer_id: str, session: AsyncSession) -> User | None:
    result = await session.execute(
        select(User).where(User.stripe_customer_id == customer_id)
    )
    return result.scalar_one_or_none()


async def _get_user_by_id(user_id: str, session: AsyncSession) -> User | None:
    from uuid import UUID
    try:
        uid = UUID(user_id)
    except ValueError:
        return None
    result = await session.execute(select(User).where(User.id == uid))
    return result.scalar_one_or_none()


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    session: Annotated[AsyncSession, Depends(get_session)],
) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Webhooks not configured.")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid signature.") from e

    if await _is_processed(event["id"], session):
        return {"status": "already_processed"}

    event_type: str = event["type"]
    logger.info(f"Stripe webhook: {event_type} ({event['id']})")

    if event_type == "checkout.session.completed":
        await _handle_checkout_completed(event["data"]["object"], session)

    elif event_type == "customer.subscription.updated":
        await _handle_subscription_updated(event["data"]["object"], session)

    elif event_type == "customer.subscription.deleted":
        await _handle_subscription_deleted(event["data"]["object"], session)

    elif event_type == "invoice.payment_failed":
        await _handle_payment_failed(event["data"]["object"], session)

    else:
        logger.debug(f"Unhandled Stripe event: {event_type}")

    await _mark_processed(event["id"], session)
    await session.commit()
    return {"status": "ok"}


async def _handle_checkout_completed(obj: dict, session: AsyncSession) -> None:
    customer_id = obj.get("customer")
    user_id = obj.get("client_reference_id") or (obj.get("metadata") or {}).get("user_id")
    plan = (obj.get("metadata") or {}).get("plan", "growth")

    user = None
    if user_id:
        user = await _get_user_by_id(user_id, session)
    if user is None and customer_id:
        user = await _get_user_by_customer(customer_id, session)

    if user is None:
        logger.warning(f"checkout.session.completed: no user found for customer={customer_id}")
        return

    user.stripe_customer_id = customer_id
    user.stripe_subscription_id = obj.get("subscription")
    user.plan = plan
    user.trial_ends_at = None  # Trial ends on payment
    logger.info(f"User {user.id} upgraded to plan={plan}")


async def _handle_subscription_updated(obj: dict, session: AsyncSession) -> None:
    customer_id = obj.get("customer")
    user = await _get_user_by_customer(customer_id, session)
    if user is None:
        logger.warning(f"subscription.updated: no user for customer={customer_id}")
        return

    # Determine new plan from price ID
    items = (obj.get("items") or {}).get("data", [])
    price_id = items[0].get("price", {}).get("id", "") if items else ""
    new_plan = PLAN_MAP.get(price_id, user.plan)

    sub_status = obj.get("status", "")
    if sub_status in ("active", "trialing"):
        user.plan = new_plan
    elif sub_status in ("past_due", "unpaid"):
        logger.warning(f"Subscription {obj.get('id')} is {sub_status} for user {user.id}")

    user.stripe_subscription_id = obj.get("id")
    logger.info(f"User {user.id} subscription updated to plan={user.plan} status={sub_status}")


async def _handle_subscription_deleted(obj: dict, session: AsyncSession) -> None:
    customer_id = obj.get("customer")
    user = await _get_user_by_customer(customer_id, session)
    if user is None:
        return
    user.plan = "starter"
    user.stripe_subscription_id = None
    logger.info(f"User {user.id} subscription cancelled - downgraded to starter")


async def _handle_payment_failed(obj: dict, session: AsyncSession) -> None:
    customer_id = obj.get("customer")
    user = await _get_user_by_customer(customer_id, session)
    if user is None:
        return
    logger.warning(f"Payment failed for user {user.id}, customer={customer_id}")
    # Flag the account for follow-up; don't downgrade immediately (Stripe retries)

import logging
from typing import Annotated

import stripe
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from config import settings
from db.session import get_session
from models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/billing", tags=["billing"])

PLAN_TO_PRICE: dict[str, str] = {
    "growth": settings.STRIPE_PRICE_GROWTH,
    "pro": settings.STRIPE_PRICE_PRO,
    "beta": settings.STRIPE_PRICE_BETA,
}


class CheckoutRequest(BaseModel):
    plan: str  # "growth" | "pro" | "beta"


class CheckoutResponse(BaseModel):
    url: str


class PortalResponse(BaseModel):
    url: str


def _stripe_client() -> stripe.StripeClient:
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Billing is not configured.",
        )
    return stripe.StripeClient(settings.STRIPE_SECRET_KEY)


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout_session(
    request: CheckoutRequest,
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> CheckoutResponse:
    plan = request.plan.lower()
    price_id = PLAN_TO_PRICE.get(plan, "")
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown plan '{plan}' or price not configured.",
        )

    client = _stripe_client()

    try:
        params: dict = {
            "payment_method_types": ["card"],
            "mode": "subscription",
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": f"{settings.APP_URL}/dashboard?upgraded=true",
            "cancel_url": f"{settings.APP_URL}/dashboard/settings",
            "client_reference_id": str(user.id),
            "metadata": {"user_id": str(user.id), "plan": plan},
        }

        # Attach existing Stripe customer if we have one
        if user.stripe_customer_id:
            params["customer"] = user.stripe_customer_id
        else:
            params["customer_email"] = user.email

        checkout = client.checkout.sessions.create(params)
        return CheckoutResponse(url=checkout.url)

    except stripe.StripeError as e:
        logger.error(f"Stripe checkout error for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not create checkout session. Please try again.",
        ) from e


@router.post("/portal", response_model=PortalResponse)
async def create_portal_session(
    user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> PortalResponse:
    if not user.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing account found. Subscribe first.",
        )

    client = _stripe_client()

    try:
        portal = client.billing_portal.sessions.create(
            {
                "customer": user.stripe_customer_id,
                "return_url": f"{settings.APP_URL}/dashboard/settings",
            }
        )
        return PortalResponse(url=portal.url)

    except stripe.StripeError as e:
        logger.error(f"Stripe portal error for user {user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not open billing portal. Please try again.",
        ) from e

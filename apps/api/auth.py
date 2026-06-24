import logging
from datetime import UTC, datetime, timedelta
from typing import Annotated

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import get_session
from models.user import User

logger = logging.getLogger(__name__)

security = HTTPBearer()

_jwks_cache: dict | None = None


async def _get_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = settings.CLERK_JWKS_URL
    if not jwks_url:
        raise HTTPException(status_code=500, detail="CLERK_JWKS_URL not configured")

    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


async def _verify_clerk_token(token: str) -> dict:
    try:
        jwks = await _get_jwks()
        claims = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        return claims
    except JWTError as e:
        logger.warning(f"JWT verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e


async def _fetch_clerk_user(clerk_user_id: str) -> tuple[str | None, str | None]:
    """Fetch email and name directly from the Clerk API using the secret key."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://api.clerk.com/v1/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
            )
            if resp.status_code != 200:
                logger.warning(f"Clerk API returned {resp.status_code} for user {clerk_user_id}")
                return None, None

            data = resp.json()
            # Primary email address
            email: str | None = None
            for ea in data.get("email_addresses", []):
                if ea.get("id") == data.get("primary_email_address_id"):
                    email = ea.get("email_address") or None
                    break
            if not email:
                # Fallback: first email in the list
                addrs = data.get("email_addresses", [])
                email = addrs[0].get("email_address") if addrs else None

            first = (data.get("first_name") or "").strip()
            last = (data.get("last_name") or "").strip()
            name: str | None = f"{first} {last}".strip() or None

            return email, name
    except Exception as e:
        logger.warning(f"Failed to fetch Clerk user profile for {clerk_user_id}: {e}")
        return None, None


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    claims = await _verify_clerk_token(credentials.credentials)

    clerk_user_id: str = claims.get("sub", "")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject claim")

    result = await session.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()

    if user is None:
        # JWT never contains email/name by default - fetch from Clerk API
        email, name = await _fetch_clerk_user(clerk_user_id)
        trial_ends = datetime.now(UTC) + timedelta(days=settings.TRIAL_DAYS)
        user = User(
            clerk_user_id=clerk_user_id,
            email=email,
            name=name,
            trial_ends_at=trial_ends,
        )
        session.add(user)
        try:
            await session.flush()
            logger.info(f"Created new user {user.id} ({email}) for clerk_id {clerk_user_id}, trial until {trial_ends.date()}")
        except IntegrityError:
            await session.rollback()
            result = await session.execute(select(User).where(User.clerk_user_id == clerk_user_id))
            user = result.scalar_one_or_none()
            if user is None:
                raise HTTPException(status_code=500, detail="User creation conflict, please retry") from None
    else:
        # Backfill missing email/name on next login - silent, best-effort
        if not user.email or not user.name:
            email, name = await _fetch_clerk_user(clerk_user_id)
            if email and not user.email:
                user.email = email
            if name and not user.name:
                user.name = name

    return user


async def get_admin_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

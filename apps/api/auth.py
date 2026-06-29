import base64
import json
import logging
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

import httpx
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from config import settings
from db.session import get_session
from models.user import User
from services.cache.client import get_redis
from services.cache.keys import jwks_key, user_key

logger = logging.getLogger(__name__)

security = HTTPBearer()

JWKS_TTL = 3600       # 1 hour - Clerk rotates keys rarely
USER_CACHE_TTL = 300  # 5 minutes - short enough to pick up plan changes quickly


# ── JWKS ────────────────────────────────────────────────────────────────────

async def _get_jwks() -> dict:
    redis = get_redis()
    if redis is not None:
        try:
            cached = await redis.get(jwks_key())
            if cached:
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis JWKS read failed: %s", e)

    if not settings.CLERK_JWKS_URL:
        raise HTTPException(status_code=500, detail="CLERK_JWKS_URL not configured")

    async with httpx.AsyncClient() as client:
        response = await client.get(settings.CLERK_JWKS_URL)
        response.raise_for_status()
        jwks = response.json()

    if redis is not None:
        try:
            await redis.setex(jwks_key(), JWKS_TTL, json.dumps(jwks))
        except Exception as e:
            logger.warning("Redis JWKS write failed: %s", e)

    return jwks


def _jwk_to_pem(jwk_key: dict) -> str:
    """Convert a JWK RSA public key to PEM using cryptography directly.
    python-jose's internal JWK->PEM path produces MalformedFraming on newer cryptography builds."""
    def _b64url_to_int(s: str) -> int:
        padding = 4 - len(s) % 4
        if padding != 4:
            s += "=" * padding
        return int.from_bytes(base64.urlsafe_b64decode(s), "big")

    n = _b64url_to_int(jwk_key["n"])
    e = _b64url_to_int(jwk_key["e"])
    pub = RSAPublicNumbers(e, n).public_key(default_backend())
    return pub.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo).decode()


async def _verify_clerk_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        jwks = await _get_jwks()
        matching_key = next(
            (k for k in jwks.get("keys", []) if k.get("kid") == kid),
            None,
        )
        if not matching_key:
            raise JWTError(f"No JWKS key found for kid={kid!r}")

        pem = _jwk_to_pem(matching_key)
        claims = jwt.decode(
            token,
            pem,
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


# ── Clerk user profile fetch ─────────────────────────────────────────────────

async def _fetch_clerk_user(clerk_user_id: str) -> tuple[str | None, str | None]:
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
            email: str | None = None
            for ea in data.get("email_addresses", []):
                if ea.get("id") == data.get("primary_email_address_id"):
                    email = ea.get("email_address") or None
                    break
            if not email:
                addrs = data.get("email_addresses", [])
                email = addrs[0].get("email_address") if addrs else None

            first = (data.get("first_name") or "").strip()
            last = (data.get("last_name") or "").strip()
            name: str | None = f"{first} {last}".strip() or None

            return email, name
    except Exception as e:
        logger.warning(f"Failed to fetch Clerk user profile for {clerk_user_id}: {e}")
        return None, None


# ── User cache helpers ───────────────────────────────────────────────────────

def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "clerk_user_id": user.clerk_user_id,
        "email": user.email,
        "name": user.name,
        "plan": user.plan,
        "is_admin": user.is_admin,
        "trial_ends_at": user.trial_ends_at.isoformat() if user.trial_ends_at else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "creator_context": user.creator_context,
    }


def _dict_to_user(data: dict) -> User:
    user = User()
    user.id = uuid.UUID(data["id"])
    user.clerk_user_id = data["clerk_user_id"]
    user.email = data.get("email")
    user.name = data.get("name")
    user.plan = data.get("plan")
    user.is_admin = data.get("is_admin", False)
    trial = data.get("trial_ends_at")
    user.trial_ends_at = datetime.fromisoformat(trial) if trial else None
    created = data.get("created_at")
    user.created_at = datetime.fromisoformat(created) if created else None
    user.creator_context = data.get("creator_context")
    return user


async def _cache_user(user: User) -> None:
    redis = get_redis()
    if redis is None:
        return
    try:
        await redis.setex(user_key(user.clerk_user_id), USER_CACHE_TTL, json.dumps(_user_to_dict(user)))
    except Exception as e:
        logger.warning("Redis user write failed: %s", e)


async def invalidate_user_cache(clerk_user_id: str) -> None:
    """Call this whenever user data that affects auth/billing is mutated."""
    redis = get_redis()
    if redis is None:
        return
    try:
        await redis.delete(user_key(clerk_user_id))
    except Exception as e:
        logger.warning("Redis user invalidation failed: %s", e)


# ── Main auth dependency ─────────────────────────────────────────────────────

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    claims = await _verify_clerk_token(credentials.credentials)

    clerk_user_id: str = claims.get("sub", "")
    if not clerk_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing subject claim")

    # ── Redis fast path ──────────────────────────────────────────────────────
    redis = get_redis()
    if redis is not None:
        try:
            cached = await redis.get(user_key(clerk_user_id))
            if cached:
                hydrated = _dict_to_user(json.loads(cached))
                # merge() re-attaches the object to this session so writes work
                return await session.merge(hydrated)
        except Exception as e:
            logger.warning("Redis user read failed, falling back to DB: %s", e)

    # ── DB load ──────────────────────────────────────────────────────────────
    result = await session.execute(select(User).where(User.clerk_user_id == clerk_user_id))
    user = result.scalar_one_or_none()

    if user is None:
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
        if not user.email or not user.name:
            email, name = await _fetch_clerk_user(clerk_user_id)
            if email and not user.email:
                user.email = email
            if name and not user.name:
                user.name = name

    await _cache_user(user)
    return user


async def get_admin_user(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user

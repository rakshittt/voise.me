"""
Backfill email and name for existing users where these are NULL.
Calls the Clerk API for each user.

Usage:
    cd apps/api
    uv run python scripts/backfill_user_profiles.py
"""

import asyncio
import sys

sys.path.insert(0, ".")

import httpx
from sqlalchemy import select

from config import settings
from db.session import AsyncSessionLocal
from models.user import User


async def fetch_clerk_user(client: httpx.AsyncClient, clerk_user_id: str) -> tuple[str | None, str | None]:
    resp = await client.get(
        f"https://api.clerk.com/v1/users/{clerk_user_id}",
        headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
    )
    if resp.status_code != 200:
        print(f"  WARN: Clerk returned {resp.status_code} for {clerk_user_id}")
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


async def main() -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where((User.email.is_(None)) | (User.name.is_(None)))
        )
        users = result.scalars().all()

        if not users:
            print("No users with missing email/name. Nothing to do.")
            return

        print(f"Found {len(users)} user(s) with missing email or name. Backfilling from Clerk...\n")

        async with httpx.AsyncClient(timeout=10.0) as client:
            for user in users:
                email, name = await fetch_clerk_user(client, user.clerk_user_id)
                updated = []
                if email and not user.email:
                    user.email = email
                    updated.append(f"email={email}")
                if name and not user.name:
                    user.name = name
                    updated.append(f"name={name}")

                if updated:
                    print(f"  ✓ {user.id} ({user.clerk_user_id[:24]}…) → {', '.join(updated)}")
                else:
                    print(f"  – {user.id} ({user.clerk_user_id[:24]}…) → no data from Clerk")

        await session.commit()
        print(f"\nDone. {len(users)} user(s) processed.")


if __name__ == "__main__":
    asyncio.run(main())

"""
Grant or revoke admin access for a user by email.

Usage:
    uv run python scripts/make_admin.py sakshamonwork@gmail.com
    uv run python scripts/make_admin.py sakshamonwork@gmail.com --revoke
"""

import argparse
import asyncio
import sys

sys.path.insert(0, ".")

from sqlalchemy import select

from db.session import AsyncSessionLocal
from models.user import User


async def set_admin(email: str, *, grant: bool) -> None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user is None:
            print(f"ERROR: No user found with email {email!r}")
            print("The user must sign in at least once before admin can be granted.")
            sys.exit(1)

        user.is_admin = grant
        await session.commit()
        action = "GRANTED" if grant else "REVOKED"
        print(f"Admin {action} for {email} (user_id={user.id})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Grant or revoke admin access")
    parser.add_argument("email", help="User email address")
    parser.add_argument("--revoke", action="store_true", help="Revoke admin (default: grant)")
    args = parser.parse_args()

    asyncio.run(set_admin(args.email, grant=not args.revoke))


if __name__ == "__main__":
    main()

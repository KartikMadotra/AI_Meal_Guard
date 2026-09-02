"""
AI MealGuard — Database Seed Script.

Only creates tables. No demo data is inserted.
Students are added via the UI.

Usage:
    python -m backend.seed
"""

import asyncio
from backend.database import init_db


async def main() -> None:
    print("\n[SEED] AI MealGuard - Setting Up Database\n")

    await init_db()
    print("  [OK] Database tables created.")

    print("\n[DONE] Database ready! Add students via the UI.\n")


if __name__ == "__main__":
    asyncio.run(main())

"""
AI MealGuard — Database Seed Script.

Populates the database with demo students and dummy meal history
so the app looks populated for demonstrations.

Usage:
    python -m backend.seed
"""

import asyncio
import random
from datetime import datetime, timedelta, timezone

from backend.database import init_db, async_session
from backend.models.student import Student
from backend.models.meal import MealAnalysis
from backend.nutrition.database import nutrition_db
from backend.ai.detector import detect
from backend.ai.portion import estimate_quantities
from backend.scoring.engine import score_meal


# ── Demo Students ────────────────────────────────────────────────────

DEMO_STUDENTS = [
    {"id": "STU-1001", "name": "Aarav Sharma",    "class_number": 3, "age": 7,  "age_group": "6-8"},
    {"id": "STU-1002", "name": "Diya Patel",      "class_number": 3, "age": 8,  "age_group": "6-8"},
    {"id": "STU-1003", "name": "Vihan Reddy",     "class_number": 4, "age": 9,  "age_group": "9-10"},
    {"id": "STU-1004", "name": "Ananya Gupta",    "class_number": 5, "age": 10, "age_group": "9-10"},
    {"id": "STU-1005", "name": "Kabir Singh",     "class_number": 6, "age": 11, "age_group": "11-14"},
    {"id": "STU-1006", "name": "Meera Iyer",      "class_number": 7, "age": 12, "age_group": "11-14"},
    {"id": "STU-1007", "name": "Rohan Das",       "class_number": 7, "age": 13, "age_group": "11-14"},
    {"id": "STU-1008", "name": "Priya Nair",      "class_number": 8, "age": 14, "age_group": "11-14"},
    {"id": "STU-1009", "name": "Arjun Kumar",     "class_number": 10, "age": 15, "age_group": "15-17"},
    {"id": "STU-1010", "name": "Sanya Joshi",     "class_number": 11, "age": 16, "age_group": "15-17"},
]

# Demo plate profiles to cycle through
PLATE_PROFILES = [
    "plate_good",
    "plate_good",
    "plate_full",
    "plate_low_protein",
    "plate_roti",
    "plate_good",
    "plate_missing_veg",
    "plate_full",
    "plate_roti",
    "plate_good",
]


async def seed_students(session) -> None:
    """Insert demo students if they don't already exist."""
    from sqlalchemy import select

    existing = (await session.execute(select(Student.id))).scalars().all()
    existing_set = set(existing)

    count = 0
    for s in DEMO_STUDENTS:
        if s["id"] not in existing_set:
            session.add(Student(**s))
            count += 1

    if count:
        await session.commit()
        print(f"  [OK] Inserted {count} demo students.")
    else:
        print("  [OK] Demo students already exist, skipping.")


async def seed_meal_history(session, num_days: int = 14) -> None:
    """Generate dummy meal history for the past N days."""
    from sqlalchemy import select, func

    # Check if we already have records
    existing_count = (await session.execute(
        select(func.count(MealAnalysis.id))
    )).scalar() or 0

    if existing_count >= 20:
        print(f"  [OK] {existing_count} meal records already exist, skipping seed.")
        return

    nutrition_db.load()
    base_date = datetime.now(timezone.utc) - timedelta(days=num_days)
    records_created = 0

    for day in range(num_days):
        date = base_date + timedelta(days=day)

        # Random subset of students eat each day
        day_students = random.sample(DEMO_STUDENTS, k=random.randint(4, 8))

        for student in day_students:
            profile = random.choice(PLATE_PROFILES)
            detection = detect(plate_profile=profile)
            quantities = estimate_quantities(detection["detections"], plate_profile=profile)
            result = score_meal(quantities, student["age_group"])

            record = MealAnalysis(
                student_id=student["id"],
                student_name=student["name"],
                student_age=student["age"],
                age_group=student["age_group"],
                meal_type="lunch",
                detected_foods=detection["detections"],
                estimated_quantities=quantities,
                nutrition_values=result["nutrition"],
                score=result["score"],
                status=result["status"],
                component_scores=result["component_scores"],
                explanation=result["explanation"],
                recommendations=result["recommendations"],
                analysis_date=date.replace(
                    hour=random.randint(11, 13),
                    minute=random.randint(0, 59),
                ),
            )
            session.add(record)
            records_created += 1

    await session.commit()
    print(f"  [OK] Created {records_created} dummy meal records across {num_days} days.")


async def main() -> None:
    print("\n[SEED] AI MealGuard - Seeding Database\n")

    # Initialize database tables
    await init_db()
    print("  [OK] Database tables created.")

    async with async_session() as session:
        await seed_students(session)
        await seed_meal_history(session)

    print("\n[DONE] Seed complete!\n")


if __name__ == "__main__":
    asyncio.run(main())

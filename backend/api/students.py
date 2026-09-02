"""
AI MealGuard — Student API routes.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.student import Student

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("/")
async def list_students(db: AsyncSession = Depends(get_db)):
    """Return all registered students."""
    result = await db.execute(select(Student).order_by(Student.id))
    students = result.scalars().all()
    return {"students": [s.to_dict() for s in students]}


@router.get("/{student_id}")
async def get_student(student_id: str, db: AsyncSession = Depends(get_db)):
    """Look up a student by their ID (e.g. STU-1024)."""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail=f"Student '{student_id}' not found.")
    return {"student": student.to_dict()}


@router.get("/age-group/{age}")
async def get_age_group(age: int):
    """Determine the age group for a given age (Age Only mode)."""
    from backend.nutrition.database import nutrition_db

    age_group = nutrition_db.get_age_group_key(age)
    if not age_group:
        raise HTTPException(status_code=400, detail=f"No age group found for age {age}.")

    return {
        "age": age,
        "age_group": age_group,
        "label": nutrition_db.get_all_age_groups()[age_group]["label"],
    }

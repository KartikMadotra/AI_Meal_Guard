"""
AI MealGuard — Student API routes.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.student import Student
from backend.nutrition.database import nutrition_db

router = APIRouter(prefix="/api/students", tags=["students"])


class CreateStudentRequest(BaseModel):
    """Schema for creating a new student."""
    name: str
    class_number: int
    age: int


class UpdateStudentRequest(BaseModel):
    """Schema for updating a student."""
    name: Optional[str] = None
    class_number: Optional[int] = None
    age: Optional[int] = None


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


@router.post("/")
async def create_student(req: CreateStudentRequest, db: AsyncSession = Depends(get_db)):
    """Add a new student to the database."""
    # Auto-generate next student ID
    result = await db.execute(
        select(func.count()).select_from(Student)
    )
    count = result.scalar() or 0
    new_id = f"STU-{1001 + count}"

    # Check if ID already exists, increment until unique
    while await db.get(Student, new_id):
        count += 1
        new_id = f"STU-{1001 + count}"

    # Determine age group from the age
    age_group = nutrition_db.get_age_group_key(req.age)
    if not age_group:
        raise HTTPException(400, f"No age group found for age {req.age}. Valid range: 6-17.")

    student = Student(
        id=new_id,
        name=req.name,
        class_number=req.class_number,
        age=req.age,
        age_group=age_group,
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)

    return {"student": student.to_dict(), "message": f"Student {new_id} created."}


@router.put("/{student_id}")
async def update_student(
    student_id: str,
    req: UpdateStudentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing student."""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(404, f"Student '{student_id}' not found.")

    if req.name is not None:
        student.name = req.name
    if req.class_number is not None:
        student.class_number = req.class_number
    if req.age is not None:
        student.age = req.age
        age_group = nutrition_db.get_age_group_key(req.age)
        if age_group:
            student.age_group = age_group

    await db.commit()
    await db.refresh(student)
    return {"student": student.to_dict()}


@router.delete("/{student_id}")
async def delete_student(student_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a student from the database."""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(404, f"Student '{student_id}' not found.")

    await db.delete(student)
    await db.commit()
    return {"message": f"Student '{student_id}' deleted."}


@router.get("/age-group/{age}")
async def get_age_group(age: int):
    """Determine the age group for a given age (Age Only mode)."""
    age_group = nutrition_db.get_age_group_key(age)
    if not age_group:
        raise HTTPException(status_code=400, detail=f"No age group found for age {age}.")

    return {
        "age": age,
        "age_group": age_group,
        "label": nutrition_db.get_all_age_groups()[age_group]["label"],
    }

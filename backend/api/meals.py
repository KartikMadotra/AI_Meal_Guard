"""
AI MealGuard — Meal History API routes.
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.meal import MealAnalysis

router = APIRouter(prefix="/api/meals", tags=["meals"])


@router.get("/history")
async def get_meal_history(
    student_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Get meal analysis history, optionally filtered by student."""
    query = select(MealAnalysis).order_by(desc(MealAnalysis.analysis_date))

    if student_id:
        query = query.where(MealAnalysis.student_id == student_id)

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    meals = result.scalars().all()

    # Total count
    count_query = select(func.count(MealAnalysis.id))
    if student_id:
        count_query = count_query.where(MealAnalysis.student_id == student_id)
    total = (await db.execute(count_query)).scalar() or 0

    return {
        "meals": [m.to_dict() for m in meals],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{meal_id}")
async def get_meal_detail(meal_id: int, db: AsyncSession = Depends(get_db)):
    """Get full details for a specific meal analysis."""
    meal = await db.get(MealAnalysis, meal_id)
    if not meal:
        raise HTTPException(404, f"Meal analysis #{meal_id} not found.")
    return {"meal": meal.to_dict()}

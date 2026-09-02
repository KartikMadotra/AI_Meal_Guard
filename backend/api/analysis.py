"""
AI MealGuard — Core Analysis API.

POST /api/analyze — the main endpoint that runs the full pipeline:
identify → detect → estimate → calculate → score → explain → recommend
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.student import Student
from backend.models.meal import MealAnalysis
from backend.ai.detector import detect
from backend.ai.portion import estimate_quantities
from backend.scoring.engine import score_meal
from backend.nutrition.database import nutrition_db

router = APIRouter(prefix="/api", tags=["analysis"])


# ── Request / Response schemas ───────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Input for meal analysis."""
    student_id: Optional[str] = None       # Mode A: Student ID
    age: Optional[int] = None              # Mode B: Age only
    meal_type: str = "lunch"
    plate_profile: Optional[str] = None    # For demo: select a preset plate

class WhatIfRequest(BaseModel):
    """Input for What-If simulator."""
    current_quantities: dict[str, float]
    additions: dict[str, float]
    age_group: str


# ── Endpoints ────────────────────────────────────────────────────────

@router.post("/analyze")
async def analyze_meal(
    req: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run the full meal analysis pipeline.

    Accepts either a student_id (Mode A) or age (Mode B).
    Uses the mock AI detector to simulate food detection.
    """
    # ── Step 1: Identify student / determine age group ───────────
    student_name = None
    student_id = req.student_id

    if req.student_id:
        student = await db.get(Student, req.student_id)
        if not student:
            raise HTTPException(404, f"Student '{req.student_id}' not found.")
        age = student.age
        age_group = student.age_group
        student_name = student.name
    elif req.age:
        age = req.age
        age_group = nutrition_db.get_age_group_key(age)
        if not age_group:
            raise HTTPException(400, f"No age group for age {age}.")
    else:
        raise HTTPException(400, "Provide either 'student_id' or 'age'.")

    # ── Step 2: Detect foods (mock) ──────────────────────────────
    detection_result = detect(plate_profile=req.plate_profile)

    # ── Step 3: Estimate quantities ──────────────────────────────
    quantities = estimate_quantities(
        detection_result["detections"],
        plate_profile=req.plate_profile,
    )

    # ── Step 4–7: Score meal ─────────────────────────────────────
    result = score_meal(quantities, age_group, req.meal_type)

    # ── Step 8: Save to database ─────────────────────────────────
    record = MealAnalysis(
        student_id=student_id,
        student_name=student_name,
        student_age=age,
        age_group=age_group,
        meal_type=req.meal_type,
        detected_foods=detection_result["detections"],
        estimated_quantities=quantities,
        nutrition_values=result["nutrition"],
        score=result["score"],
        status=result["status"],
        component_scores=result["component_scores"],
        explanation=result["explanation"],
        recommendations=result["recommendations"],
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # ── Response ─────────────────────────────────────────────────
    return {
        "analysis_id": record.id,
        "student": {
            "id": student_id,
            "name": student_name,
            "age": age,
            "age_group": age_group,
        },
        "detection": detection_result,
        "quantities": quantities,
        "nutrition": result["nutrition"],
        "coverage": result["coverage"],
        "score": result["score"],
        "status": result["status"],
        "component_scores": result["component_scores"],
        "explanation": result["explanation"],
        "recommendations": result["recommendations"],
    }


@router.post("/what-if")
async def what_if_simulator(req: WhatIfRequest):
    """
    What-If simulator — recalculate with hypothetical food additions.
    """
    from backend.nutrition.calculator import simulate_what_if
    from backend.scoring.engine import score_meal

    simulation = simulate_what_if(
        req.current_quantities, req.additions, req.age_group
    )

    # Also score both versions
    original_score = score_meal(req.current_quantities, req.age_group)
    new_quantities = dict(req.current_quantities)
    for food, extra in req.additions.items():
        new_quantities[food] = new_quantities.get(food, 0) + extra
    simulated_score = score_meal(new_quantities, req.age_group)

    return {
        "original": {
            "score": original_score["score"],
            "status": original_score["status"],
            "nutrition_totals": simulation["original"]["nutrition"]["totals"],
            "coverage": simulation["original"]["coverage"],
        },
        "simulated": {
            "score": simulated_score["score"],
            "status": simulated_score["status"],
            "quantities": new_quantities,
            "additions": req.additions,
            "nutrition_totals": simulation["simulated"]["nutrition"]["totals"],
            "coverage": simulation["simulated"]["coverage"],
        },
        "improvement": {
            "score_change": round(simulated_score["score"] - original_score["score"], 1),
            "status_change": f"{original_score['status']} → {simulated_score['status']}",
        },
    }


@router.get("/demo-plates")
async def get_demo_plates():
    """List available demo plate profiles for testing."""
    from backend.ai.detector import list_demo_plates
    return {"plates": list_demo_plates()}


@router.get("/nutrition/foods")
async def get_food_database():
    """Return the full food nutrition database."""
    return {"foods": nutrition_db.get_all_foods()}


@router.get("/nutrition/age-groups")
async def get_age_groups():
    """Return all age group requirements."""
    return {"age_groups": nutrition_db.get_all_age_groups()}


@router.get("/nutrition/meal-rules")
async def get_meal_rules():
    """Return the meal rules configuration."""
    return {"rules": nutrition_db.get_all_meal_rules()}

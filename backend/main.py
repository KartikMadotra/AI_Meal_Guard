from contextlib import asynccontextmanager
import base64
import os
import uuid
import tempfile
from typing import Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database import init_db, get_db, Student, MealAnalysis
from backend.nutrition_service import score_meal, NUTRITION_DB, AGE_GROUPS, get_age_group
from backend.ai_service import analyze_image

# ── 1. Lifespan & App Setup ──

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n[START] AI MealGuard Backend (V2 - Clean Architecture) starting...")
    await init_db()
    print("  [OK] Database initialized.")
    print("  [OK] AI and Nutrition Services loaded.")
    yield
    print("\n[STOP] AI MealGuard shutting down.")

app = FastAPI(title="AI MealGuard V2", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── 2. Request Models ──

class AnalyzeRequest(BaseModel):
    student_id: Optional[str] = None
    age: Optional[int] = None
    meal_type: str = "lunch"
    image_data: Optional[str] = None  # Base64 image
    plate_profile: Optional[str] = None # Fallback for demo mode

# ── 3. Core Endpoints ──

@app.post("/api/analyze")
async def analyze_endpoint(req: AnalyzeRequest, db: AsyncSession = Depends(get_db)):
    """The main entry point for meal analysis."""
    
    # 1. Resolve Student/Age
    if req.student_id:
        student = await db.get(Student, req.student_id)
        if not student:
            raise HTTPException(404, "Student not found.")
        age = student.age
        student_name = student.name
    elif req.age:
        age = req.age
        student_name = None
    else:
        raise HTTPException(400, "Provide student_id or age.")

    # 2. Process Image & Run AI
    detections = []
    quantities = {}
    
    if req.image_data:
        # Save base64 to temp file for YOLO
        try:
            # Handle standard Data URI scheme: data:image/jpeg;base64,...
            header, encoded = req.image_data.split(",", 1) if "," in req.image_data else ("", req.image_data)
            image_bytes = base64.b64decode(encoded)
            
            fd, temp_path = tempfile.mkstemp(suffix=".jpg")
            with os.fdopen(fd, 'wb') as f:
                f.write(image_bytes)
                
            # Run inference
            ai_result = analyze_image(temp_path)
            detections = ai_result.get("detections", [])
            quantities = ai_result.get("quantities", {})
            
            os.remove(temp_path)
        except Exception as e:
            print(f"Error processing image: {e}")
            raise HTTPException(500, "Failed to analyze image with AI model.")
    else:
        # Fallback dummy data if no image provided (for testing the pipeline)
        detections = [{"food": "rice", "confidence": 0.99, "bbox": [0,0,100,100], "pixel_area": 10000, "estimated_weight_g": 250.0}]
        quantities = {"rice": 250.0}

    # 3. Score the Meal
    score_result = score_meal(quantities, age)

    # 4. Save to DB
    record = MealAnalysis(
        student_id=req.student_id,
        student_name=student_name,
        student_age=age,
        age_group=get_age_group(age),
        meal_type=req.meal_type,
        detected_foods=detections,
        estimated_quantities=quantities,
        nutrition_values=score_result["nutrition"],
        score=score_result["score"],
        status=score_result["status"],
        component_scores=score_result["component_scores"],
        explanation=score_result["explanation"],
        recommendations=score_result["recommendations"],
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)

    # 5. Return
    return {
        "analysis_id": record.id,
        "student": {"id": req.student_id, "name": student_name, "age": age},
        "detection": {"detections": detections},
        "quantities": quantities,
        **score_result
    }

# ── 4. Helper Endpoints ──

@app.get("/api/students")
async def get_students(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Student))
    students = result.scalars().all()
    return {"students": students}

@app.get("/api/meals/history")
async def get_history(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MealAnalysis).order_by(MealAnalysis.analysis_date.desc()).limit(50))
    history = result.scalars().all()
    return {"history": history}

@app.get("/api/dashboard/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MealAnalysis))
    meals = result.scalars().all()
    
    total = len(meals)
    excellent = sum(1 for m in meals if m.score >= 90)
    avg_score = sum(m.score for m in meals) / total if total > 0 else 0
    
    return {
        "total_meals": total,
        "excellent_meals": excellent,
        "average_score": round(avg_score, 1),
        "needs_improvement": total - excellent
    }

@app.get("/api/nutrition/foods")
async def get_foods():
    return {"foods": NUTRITION_DB}

@app.get("/api/nutrition/age-groups")
async def get_age_groups():
    return {"age_groups": AGE_GROUPS}

@app.get("/")
async def root():
    return {"status": "ok", "message": "AI MealGuard V2 Backend Running"}

if __name__ == "__main__":
    import uvicorn
    # Use environment vars or default port 8000
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

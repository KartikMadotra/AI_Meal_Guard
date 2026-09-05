from contextlib import asynccontextmanager
import base64
import os
import uuid
import tempfile
from typing import Optional, Dict, Any

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.csv_db import get_all_students, save_student, get_all_meals, save_meal_analysis, get_student_by_id
from backend.face_utils import get_face_encoding, find_matching_student
from backend.nutrition_service import score_meal, NUTRITION_DB, AGE_GROUPS, get_age_group, get_nutrition_per_100g
from backend.ai_service import analyze_image

# ── 1. Lifespan & App Setup ──

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n[START] AI MealGuard Backend (V3 - CSV Storage) starting...")
    print("  [OK] AI and Nutrition Services loaded.")
    yield
    print("\n[STOP] AI MealGuard shutting down.")

app = FastAPI(title="AI MealGuard V3", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
async def analyze_endpoint(req: AnalyzeRequest):
    """The main entry point for meal analysis."""
    
    # 1. Resolve Student/Age
    if req.student_id:
        student = get_student_by_id(req.student_id)
        if not student:
            raise HTTPException(404, "Student not found.")
        age = int(student["age"])
        student_name = student["name"]
    elif req.age:
        age = req.age
        student_name = None
    else:
        raise HTTPException(400, "Provide student_id or age.")

    # 2. Process Image & Run AI
    detections = []
    quantities = {}
    
    if req.image_data:
        try:
            header, encoded = req.image_data.split(",", 1) if "," in req.image_data else ("", req.image_data)
            image_bytes = base64.b64decode(encoded)
            
            fd, temp_path = tempfile.mkstemp(suffix=".jpg")
            with os.fdopen(fd, 'wb') as f:
                f.write(image_bytes)
                
            ai_result = analyze_image(temp_path)
            detections = ai_result.get("detections", [])
            quantities = ai_result.get("quantities", {})
            
            os.remove(temp_path)
        except Exception as e:
            print(f"Error processing image: {e}")
            raise HTTPException(500, "Failed to analyze image with AI model.")
    else:
        detections = [{"food": "rice", "confidence": 0.99, "bbox": [0,0,100,100], "pixel_area": 10000, "estimated_weight_g": 250.0}]
        quantities = {"rice": 250.0}

    # 3. Score the Meal
    score_result = score_meal(quantities, age)

    # 4. Save to CSV
    save_meal_analysis(
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
        recommendations=score_result["recommendations"]
    )

    # 5. Return
    return {
        "analysis_id": "auto",
        "student": {"id": req.student_id, "name": student_name, "age": age},
        "detection": {"detections": detections},
        "quantities": quantities,
        **score_result
    }

# ── 4. Helper Endpoints ──

@app.get("/api/students")
async def get_students():
    return {"students": get_all_students()}

class StudentRegisterRequest(BaseModel):
    id: str
    name: str
    age: int
    class_number: Optional[str] = "Unknown"
    face_image: Optional[str] = None # Base64 image from webcam

@app.post("/api/students/register")
async def register_student(req: StudentRegisterRequest):
    try:
        existing = get_student_by_id(req.id)
        if existing:
            raise HTTPException(400, "Student ID already exists.")
        
        face_encoding = None
        if req.face_image:
            try:
                face_encoding = get_face_encoding(req.face_image)
                if not face_encoding:
                    raise HTTPException(400, "No face detected in the captured image. Please try again with better lighting.")
            except HTTPException:
                raise
            except Exception as fe:
                print(f"Face encoding failed: {fe}")
                raise HTTPException(400, f"Failed to process face image: {fe}")
        
        save_student(
            student_id=req.id, 
            name=req.name, 
            age=req.age, 
            age_group=get_age_group(req.age),
            class_number=req.class_number,
            face_encoding=face_encoding
        )
        msg = f"Registered {req.name} ({req.id})"
        if face_encoding:
            msg += " with facial recognition."
        return {"status": "success", "message": msg}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "traceback": traceback.format_exc()}

class FaceCheckRequest(BaseModel):
    face_image: str

@app.post("/api/students/check_face")
async def check_face(req: FaceCheckRequest):
    """Used for auto-capture during registration. Returns true if a face is clearly visible."""
    try:
        encoding = get_face_encoding(req.face_image)
        return {"status": "success", "face_detected": encoding is not None}
    except Exception as e:
        import traceback
        print(f"Check face error: {e}\n{traceback.format_exc()}")
        return {"status": "error", "face_detected": False}

class FaceRecognizeRequest(BaseModel):
    face_image: str

@app.post("/api/students/recognize")
async def recognize_student(req: FaceRecognizeRequest):
    try:
        encoding = get_face_encoding(req.face_image)
        if not encoding:
            raise HTTPException(400, "No face detected in the image.")
            
        students = get_all_students()
        match_id = find_matching_student(encoding, students)
        
        if match_id:
            student = get_student_by_id(match_id)
            return {"status": "success", "match": True, "student": student}
        else:
            return {"status": "success", "match": False, "message": "Face not recognized."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error processing face: {str(e)}")

@app.get("/api/meals/history")
async def get_history():
    meals = get_all_meals()
    # Return last 50, sorted by latest
    meals.reverse()
    return {"history": meals[:50]}

@app.get("/api/dashboard/stats")
async def get_stats():
    meals = get_all_meals()
    total = len(meals)
    if total == 0:
        return {"total_meals": 0, "average_score": 0, "pass_rate": 0, "top_foods": [], "protein_days": 0, "fruit_days": 0}
        
    avg_score = sum(m["score"] for m in meals) / total
    passes = sum(1 for m in meals if m["status"] == "PASS")
    
    food_counts = {}
    protein_meals = 0
    fruit_meals = 0
    
    for m in meals:
        foods = m["estimated_quantities"].keys()
        has_protein = False
        has_fruit = False
        for f in foods:
            food_counts[f] = food_counts.get(f, 0) + 1
            ntype = get_nutrition_per_100g(f)["type"]
            if ntype in ["protein", "dairy"]: has_protein = True
            if ntype == "fruit": has_fruit = True
        
        if has_protein: protein_meals += 1
        if has_fruit: fruit_meals += 1
            
    top_foods = sorted([{"name": k, "count": v} for k,v in food_counts.items()], key=lambda x: x["count"], reverse=True)[:5]
    
    return {
        "total_meals": total,
        "average_score": round(avg_score, 1),
        "pass_rate": round((passes / total) * 100),
        "top_foods": top_foods,
        "protein_days": protein_meals,
        "fruit_days": fruit_meals
    }

@app.get("/api/nutrition/foods")
async def get_foods():
    return {"foods": NUTRITION_DB}

@app.get("/api/nutrition/age-groups")
async def get_age_groups():
    return {"age_groups": AGE_GROUPS}

from fastapi.responses import FileResponse

@app.get("/")
async def root():
    frontend_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {"status": "ok", "message": "AI MealGuard V3 Backend Running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8080, reload=True)

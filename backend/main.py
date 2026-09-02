"""
AI MealGuard — FastAPI Application Entry Point.

Starts the server, mounts all API routes, loads databases,
and serves the frontend (once built).

Usage:
    python -m backend.main
    # or
    uvicorn backend.main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import settings
from backend.database import init_db
from backend.nutrition.database import nutrition_db
from backend.api import students_router, analysis_router, meals_router, reports_router


# ── Lifespan ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # ── Startup ──
    print("\n[START] AI MealGuard starting up...")

    # Create database tables
    await init_db()
    print("  [OK] Database initialized.")

    # Load nutrition / rules data into memory
    nutrition_db.load()
    print("  [OK] Nutrition database loaded.")
    print(f"  [OK] {len(nutrition_db.list_food_keys())} foods available.")
    print(f"  [OK] {len(nutrition_db.get_all_age_groups())} age groups configured.")

    print("  [OK] Ready!\n")

    yield

    # ── Shutdown ──
    print("\n[STOP] AI MealGuard shutting down.\n")


# ── App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="AI MealGuard",
    description=(
        "AI-Powered Smart Monitoring for Nutritious School Meals — SDG 2.\n\n"
        "An AI-based age-aware system for visual school meal assessment, "
        "nutritional monitoring and meal quality improvement."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS (allow React dev server during development) ─────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],             # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────

app.include_router(students_router)
app.include_router(analysis_router)
app.include_router(meals_router)
app.include_router(reports_router)


@app.get("/", tags=["root"])
async def root():
    return {
        "project": "AI MealGuard",
        "tagline": "AI-Powered Smart Monitoring for Nutritious School Meals",
        "sdg": "2 — Zero Hunger",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "analyze_meal": "POST /api/analyze",
            "what_if": "POST /api/what-if",
            "students": "GET /api/students",
            "meal_history": "GET /api/meals/history",
            "dashboard": "GET /api/dashboard/stats",
            "food_database": "GET /api/nutrition/foods",
            "age_groups": "GET /api/nutrition/age-groups",
            "meal_rules": "GET /api/nutrition/meal-rules",
            "demo_plates": "GET /api/demo-plates",
        },
    }


# ── Run ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=settings.debug,
    )

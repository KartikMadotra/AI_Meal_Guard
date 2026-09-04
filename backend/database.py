import os
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker

# ── Configuration ──
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "mealguard.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
DATABASE_URL = f"sqlite+aiosqlite:///{DB_PATH}"

# ── Engine & Session ──
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()

# ── Dependency ──
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ── Models ──
class Student(Base):
    __tablename__ = "students"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    age_group = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class MealAnalysis(Base):
    __tablename__ = "meal_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(String, index=True, nullable=True)
    student_name = Column(String, nullable=True)
    student_age = Column(Integer, nullable=True)
    age_group = Column(String, nullable=False)
    meal_type = Column(String, nullable=False, default="lunch")
    
    # Store JSON arrays/objects directly
    detected_foods = Column(JSON, nullable=False)
    estimated_quantities = Column(JSON, nullable=False)
    nutrition_values = Column(JSON, nullable=False)
    
    # Scoring and Feedback
    score = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    component_scores = Column(JSON, nullable=False)
    explanation = Column(String, nullable=False)
    recommendations = Column(JSON, nullable=False)
    
    analysis_date = Column(DateTime, default=datetime.utcnow)

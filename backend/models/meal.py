"""
AI MealGuard — MealAnalysis model.

Stores every meal scan result for history, dashboards, and trend analysis.
"""

from datetime import datetime, timezone

from sqlalchemy import Integer, Float, String, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class MealAnalysis(Base):
    """A single meal analysis record."""

    __tablename__ = "meal_analyses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # ── Student context ─────────────────────────────────────────────
    student_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    student_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    student_age: Mapped[int] = mapped_column(Integer, nullable=False)
    age_group: Mapped[str] = mapped_column(String(10), nullable=False)

    # ── Meal metadata ───────────────────────────────────────────────
    meal_type: Mapped[str] = mapped_column(String(20), default="lunch")
    image_path: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── AI Detection results (stored as JSON) ───────────────────────
    detected_foods: Mapped[dict] = mapped_column(JSON, default=dict)
    estimated_quantities: Mapped[dict] = mapped_column(JSON, default=dict)

    # ── Nutrition calculation ────────────────────────────────────────
    nutrition_values: Mapped[dict] = mapped_column(JSON, default=dict)

    # ── Scoring ──────────────────────────────────────────────────────
    score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(10), default="FAIL")     # PASS / REVIEW / FAIL
    component_scores: Mapped[dict] = mapped_column(JSON, default=dict)  # per-category breakdown

    # ── Explanation & recommendations ────────────────────────────────
    explanation: Mapped[dict] = mapped_column(JSON, default=dict)
    recommendations: Mapped[list] = mapped_column(JSON, default=list)

    # ── Timestamps ───────────────────────────────────────────────────
    analysis_date: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student_name,
            "student_age": self.student_age,
            "age_group": self.age_group,
            "meal_type": self.meal_type,
            "image_path": self.image_path,
            "detected_foods": self.detected_foods,
            "estimated_quantities": self.estimated_quantities,
            "nutrition_values": self.nutrition_values,
            "score": self.score,
            "status": self.status,
            "component_scores": self.component_scores,
            "explanation": self.explanation,
            "recommendations": self.recommendations,
            "analysis_date": self.analysis_date.isoformat() if self.analysis_date else None,
        }

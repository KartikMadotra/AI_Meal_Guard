"""
AI MealGuard — Student model.
"""

from datetime import datetime, timezone

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Student(Base):
    """A registered student in the school meal program."""

    __tablename__ = "students"

    id: Mapped[str] = mapped_column(String(20), primary_key=True)          # e.g. "STU-1001"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    class_number: Mapped[int] = mapped_column(Integer, nullable=False)     # e.g. 7
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    age_group: Mapped[str] = mapped_column(String(10), nullable=False)     # e.g. "11-14"
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "class_number": self.class_number,
            "age": self.age,
            "age_group": self.age_group,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

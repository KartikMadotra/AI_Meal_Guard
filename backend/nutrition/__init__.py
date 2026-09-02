from backend.nutrition.database import nutrition_db
from backend.nutrition.calculator import (
    calculate_meal_nutrition,
    compute_nutrient_coverage,
    simulate_what_if,
)

__all__ = [
    "nutrition_db",
    "calculate_meal_nutrition",
    "compute_nutrient_coverage",
    "simulate_what_if",
]

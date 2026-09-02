"""
AI MealGuard — Nutrition Calculator.

Takes detected foods with estimated quantities and calculates total
nutritional content for the meal.
"""

from typing import Any

from backend.nutrition.database import nutrition_db


def calculate_meal_nutrition(
    food_quantities: dict[str, float],
) -> dict[str, Any]:
    """
    Calculate total nutrition for a meal.

    Parameters
    ----------
    food_quantities : dict
        Mapping of food key → estimated quantity in grams.
        Example: {"rice": 150.0, "dal": 80.0, "vegetable": 55.0}

    Returns
    -------
    dict with keys:
        - "per_food": per-food nutrient breakdown
        - "totals":   summed nutrient values for the entire meal
    """
    per_food: dict[str, dict] = {}
    totals: dict[str, float] = {}

    for food_key, quantity_g in food_quantities.items():
        nutrients_per_100g = nutrition_db.get_food_nutrients(food_key)
        if nutrients_per_100g is None:
            # Unknown food — skip but note it
            per_food[food_key] = {"quantity_g": quantity_g, "unknown": True}
            continue

        factor = quantity_g / 100.0
        food_nutrients: dict[str, float] = {}

        for nutrient, value_per_100g in nutrients_per_100g.items():
            computed = round(value_per_100g * factor, 2)
            food_nutrients[nutrient] = computed
            totals[nutrient] = round(totals.get(nutrient, 0.0) + computed, 2)

        per_food[food_key] = {
            "quantity_g": quantity_g,
            "category": nutrition_db.get_food_category(food_key),
            "name": (nutrition_db.get_food(food_key) or {}).get("name", food_key),
            "nutrients": food_nutrients,
        }

    return {"per_food": per_food, "totals": totals}


def compute_nutrient_coverage(
    totals: dict[str, float],
    age_group: str,
) -> dict[str, Any]:
    """
    Compare meal totals against age-specific per-meal requirements.

    Returns a dict with per-nutrient coverage percentages and shortfalls.
    """
    requirements = nutrition_db.get_age_requirements(age_group)
    if requirements is None:
        return {"error": f"Unknown age group: {age_group}"}

    coverage: dict[str, dict] = {}
    for nutrient, required in requirements.items():
        actual = totals.get(nutrient, 0.0)
        pct = round((actual / required) * 100, 1) if required > 0 else 0.0
        coverage[nutrient] = {
            "actual": actual,
            "required": required,
            "coverage_pct": pct,
            "shortfall": round(max(0, required - actual), 2),
            "adequate": pct >= 80.0,  # ≥80% is considered adequate
        }

    return coverage


def simulate_what_if(
    current_quantities: dict[str, float],
    additions: dict[str, float],
    age_group: str,
) -> dict[str, Any]:
    """
    What-If simulator: recalculate nutrition with hypothetical food additions.

    Parameters
    ----------
    current_quantities : dict  — current food→grams
    additions : dict           — food→additional grams to add
    age_group : str

    Returns
    -------
    dict with "original" and "simulated" nutrition + coverage.
    """
    # Original
    original_nutrition = calculate_meal_nutrition(current_quantities)
    original_coverage = compute_nutrient_coverage(
        original_nutrition["totals"], age_group
    )

    # Simulated
    simulated_quantities = dict(current_quantities)
    for food_key, extra_g in additions.items():
        simulated_quantities[food_key] = simulated_quantities.get(food_key, 0.0) + extra_g

    simulated_nutrition = calculate_meal_nutrition(simulated_quantities)
    simulated_coverage = compute_nutrient_coverage(
        simulated_nutrition["totals"], age_group
    )

    return {
        "original": {
            "quantities": current_quantities,
            "nutrition": original_nutrition,
            "coverage": original_coverage,
        },
        "simulated": {
            "quantities": simulated_quantities,
            "additions": additions,
            "nutrition": simulated_nutrition,
            "coverage": simulated_coverage,
        },
    }

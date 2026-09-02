"""
AI MealGuard — Nutrition database loader.

Loads and provides lookup functions for the food nutrition data
and age-specific requirements.
"""

import json
from pathlib import Path
from typing import Any

from backend.config import DATA_DIR


class NutritionDB:
    """In-memory nutrition and age-requirements database."""

    def __init__(self) -> None:
        self._foods: dict[str, Any] = {}
        self._age_groups: dict[str, Any] = {}
        self._meal_rules: dict[str, Any] = {}
        self._loaded = False

    def load(self) -> None:
        """Load all JSON data files into memory."""
        # Nutrition data
        with open(DATA_DIR / "nutrition.json", encoding="utf-8") as f:
            data = json.load(f)
            self._foods = data.get("foods", {})

        # Age requirements
        with open(DATA_DIR / "age_requirements.json", encoding="utf-8") as f:
            data = json.load(f)
            self._age_groups = data.get("age_groups", {})

        # Meal rules
        with open(DATA_DIR / "meal_rules.json", encoding="utf-8") as f:
            self._meal_rules = json.load(f)

        self._loaded = True

    def _ensure_loaded(self) -> None:
        if not self._loaded:
            self.load()

    # ── Food lookup ──────────────────────────────────────────────────

    def get_food(self, food_key: str) -> dict | None:
        """Get nutrition data for a food item by its key (e.g. 'rice', 'dal')."""
        self._ensure_loaded()
        return self._foods.get(food_key)

    def get_food_nutrients(self, food_key: str) -> dict | None:
        """Get the per-100g nutrient values for a food."""
        food = self.get_food(food_key)
        if food:
            return food.get("per_100g")
        return None

    def get_food_category(self, food_key: str) -> str | None:
        """Get the category (cereal, pulse, vegetable, etc.) for a food."""
        food = self.get_food(food_key)
        if food:
            return food.get("category")
        return None

    def get_all_foods(self) -> dict[str, Any]:
        """Return the full food database."""
        self._ensure_loaded()
        return self._foods

    def list_food_keys(self) -> list[str]:
        """Return a list of all known food keys."""
        self._ensure_loaded()
        return list(self._foods.keys())

    # ── Age requirements ─────────────────────────────────────────────

    def get_age_group_key(self, age: int) -> str | None:
        """Determine the age-group key for a given age."""
        self._ensure_loaded()
        for key, group in self._age_groups.items():
            lo, hi = group["age_range"]
            if lo <= age <= hi:
                return key
        return None

    def get_age_requirements(self, age_group: str) -> dict | None:
        """Get the per-meal nutritional requirements for an age group."""
        self._ensure_loaded()
        group = self._age_groups.get(age_group)
        if group:
            return group.get("per_meal")
        return None

    def get_all_age_groups(self) -> dict[str, Any]:
        """Return all age group data."""
        self._ensure_loaded()
        return self._age_groups

    # ── Meal rules ───────────────────────────────────────────────────

    def get_scoring_weights(self) -> dict[str, float]:
        self._ensure_loaded()
        return self._meal_rules.get("scoring_weights", {})

    def get_status_thresholds(self) -> dict[str, int]:
        self._ensure_loaded()
        return self._meal_rules.get("status_thresholds", {})

    def get_meal_type_rules(self, meal_type: str = "lunch") -> dict | None:
        self._ensure_loaded()
        return self._meal_rules.get("meal_types", {}).get(meal_type)

    def get_critical_nutrients(self) -> list[str]:
        self._ensure_loaded()
        return self._meal_rules.get("critical_nutrients", [])

    def get_micronutrient_keys(self) -> list[str]:
        self._ensure_loaded()
        return self._meal_rules.get("micronutrient_keys", [])

    def get_all_meal_rules(self) -> dict[str, Any]:
        self._ensure_loaded()
        return self._meal_rules


# ── Singleton ────────────────────────────────────────────────────────
nutrition_db = NutritionDB()

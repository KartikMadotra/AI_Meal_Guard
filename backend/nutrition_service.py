"""
Nutrition Service
Handles food database, age group requirements, and meal scoring logic.
"""

from typing import Dict, Any, List

# ── 1. Reference Data (Age Groups & Requirements) ──
AGE_GROUPS = {
    "5-7":  {"calories": 400, "protein": 12.0, "carbs": 60.0},
    "8-10": {"calories": 500, "protein": 15.0, "carbs": 75.0},
    "11-14": {"calories": 650, "protein": 20.0, "carbs": 90.0},
    "15-18": {"calories": 800, "protein": 25.0, "carbs": 110.0},
}

def get_age_group(age: int) -> str:
    if age <= 7: return "5-7"
    if age <= 10: return "8-10"
    if age <= 14: return "11-14"
    return "15-18"

# ── 2. Generic Food Categories ──
# Values per 100g
NUTRITION_DB = {
    "rice": {"calories": 130, "protein": 2.7, "carbs": 28.0, "type": "grain"},
    "roti": {"calories": 297, "protein": 9.0, "carbs": 46.0, "type": "grain"},
    "dal": {"calories": 116, "protein": 9.0, "carbs": 20.0, "type": "protein"},
    "vegetable": {"calories": 65, "protein": 2.0, "carbs": 10.0, "type": "veg"},
    "potato": {"calories": 85, "protein": 1.9, "carbs": 20.0, "type": "veg"},
    "salad": {"calories": 20, "protein": 1.0, "carbs": 4.0, "type": "veg"},
    "fruit": {"calories": 50, "protein": 0.5, "carbs": 14.0, "type": "fruit"},
    "curd": {"calories": 98, "protein": 11.0, "carbs": 3.4, "type": "dairy"}
}

# ── 3. Label to Generic Category Mapping ──
# Dynamically maps any of the 50 classes to generic categories based on names.
def get_category_for_food(food_name: str) -> str:
    f = food_name.lower()
    if any(x in f for x in ["rice", "biriyani", "khichdi", "pongal", "semiya"]): return "rice"
    if any(x in f for x in ["roti", "papad"]): return "roti"
    if any(x in f for x in ["dal", "rajma", "sambar", "rasam", "chole", "beans"]): return "dal"
    if any(x in f for x in ["curd", "raitha"]): return "curd"
    if any(x in f for x in ["salad", "chutney", "pickle"]): return "salad"
    if any(x in f for x in ["watermelon", "melon", "banana", "fruit", "pineapple"]): return "fruit"
    if any(x in f for x in ["aloo", "potato"]): return "potato"
    if any(x in f for x in ["sweet", "rasgulla"]): return "fruit" # Map sweets roughly to fruit/carbs
    return "vegetable" # Default to vegetable for curries and fries

# ── 4. Density Map for Weight Estimation ──
# How dense/heavy is a standard pixel area of this generic food type?
# (Estimated reference factor: grams per 1000 pixels in a standard 640x480 frame)
DENSITY_FACTORS = {
    "grain": 1.2,    # Rice/Roti is dense
    "protein": 1.5,  # Dal is heavy (liquid + solids)
    "veg": 0.8,      # Veggies are lighter
    "fruit": 1.0,    # Fruits are standard
    "dairy": 1.1     # Curd
}

def get_nutrition_per_100g(food_name: str) -> Dict[str, float]:
    category = get_category_for_food(food_name)
    return NUTRITION_DB.get(category, {"calories": 0, "protein": 0, "carbs": 0, "type": "unknown"})

def get_density_factor(food_name: str) -> float:
    category = get_category_for_food(food_name)
    food_type = NUTRITION_DB.get(category, {}).get("type", "veg")
    return DENSITY_FACTORS.get(food_type, 1.0)


# ── 5. Scoring Logic (Cinematic Blueprint) ──
def score_meal(quantities: Dict[str, float], age: int) -> Dict[str, Any]:
    """Calculate total nutrition and SDG-2 score."""
    age_group_str = get_age_group(age)
    reqs = AGE_GROUPS[age_group_str]
    
    totals = {"calories": 0.0, "protein": 0.0, "carbs": 0.0}
    
    # Calculate totals
    for food_name, weight_grams in quantities.items():
        nut_per_100 = get_nutrition_per_100g(food_name)
        factor = weight_grams / 100.0
        totals["calories"] += nut_per_100["calories"] * factor
        totals["protein"] += nut_per_100["protein"] * factor
        totals["carbs"] += nut_per_100["carbs"] * factor
        
    # Calculate coverage
    coverage = {
        "calories": min(100.0, (totals["calories"] / reqs["calories"]) * 100),
        "protein": min(100.0, (totals["protein"] / reqs["protein"]) * 100),
        "carbs": min(100.0, (totals["carbs"] / reqs["carbs"]) * 100),
    }
    
    # Simple overall score average
    overall_score = (coverage["calories"] + coverage["protein"] + coverage["carbs"]) / 3.0
    overall_score = round(overall_score, 1)
    
    # Status (PASS/REVIEW/FAIL)
    if overall_score >= 80:
        status = "PASS"
    elif overall_score >= 60:
        status = "REVIEW"
    else:
        status = "FAIL"
        
    # Explanation (The "WHY?")
    issues = []
    recommendations = []
    
    if coverage["protein"] < 80:
        issues.append(f"Protein is below target ({round(totals['protein'], 1)}g vs {reqs['protein']}g).")
        recommendations.append("Increase pulse/protein component (e.g., add dal).")
        
    if coverage["calories"] < 80:
        issues.append(f"Energy is below target ({round(totals['calories'], 0)}kcal vs {reqs['calories']}kcal).")
        recommendations.append("Increase main carbohydrate portion (e.g., rice or roti).")
        
    has_veg = any(get_nutrition_per_100g(f)["type"] == "veg" for f in quantities)
    if not has_veg:
        issues.append("Missing vegetable component.")
        recommendations.append("Add 1 serving of vegetables.")
        
    has_fruit = any(get_nutrition_per_100g(f)["type"] == "fruit" for f in quantities)
    if not has_fruit:
        issues.append("Missing fruit component.")
        recommendations.append("Add 1 serving of seasonal fruit.")
        
    if not issues:
        issues.append("Meal meets all nutritional targets for this age group.")
        recommendations.append("Keep up the great work! No changes needed.")

    # Convert to single string for DB compatibility, or return as list
    explanation = "\\n".join(issues)

    return {
        "score": overall_score,
        "status": status,
        "nutrition": totals,
        "coverage": coverage,
        "component_scores": coverage,
        "explanation": explanation,
        "recommendations": recommendations,
        "requirements": reqs
    }

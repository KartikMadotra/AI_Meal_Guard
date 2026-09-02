"""
AI MealGuard — Scoring Engine.

Produces a weighted score (0–100) with PASS / REVIEW / FAIL status
and a detailed per-component breakdown.
"""

from typing import Any

from backend.nutrition.database import nutrition_db
from backend.nutrition.calculator import calculate_meal_nutrition, compute_nutrient_coverage


# ═════════════════════════════════════════════════════════════════════
#  COMPONENT SCORERS  (each returns 0–100)
# ═════════════════════════════════════════════════════════════════════

def _score_protein_adequacy(coverage: dict) -> tuple[float, dict]:
    """Score protein coverage (0–100)."""
    info = coverage.get("protein_g", {})
    pct = info.get("coverage_pct", 0.0)
    # Generous curve: 100% coverage → 100 pts; <50% → 0 pts
    score = min(100, max(0, (pct - 50) * 2)) if pct < 100 else 100.0
    return score, {
        "actual_g": info.get("actual", 0),
        "required_g": info.get("required", 0),
        "coverage_pct": pct,
    }


def _score_energy_adequacy(coverage: dict) -> tuple[float, dict]:
    """Score energy coverage (0–100)."""
    info = coverage.get("energy_kcal", {})
    pct = info.get("coverage_pct", 0.0)
    # Same curve
    score = min(100, max(0, (pct - 50) * 2)) if pct < 100 else 100.0
    return score, {
        "actual_kcal": info.get("actual", 0),
        "required_kcal": info.get("required", 0),
        "coverage_pct": pct,
    }


def _score_meal_components(
    food_quantities: dict[str, float],
    meal_type: str,
) -> tuple[float, dict]:
    """Score whether the meal has the required/recommended food categories."""
    rules = nutrition_db.get_meal_type_rules(meal_type)
    if not rules:
        return 50.0, {"error": f"No rules for meal type '{meal_type}'"}

    required = set(rules.get("required_categories", []))
    recommended = set(rules.get("recommended_categories", []))
    min_components = rules.get("min_components", 2)

    # Determine which categories are present
    present_categories: set[str] = set()
    for food_key in food_quantities:
        cat = nutrition_db.get_food_category(food_key)
        if cat:
            present_categories.add(cat)

    # Required categories present?
    required_present = required & present_categories
    required_missing = required - present_categories

    # Recommended categories present?
    recommended_present = recommended & present_categories

    # Component count
    num_components = len(food_quantities)

    # Scoring
    score = 0.0

    # Required: 60 pts total
    if required:
        score += (len(required_present) / len(required)) * 60
    else:
        score += 60  # no required → full marks

    # Recommended: 25 pts total
    if recommended:
        score += (len(recommended_present) / len(recommended)) * 25
    else:
        score += 25

    # Component count: 15 pts
    if num_components >= min_components:
        score += 15
    elif num_components > 0:
        score += (num_components / min_components) * 15

    details = {
        "required_categories": list(required),
        "required_present": list(required_present),
        "required_missing": list(required_missing),
        "recommended_present": list(recommended_present),
        "num_components": num_components,
        "min_components": min_components,
    }

    return min(100, score), details


def _score_micronutrients(coverage: dict) -> tuple[float, dict]:
    """Score coverage of key micronutrients (iron, calcium, vitamin C, zinc)."""
    micro_keys = nutrition_db.get_micronutrient_keys()
    if not micro_keys:
        return 50.0, {}

    total_pct = 0.0
    details: dict[str, dict] = {}

    for key in micro_keys:
        info = coverage.get(key, {})
        pct = info.get("coverage_pct", 0.0)
        total_pct += min(pct, 150.0)  # cap at 150% to avoid one micro inflating
        details[key] = {
            "actual": info.get("actual", 0),
            "required": info.get("required", 0),
            "coverage_pct": pct,
        }

    avg_pct = total_pct / len(micro_keys)
    score = min(100, max(0, avg_pct))

    return score, details


def _score_portion_adequacy(
    food_quantities: dict[str, float],
    meal_type: str,
) -> tuple[float, dict]:
    """Score whether portions fall within configured ranges."""
    rules = nutrition_db.get_meal_type_rules(meal_type)
    if not rules:
        return 50.0, {}

    portion_ranges = rules.get("portion_ranges_g", {})
    total_score = 0.0
    count = 0
    details: dict[str, dict] = {}

    for food_key, qty in food_quantities.items():
        category = nutrition_db.get_food_category(food_key)
        if not category or category not in portion_ranges:
            continue

        ranges = portion_ranges[category]
        min_g = ranges["min"]
        ideal_g = ranges["ideal"]
        max_g = ranges["max"]

        if min_g <= qty <= max_g:
            # How close to ideal?
            if qty <= ideal_g:
                pct = ((qty - min_g) / (ideal_g - min_g)) * 100 if ideal_g > min_g else 100
            else:
                pct = ((max_g - qty) / (max_g - ideal_g)) * 100 if max_g > ideal_g else 100
            pct = max(60, pct)  # within range → at least 60
        elif qty < min_g:
            pct = (qty / min_g) * 50 if min_g > 0 else 0
        else:
            pct = max(0, 100 - ((qty - max_g) / max_g) * 100)

        total_score += min(100, max(0, pct))
        count += 1
        details[food_key] = {
            "quantity_g": qty,
            "category": category,
            "range": f"{min_g}–{max_g}g (ideal {ideal_g}g)",
            "score": round(pct, 1),
        }

    score = (total_score / count) if count > 0 else 50.0
    return min(100, score), details


# ═════════════════════════════════════════════════════════════════════
#  MAIN SCORING FUNCTION
# ═════════════════════════════════════════════════════════════════════

def score_meal(
    food_quantities: dict[str, float],
    age_group: str,
    meal_type: str = "lunch",
) -> dict[str, Any]:
    """
    Produce a full meal assessment.

    Returns
    -------
    dict with keys:
        score           float   (0–100)
        status          str     ("PASS" / "REVIEW" / "FAIL")
        component_scores  dict  per-category breakdown
        nutrition       dict    full nutrition results
        coverage        dict    nutrient-vs-requirement coverage
        explanation     dict    human-readable explanation
        recommendations list[str]
    """
    # 1. Calculate nutrition
    nutrition = calculate_meal_nutrition(food_quantities)
    coverage = compute_nutrient_coverage(nutrition["totals"], age_group)

    if "error" in coverage:
        return {
            "score": 0,
            "status": "FAIL",
            "error": coverage["error"],
            "nutrition": nutrition,
            "coverage": {},
            "component_scores": {},
            "explanation": {},
            "recommendations": [],
        }

    # 2. Score each component
    weights = nutrition_db.get_scoring_weights()

    protein_score, protein_detail = _score_protein_adequacy(coverage)
    energy_score, energy_detail = _score_energy_adequacy(coverage)
    components_score, components_detail = _score_meal_components(food_quantities, meal_type)
    micro_score, micro_detail = _score_micronutrients(coverage)
    portion_score, portion_detail = _score_portion_adequacy(food_quantities, meal_type)

    component_scores = {
        "protein_adequacy": {"score": round(protein_score, 1), "weight": weights.get("protein_adequacy", 0.3), "details": protein_detail},
        "energy_adequacy": {"score": round(energy_score, 1), "weight": weights.get("energy_adequacy", 0.25), "details": energy_detail},
        "meal_components": {"score": round(components_score, 1), "weight": weights.get("meal_components", 0.2), "details": components_detail},
        "micronutrients": {"score": round(micro_score, 1), "weight": weights.get("micronutrients", 0.15), "details": micro_detail},
        "portion_adequacy": {"score": round(portion_score, 1), "weight": weights.get("portion_adequacy", 0.1), "details": portion_detail},
    }

    # 3. Weighted total
    total_score = sum(
        cs["score"] * cs["weight"] for cs in component_scores.values()
    )
    total_score = round(min(100, max(0, total_score)), 1)

    # 4. Status
    thresholds = nutrition_db.get_status_thresholds()
    if total_score >= thresholds.get("pass", 75):
        status = "PASS"
    elif total_score >= thresholds.get("review", 50):
        status = "REVIEW"
    else:
        status = "FAIL"

    # 5. Generate explanation
    explanation = _build_explanation(
        total_score, status, coverage, component_scores, age_group, meal_type
    )

    # 6. Generate recommendations
    recommendations = _build_recommendations(coverage, component_scores, meal_type)

    return {
        "score": total_score,
        "status": status,
        "component_scores": component_scores,
        "nutrition": nutrition,
        "coverage": coverage,
        "explanation": explanation,
        "recommendations": recommendations,
    }


# ═════════════════════════════════════════════════════════════════════
#  EXPLANATION & RECOMMENDATIONS
# ═════════════════════════════════════════════════════════════════════

def _build_explanation(
    score: float,
    status: str,
    coverage: dict,
    component_scores: dict,
    age_group: str,
    meal_type: str,
) -> dict:
    """Build a human-readable explanation of the score."""
    # Find the weakest component
    weakest = min(component_scores.items(), key=lambda x: x[1]["score"])
    strongest = max(component_scores.items(), key=lambda x: x[1]["score"])

    # Critical nutrient shortfalls
    critical_nutrients = nutrition_db.get_critical_nutrients()
    shortfalls = []
    for nutrient in critical_nutrients:
        info = coverage.get(nutrient, {})
        if info.get("coverage_pct", 100) < 80:
            shortfalls.append({
                "nutrient": nutrient,
                "actual": info.get("actual", 0),
                "required": info.get("required", 0),
                "coverage_pct": info.get("coverage_pct", 0),
            })

    return {
        "score": score,
        "status": status,
        "age_group": age_group,
        "meal_type": meal_type,
        "summary": _status_summary(status, score),
        "weakest_component": {
            "name": weakest[0],
            "score": weakest[1]["score"],
        },
        "strongest_component": {
            "name": strongest[0],
            "score": strongest[1]["score"],
        },
        "critical_shortfalls": shortfalls,
    }


def _status_summary(status: str, score: float) -> str:
    if status == "PASS":
        return f"This meal meets the selected nutritional criteria with a score of {score}/100."
    elif status == "REVIEW":
        return (
            f"This meal is close to the threshold (score: {score}/100). "
            "Some nutrient levels may be borderline — review recommended."
        )
    else:
        return (
            f"This meal does not meet key nutritional criteria (score: {score}/100). "
            "Significant improvements are needed."
        )


def _build_recommendations(
    coverage: dict,
    component_scores: dict,
    meal_type: str,
) -> list[dict[str, str]]:
    """Generate actionable improvement suggestions."""
    recs: list[dict[str, str]] = []

    # Protein shortfall
    protein = coverage.get("protein_g", {})
    if protein.get("coverage_pct", 100) < 80:
        shortfall = protein.get("shortfall", 0)
        recs.append({
            "problem": "Protein is below the selected benchmark.",
            "suggestion": "Increase the pulse/protein component.",
            "detail": f"Add approximately {round(shortfall / 0.07)}g of dal or equivalent pulse to bridge the ~{shortfall}g protein gap.",
        })

    # Energy shortfall
    energy = coverage.get("energy_kcal", {})
    if energy.get("coverage_pct", 100) < 80:
        recs.append({
            "problem": "Energy intake is below the selected benchmark.",
            "suggestion": "Increase cereal portion (rice/roti) or add an energy-dense item.",
            "detail": f"Current: {energy.get('actual', 0)} kcal vs required: {energy.get('required', 0)} kcal.",
        })

    # Iron shortfall
    iron = coverage.get("iron_mg", {})
    if iron.get("coverage_pct", 100) < 80:
        recs.append({
            "problem": "Iron content is below the selected benchmark.",
            "suggestion": "Add iron-rich foods such as spinach (palak) or egg.",
            "detail": f"Current: {iron.get('actual', 0)} mg vs required: {iron.get('required', 0)} mg.",
        })

    # Missing required components
    comp = component_scores.get("meal_components", {}).get("details", {})
    missing = comp.get("required_missing", [])
    if missing:
        recs.append({
            "problem": f"Required food categories missing: {', '.join(missing)}.",
            "suggestion": f"Add a food item from: {', '.join(missing)}.",
            "detail": "The meal should contain at least one item from each required category.",
        })

    # Calcium shortfall
    calcium = coverage.get("calcium_mg", {})
    if calcium.get("coverage_pct", 100) < 60:
        recs.append({
            "problem": "Calcium content is significantly low.",
            "suggestion": "Consider adding dairy (milk, curd) or calcium-rich greens.",
            "detail": f"Current: {calcium.get('actual', 0)} mg vs required: {calcium.get('required', 0)} mg.",
        })

    if not recs:
        recs.append({
            "problem": "No significant issues detected.",
            "suggestion": "Meal meets the configured nutritional criteria.",
            "detail": "Continue maintaining the current meal composition.",
        })

    return recs

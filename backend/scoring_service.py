import os
import json
from typing import Dict, Any

# Load Age Requirements
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "age_requirements.json")
with open(DB_PATH, 'r') as f:
    AGE_REQUIREMENTS = json.load(f)

def calculate_score(quantities: Dict[str, float], total_nutrition: Dict[str, float], age_group: str) -> Dict[str, Any]:
    if age_group not in AGE_REQUIREMENTS:
        # Fallback to a default if unknown
        age_group = "11-14"
        
    targets = AGE_REQUIREMENTS[age_group]
    
    # 1. Calculate Component Scores (out of 100 each)
    protein_score = min(100, (total_nutrition.get("protein", 0) / targets["target_protein_g"]) * 100)
    energy_score = min(100, (total_nutrition.get("calories", 0) / targets["target_calories"]) * 100)
    
    # Check for vegetables and fruits
    has_veg = any("vegetable" in k or "curry" in k or "dal" in k or "chutney" in k for k in quantities.keys())
    has_fruit = any("fruit" in k or "banana" in k or "melon" in k or "apple" in k for k in quantities.keys())
    
    variety_score = 50
    if has_veg: variety_score += 25
    if has_fruit: variety_score += 25
        
    # Final Score (Weighted)
    # Protein: 40%, Energy: 40%, Variety: 20%
    final_score = (protein_score * 0.40) + (energy_score * 0.40) + (variety_score * 0.20)
    final_score = round(final_score, 1)
    
    # 2. Determine Status
    if final_score >= 80:
        status = "PASS"
    elif final_score >= 60:
        status = "REVIEW"
    else:
        status = "FAIL"
        
    # 3. Generate "Why" and Recommendations
    issues = []
    recommendations = []
    
    if protein_score < 80:
        issues.append(f"Protein is below benchmark ({round(total_nutrition.get('protein', 0), 1)}g vs {targets['target_protein_g']}g)")
        recommendations.append("Increase pulse/protein component (e.g. add ~30g dal).")
        
    if energy_score < 80:
        issues.append(f"Energy is below benchmark ({round(total_nutrition.get('calories', 0), 0)} kcal vs {targets['target_calories']} kcal)")
        recommendations.append("Increase main carbohydrate portion (e.g. rice or roti).")
        
    if not has_veg:
        issues.append("Missing vegetable component")
        recommendations.append("Add 1 serving of vegetables.")
        
    if not has_fruit:
        issues.append("Missing fruit component")
        recommendations.append("Add 1 serving of seasonal fruit.")
        
    if len(issues) == 0:
        issues.append("Meal meets all nutritional targets comfortably.")
        recommendations.append("No changes needed. Excellent meal!")
        
    return {
        "score": final_score,
        "status": status,
        "issues": issues,
        "recommendations": recommendations,
        "targets": targets
    }

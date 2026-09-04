import sys
import os

# Add root directory to python path
sys.path.append(os.path.dirname(__file__))

from backend.ai_service import analyze_image
from backend.nutrition_service import score_meal

image_path = "imges/result.jpg"

if not os.path.exists(image_path):
    print(f"Error: Could not find test image at {image_path}")
    sys.exit(1)

print("Running AI analysis...")
try:
    result = analyze_image(image_path)
    print("\n--- AI Detections ---")
    for d in result.get("detections", []):
        print(f"Food: {d['food']:<25} | Confidence: {d['confidence']:.2f} | Pixels: {d['pixel_area']:>6} | Est Weight: {d['estimated_weight_g']}g")
        
    print("\n--- Estimated Quantities ---")
    for food, qty in result.get("quantities", {}).items():
        print(f"{food}: {qty}g")
        
    print("\nRunning Nutrition Scoring (Age: 10)...")
    score_result = score_meal(result.get("quantities", {}), 10)
    print(f"Status: {score_result['status']} (Score: {score_result['score']})")
    print(f"Nutrition: {score_result['nutrition']}")
    print(f"Explanation: {score_result['explanation']}")
    for rec in score_result['recommendations']:
        print(f"- {rec}")
    
except Exception as e:
    print(f"Test failed with error: {e}")

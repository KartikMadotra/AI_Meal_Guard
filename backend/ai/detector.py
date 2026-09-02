"""
AI MealGuard — Core Food Detector using Google Gemini API.

When an image is provided, it calls the Gemini API to perform
actual visual analysis of the food plate. If no image is provided,
it falls back to mock test profiles for demonstration purposes.
"""

import json
import base64
import random
import os
from typing import Any
from dotenv import load_dotenv

# Try loading from the global .env file first
load_dotenv(os.path.expanduser("~/.env"))
load_dotenv() # Load from project .env if exists

# ── Demo food profiles (Fallback) ───────────────────────────────────

DEMO_PLATES: dict[str, list[dict[str, Any]]] = {
    "plate_good": [
        {"food": "rice", "confidence": 0.94, "bbox": [50, 60, 280, 200]},
        {"food": "dal", "confidence": 0.91, "bbox": [300, 80, 450, 200]},
        {"food": "vegetable", "confidence": 0.88, "bbox": [300, 210, 450, 330]},
    ],
    "plate_low_protein": [
        {"food": "rice", "confidence": 0.95, "bbox": [50, 60, 300, 220]},
        {"food": "dal", "confidence": 0.72, "bbox": [320, 100, 400, 160]},
        {"food": "vegetable", "confidence": 0.86, "bbox": [310, 200, 450, 320]},
    ],
    "plate_missing_veg": [
        {"food": "rice", "confidence": 0.93, "bbox": [50, 60, 280, 200]},
        {"food": "dal", "confidence": 0.90, "bbox": [300, 80, 450, 220]},
    ],
    "plate_full": [
        {"food": "rice", "confidence": 0.96, "bbox": [30, 50, 220, 180]},
        {"food": "dal", "confidence": 0.93, "bbox": [230, 50, 380, 170]},
        {"food": "vegetable", "confidence": 0.89, "bbox": [230, 180, 380, 300]},
        {"food": "egg", "confidence": 0.92, "bbox": [390, 50, 470, 130]},
        {"food": "salad", "confidence": 0.85, "bbox": [390, 140, 470, 230]},
    ],
    "plate_roti": [
        {"food": "roti", "confidence": 0.94, "bbox": [50, 50, 220, 200]},
        {"food": "dal", "confidence": 0.91, "bbox": [240, 60, 400, 190]},
        {"food": "potato", "confidence": 0.87, "bbox": [240, 200, 400, 320]},
    ],
}

DEFAULT_PLATE = "plate_good"


def detect(
    image_path: str | None = None,
    plate_profile: str | None = None,
    image_data: str | None = None
) -> dict[str, Any]:
    """
    Perform food detection on a meal image.
    
    If `image_data` (base64 string) is provided and GEMINI_API_KEY is found,
    it calls the Gemini API to analyze the image accurately.
    Otherwise, it falls back to the mock profiles.
    """
    api_key = os.environ.get("GEMINI_API_KEY")

    if image_data and api_key:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            
            # Clean base64 string if it has the data URI prefix
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            
            img_bytes = base64.b64decode(image_data)
            
            prompt = """
            You are an AI Food Detection model. Analyze the provided image of a food plate.
            Identify the food components visible on the plate.
            
            Return your findings as a JSON array of objects. Each object must have:
            - "food": a string, the general category or name of the food (e.g. "rice", "dal", "vegetable", "roti", "salad", "egg", "potato", "milk", "curd"). Use simple broad categories.
            - "confidence": a float between 0.0 and 1.0 representing your confidence.
            - "bbox": an array of 4 integers representing [x1, y1, x2, y2] (just guess reasonable bounding boxes based on a 400x400 image).
            
            ONLY return the JSON array, no markdown formatting or extra text.
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=[
                    prompt,
                    types.Part.from_bytes(data=img_bytes, mime_type='image/jpeg'),
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                )
            )
            
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            detections = json.loads(text.strip())
            
            # Ensure format is correct
            valid_detections = []
            for d in detections:
                valid_detections.append({
                    "food": str(d.get("food", "unknown")).lower(),
                    "confidence": float(d.get("confidence", 0.9)),
                    "bbox": d.get("bbox", [50, 50, 200, 200])
                })
                
            return {
                "detections": valid_detections,
                "num_detections": len(valid_detections),
                "model_info": {
                    "model": "Gemini 2.5 Flash (Vision)",
                    "mode": "live",
                    "note": "Analyzed using Gemini API."
                }
            }
            
        except Exception as e:
            print(f"Gemini API error: {e}. Falling back to mock data.")

    # ── Fallback ──
    profile = plate_profile or DEFAULT_PLATE
    base_detections = DEMO_PLATES.get(profile, DEMO_PLATES[DEFAULT_PLATE])

    detections = []
    for det in base_detections:
        noise = random.uniform(-0.03, 0.03)
        detections.append({
            "food": det["food"],
            "confidence": round(min(0.99, max(0.5, det["confidence"] + noise)), 2),
            "bbox": det["bbox"],
        })

    return {
        "detections": detections,
        "num_detections": len(detections),
        "model_info": {
            "model": "MealGuard-YOLO-v1 (mock)",
            "mode": "simulation",
            "note": "Mock data fallback because Gemini API wasn't available or failed.",
        },
    }

def list_demo_plates() -> list[str]:
    return list(DEMO_PLATES.keys())

"""
AI MealGuard — Mock Food Detector.

Simulates YOLO-based food detection for the competition prototype.
When a trained model is available, replace the `detect()` function
with real Ultralytics inference.
"""

import random
from typing import Any


# ── Demo food profiles ──────────────────────────────────────────────
# Each profile simulates what the AI would detect for a type of plate.

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

# Default plate when no specific profile is matched
DEFAULT_PLATE = "plate_good"


def detect(
    image_path: str | None = None,
    plate_profile: str | None = None,
) -> dict[str, Any]:
    """
    Simulate food detection on a meal image.

    In the real system, this would run:
        model = YOLO(model_path)
        results = model(image)

    Parameters
    ----------
    image_path : str, optional
        Path to the meal image (unused in mock).
    plate_profile : str, optional
        Name of a demo plate profile for controlled testing.

    Returns
    -------
    dict with:
        - detections: list of detected food items
        - model_info: mock model metadata
    """
    profile = plate_profile or DEFAULT_PLATE
    base_detections = DEMO_PLATES.get(profile, DEMO_PLATES[DEFAULT_PLATE])

    # Add slight randomness to confidence scores to feel realistic
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
            "note": "Replace with real Ultralytics model for production.",
        },
    }


def list_demo_plates() -> list[str]:
    """Return available demo plate profiles."""
    return list(DEMO_PLATES.keys())

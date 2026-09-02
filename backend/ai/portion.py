"""
AI MealGuard — Portion / Quantity Estimation.

Estimates food quantities in grams from detection results.
In the real system this would use segmentation area + calibration.
Currently uses demo profiles mapped to realistic quantities.
"""

import random
from typing import Any


# ── Calibration profiles ────────────────────────────────────────────
# Maps plate_profile → food → estimated grams.
# In the real system, this comes from segmented area × density factor.

QUANTITY_PROFILES: dict[str, dict[str, float]] = {
    "plate_good": {
        "rice": 150.0,
        "dal": 100.0,
        "vegetable": 75.0,
    },
    "plate_low_protein": {
        "rice": 180.0,
        "dal": 35.0,        # deliberately low
        "vegetable": 60.0,
    },
    "plate_missing_veg": {
        "rice": 160.0,
        "dal": 110.0,
        # no vegetable
    },
    "plate_full": {
        "rice": 140.0,
        "dal": 90.0,
        "vegetable": 70.0,
        "egg": 50.0,        # ~1 egg
        "salad": 40.0,
    },
    "plate_roti": {
        "roti": 90.0,       # ~2 rotis
        "dal": 100.0,
        "potato": 80.0,
    },
}

# Fallback: if a food is detected but has no calibrated quantity
DEFAULT_QUANTITY_G: dict[str, float] = {
    "rice": 150.0,
    "dal": 80.0,
    "roti": 90.0,
    "vegetable": 65.0,
    "potato": 70.0,
    "egg": 50.0,
    "fruit": 80.0,
    "milk": 150.0,
    "curd": 80.0,
    "salad": 50.0,
    "spinach": 60.0,
    "chicken": 60.0,
}


def estimate_quantities(
    detections: list[dict[str, Any]],
    plate_profile: str | None = None,
) -> dict[str, float]:
    """
    Estimate the quantity (grams) of each detected food.

    Parameters
    ----------
    detections : list
        Output from detector.detect()["detections"].
    plate_profile : str, optional
        Use calibrated profile if available.

    Returns
    -------
    dict  food_key → estimated grams (with slight noise for realism).
    """
    profile_quantities = QUANTITY_PROFILES.get(plate_profile or "", {})
    quantities: dict[str, float] = {}

    for det in detections:
        food = det["food"]
        # Use profile value, or fallback default
        base = profile_quantities.get(food, DEFAULT_QUANTITY_G.get(food, 60.0))
        # Add ±5% noise for realism
        noise = random.uniform(-0.05, 0.05)
        estimated = round(base * (1 + noise))
        quantities[food] = max(5, estimated)  # at least 5g

    return quantities

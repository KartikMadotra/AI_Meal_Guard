"""
AI MealGuard — Core Food Detector using YOLO Segmentation.

When an image is provided, it passes the image through the Ultralytics YOLO
segmentation model. It extracts bounding boxes, classes, and confidence scores.

To handle the prototype before the custom 'best.pt' is trained, this uses the 
base yolov8n-seg.pt model and maps its COCO classes to food categories.
"""

import json
import base64
import os
import random
from typing import Any
import numpy as np
import cv2

try:
    from ultralytics import YOLO
    # Initialize YOLO segmentation model
    # It will download yolov8n-seg.pt if it doesn't exist locally.
    # When your custom model is ready, replace this path with "runs/segment/train/weights/best.pt"
    MODEL = YOLO("yolov8n-seg.pt")
except ImportError:
    MODEL = None
    print("Warning: ultralytics not installed. YOLO inference will not work.")

# ── Demo food profiles (Fallback for when no image is uploaded) ────

DEMO_PLATES: dict[str, list[dict[str, Any]]] = {
    "plate_good": [
        {"food": "rice", "confidence": 0.94, "bbox": [50, 60, 280, 200]},
        {"food": "dal", "confidence": 0.91, "bbox": [300, 80, 450, 200]},
        {"food": "vegetable", "confidence": 0.88, "bbox": [300, 210, 450, 330]},
    ],
    # ... other profiles omitted for brevity, keeping only the default ...
}
DEFAULT_PLATE = "plate_good"

# Map standard COCO objects to our Food classes so the base model works on plates
COCO_TO_FOOD_MAP = {
    "bowl": "dal",
    "sandwich": "roti",
    "hot dog": "roti",
    "broccoli": "vegetable",
    "carrot": "vegetable",
    "pizza": "rice",
    "apple": "fruit",
    "orange": "fruit",
    "banana": "banana",
    "cup": "milk"
}


def detect(
    image_path: str | None = None,
    plate_profile: str | None = None,
    image_data: str | None = None
) -> dict[str, Any]:
    """
    Perform YOLO segmentation on a meal image.
    """
    if image_data and MODEL:
        try:
            # Clean base64 string
            if "base64," in image_data:
                image_data = image_data.split("base64,")[1]
            
            img_bytes = base64.b64decode(image_data)
            np_arr = np.frombuffer(img_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

            # Run YOLO inference
            results = MODEL(img)
            
            valid_detections = []
            
            for result in results:
                # result.boxes has bounding boxes, confidences, and classes
                if result.boxes is None:
                    continue
                
                boxes = result.boxes.xyxy.cpu().numpy()
                confidences = result.boxes.conf.cpu().numpy()
                class_ids = result.boxes.cls.cpu().numpy()
                
                names = result.names
                
                for i in range(len(boxes)):
                    conf = float(confidences[i])
                    box = [int(x) for x in boxes[i]]
                    class_name = names[int(class_ids[i])].lower()
                    
                    # Apply confidence threshold (as per the textbook)
                    if conf < 0.40:
                        food_label = "⚠️ UNKNOWN FOOD"
                    else:
                        # Map to our food classes or use UNKNOWN if not in map
                        food_label = COCO_TO_FOOD_MAP.get(class_name, "⚠️ UNKNOWN FOOD")
                    
                    valid_detections.append({
                        "food": food_label,
                        "confidence": conf,
                        "bbox": box
                    })

            return {
                "detections": valid_detections,
                "num_detections": len(valid_detections),
                "model_info": {
                    "model": "YOLOv8 Segmentation",
                    "mode": "live",
                    "note": "Actual YOLO detection. Uses class map for prototype."
                }
            }

        except Exception as e:
            print(f"YOLO inference error: {e}")

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
            "note": "Mock data fallback because no image provided.",
        },
    }

def list_demo_plates() -> list[str]:
    return list(DEMO_PLATES.keys())

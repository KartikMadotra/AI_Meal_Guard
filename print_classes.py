from ultralytics import YOLO
import sys

try:
    model = YOLO('backend/ai/best.pt')
    with open('model_names.txt', 'w') as f:
        f.write(str(model.names))
    print("SUCCESS: wrote model names to model_names.txt")
except Exception as e:
    print(f"FAILED: {e}")

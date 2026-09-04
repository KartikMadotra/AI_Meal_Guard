import os
from ultralytics import YOLO
from backend.nutrition_service import get_density_factor

# ── 1. Model Loading ──
MODEL_PATH = os.path.join(os.path.dirname(__file__), "best.pt")
model = YOLO(MODEL_PATH) if os.path.exists(MODEL_PATH) else None

# ── 2. The Unscrambler (Model Output → True Name) ──
# The ground truth mask classes were actually from seg_full_final.json (50 classes).
WRONG_NAMES = [
    "aloo-dry-fry", "avakaya-muddha-papu-rice", "baby-corn-capsicum-dry", "cabbage-pakodi",
    "cabbage-fry", "capsicum-paneer-curry", "chakar-pongal", "chole-masala",
    "cluster-beans-curry", "cucumber-raitha", "dal-fry", "gobi-masala-curry",
    "gutti-vankaya-curry", "jeera-rice", "leaf-dal", "mixed-curry", "ivy-dal-gourd-curry",
    "muskmelon", "pappu-charu", "rajma", "rasgulla", "sambar", "tomato-rasam",
    "vankaya-ali-karam", "veg-biriyani", "aloo-curry", "curd", "dal", "fresh-chutney",
    "green-salad", "moong-beans-curry", "khichdi", "lemon-rice", "live-roti-with-ghee",
    "non-spicy-curry-bottle-gourd", "non-spicy-dal", "papad", "plain-rice", "watermelon",
    "aloo-fry", "banana", "mix-fruit", "non-spicy-baby-corn-capsicum-dry", "sweet",
    "tomato-rice", "fried-papad-rings", "gravy", "ivy-gourd-fry", "mango-pickle", "papad-chat"
]
CORRECT_NAMES = [
    "aloo-dry-fry", "avakaya-muddha-papu-rice", "baby-corn-capsicum-dry", "cabbage-pakodi",
    "cabbage-fry", "capsicum-paneer-curry", "chakar-pongal", "chole-masala",
    "cluster-beans-curry", "cucumber-raitha", "gobi-masala-curry", "gutti-vankaya-curry",
    "jeera-rice", "mixed-curry", "muskmelon", "rajma", "rasgulla", "sambar",
    "tomato-rasam", "vankaya-ali-karam", "veg-biriyani", "aloo-curry", "curd",
    "dal", "fresh-chutney", "green-salad", "moong-beans-curry", "khichdi",
    "lemon-rice", "live-roti-with-ghee", "non-spicy-curry-bottle-gourd", "papad",
    "plain-rice", "watermelon", "aloo-fry", "banana", "mix-fruit",
    "non-spicy-baby-corn-capsicum-dry", "sweet", "tomato-rice", "fried-papad-rings",
    "gravy", "ivy-gourd-fry", "mango-pickle", "papad-chat", "pepper-rasam",
    "pineapple", "corn-fry", "paneer-curry", "semiya"
]
UNSCRAMBLE = dict(zip(WRONG_NAMES, CORRECT_NAMES))

# ── 3. Reference Scale for Weight ──
# Grams per 1000 pixels
BASE_PIXELS_TO_GRAMS = 25.0 / 1000.0  # 25g per 1000 pixels at reference depth

def analyze_image(image_path: str):
    """Run YOLO inference and extract precise masks and weights."""
    if not model:
        return {"error": "Model not found."}

    results = model(image_path)
    if not results:
        return {"detections": [], "quantities": {}}
        
    result = results[0]
    names = result.names
    
    detections = []
    quantities = {}

    if result.boxes and result.masks:
        boxes = result.boxes.cpu().numpy()
        masks = result.masks.data.cpu().numpy() # [N, H, W] tensor of masks

        for i, (box, mask) in enumerate(zip(boxes, masks)):
            class_id = int(box.cls[0])
            raw_name = names[class_id].lower()
            confidence = float(box.conf[0])
            
            # Fix the label shift
            true_food_name = UNSCRAMBLE.get(raw_name, raw_name)
            
            # Get the exact bounding box
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            
            # ── Pixel-Area-based Weight Estimation ──
            # Calculate total non-zero pixels in the mask for this object
            pixel_area = mask.sum() 
            
            # Lookup density factor (rice is denser than papad)
            density = get_density_factor(true_food_name)
            
            # Calculate weight
            estimated_weight_grams = round(pixel_area * BASE_PIXELS_TO_GRAMS * density, 1)

            detections.append({
                "food": true_food_name,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2],
                "pixel_area": int(pixel_area),
                "estimated_weight_g": estimated_weight_grams
            })
            
            # Aggregate quantities for scoring
            if true_food_name in quantities:
                quantities[true_food_name] += estimated_weight_grams
            else:
                quantities[true_food_name] = estimated_weight_grams
                
    return {
        "detections": detections,
        "quantities": quantities
    }

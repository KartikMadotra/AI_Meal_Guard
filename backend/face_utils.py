import face_recognition
import numpy as np
import base64
import io
import json
from PIL import Image

def decode_base64_image(base64_str):
    if "base64," in base64_str:
        base64_str = base64_str.split("base64,")[1]
    img_data = base64.b64decode(base64_str)
    # Explicitly load via PIL, force RGB, force uint8, force contiguous
    image = Image.open(io.BytesIO(img_data)).convert('RGB')
    img_array = np.array(image, dtype=np.uint8)
    return np.ascontiguousarray(img_array)

def get_face_encoding(base64_img):
    img = decode_base64_image(base64_img)
    face_locations = face_recognition.face_locations(img)
    if not face_locations:
        return None
    
    # Get encoding for the first face found
    encodings = face_recognition.face_encodings(img, face_locations)
    if encodings:
        return encodings[0].tolist() # Convert numpy array to list for JSON serialization
    return None

def find_matching_student(unknown_encoding, students, tolerance=0.6):
    if not unknown_encoding:
        return None
        
    known_encodings = []
    student_ids = []
    
    for s in students:
        if s.get("face_encoding"):
            known_encodings.append(np.array(s["face_encoding"]))
            student_ids.append(s["id"])
            
    if not known_encodings:
        return None
        
    unknown_enc_np = np.array(unknown_encoding)
    distances = face_recognition.face_distance(known_encodings, unknown_enc_np)
    
    best_match_index = np.argmin(distances)
    if distances[best_match_index] <= tolerance:
        return student_ids[best_match_index]
        
    return None

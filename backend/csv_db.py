import os
import csv
import json
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
os.makedirs(DATA_DIR, exist_ok=True)

STUDENTS_CSV = os.path.join(DATA_DIR, "students.csv")
MEALS_CSV = os.path.join(DATA_DIR, "meal_history.csv")

def _init_csv(file_path, headers):
    if not os.path.exists(file_path):
        with open(file_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers)

# Initialize CSV files
_init_csv(STUDENTS_CSV, ["id", "name", "age", "age_group", "class_number", "face_encoding", "created_at"])
_init_csv(MEALS_CSV, ["id", "student_id", "student_name", "student_age", "age_group", "meal_type", "analysis_date", "detected_foods", "estimated_quantities", "nutrition_values", "score", "status", "component_scores", "explanation", "recommendations"])

def save_student(student_id, name, age, age_group, class_number, face_encoding=None):
    _init_csv(STUDENTS_CSV, ["id", "name", "age", "age_group", "class_number", "face_encoding", "created_at"])
    encoding_str = json.dumps(face_encoding) if face_encoding else ""
    created_at = datetime.utcnow().isoformat()
    
    with open(STUDENTS_CSV, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([student_id, name, age, age_group, class_number, encoding_str, created_at])

def get_all_students():
    students = []
    if not os.path.exists(STUDENTS_CSV): return students
    with open(STUDENTS_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("face_encoding"):
                row["face_encoding"] = json.loads(row["face_encoding"])
            else:
                row["face_encoding"] = None
            row["age"] = int(row["age"])
            students.append(row)
    return students

def get_student_by_id(student_id):
    students = get_all_students()
    for s in students:
        if s["id"] == student_id:
            return s
    return None

def save_meal_analysis(student_id, student_name, student_age, age_group, meal_type, detected_foods, estimated_quantities, nutrition_values, score, status, component_scores, explanation, recommendations):
    _init_csv(MEALS_CSV, ["id", "student_id", "student_name", "student_age", "age_group", "meal_type", "analysis_date", "detected_foods", "estimated_quantities", "nutrition_values", "score", "status", "component_scores", "explanation", "recommendations"])
    analysis_date = datetime.utcnow().isoformat()
    # Generate auto-incrementing ID
    meals = get_all_meals()
    new_id = len(meals) + 1
    
    detected_foods_str = json.dumps(detected_foods)
    estimated_quantities_str = json.dumps(estimated_quantities)
    nutrition_values_str = json.dumps(nutrition_values)
    component_scores_str = json.dumps(component_scores)
    recs_str = json.dumps(recommendations)
    
    with open(MEALS_CSV, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            new_id, student_id, student_name, student_age, age_group, meal_type, 
            analysis_date, detected_foods_str, estimated_quantities_str, nutrition_values_str, 
            score, status, component_scores_str, explanation, recs_str
        ])

def get_all_meals():
    meals = []
    if not os.path.exists(MEALS_CSV): return meals
    
    with open(MEALS_CSV, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["id"] = int(row["id"])
            if row.get("student_age") and row["student_age"] != 'None':
                row["student_age"] = int(row["student_age"])
            else:
                row["student_age"] = None
            row["score"] = float(row["score"])
            row["detected_foods"] = json.loads(row["detected_foods"])
            row["estimated_quantities"] = json.loads(row["estimated_quantities"])
            row["nutrition_values"] = json.loads(row["nutrition_values"])
            row["component_scores"] = json.loads(row["component_scores"])
            row["recommendations"] = json.loads(row["recommendations"])
            meals.append(row)
    return meals

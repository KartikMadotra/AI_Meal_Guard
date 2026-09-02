// ── API types mirroring the backend responses ──────────

export interface Student {
  id: string;
  name: string;
  class_number: number;
  age: number;
  age_group: string;
  created_at: string;
}

export interface FoodNutrients {
  energy_kcal: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fibre_g: number;
  iron_mg: number;
  calcium_mg: number;
  vitamin_c_mg: number;
  zinc_mg: number;
}

export interface Detection {
  food: string;
  confidence: number;
  bbox: number[];
}

export interface ComponentScore {
  score: number;
  weight: number;
  details: Record<string, unknown>;
}

export interface CoverageItem {
  actual: number;
  required: number;
  coverage_pct: number;
  shortfall: number;
  adequate: boolean;
}

export interface Recommendation {
  problem: string;
  suggestion: string;
  detail: string;
}

export interface Explanation {
  score: number;
  status: string;
  age_group: string;
  meal_type: string;
  summary: string;
  weakest_component: { name: string; score: number };
  strongest_component: { name: string; score: number };
  critical_shortfalls: Array<{
    nutrient: string;
    actual: number;
    required: number;
    coverage_pct: number;
  }>;
}

export interface AnalysisResult {
  analysis_id: number;
  student: {
    id: string | null;
    name: string | null;
    age: number;
    age_group: string;
  };
  detection: {
    detections: Detection[];
    num_detections: number;
    model_info: Record<string, string>;
  };
  quantities: Record<string, number>;
  nutrition: {
    per_food: Record<string, {
      quantity_g: number;
      category: string;
      name: string;
      nutrients: FoodNutrients;
    }>;
    totals: FoodNutrients;
  };
  coverage: Record<string, CoverageItem>;
  score: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  component_scores: Record<string, ComponentScore>;
  explanation: Explanation;
  recommendations: Recommendation[];
}

export interface MealRecord {
  id: number;
  student_id: string | null;
  student_name: string | null;
  student_age: number;
  age_group: string;
  meal_type: string;
  score: number;
  status: 'PASS' | 'REVIEW' | 'FAIL';
  detected_foods: Detection[];
  estimated_quantities: Record<string, number>;
  nutrition_values: Record<string, unknown>;
  component_scores: Record<string, ComponentScore>;
  explanation: Record<string, unknown>;
  recommendations: Recommendation[];
  analysis_date: string;
}

export interface DashboardStats {
  total_meals: number;
  average_score: number;
  status_distribution: Record<string, number>;
  status_percentages: Record<string, number>;
  score_distribution: Record<string, number>;
  common_issues: Array<{ issue: string; count: number; percentage: number }>;
}

export interface WhatIfResult {
  original: {
    score: number;
    status: string;
    nutrition_totals: FoodNutrients;
    coverage: Record<string, CoverageItem>;
  };
  simulated: {
    score: number;
    status: string;
    quantities: Record<string, number>;
    additions: Record<string, number>;
    nutrition_totals: FoodNutrients;
    coverage: Record<string, CoverageItem>;
  };
  improvement: {
    score_change: number;
    status_change: string;
  };
}

export interface FoodItem {
  name: string;
  category: string;
  per_100g: FoodNutrients;
}

export interface AgeGroup {
  label: string;
  age_range: [number, number];
  daily: FoodNutrients;
  per_meal: FoodNutrients;
}

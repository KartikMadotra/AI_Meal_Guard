// ── API client for AI MealGuard backend ────────────────

import type {
  Student, AnalysisResult, MealRecord, DashboardStats,
  WhatIfResult, FoodItem, AgeGroup,
} from './types';

const BASE = '/api';

async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error: ${res.status}`);
  }
  return res.json();
}

// ── Students ──────────────────────────────────────────
export async function getStudents(): Promise<Student[]> {
  const data = await fetchJSON<{ students: Student[] }>(`${BASE}/students/`);
  return data.students;
}

export async function getStudent(id: string): Promise<Student> {
  const data = await fetchJSON<{ student: Student }>(`${BASE}/students/${id}`);
  return data.student;
}

export async function getAgeGroup(age: number) {
  return fetchJSON<{ age: number; age_group: string; label: string }>(
    `${BASE}/students/age-group/${age}`
  );
}

// ── Analysis ──────────────────────────────────────────
export async function analyzeMeal(params: {
  student_id?: string;
  age?: number;
  meal_type?: string;
  plate_profile?: string;
}): Promise<AnalysisResult> {
  return fetchJSON<AnalysisResult>(`${BASE}/analyze`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function getDemoPlates(): Promise<string[]> {
  const data = await fetchJSON<{ plates: string[] }>(`${BASE}/demo-plates`);
  return data.plates;
}

// ── What-If ───────────────────────────────────────────
export async function whatIf(params: {
  current_quantities: Record<string, number>;
  additions: Record<string, number>;
  age_group: string;
}): Promise<WhatIfResult> {
  return fetchJSON<WhatIfResult>(`${BASE}/what-if`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// ── Meals / History ───────────────────────────────────
export async function getMealHistory(params?: {
  student_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{ meals: MealRecord[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.student_id) q.set('student_id', params.student_id);
  if (params?.limit) q.set('limit', String(params.limit));
  if (params?.offset) q.set('offset', String(params.offset));
  return fetchJSON(`${BASE}/meals/history?${q}`);
}

export async function getMealDetail(id: number): Promise<MealRecord> {
  const data = await fetchJSON<{ meal: MealRecord }>(`${BASE}/meals/${id}`);
  return data.meal;
}

// ── Dashboard ─────────────────────────────────────────
export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchJSON<DashboardStats>(`${BASE}/dashboard/stats`);
}

// ── Nutrition Data ────────────────────────────────────
export async function getFoodDatabase(): Promise<Record<string, FoodItem>> {
  const data = await fetchJSON<{ foods: Record<string, FoodItem> }>(`${BASE}/nutrition/foods`);
  return data.foods;
}

export async function getAgeGroups(): Promise<Record<string, AgeGroup>> {
  const data = await fetchJSON<{ age_groups: Record<string, AgeGroup> }>(`${BASE}/nutrition/age-groups`);
  return data.age_groups;
}

export async function getMealRules() {
  const data = await fetchJSON<{ rules: Record<string, unknown> }>(`${BASE}/nutrition/meal-rules`);
  return data.rules;
}

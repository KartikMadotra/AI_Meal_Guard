# AI MealGuard 🍛

**AI-Powered Smart Monitoring for Nutritious School Meals — SDG 2: Zero Hunger**

An AI-based age-aware system for visual school meal assessment, nutritional monitoring, and meal quality improvement.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Create env file
copy .env.example .env

# Seed database with demo data
python -m backend.seed

# Start server (http://127.0.0.1:8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Docker

```bash
docker-compose up --build
```

## Architecture

```
Frontend (React + TypeScript + Vite + Tailwind CSS + Recharts)
  │
  ├── Dashboard — Aggregate stats, charts, common issues
  ├── Scan Meal — Student ID / Age entry → AI detection → Score
  ├── Meal History — Timeline with detail panel
  ├── Students — Demo student registry
  ├── Food Database — 12 Indian school meal foods
  ├── Age Requirements — ICMR-NIN RDA benchmarks
  ├── What-If Simulator — Model meal improvements
  └── Settings — System configuration
  │
  │ HTTP API (JSON)
  │
Backend (Python + FastAPI + SQLAlchemy + SQLite)
  │
  ├── AI Layer — YOLO food detection (mock → real)
  ├── Nutrition Engine — food × quantity → nutrients
  ├── Scoring Engine — 5-component weighted (0–100)
  └── Data Layer — nutrition.json, age_requirements.json, meal_rules.json
```

## Scoring Model

| Component | Weight | Description |
|-----------|--------|-------------|
| Protein adequacy | 30% | Coverage vs age-specific benchmark |
| Energy adequacy | 25% | Calories vs requirement |
| Meal components | 20% | Required food categories present |
| Micronutrients | 15% | Iron, calcium, vitamin C, zinc |
| Portion adequacy | 10% | Within configured ranges |

**Status**: PASS (≥75) · REVIEW (≥50) · FAIL (<50)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analyze` | Full meal analysis pipeline |
| `POST` | `/api/what-if` | What-If simulator |
| `GET` | `/api/students/` | List all students |
| `GET` | `/api/meals/history` | Meal history |
| `GET` | `/api/dashboard/stats` | Dashboard statistics |
| `GET` | `/api/nutrition/foods` | Food database |
| `GET` | `/api/nutrition/age-groups` | Age requirements |
| `GET` | `/docs` | Interactive Swagger UI |

## Tech Stack

- **Backend**: Python, FastAPI, SQLAlchemy, SQLite, PyTorch, Ultralytics, OpenCV
- **Frontend**: React, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons
- **Deployment**: Docker, Docker Compose

## SDG 2 Connection

This system helps ensure food provided to school students is nutritionally adequate and that deficiencies can be identified and addressed — directly supporting **SDG 2: Zero Hunger**.

## License

School competition project. All rights reserved.

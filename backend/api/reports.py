"""
AI MealGuard — Dashboard / Reports API routes.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models.meal import MealAnalysis

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """
    Aggregate statistics for the school meal dashboard.

    Returns total meals, average score, status distribution,
    and common nutritional issues.
    """
    # Total meals
    total = (await db.execute(select(func.count(MealAnalysis.id)))).scalar() or 0

    if total == 0:
        return {
            "total_meals": 0,
            "average_score": 0,
            "status_distribution": {"PASS": 0, "REVIEW": 0, "FAIL": 0},
            "status_percentages": {"PASS": 0, "REVIEW": 0, "FAIL": 0},
            "common_issues": [],
        }

    # Average score
    avg_score = (
        await db.execute(select(func.avg(MealAnalysis.score)))
    ).scalar() or 0

    # Status counts
    status_dist: dict[str, int] = {"PASS": 0, "REVIEW": 0, "FAIL": 0}
    for status in ["PASS", "REVIEW", "FAIL"]:
        count = (
            await db.execute(
                select(func.count(MealAnalysis.id)).where(
                    MealAnalysis.status == status
                )
            )
        ).scalar() or 0
        status_dist[status] = count

    status_pct = {
        k: round((v / total) * 100, 1) for k, v in status_dist.items()
    }

    # Common issues — scan recommendations from recent meals
    recent_meals = (
        await db.execute(
            select(MealAnalysis.recommendations)
            .order_by(MealAnalysis.analysis_date.desc())
            .limit(100)
        )
    ).scalars().all()

    issue_counter: dict[str, int] = {}
    for recs in recent_meals:
        if isinstance(recs, list):
            for rec in recs:
                problem = rec.get("problem", "") if isinstance(rec, dict) else ""
                if problem and "No significant issues" not in problem:
                    issue_counter[problem] = issue_counter.get(problem, 0) + 1

    common_issues = sorted(
        [{"issue": k, "count": v, "percentage": round((v / total) * 100, 1)}
         for k, v in issue_counter.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:5]

    # Score distribution (for charts)
    score_ranges = {
        "0-20": 0, "21-40": 0, "41-60": 0,
        "61-80": 0, "81-100": 0,
    }
    all_scores = (
        await db.execute(select(MealAnalysis.score))
    ).scalars().all()

    for s in all_scores:
        if s <= 20:
            score_ranges["0-20"] += 1
        elif s <= 40:
            score_ranges["21-40"] += 1
        elif s <= 60:
            score_ranges["41-60"] += 1
        elif s <= 80:
            score_ranges["61-80"] += 1
        else:
            score_ranges["81-100"] += 1

    return {
        "total_meals": total,
        "average_score": round(avg_score, 1),
        "status_distribution": status_dist,
        "status_percentages": status_pct,
        "score_distribution": score_ranges,
        "common_issues": common_issues,
    }

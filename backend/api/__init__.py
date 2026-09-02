from backend.api.students import router as students_router
from backend.api.analysis import router as analysis_router
from backend.api.meals import router as meals_router
from backend.api.reports import router as reports_router

__all__ = ["students_router", "analysis_router", "meals_router", "reports_router"]

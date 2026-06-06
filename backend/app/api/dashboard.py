"""Dashboard API - returns user practice statistics."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.practice_session import PracticeSession
from ..schemas.dashboard import DashboardStatsOut
from ..utils.seed_data import seed_all

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsOut)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Return total practice count, average score, and best score."""
    await seed_all(db)

    result = await db.execute(
        select(
            func.count(PracticeSession.id).label("total"),
            func.avg(PracticeSession.overall_score).label("avg_score"),
            func.max(PracticeSession.overall_score).label("max_score"),
        )
    )
    row = result.one()
    total = row.total or 0
    avg = round(float(row.avg_score or 0), 1)
    best = int(row.max_score or 0)

    return DashboardStatsOut(totalPractice=total, averageScore=avg, bestScore=float(best))

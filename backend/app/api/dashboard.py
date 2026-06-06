"""Dashboard API - returns user practice statistics."""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.practice_session import PracticeSession
from ..schemas.dashboard import DashboardStatsOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

# Seed data matching frontend mock (history entries in mock_data.ts)
SEED_SESSIONS = [
    {"id": 1, "scenario": "面试", "difficulty": "中等", "start_time": datetime(2026, 6, 5, 10, 0), "end_time": datetime(2026, 6, 5, 10, 11), "total_rounds": 8, "overall_score": 85.0},
    {"id": 2, "scenario": "餐厅", "difficulty": "简单", "start_time": datetime(2026, 6, 4, 14, 0), "end_time": datetime(2026, 6, 4, 14, 8), "total_rounds": 4, "overall_score": 78.0},
    {"id": 3, "scenario": "会议", "difficulty": "困难", "start_time": datetime(2026, 6, 3, 9, 0), "end_time": datetime(2026, 6, 3, 9, 15), "total_rounds": 6, "overall_score": 91.0},
    {"id": 4, "scenario": "旅行", "difficulty": "简单", "start_time": datetime(2026, 6, 2, 16, 0), "end_time": datetime(2026, 6, 2, 16, 10), "total_rounds": 5, "overall_score": 82.0},
    {"id": 5, "scenario": "面试", "difficulty": "中等", "start_time": datetime(2026, 6, 1, 11, 0), "end_time": datetime(2026, 6, 1, 11, 12), "total_rounds": 8, "overall_score": 88.0},
    {"id": 6, "scenario": "餐厅", "difficulty": "简单", "start_time": datetime(2026, 5, 30, 15, 0), "end_time": datetime(2026, 5, 30, 15, 9), "total_rounds": 4, "overall_score": 75.0},
    {"id": 7, "scenario": "会议", "difficulty": "困难", "start_time": datetime(2026, 5, 29, 10, 0), "end_time": datetime(2026, 5, 29, 10, 14), "total_rounds": 6, "overall_score": 86.0},
    {"id": 8, "scenario": "旅行", "difficulty": "简单", "start_time": datetime(2026, 5, 28, 13, 0), "end_time": datetime(2026, 5, 28, 13, 13), "total_rounds": 5, "overall_score": 90.0},
]


async def seed_if_empty(db: AsyncSession):
    """Insert seed data if the practice_sessions table is empty."""
    result = await db.execute(select(func.count(PracticeSession.id)))
    count = result.scalar()
    if count == 0:
        for s in SEED_SESSIONS:
            db.add(PracticeSession(**s))
        await db.flush()


@router.get("/stats", response_model=DashboardStatsOut)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    """Return total practice count, average score, and best score."""
    await seed_if_empty(db)

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

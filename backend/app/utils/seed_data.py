"""Shared seed data — called by any endpoint that needs initial data."""

from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.practice_session import PracticeSession
from ..models.evaluation import Evaluation

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

SEED_EVALUATIONS = [
    {"id": 1, "session_id": 1, "error_type": "general", "error_count": 2, "grammar_score": 82.0, "pronunciation_score": 87.0},
    {"id": 2, "session_id": 2, "error_type": "general", "error_count": 3, "grammar_score": 75.0, "pronunciation_score": 80.0},
    {"id": 3, "session_id": 3, "error_type": "general", "error_count": 1, "grammar_score": 90.0, "pronunciation_score": 92.0},
    {"id": 4, "session_id": 4, "error_type": "general", "error_count": 2, "grammar_score": 80.0, "pronunciation_score": 83.0},
    {"id": 5, "session_id": 5, "error_type": "general", "error_count": 1, "grammar_score": 86.0, "pronunciation_score": 89.0},
    {"id": 6, "session_id": 6, "error_type": "general", "error_count": 3, "grammar_score": 72.0, "pronunciation_score": 78.0},
    {"id": 7, "session_id": 7, "error_type": "general", "error_count": 2, "grammar_score": 85.0, "pronunciation_score": 88.0},
    {"id": 8, "session_id": 8, "error_type": "general", "error_count": 1, "grammar_score": 89.0, "pronunciation_score": 91.0},
]


async def seed_all(db: AsyncSession):
    """Seed all tables if they are empty."""
    # Seed sessions
    result = await db.execute(select(func.count(PracticeSession.id)))
    if result.scalar() == 0:
        for s in SEED_SESSIONS:
            db.add(PracticeSession(**s))

    # Seed evaluations
    result = await db.execute(select(func.count(Evaluation.id)))
    if result.scalar() == 0:
        for e in SEED_EVALUATIONS:
            db.add(Evaluation(**e))

    await db.flush()

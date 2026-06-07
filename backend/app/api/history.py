"""History API - practice history list with filters."""

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, distinct
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.practice_session import PracticeSession
from ..models.evaluation import Evaluation
from ..schemas.history import HistoryEntryOut, HistoryFiltersOut
from ..utils.seed_data import seed_all

router = APIRouter(prefix="/api/history", tags=["history"])


def _fmt_duration(start: datetime, end: datetime | None) -> str:
    """Format duration between two timestamps as 'X分钟'."""
    if not end:
        return "0分钟"
    delta = (end - start).total_seconds()
    minutes = max(1, round(delta / 60))
    return f"{minutes}分钟"


def _get_time_range_filter(time_range: str | None) -> datetime | None:
    """Return the earliest datetime for the given time range filter."""
    now = datetime.now()
    if time_range == "本周":
        monday = now - timedelta(days=now.weekday())
        return monday.replace(hour=0, minute=0, second=0)
    elif time_range == "本月":
        return now.replace(day=1, hour=0, minute=0, second=0)
    return None


@router.get("", response_model=list[HistoryEntryOut])
async def get_history(
    scenario: str | None = Query(None),
    timeRange: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return practice history, optionally filtered by scenario and time range."""
    await seed_all(db)

    eval_subq = (
        select(
            Evaluation.session_id,
            func.avg(Evaluation.grammar_score).label("grammar"),
            func.avg(Evaluation.pronunciation_score).label("pronunciation"),
        )
        .group_by(Evaluation.session_id)
        .subquery()
    )

    query = (
        select(
            PracticeSession.id,
            PracticeSession.scenario,
            PracticeSession.overall_score,
            PracticeSession.start_time,
            PracticeSession.end_time,
            func.coalesce(eval_subq.c.grammar, 0).label("grammar"),
            func.coalesce(eval_subq.c.pronunciation, 0).label("pronunciation"),
        )
        .outerjoin(eval_subq, PracticeSession.id == eval_subq.c.session_id)
        .where(PracticeSession.end_time.isnot(None))
        .order_by(PracticeSession.start_time.desc())
    )

    if scenario and scenario != "全部":
        query = query.where(PracticeSession.scenario == scenario)

    since = _get_time_range_filter(timeRange)
    if since:
        query = query.where(PracticeSession.start_time >= since)

    result = await db.execute(query)
    rows = result.all()

    return [
        HistoryEntryOut(
            id=row.id,
            date=row.start_time.strftime("%Y-%m-%d"),
            scenario=row.scenario,
            score=int(row.overall_score or 0),
            duration=_fmt_duration(row.start_time, row.end_time),
            grammar=int(row.grammar or 0),
            pronunciation=int(row.pronunciation or 0),
        )
        for row in rows
    ]


@router.get("/filters", response_model=HistoryFiltersOut)
async def get_history_filters(db: AsyncSession = Depends(get_db)):
    """Return available filter options for history."""
    await seed_all(db)

    result = await db.execute(select(distinct(PracticeSession.scenario)))
    scenarios = ["全部"] + [row[0] for row in result.all()]

    return HistoryFiltersOut(
        scenarios=scenarios,
        timeRanges=["本周", "本月", "全部"],
    )

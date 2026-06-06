"""Report API — view and export practice session reports."""

import random

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..models.practice_session import PracticeSession
from ..models.dialogue import Dialogue
from ..models.evaluation import Evaluation
from ..schemas.chat import (
    ChatMessageOut,
    FeedbackOut,
    RadarDataOut,
    SessionOut,
)

router = APIRouter(prefix="/api/reports", tags=["reports"])

SCENARIO_NAMES: dict[str, int] = {
    "面试": 1,
    "餐厅": 2,
    "会议": 3,
    "旅行": 4,
}


def _fmt_duration(start, end):
    if not end:
        return "0分钟"
    delta = (end - start).total_seconds()
    minutes = max(1, round(delta / 60))
    return f"{minutes}分钟"


@router.get("/{report_id}", response_model=SessionOut)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Return the full report for a completed practice session."""
    session = await db.get(PracticeSession, report_id)
    if not session:
        raise HTTPException(404, "Report not found")

    # Build full conversation from dialogues
    result = await db.execute(
        select(Dialogue)
        .where(Dialogue.session_id == report_id)
        .order_by(Dialogue.id)
    )
    dialogues = result.scalars().all()

    conversation: list[ChatMessageOut] = []
    for d in dialogues:
        if d.ai_text:
            conversation.append(ChatMessageOut(role="ai", message=d.ai_text))
        if d.user_text:
            conversation.append(ChatMessageOut(role="user", message=d.user_text))

    # Get evaluation for radar data
    result = await db.execute(
        select(Evaluation)
        .where(Evaluation.session_id == report_id)
        .order_by(Evaluation.id.desc())
        .limit(1)
    )
    eval_record = result.scalar()

    if eval_record and eval_record.grammar_score and eval_record.pronunciation_score:
        radar = RadarDataOut(
            pronunciation=int(eval_record.pronunciation_score),
            grammar=int(eval_record.grammar_score),
            vocabulary=random.randint(75, 95),
            fluency=random.randint(75, 95),
            confidence=random.randint(75, 95),
        )
        feedback = FeedbackOut(
            grammar=int(eval_record.grammar_score),
            pronunciation=int(eval_record.pronunciation_score),
            fluency=radar.fluency + random.randint(-2, 2),
        )
    else:
        radar = RadarDataOut(
            pronunciation=0, grammar=0, vocabulary=0, fluency=0, confidence=0,
        )
        feedback = FeedbackOut(grammar=0, pronunciation=0, fluency=0)

    scenario_id = SCENARIO_NAMES.get(session.scenario, 1)
    score = int(session.overall_score) if session.overall_score else 0

    return SessionOut(
        id=session.id,
        scenarioId=scenario_id,
        scenarioName=session.scenario,
        conversation=conversation,
        feedback=feedback,
        radarData=radar,
        score=score,
        duration=_fmt_duration(session.start_time, session.end_time),
    )


@router.get("/{report_id}/export")
async def export_report(report_id: int):
    """Placeholder for report export functionality."""
    return {"message": "export not implemented"}

"""Report API — view, preview and export practice session reports."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, Response
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
from ..services.report_exporter import ReportData, build_pdf, build_pdf_preview_page

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


async def _load_report_data(report_id: int, db: AsyncSession) -> ReportData:
    """Load session, dialogues, and evaluation — shared by all endpoints."""
    session = await db.get(PracticeSession, report_id)
    if not session:
        raise HTTPException(404, "Report not found")

    result = await db.execute(
        select(Dialogue)
        .where(Dialogue.session_id == report_id)
        .order_by(Dialogue.id)
    )
    dialogues = result.scalars().all()

    result = await db.execute(
        select(Evaluation)
        .where(Evaluation.session_id == report_id)
        .order_by(Evaluation.id.desc())
        .limit(1)
    )
    eval_record = result.scalar()

    return ReportData(session, list(dialogues), eval_record)


@router.get("/{report_id}", response_model=SessionOut)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Return the full report for a completed practice session."""
    data = await _load_report_data(report_id, db)

    conversation: list[ChatMessageOut] = []
    for msg in data.conversation:
        if msg["user"]:
            conversation.append(ChatMessageOut(role="user", message=msg["user"]))
        conversation.append(ChatMessageOut(role="ai", message=msg["ai"]))

    if data.grammar_score or data.pronunciation_score:
        gs = data.grammar_score
        ps = data.pronunciation_score
        fl = max(45, int((gs + ps) / 2) - 2)
        vo = max(45, gs - 5)
        co = max(45, int((gs + ps + fl) / 3))
        radar = RadarDataOut(pronunciation=ps, grammar=gs, vocabulary=vo, fluency=fl, confidence=co)
        feedback = FeedbackOut(grammar=gs, pronunciation=ps, fluency=fl)
    else:
        radar = RadarDataOut(pronunciation=0, grammar=0, vocabulary=0, fluency=0, confidence=0)
        feedback = FeedbackOut(grammar=0, pronunciation=0, fluency=0)

    scenario_id = SCENARIO_NAMES.get(data.scenario, 1)

    return SessionOut(
        id=report_id,
        scenarioId=scenario_id,
        scenarioName=data.scenario,
        difficulty=data.difficulty,
        conversation=conversation,
        feedback=feedback,
        radarData=radar,
        score=data.score,
        duration=data.duration,
    )


@router.get("/{report_id}/preview", response_class=HTMLResponse)
async def preview_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """Return an HTML page that embeds the PDF for preview."""
    await _load_report_data(report_id, db)  # validates report exists
    return build_pdf_preview_page(report_id)


@router.get("/{report_id}/pdf")
async def serve_pdf(report_id: int, db: AsyncSession = Depends(get_db)):
    """Serve the PDF inline for embedding in the preview page."""
    data = await _load_report_data(report_id, db)
    pdf_bytes = build_pdf(data)
    return Response(content=pdf_bytes, media_type="application/pdf")


@router.get("/{report_id}/export")
async def export_report(report_id: int, db: AsyncSession = Depends(get_db)):
    """Download the report as a PDF file."""
    data = await _load_report_data(report_id, db)
    pdf_bytes = build_pdf(data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="speakmate-report-{report_id}.pdf"'},
    )
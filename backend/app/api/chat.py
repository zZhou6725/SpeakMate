"""Chat / Practice Session API — core conversation flow."""

import random
from datetime import datetime

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
    SessionCreateIn,
    SessionOut,
    MessageIn,
    MessageOut,
)
from ..agents.conversation_agent import generate_ai_reply

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

# Scenario id → name
SCENARIO_NAMES: dict[int, str] = {
    1: "面试",
    2: "餐厅",
    3: "会议",
    4: "旅行",
}

# Scenario id → opening AI greeting (fixed — not LLM-generated)
OPENING_LINES: dict[int, str] = {
    1: "请简单介绍一下你自己。",
    2: "欢迎光临！请问需要点些什么？",
    3: "我们来讨论一下第三季度的项目时间表。",
    4: "你好！请问你要去哪里？",
}


def _scenario_name_to_id(name: str) -> int:
    for sid, sname in SCENARIO_NAMES.items():
        if sname == name:
            return sid
    return 1


def _generate_feedback() -> FeedbackOut:
    return FeedbackOut(
        grammar=random.randint(72, 95),
        pronunciation=random.randint(72, 95),
        fluency=random.randint(72, 95),
    )


def _generate_radar() -> RadarDataOut:
    return RadarDataOut(
        pronunciation=random.randint(75, 95),
        grammar=random.randint(75, 95),
        vocabulary=random.randint(75, 95),
        fluency=random.randint(75, 95),
        confidence=random.randint(75, 95),
    )


def _fmt_duration(start: datetime, end: datetime | None) -> str:
    if not end:
        return "0分钟"
    delta = (end - start).total_seconds()
    minutes = max(1, round(delta / 60))
    return f"{minutes}分钟"


@router.post("", response_model=SessionOut)
async def create_session(
    body: SessionCreateIn,
    db: AsyncSession = Depends(get_db),
):
    """Create a new practice session, return initial AI greeting."""
    scenario_name = SCENARIO_NAMES.get(body.scenarioId)
    if not scenario_name:
        raise HTTPException(400, f"Unknown scenarioId: {body.scenarioId}")

    now = datetime(2026, 6, 6, 10, 0)
    session = PracticeSession(
        scenario=scenario_name,
        difficulty="中等",
        start_time=now,
        total_rounds=0,
    )
    db.add(session)
    await db.flush()

    opening = OPENING_LINES.get(body.scenarioId, "你好！")
    ai_msg = Dialogue(
        session_id=session.id,
        ai_text=opening,
        timestamp=now,
    )
    db.add(ai_msg)
    await db.flush()

    return SessionOut(
        id=session.id,
        scenarioId=body.scenarioId,
        scenarioName=scenario_name,
        conversation=[ChatMessageOut(role="ai", message=opening)],
        feedback=FeedbackOut(grammar=0, pronunciation=0, fluency=0),
        radarData=RadarDataOut(pronunciation=0, grammar=0, vocabulary=0, fluency=0, confidence=0),
        score=0,
        duration="0分钟",
    )


@router.post("/{session_id}/messages", response_model=MessageOut)
async def send_message(
    session_id: int,
    body: MessageIn,
    db: AsyncSession = Depends(get_db),
):
    """Receive user message, return AI reply + simulated feedback."""
    session = await db.get(PracticeSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    now = datetime(2026, 6, 6, 10, 0)

    # Load all existing dialogues for context
    result = await db.execute(
        select(Dialogue).where(Dialogue.session_id == session_id)
    )
    all_dialogues = result.scalars().all()

    # Generate AI reply via LLM agent (with script fallback if LLM unavailable)
    ai_text = await generate_ai_reply(
        scenario=session.scenario,
        difficulty=session.difficulty,
        dialogues=list(all_dialogues),
        current_user_text=body.message,
    )

    # Save user message
    db.add(Dialogue(session_id=session_id, user_text=body.message, timestamp=now))

    feedback = _generate_feedback()

    # Save AI message
    db.add(Dialogue(
        session_id=session_id,
        ai_text=ai_text,
        pronunciation_score=float(feedback.pronunciation),
        timestamp=now,
    ))

    session.total_rounds += 1
    await db.flush()

    return MessageOut(
        userMessage=ChatMessageOut(role="user", message=body.message),
        aiMessage=ChatMessageOut(role="ai", message=ai_text),
        feedback=feedback,
    )


@router.post("/{session_id}/end", response_model=SessionOut)
async def end_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
):
    """End a practice session, return final report data."""
    session = await db.get(PracticeSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    now = datetime(2026, 6, 6, 10, 11)
    session.end_time = now

    # Calculate average score from feedbacks
    result = await db.execute(
        select(Dialogue).where(
            Dialogue.session_id == session_id,
            Dialogue.pronunciation_score.isnot(None),
        )
    )
    scored = result.scalars().all()
    scores = [int(d.pronunciation_score) for d in scored if d.pronunciation_score]
    avg_score = round(sum(scores) / len(scores)) if scores else 85
    session.overall_score = float(avg_score)

    radar = _generate_radar()

    # Save evaluation record
    db.add(Evaluation(
        session_id=session_id,
        error_type="general",
        error_count=random.randint(1, 3),
        grammar_score=float(radar.grammar),
        pronunciation_score=float(radar.pronunciation),
    ))

    # Build full conversation
    result = await db.execute(
        select(Dialogue).where(Dialogue.session_id == session_id).order_by(Dialogue.id)
    )
    all_dialogues = result.scalars().all()

    conversation: list[ChatMessageOut] = []
    for d in all_dialogues:
        if d.ai_text:
            conversation.append(ChatMessageOut(role="ai", message=d.ai_text))
        if d.user_text:
            conversation.append(ChatMessageOut(role="user", message=d.user_text))

    scenario_id = _scenario_name_to_id(session.scenario)

    return SessionOut(
        id=session.id,
        scenarioId=scenario_id,
        scenarioName=session.scenario,
        conversation=conversation,
        feedback=FeedbackOut(
            grammar=radar.grammar,
            pronunciation=radar.pronunciation,
            fluency=radar.fluency + random.randint(-2, 2),
        ),
        radarData=radar,
        score=avg_score,
        duration=_fmt_duration(session.start_time, session.end_time),
    )

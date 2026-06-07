"""Chat / Practice Session API — core conversation flow."""

import asyncio
import json
import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
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
from ..agents.conversation_agent import generate_ai_reply, generate_ai_reply_stream
from ..agents.correction_agent import check_grammar
from ..agents.pronunciation_agent import check_pronunciation
from ..schemas.correction import CorrectionOut
from ..schemas.pronunciation import PronunciationOut

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


@router.post("/{session_id}/messages")
async def send_message(
    session_id: int,
    body: MessageIn,
    db: AsyncSession = Depends(get_db),
):
    """Receive user message, stream AI reply via SSE, return final structured result."""
    session = await db.get(PracticeSession, session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    now = datetime(2026, 6, 6, 10, 0)

    result = await db.execute(
        select(Dialogue).where(Dialogue.session_id == session_id)
    )
    all_dialogues = result.scalars().all()

    # Run grammar check and pronunciation check in parallel
    correction_dict, pronunciation_dict = await asyncio.gather(
        check_grammar(body.message),
        check_pronunciation(body.message),
    )
    grammar_correction = correction_dict if correction_dict.get("items") else None

    async def sse_stream():
        # Stream AI reply tokens
        full_reply = ""
        async for token in generate_ai_reply_stream(
            scenario=session.scenario,
            difficulty=session.difficulty,
            dialogues=list(all_dialogues),
            current_user_text=body.message,
        ):
            full_reply += token
            yield f"data: {json.dumps({'type': 'token', 'content': token}, ensure_ascii=False)}\n\n"

        # Save both messages to DB after stream completes
        db.add(Dialogue(
            session_id=session_id,
            user_text=body.message,
            grammar_correction=grammar_correction,
            timestamp=now,
        ))

        feedback = _generate_feedback()
        # Override pronunciation score with LLM-based result if available
        if pronunciation_dict and pronunciation_dict.get("score", 0) > 0:
            feedback.pronunciation = pronunciation_dict["score"]

        db.add(Dialogue(
            session_id=session_id,
            ai_text=full_reply,
            pronunciation_score=float(feedback.pronunciation),
            timestamp=now,
        ))

        session.total_rounds += 1
        await db.flush()

        correction_out = CorrectionOut(**correction_dict) if correction_dict else None
        pronunciation_out = PronunciationOut(**pronunciation_dict) if pronunciation_dict else None

        done_payload = {
            "type": "done",
            "userMessage": {"role": "user", "message": body.message},
            "aiMessage": {"role": "ai", "message": full_reply},
            "feedback": {
                "grammar": feedback.grammar,
                "pronunciation": feedback.pronunciation,
                "fluency": feedback.fluency,
            },
            "correction": correction_out.model_dump() if correction_out else None,
            "pronunciation": pronunciation_out.model_dump() if pronunciation_out else None,
        }
        yield f"data: {json.dumps(done_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(sse_stream(), media_type="text/event-stream")


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

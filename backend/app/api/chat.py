"""Chat / Practice Session API — core conversation flow."""

import asyncio
import json
import re
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
    VocabularyOut,
)
from ..agents.conversation_agent import generate_ai_reply, generate_ai_reply_stream
from ..agents.correction_agent import check_grammar
from ..agents.pronunciation_agent import check_pronunciation
from ..agents.summary_agent import generate_summary
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
# Scenario id → opening AI greeting per difficulty
OPENING_LINES: dict[int, dict[str, str]] = {
    1: {  # 面试
        "简单": "Hi! Nice to meet you. Can you tell me your name and where you are from?",
        "中等": "Hi there, welcome! Tell me a little about yourself and your background.",
        "困难": "Good morning! Let's dive right in — walk me through your professional background and what makes you a strong candidate for this role.",
    },
    2: {  # 餐厅
        "简单": "Hello! Welcome. What would you like to eat today?",
        "中等": "Hey, welcome to The Garden Bistro! What can I get for you today?",
        "困难": "Good evening and welcome to The Garden Bistro. Our specials tonight are pan-seared salmon with herb butter and a dry-aged ribeye. May I start you off with a drink while you look over the menu?",
    },
    3: {  # 会议
        "简单": "Hi! Let's talk about the project. How is your work going?",
        "中等": "Hey, good to see you. Let's catch up on the Q3 project timeline — how are things progressing?",
        "困难": "Alright team, let's get straight into it. I'd like to go over the Q3 deliverables, identify any blockers, and reassess our resource allocation. Can you kick us off with a status update on your side?",
    },
    4: {  # 旅行
        "简单": "Hello! Where do you want to go on your trip?",
        "中等": "Hi there! Where are you planning to travel to? Any particular destination in mind?",
        "困难": "Welcome to Wanderlust Travel! Whether you're after a luxury beach getaway, a cultural deep-dive, or an off-the-beaten-path adventure, I'm here to craft the perfect itinerary. So tell me — what kind of experience are you looking for?",
    },
}


def _scenario_name_to_id(name: str) -> int:
    for sid, sname in SCENARIO_NAMES.items():
        if sname == name:
            return sid
    return 1


def _compute_grammar_score(correction: dict | None) -> int:
    """Derive grammar score from correction items count. Fewer errors = higher score."""
    if correction is None:
        return 70
    items = correction.get("items", [])
    if not items:
        return 88
    return max(45, 88 - len(items) * 8)


def _compute_scores(
    correction: dict | None,
    pronunciation: dict | None,
) -> tuple[FeedbackOut, RadarDataOut]:
    grammar = _compute_grammar_score(correction)
    pron = pronunciation.get("score", 70) if pronunciation else 70
    fluency = max(45, int((grammar + pron) / 2) - 2)
    vocabulary = max(45, grammar - 5)
    confidence = max(45, int((grammar + pron + fluency) / 3))

    feedback = FeedbackOut(grammar=grammar, pronunciation=pron, fluency=fluency)
    radar = RadarDataOut(
        pronunciation=pron,
        grammar=grammar,
        vocabulary=vocabulary,
        fluency=fluency,
        confidence=confidence,
    )
    return feedback, radar


def _compute_vocabulary(user_texts: list[str], all_items: list[dict]) -> VocabularyOut:
    """Compute vocabulary stats from user messages and grammar correction items."""
    all_words: list[str] = []
    for text in user_texts:
        words = re.findall(r"[a-zA-Z]+", text.lower())
        all_words.extend(words)

    total = len(all_words)
    unique = len(set(all_words))
    avg_len = round(sum(len(w) for w in all_words) / total, 1) if total else 0.0

    wrong_words: set[str] = set()
    for item in all_items:
        wrong = item.get("wrong", "").lower()
        wrong_words.update(re.findall(r"[a-zA-Z]+", wrong))
    matched_wrong = len(wrong_words & set(all_words))
    accuracy = round((total - matched_wrong) / total * 100) if total else 100

    return VocabularyOut(totalWords=total, uniqueWords=unique, avgWordLength=avg_len, accuracy=accuracy)


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

    now = datetime.now()
    session = PracticeSession(
        scenario=scenario_name,
        difficulty=body.difficulty,
        start_time=now,
        total_rounds=0,
    )
    db.add(session)
    await db.flush()

    scenario_lines = OPENING_LINES.get(body.scenarioId, {})
    opening = scenario_lines.get(body.difficulty) or list(scenario_lines.values())[0] if scenario_lines else "Hi there!"
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
        difficulty=body.difficulty,
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

    now = datetime.now()

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

        feedback, radar = _compute_scores(correction_dict, pronunciation_dict)

        pron_items = pronunciation_dict.get("items") if pronunciation_dict else None

        db.add(Dialogue(
            session_id=session_id,
            ai_text=full_reply,
            pronunciation_score=float(feedback.pronunciation),
            pronunciation_items=pron_items,
            timestamp=now,
        ))

        session.total_rounds += 1
        await db.flush()

        correction_out = CorrectionOut(**correction_dict) if correction_dict else None
        pronunciation_out = PronunciationOut(**pronunciation_dict) if pronunciation_dict else None

        # Compute vocabulary stats across all user messages in this session
        user_texts = [d.user_text for d in all_dialogues if d.user_text] + [body.message]
        all_corr_items: list[dict] = []
        for d in all_dialogues:
            if d.grammar_correction and d.grammar_correction.get("items"):
                all_corr_items.extend(d.grammar_correction["items"])
        if correction_dict and correction_dict.get("items"):
            all_corr_items.extend(correction_dict["items"])
        vocabulary = _compute_vocabulary(user_texts, all_corr_items)

        done_payload = {
            "type": "done",
            "userMessage": {"role": "user", "message": body.message},
            "aiMessage": {"role": "ai", "message": full_reply},
            "feedback": {
                "grammar": feedback.grammar,
                "pronunciation": feedback.pronunciation,
                "fluency": feedback.fluency,
            },
            "vocabulary": vocabulary.model_dump(),
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

    now = datetime.now()
    session.end_time = now

    # Query all dialogues for this session
    result = await db.execute(
        select(Dialogue).where(Dialogue.session_id == session_id).order_by(Dialogue.id)
    )
    all_dialogues = result.scalars().all()

    # Aggregate grammar and pronunciation data from all dialogue turns
    all_items: list[dict] = []
    pron_scores: list[int] = []
    for d in all_dialogues:
        if d.grammar_correction and d.grammar_correction.get("items"):
            all_items.extend(d.grammar_correction["items"])
        if d.pronunciation_score:
            pron_scores.append(int(d.pronunciation_score))

    grammar_correction = {"items": all_items} if all_items else None
    pron_dict = {"score": round(sum(pron_scores) / len(pron_scores))} if pron_scores else {"score": 70}

    feedback, radar = _compute_scores(grammar_correction, pron_dict)

    avg_score = round((feedback.grammar + feedback.pronunciation + feedback.fluency) / 3)
    session.overall_score = float(avg_score)

    # Save evaluation record
    db.add(Evaluation(
        session_id=session_id,
        error_type="general",
        error_count=len(all_items),
        grammar_score=float(radar.grammar),
        pronunciation_score=float(radar.pronunciation),
    ))

    # Build full conversation
    conversation: list[ChatMessageOut] = []
    for d in all_dialogues:
        if d.ai_text:
            conversation.append(ChatMessageOut(role="ai", message=d.ai_text))
        if d.user_text:
            conversation.append(ChatMessageOut(role="user", message=d.user_text))

    scenario_id = _scenario_name_to_id(session.scenario)

    user_texts = [d.user_text for d in all_dialogues if d.user_text]
    vocabulary = _compute_vocabulary(user_texts, all_items)

    # Generate session summary
    summary_dict = await generate_summary(
        scenario=session.scenario,
        difficulty=session.difficulty,
        grammar_score=radar.grammar,
        pronunciation_score=radar.pronunciation,
        overall_score=avg_score,
        total_words=vocabulary.totalWords,
        unique_words=vocabulary.uniqueWords,
        accuracy=vocabulary.accuracy,
        num_rounds=session.total_rounds,
        grammar_errors=len(all_items),
    )
    from ..schemas.chat import SummaryOut
    summary_out = SummaryOut(**summary_dict) if summary_dict else None

    # Aggregate pronunciation items from all dialogues
    pron_items: list[dict] = []
    for d in all_dialogues:
        if d.pronunciation_items:
            items = d.pronunciation_items if isinstance(d.pronunciation_items, list) else d.pronunciation_items.get("items", [])
            pron_items.extend(items)

    correction_out = CorrectionOut(
        original="", corrected="", items=[
            {"wrong": item.get("wrong", ""), "correct": item.get("correct", ""), "reason": item.get("reason", "")}
            for item in all_items
        ]
    ) if all_items else None
    pronunciation_out = PronunciationOut(
        text="", score=feedback.pronunciation, items=pron_items
    ) if pron_items else None

    return SessionOut(
        id=session.id,
        scenarioId=scenario_id,
        scenarioName=session.scenario,
        difficulty=session.difficulty,
        conversation=conversation,
        feedback=FeedbackOut(
            grammar=radar.grammar,
            pronunciation=radar.pronunciation,
            fluency=radar.fluency,
        ),
        radarData=radar,
        vocabulary=vocabulary,
        correction=correction_out,
        pronunciation=pronunciation_out,
        summary=summary_out,
        score=avg_score,
        duration=_fmt_duration(session.start_time, session.end_time),
    )

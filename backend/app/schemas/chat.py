"""Schemas for chat / practice sessions."""

from pydantic import BaseModel

from .correction import CorrectionOut
from .pronunciation import PronunciationOut


class ChatMessageOut(BaseModel):
    role: str  # "ai" | "user"
    message: str

    model_config = {"from_attributes": True}


class FeedbackOut(BaseModel):
    grammar: int
    pronunciation: int
    fluency: int

    model_config = {"from_attributes": True}


class RadarDataOut(BaseModel):
    pronunciation: int
    grammar: int
    vocabulary: int
    fluency: int
    confidence: int

    model_config = {"from_attributes": True}


class VocabularyOut(BaseModel):
    totalWords: int
    uniqueWords: int
    avgWordLength: float
    accuracy: int

    model_config = {"from_attributes": True}


class SessionCreateIn(BaseModel):
    scenarioId: int
    difficulty: str = "中等"


class SessionOut(BaseModel):
    id: int
    scenarioId: int
    scenarioName: str
    difficulty: str
    conversation: list[ChatMessageOut]
    feedback: FeedbackOut
    radarData: RadarDataOut
    vocabulary: VocabularyOut | None = None
    score: int
    duration: str

    model_config = {"from_attributes": True}


class MessageIn(BaseModel):
    message: str


class MessageOut(BaseModel):
    userMessage: ChatMessageOut
    aiMessage: ChatMessageOut
    feedback: FeedbackOut
    correction: CorrectionOut | None = None
    pronunciation: PronunciationOut | None = None

    model_config = {"from_attributes": True}

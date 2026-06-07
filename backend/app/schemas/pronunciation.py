"""Schemas for pronunciation evaluation."""

from pydantic import BaseModel


class PronunciationItem(BaseModel):
    word: str = ""
    phonetic: str = ""
    tip: str = ""


class PronunciationOut(BaseModel):
    text: str = ""
    score: int = 0
    items: list[PronunciationItem] = []


class PronunciationRequest(BaseModel):
    text: str
    session_id: int | None = None
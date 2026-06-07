"""Schemas for grammar correction."""

from pydantic import BaseModel


class CorrectionItem(BaseModel):
    wrong: str = ""
    correct: str = ""
    reason: str = ""


class CorrectionOut(BaseModel):
    original: str
    corrected: str
    items: list[CorrectionItem] = []

    model_config = {"from_attributes": True}


class CorrectionRequest(BaseModel):
    text: str
    session_id: int | None = None
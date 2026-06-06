"""Schemas for history."""

from pydantic import BaseModel


class HistoryEntryOut(BaseModel):
    id: int
    date: str
    scenario: str
    score: int
    duration: str
    grammar: int
    pronunciation: int

    model_config = {"from_attributes": True}


class HistoryFiltersOut(BaseModel):
    scenarios: list[str]
    timeRanges: list[str]

    model_config = {"from_attributes": True}

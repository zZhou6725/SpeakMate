"""Schemas for scenarios."""

from pydantic import BaseModel


class ScenarioOut(BaseModel):
    id: int
    name: str
    difficulty: str  # "简单" | "中等" | "困难"

    model_config = {"from_attributes": True}

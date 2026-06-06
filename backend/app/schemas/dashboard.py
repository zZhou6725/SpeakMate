"""Schemas for dashboard stats."""

from pydantic import BaseModel


class DashboardStatsOut(BaseModel):
    totalPractice: int
    averageScore: float
    bestScore: float

    model_config = {"from_attributes": True}

"""Schemas for dashboard stats."""

from pydantic import BaseModel


class DashboardStatsOut(BaseModel):
    totalPractice: int
    averageScore: float
    bestScore: float

    class Config:
        orm_mode = True

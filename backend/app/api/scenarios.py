"""Scenario API - returns the list of available practice scenarios."""

from typing import List

from fastapi import APIRouter

from ..schemas.scenario import ScenarioOut

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])

SEED_SCENARIOS = [
    ScenarioOut(id=1, name="面试", difficulty="中等"),
    ScenarioOut(id=2, name="餐厅", difficulty="简单"),
    ScenarioOut(id=3, name="会议", difficulty="困难"),
    ScenarioOut(id=4, name="旅行", difficulty="简单"),
]


@router.get("", response_model=List[ScenarioOut])
async def list_scenarios():
    """Return all available practice scenarios."""
    return SEED_SCENARIOS

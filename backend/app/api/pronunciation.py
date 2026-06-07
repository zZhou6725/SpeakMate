"""Pronunciation evaluation API — on-demand pronunciation analysis."""

from fastapi import APIRouter

from ..agents.pronunciation_agent import check_pronunciation
from ..schemas.pronunciation import PronunciationOut, PronunciationRequest

router = APIRouter(prefix="/api/pronunciation", tags=["pronunciation"])


@router.post("", response_model=PronunciationOut)
async def evaluate_pronunciation(body: PronunciationRequest):
    """Analyze pronunciation difficulty of the given text."""
    result = await check_pronunciation(body.text)
    return PronunciationOut(**result)
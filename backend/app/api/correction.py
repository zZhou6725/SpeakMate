"""Grammar correction API — on-demand text correction."""

from fastapi import APIRouter

from ..agents.correction_agent import check_grammar
from ..schemas.correction import CorrectionOut, CorrectionRequest

router = APIRouter(prefix="/api/correction", tags=["correction"])


@router.post("", response_model=CorrectionOut)
async def correct_text(body: CorrectionRequest):
    """Check grammar of the given text, return corrections."""
    result = await check_grammar(body.text)
    return CorrectionOut(**result)
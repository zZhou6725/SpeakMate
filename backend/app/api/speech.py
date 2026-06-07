"""Speech recognition API — transcribe audio to text via Whisper."""

import logging
import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speech", tags=["speech"])

_model = None


def _get_model():
    global _model
    if _model is None:
        import whisper

        logger.info("Loading Whisper model: %s", settings.whisper_model)
        _model = whisper.load_model(settings.whisper_model)
    return _model


class SpeechOut(BaseModel):
    text: str


@router.post("", response_model=SpeechOut)
async def transcribe_speech(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")

    suffix = os.path.splitext(file.filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        model = _get_model()
        result = model.transcribe(tmp_path, language="en")
        text = result["text"].strip()
        return SpeechOut(text=text)
    except Exception:
        logger.exception("Whisper transcription failed")
        raise HTTPException(status_code=500, detail="Speech recognition failed")
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
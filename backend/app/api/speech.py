"""Speech recognition API — transcribe audio to text via Whisper."""

import logging
import os
import tempfile
import wave

import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from ..core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/speech", tags=["speech"])

_model = None
SAMPLE_RATE = 16000


def _get_model():
    global _model
    if _model is None:
        import whisper

        logger.info("Loading Whisper model: %s", settings.whisper_model)
        _model = whisper.load_model(settings.whisper_model)
    return _model


def _read_wav(path: str) -> np.ndarray:
    """Read a 16kHz mono 16-bit WAV file into a float32 numpy array."""
    with wave.open(path, "rb") as wf:
        nchannels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        nframes = wf.getnframes()
        raw = wf.readframes(nframes)

    dtype = {1: np.int8, 2: np.int16, 4: np.int32}[sampwidth]
    audio = np.frombuffer(raw, dtype=dtype).astype(np.float32)
    if nchannels > 1:
        audio = audio.reshape(-1, nchannels).mean(axis=1)
    max_val = float(np.iinfo(dtype).max)
    return audio / max_val


class SpeechOut(BaseModel):
    text: str


@router.post("", response_model=SpeechOut)
async def transcribe_speech(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")

    suffix = os.path.splitext(file.filename)[1] or ".wav"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        audio = _read_wav(tmp_path)
        model = _get_model()
        result = model.transcribe(audio, language="en", fp16=False)
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
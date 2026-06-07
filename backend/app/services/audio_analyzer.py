"""Audio-level pronunciation analysis service.

Analyzes audio features (speech rate, pitch variation, energy, pauses)
to produce a pronunciation score that complements the text-based LLM analysis.
"""

import logging

import numpy as np

logger = logging.getLogger(__name__)

SAMPLE_RATE = 16000


def analyze_audio(audio: np.ndarray, text: str) -> dict:
    """Analyze audio for pronunciation quality metrics.

    Args:
        audio: float32 numpy array, 16kHz mono, values in [-1, 1].
        text: transcribed text for speech rate calculation.

    Returns:
        dict with keys: score, speech_rate, pitch_variation, energy_consistency, pause_ratio.
    """
    if audio.size == 0 or not text.strip():
        return {
            "score": 0,
            "speech_rate": 0,
            "pitch_variation": 0,
            "energy_consistency": 0,
            "pause_ratio": 0,
        }

    duration = len(audio) / SAMPLE_RATE
    if duration < 0.3:
        return {"score": 50, "speech_rate": 0, "pitch_variation": 0, "energy_consistency": 0, "pause_ratio": 0}

    word_count = len(text.split())
    speech_rate = word_count / max(duration, 0.1) * 60  # words per minute

    # Energy (RMS) — detect speaking vs silence segments
    frame_len = int(SAMPLE_RATE * 0.03)  # 30ms frames
    hop_len = int(SAMPLE_RATE * 0.01)  # 10ms hop
    rms = _rms_frames(audio, frame_len, hop_len)
    energy_mean = float(np.mean(rms))
    energy_std = float(np.std(rms))

    # Energy consistency (0-100): higher = more consistent volume
    if energy_mean > 1e-6:
        cv = min(energy_std / energy_mean, 1.0)
        energy_consistency = round((1.0 - cv) * 100)
    else:
        energy_consistency = 0

    # Pause ratio: fraction of frames below noise threshold
    noise_threshold = max(energy_mean * 0.1, 1e-4)
    silent_frames = np.sum(rms < noise_threshold)
    pause_ratio = round(silent_frames / max(len(rms), 1) * 100)

    # Pitch variation via zero-crossing rate proxy
    zcr = _zcr_frames(audio, frame_len, hop_len)
    zcr_std = float(np.std(zcr))
    pitch_variation = round(min(zcr_std * 1000, 100))  # scale to 0-100

    # Composite score
    speech_rate_score = _rate_score(speech_rate)
    pause_score = _pause_score(pause_ratio)
    score = round(
        speech_rate_score * 0.3
        + energy_consistency * 0.2
        + pitch_variation * 0.2
        + pause_score * 0.3
    )

    return {
        "score": max(0, min(100, score)),
        "speech_rate": round(speech_rate),
        "pitch_variation": pitch_variation,
        "energy_consistency": energy_consistency,
        "pause_ratio": pause_ratio,
    }


def _rms_frames(audio: np.ndarray, frame_len: int, hop_len: int) -> np.ndarray:
    """Compute RMS energy per frame."""
    n_frames = max(1, (len(audio) - frame_len) // hop_len + 1)
    rms = np.zeros(n_frames, dtype=np.float32)
    for i in range(n_frames):
        start = i * hop_len
        frame = audio[start : start + frame_len]
        rms[i] = np.sqrt(np.mean(frame**2) + 1e-10)
    return rms


def _zcr_frames(audio: np.ndarray, frame_len: int, hop_len: int) -> np.ndarray:
    """Compute zero-crossing rate per frame."""
    n_frames = max(1, (len(audio) - frame_len) // hop_len + 1)
    zcr = np.zeros(n_frames, dtype=np.float32)
    for i in range(n_frames):
        start = i * hop_len
        end = start + frame_len
        frame = audio[start:end]
        zcr[i] = np.sum(np.abs(np.diff(np.sign(frame)))) / (2 * frame_len) if len(frame) > 1 else 0
    return zcr


def _rate_score(wpm: float) -> float:
    """Score speech rate. Optimal for learners: 100-150 wpm."""
    if wpm < 40:
        return 30
    if wpm < 80:
        return 50 + (wpm - 40) * 1.25
    if wpm <= 150:
        return 100
    if wpm <= 200:
        return 100 - (wpm - 150) * 0.6
    return 70


def _pause_score(ratio: float) -> float:
    """Score pause ratio. Optimal: 20-40% pauses."""
    if ratio < 10:
        return 60  # too few pauses, rushed
    if ratio <= 40:
        return 100
    if ratio <= 60:
        return 100 - (ratio - 40) * 1.5
    return 70  # too many pauses
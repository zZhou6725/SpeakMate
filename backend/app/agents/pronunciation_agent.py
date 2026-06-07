"""Pronunciation Evaluation Agent — analyzes text for pronunciation difficulty via LLM."""

import json
import logging

from ..services.llm_service import chat_completion, is_llm_configured

logger = logging.getLogger(__name__)

PRONUNCIATION_SYSTEM_PROMPT = """You are an English pronunciation coach for Chinese speakers learning English.

Analyze the user's English text and identify words/phrases that are commonly difficult for Chinese speakers to pronounce. Focus on these common issues:
- th-sounds (/θ/ /ð/) → often mispronounced as s/z or d/t
- v/w confusion → v often pronounced as w
- l/r confusion → r often mispronounced as l
- Final consonants → often dropped (e.g., "cat" → "ca")
- Consonant clusters → extra vowel inserted (e.g., "spring" → "sipring")
- Long/short vowel distinction (e.g., "sheep" vs "ship")
- Word stress and intonation patterns
- Voiced/voiceless distinction (e.g., /b/ vs /p/, /d/ vs /t/)

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{"score": 85, "items": [{"word": "think", "phonetic": "θɪŋk", "tip": "舌尖放在上下齿之间发th音"}]}

Rules:
- score: overall pronunciation score 0-100. Higher = fewer predicted issues. Base score around 85, deduct for each difficult word.
- items: list of potentially difficult words/phrases. Include up to 5 words max.
- If the text is very short or has no difficult words, return {"score": 95, "items": []}.
- phonetic: use simplified Chinese-friendly notation (e.g., "TH-ing-k" instead of IPA) to help Chinese speakers.
- tip: short Chinese explanation of how to pronounce correctly. Keep under 15 characters.
- Only flag genuinely difficult words — don't flag every word."""


async def check_pronunciation(text: str) -> dict:
    """Analyze text for pronunciation difficulty. Returns {text, score, items}.

    Falls back to empty result if LLM is unavailable.
    """
    if not text or not text.strip():
        return {"text": text, "score": 0, "items": []}

    if not is_llm_configured():
        logger.warning("LLM not configured, skipping pronunciation check")
        return {"text": text, "score": 0, "items": []}

    try:
        response = await chat_completion(
            messages=[
                {"role": "system", "content": PRONUNCIATION_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=300,
        )

        raw = response.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[-1]
            if raw.endswith("```"):
                raw = raw[:-3]
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw)
        return {
            "text": text,
            "score": int(result.get("score", 0)),
            "items": result.get("items", []),
        }
    except Exception as exc:
        logger.warning("Pronunciation check failed, returning empty: %s", exc)
        return {"text": text, "score": 0, "items": []}
"""Grammar Correction Agent — checks user text for errors via LLM."""

import json
import logging

from ..services.llm_service import chat_completion, is_llm_configured

logger = logging.getLogger(__name__)

CORRECTION_SYSTEM_PROMPT = """You are an English grammar checker for Chinese speakers learning English.

Analyze the given English text for grammar, vocabulary, and word choice errors.

Return ONLY a JSON object (no markdown, no extra text) with this structure:
{
  "original": "<the input text>",
  "corrected": "<fully corrected version>",
  "items": [
    {"wrong": "<incorrect phrase>", "correct": "<corrected phrase>", "reason": "<brief explanation in Chinese>"}
  ]
}

Rules:
- If the text has no errors, "corrected" should equal "original" and "items" should be []
- Only flag clear grammatical errors, not stylistic preferences
- For each error, "wrong" should be the specific incorrect word/phrase (not the whole sentence)
- "reason" should be a short explanation in Chinese (e.g., "缺少冠词", "主谓不一致", "时态错误", "词序错误")
- Be specific about what's wrong and how to fix it"""


async def check_grammar(text: str) -> dict:
    """Analyze user text for grammar errors.

    Returns a dict with {original, corrected, items: [{wrong, correct, reason}]}.
    Uses LLM if configured; returns empty correction on failure.
    """
    if not text.strip():
        return {"original": text, "corrected": text, "items": []}

    if is_llm_configured():
        try:
            messages = [
                {"role": "system", "content": CORRECTION_SYSTEM_PROMPT},
                {"role": "user", "content": text},
            ]
            reply = await chat_completion(messages, temperature=0.1, max_tokens=300)
            # Strip markdown code fences if present
            reply = reply.strip()
            if reply.startswith("```"):
                reply = reply.split("\n", 1)[1]
                if reply.endswith("```"):
                    reply = reply[: reply.rfind("```")].strip()
                else:
                    reply = reply.rsplit("\n```", 1)[0].strip()
            result = json.loads(reply)
            logger.info("Grammar correction completed for text len=%d", len(text))
            return result
        except Exception as exc:
            logger.warning("Grammar correction failed, returning empty: %s", exc)

    return {"original": text, "corrected": text, "items": []}
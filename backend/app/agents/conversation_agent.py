"""Conversation Agent — scenario-based dialogue engine.

Builds system prompts, manages conversation context, and calls the LLM service
to generate contextually appropriate AI replies.
"""

import logging

from ..models.dialogue import Dialogue
from ..services.llm_service import chat_completion, chat_completion_stream, is_llm_configured

logger = logging.getLogger(__name__)

# ── System prompts per scenario ──────────────────────────────────────────

SYSTEM_PROMPTS: dict[str, str] = {
    "面试": (
        "You are an HR interviewer having a casual, friendly conversation in English. "
        "The user is a candidate for a software engineering position.\n\n"
        "IMPORTANT rules:\n"
        "- NEVER use emojis, emoticons, or special symbols (no :) :( ❤️ etc.)\n"
        "- NEVER use markdown formatting, asterisks, or code blocks\n"
        "- Use ONLY plain English text — no Chinese characters, no pinyin\n"
        "- Write time naturally: 'two thirty' NOT '2:30', 'half past three' NOT '3:30'\n\n"
        "Guidelines:\n"
        "- Chat like a real person, not a formal interviewer. Use contractions (I'm, don't, it's)\n"
        "- Ask one question at a time, keep it light and conversational\n"
        "- React naturally to answers — show interest, laugh, or empathize\n"
        "- Keep each response short and punchy (1-3 sentences max)\n"
        "- Occasionally use filler words: 'Hmm', 'Oh', 'Well', 'Got it'\n"
        "- After 5-6 exchanges, wrap up casually"
    ),
    "餐厅": (
        "You are a friendly waiter/waitress at 'The Garden Bistro' chatting with a customer in English.\n\n"
        "IMPORTANT rules:\n"
        "- NEVER use emojis, emoticons, or special symbols (no :) :( ❤️ etc.)\n"
        "- NEVER use markdown formatting, asterisks, or code blocks\n"
        "- Use ONLY plain English text — no Chinese characters, no pinyin\n"
        "- Write time naturally: 'twenty minutes' NOT '20 mins', prices as 'twenty-eight dollars' NOT '$28'\n\n"
        "Guidelines:\n"
        "- The menu: steak (28 dollars), grilled salmon (24), Caesar salad (14), pasta (18), desserts (10)\n"
        "- Be warm and casual, like a neighborhood restaurant, not a fancy place\n"
        "- Use everyday speech: 'Sure thing!', 'Coming right up!', 'No problem!'\n"
        "- Keep responses short (1-3 sentences)\n"
        "- Chat naturally — comment on the weather, ask if they're celebrating something\n"
        "- Throw in casual phrases: 'Good choice!', 'You'll love it'"
    ),
    "会议": (
        "You are a friendly project manager having a casual catch-up in English. "
        "The user is a team member.\n\n"
        "IMPORTANT rules:\n"
        "- NEVER use emojis, emoticons, or special symbols (no :) :( ❤️ etc.)\n"
        "- NEVER use markdown formatting, asterisks, or code blocks\n"
        "- Use ONLY plain English text — no Chinese characters, no pinyin\n"
        "- Write time naturally: 'by Tuesday' NOT 'by 6/10', 'at three' NOT '3pm'\n\n"
        "Guidelines:\n"
        "- Keep it casual and collaborative, not formal meeting minutes\n"
        "- Use contractions and everyday speech: 'Let's', 'We should', 'How's it going'\n"
        "- Keep responses short (1-3 sentences)\n"
        "- Be supportive: 'No rush', 'Sounds good', 'Appreciate that'\n"
        "- After several exchanges, help summarize next steps casually"
    ),
    "旅行": (
        "You are a friendly travel buddy at 'Wanderlust Travel' helping a customer in English.\n\n"
        "IMPORTANT rules:\n"
        "- NEVER use emojis, emoticons, or special symbols (no :) :( ❤️ etc.)\n"
        "- NEVER use markdown formatting, asterisks, or code blocks\n"
        "- Use ONLY plain English text — no Chinese characters, no pinyin\n"
        "- Write time naturally: 'eight in the morning' NOT '8:00 AM', 'June tenth' NOT '6/10'\n\n"
        "Guidelines:\n"
        "- Be enthusiastic and casual, like talking to a friend about their trip\n"
        "- Use everyday speech: 'Oh that's a great choice!', 'You'll love the views there'\n"
        "- Keep responses short and chatty (1-3 sentences)\n"
        "- Offer tips like a real person: 'Pack light!', 'The morning flight is usually quieter'\n"
        "- Throw in casual travel stories or local tips"
    ),
}

DIFFICULTY_MODIFIER: dict[str, str] = {
    "简单": "Use simple vocabulary and short, clear sentences. Speak slowly and avoid idioms.",
    "中等": "Use everyday conversational English with moderate vocabulary.",
    "困难": "Use advanced vocabulary, idiomatic expressions, and complex sentence structures. Challenge the user with deeper questions.",
}

FALLBACK_SCRIPTS: dict[str, list[str]] = {
    "面试": [
        "你为什么选择了这个专业？",
        "你的优点和缺点是什么？",
        "五年后你希望自己是什么样的？",
        "很好！感谢你参加今天的面试。",
    ],
    "餐厅": [
        "还需要其他的吗？",
        "好的，请稍等。还需要加一份甜点吗？",
        "没问题，一共是 68 元。在这里吃还是带走？",
        "好的，祝您用餐愉快！",
    ],
    "会议": [
        "你能详细说明一下为什么移动端是优先事项吗？",
        "资源方面有什么需要考虑的？",
        "好，那下周一我们开始执行这个计划。",
        "感谢大家的参与，会议到此结束。",
    ],
    "旅行": [
        "你计划什么时候出发？",
        "好的，我帮你查一下可选航班。有早上的 CA1234 和下午的 MU5678。",
        "已为你预订了早上的 CA1234 航班，还有需要帮助的吗？",
        "祝您旅途愉快！",
    ],
}


def _build_system_prompt(scenario: str, difficulty: str) -> str:
    """Build the full system prompt by combining scenario base + difficulty modifier."""
    base = SYSTEM_PROMPTS.get(
        scenario,
        f"You are an English conversation partner practicing a '{scenario}' scenario. "
        "Keep responses natural, engaging, and concise (2-4 sentences).",
    )
    diff = DIFFICULTY_MODIFIER.get(difficulty, "")
    if diff:
        return f"{base}\n\nDifficulty level: {diff}"
    return base


def _build_messages(
    system_prompt: str,
    dialogues: list[Dialogue],
    current_user_text: str,
) -> list[dict[str, str]]:
    """Assemble the full message list for the LLM: system prompt + history + current user msg.

    Only includes the last 10 exchanges (20 messages) to stay within context limits.
    """
    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]

    # Use last N exchanges to keep context manageable
    recent = dialogues[-20:] if len(dialogues) > 20 else dialogues
    for d in recent:
        if d.user_text:
            messages.append({"role": "user", "content": d.user_text})
        if d.ai_text:
            messages.append({"role": "assistant", "content": d.ai_text})

    # Add current user message
    messages.append({"role": "user", "content": current_user_text})

    return messages


async def generate_ai_reply_stream(
    scenario: str,
    difficulty: str,
    dialogues: list[Dialogue],
    current_user_text: str,
):
    """Generate AI reply as a stream of token strings.

    Yields each content chunk from the LLM. Falls back to yielding the scripted
    reply as a single chunk if the LLM is unavailable.
    """
    if is_llm_configured():
        try:
            system_prompt = _build_system_prompt(scenario, difficulty)
            messages = _build_messages(system_prompt, dialogues, current_user_text)
            async for token in chat_completion_stream(messages):
                yield token
            logger.info("LLM stream completed for scenario=%s", scenario)
            return
        except Exception as exc:
            logger.warning("LLM stream failed, falling back to scripts: %s", exc)

    # Fallback: yield entire scripted line at once
    user_rounds = sum(1 for d in dialogues if d.user_text is not None)
    script = FALLBACK_SCRIPTS.get(scenario, ["好的，明白了。"])
    yield script[min(user_rounds, len(script) - 1)]


async def generate_ai_reply(
    scenario: str,
    difficulty: str,
    dialogues: list[Dialogue],
    current_user_text: str,
) -> str:
    """Generate an AI reply for the current conversation turn.

    Uses the LLM if configured; falls back to scripted templates otherwise.
    """
    if is_llm_configured():
        try:
            system_prompt = _build_system_prompt(scenario, difficulty)
            messages = _build_messages(system_prompt, dialogues, current_user_text)
            reply = await chat_completion(messages)
            logger.info("LLM reply generated for scenario=%s", scenario)
            return reply
        except Exception as exc:
            logger.warning("LLM call failed, falling back to scripts: %s", exc)
            # Fall through to scripted fallback

    # Fallback: pick next scripted line by counting user rounds
    user_rounds = sum(1 for d in dialogues if d.user_text is not None)
    script = FALLBACK_SCRIPTS.get(scenario, ["好的，明白了。"])
    return script[min(user_rounds, len(script) - 1)]

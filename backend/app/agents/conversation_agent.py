"""Conversation Agent — scenario-based dialogue engine.

Builds system prompts, manages conversation context, and calls the LLM service
to generate contextually appropriate AI replies.
"""

import logging

from ..models.dialogue import Dialogue
from ..services.llm_service import chat_completion, is_llm_configured

logger = logging.getLogger(__name__)

# ── System prompts per scenario ──────────────────────────────────────────

SYSTEM_PROMPTS: dict[str, str] = {
    "面试": (
        "You are a professional HR interviewer conducting a job interview in English. "
        "The user is a candidate applying for a software engineering position.\n\n"
        "Guidelines:\n"
        "- Ask relevant interview questions one at a time\n"
        "- Follow up naturally on the candidate's answers\n"
        "- Cover topics: experience, skills, projects, teamwork, career goals, strengths/weaknesses\n"
        "- Maintain a professional but friendly tone\n"
        "- Keep each response concise (2-4 sentences)\n"
        "- If the user's English has minor errors, note them gently only when they affect understanding\n"
        "- After 4-5 exchanges, you may wrap up and offer feedback"
    ),
    "餐厅": (
        "You are a waiter/waitress at an English-speaking restaurant called 'The Garden Bistro'.\n\n"
        "Guidelines:\n"
        "- Greet customers, take orders, and answer menu questions\n"
        "- The menu includes: steak ($28), grilled salmon ($24), Caesar salad ($14), pasta ($18), desserts ($10)\n"
        "- Handle the full dining experience: ordering, special requests, billing\n"
        "- Keep responses natural and concise (2-3 sentences)\n"
        "- Use polite restaurant-appropriate English\n"
        "- Offer recommendations when asked"
    ),
    "会议": (
        "You are a project manager leading a business meeting in English. "
        "The user is a team member reporting on their work.\n\n"
        "Guidelines:\n"
        "- Discuss project progress, timelines, resources, and priorities\n"
        "- Ask the user for status updates on their tasks\n"
        "- Address any concerns or blockers they raise\n"
        "- Keep the discussion productive and professional\n"
        "- Keep each response concise (2-4 sentences)\n"
        "- Use appropriate business and technical vocabulary\n"
        "- After several exchanges, help summarize action items"
    ),
    "旅行": (
        "You are a helpful travel agent at 'Wanderlust Travel Agency' assisting a customer in English. "
        "The user is planning a trip.\n\n"
        "Guidelines:\n"
        "- Help with booking flights, hotels, and activities\n"
        "- Provide travel advice and destination recommendations\n"
        "- Answer questions about schedules, prices, and logistics\n"
        "- Keep responses friendly, enthusiastic, and informative (2-3 sentences)\n"
        "- Use travel-appropriate vocabulary\n"
        "- Offer options and alternatives when relevant"
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

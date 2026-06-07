"""Summary Agent — generates an after-lesson summary via LLM."""

import json
import logging

from ..services.llm_service import chat_completion, is_llm_configured

logger = logging.getLogger(__name__)

SUMMARY_PROMPT = """You are an English tutor writing a friendly after-lesson summary for a Chinese student.

Generate a summary in SIMPLIFIED CHINESE. The student just finished an English conversation practice session. Review their performance data below and write a warm, encouraging summary.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "overall": "总体评价，1-3句话，鼓励为主",
  "strengths": ["优点1", "优点2", "优点3"],
  "improvements": ["待改进1", "待改进2"],
  "tips": ["学习建议1", "学习建议2", "学习建议3"]
}

Rules:
- overall: be encouraging but honest based on the score. Under 50 → gentle encouragement. 50-70 → positive with areas to grow. 70-90 → praise effort. 90+ → celebrate.
- strengths: based on grammar/pronunciation scores and vocabulary diversity
- improvements: specific, actionable advice for improving English speaking
- tips: practical study methods for Chinese learners of English
- Keep each item under 40 Chinese characters
- Use a warm, encouraging tone — the student is learning!"""


async def generate_summary(
    scenario: str,
    difficulty: str,
    grammar_score: int,
    pronunciation_score: int,
    overall_score: int,
    total_words: int,
    unique_words: int,
    accuracy: int,
    num_rounds: int,
    grammar_errors: int,
) -> dict:
    """Generate a session summary. Falls back to a template if LLM is unavailable."""

    if is_llm_configured():
        try:
            user_prompt = (
                f"Session data:\n"
                f"- Scenario: {scenario}\n"
                f"- Difficulty: {difficulty}\n"
                f"- Rounds of conversation: {num_rounds}\n"
                f"- Overall score: {overall_score}/100\n"
                f"- Grammar score: {grammar_score}/100\n"
                f"- Pronunciation score: {pronunciation_score}/100\n"
                f"- Total words used: {total_words}\n"
                f"- Unique words used: {unique_words}\n"
                f"- Vocabulary accuracy: {accuracy}%\n"
                f"- Grammar errors found: {grammar_errors}\n"
            )

            response = await chat_completion(
                messages=[
                    {"role": "system", "content": SUMMARY_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=600,
            )

            raw = response.strip()
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:])
                if raw.endswith("```"):
                    raw = raw[:-3]
                if raw.startswith("json"):
                    raw = raw[4:]

            return json.loads(raw)

        except Exception as exc:
            logger.warning("Summary generation failed: %s", exc)

    # Fallback template
    return {
        "overall": _fallback_overall(overall_score, scenario),
        "strengths": _fallback_strengths(grammar_score, pronunciation_score, accuracy),
        "improvements": _fallback_improvements(grammar_score, pronunciation_score, grammar_errors, unique_words),
        "tips": _fallback_tips(total_words, accuracy),
    }


def _fallback_overall(score: int, scenario: str) -> str:
    if score >= 90:
        return f"太棒了！你在{scenario}场景中表现出色，英语口语非常流利自然。"
    if score >= 70:
        return f"不错哦！你在{scenario}场景中的表现整体良好，继续保持！"
    if score >= 50:
        return f"做得不错！{scenario}练习中你展示了不错的沟通能力，还有进步空间。"
    return f"迈出了第一步很棒！{scenario}场景的练习是提高口语的好开始，坚持练习会越来越好。"


def _fallback_strengths(grammar: int, pron: int, accuracy: int) -> list[str]:
    s = []
    if grammar >= 70:
        s.append("语法基础扎实，句子结构清晰")
    elif grammar >= 50:
        s.append("语法基本正确，能表达清楚意思")
    if pron >= 70:
        s.append("发音清晰，语调自然")
    if accuracy >= 80:
        s.append("词汇运用准确，表达地道")
    elif accuracy >= 60:
        s.append("词汇使用基本准确")
    if len(s) < 2:
        s.append("敢于开口说英语，学习态度积极")
    if len(s) < 3:
        s.append("对话互动自然，沟通意愿强")
    return s[:3]


def _fallback_improvements(grammar: int, pron: int, errors: int, unique: int) -> list[str]:
    imp = []
    if grammar < 70:
        imp.append("多练习基础语法，尤其注意时态和主谓一致")
    if pron < 70:
        imp.append("多听英文原声，模仿发音和语调")
    if errors > 3:
        imp.append(f"本次对话有{errors}处语法小错误，回顾纠错面板重点复习")
    if unique < 20:
        imp.append("尝试使用更多样化的词汇，避免重复用词")
    if len(imp) < 2:
        imp.append("增加练习频率，每周至少练习3次口语")
    return imp[:2]


def _fallback_tips(words: int, accuracy: int) -> list[str]:
    tips = [
        "每天花10分钟朗读英文文章，培养语感",
        "看英文视频时尝试跟读（shadowing），模仿语音语调",
        "准备一个生词本，每次练习后的纠错词汇重点记忆",
    ]
    if words < 30:
        tips.append("尝试在每次对话中说更多内容，扩展回答长度")
    if accuracy < 70:
        tips.append("使用简单但正确的句子比复杂但有错的句子更好")
    return tips[:3]
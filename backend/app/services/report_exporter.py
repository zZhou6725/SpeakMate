"""Report exporter — PDF generation and preview wrapper for practice reports."""

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from ..models.practice_session import PracticeSession
from ..models.dialogue import Dialogue
from ..models.evaluation import Evaluation

FONT_BODY_PATH = "C:/Windows/Fonts/simsun.ttc"
FONT_BODY_NAME = "SimSunBold"
FONT_BODY_INDEX = 1
FONT_TITLE_PATH = "C:/Windows/Fonts/simhei.ttf"
FONT_TITLE_NAME = "SimHei"

_registered = False


def _register_fonts():
    global _registered
    if not _registered:
        pdfmetrics.registerFont(TTFont(FONT_BODY_NAME, FONT_BODY_PATH, subfontIndex=FONT_BODY_INDEX))
        pdfmetrics.registerFont(TTFont(FONT_TITLE_NAME, FONT_TITLE_PATH))
        _registered = True


def _fmt_duration(start, end):
    if not end:
        return "0分钟"
    delta = (end - start).total_seconds()
    minutes = max(1, round(delta / 60))
    return f"{minutes}分钟"


class ReportData:
    def __init__(self, session: PracticeSession, dialogues: list[Dialogue], evaluation: Evaluation | None):
        self.scenario = session.scenario
        self.score = int(session.overall_score) if session.overall_score else 0
        self.duration = _fmt_duration(session.start_time, session.end_time)
        self.start_time = session.start_time

        gs = int(evaluation.grammar_score or 0) if evaluation else 0
        ps = int(evaluation.pronunciation_score or 0) if evaluation else 0
        self.grammar_score = gs
        self.pronunciation_score = ps
        self.fluency_score = max(45, int((gs + ps) / 2) - 2)

        self.conversation: list[dict] = []
        self.grammar_items: list[dict] = []
        self.pronunciation_items: list[dict] = []

        turn = 1
        pending_user: str | None = None
        for d in dialogues:
            if d.user_text:
                pending_user = d.user_text
                if d.grammar_correction and d.grammar_correction.get("items"):
                    self.grammar_items.extend(d.grammar_correction["items"])
            if d.ai_text:
                user = pending_user or ""
                self.conversation.append({"turn": turn, "user": user, "ai": d.ai_text})
                if d.pronunciation_items:
                    items = d.pronunciation_items if isinstance(d.pronunciation_items, list) else d.pronunciation_items.get("items", [])
                    self.pronunciation_items.extend(items)
                turn += 1
                pending_user = None


def build_pdf_preview_page(report_id: int) -> str:
    """Return an HTML page that embeds the PDF for preview, with a toolbar."""
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>SpeakMate 练习报告 — 预览</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: "Microsoft YaHei", "PingFang SC", sans-serif; background: #E5E7EB; height: 100vh; display: flex; flex-direction: column; }}
  .toolbar {{ display: flex; justify-content: space-between; align-items: center; background: #fff; border-bottom: 1px solid #D1D5DB; padding: 10px 24px; flex-shrink: 0; }}
  .toolbar-title {{ font-size: 14px; font-weight: 600; color: #2563EB; }}
  .toolbar-actions {{ display: flex; gap: 8px; }}
  .btn {{ padding: 7px 18px; border-radius: 8px; font-size: 13px; cursor: pointer; font-family: inherit; transition: all .15s; }}
  .btn-print {{ border: none; background: #2563EB; color: #fff; }}
  .btn-print:hover {{ background: #1D4ED8; }}
  .btn-close {{ border: 1px solid #D1D5DB; background: #fff; color: #374151; }}
  .btn-close:hover {{ background: #F3F4F6; }}
  .pdf-container {{ flex: 1; display: flex; }}
  embed {{ flex: 1; border: none; }}
</style>
</head>
<body>
<div class="toolbar">
  <span class="toolbar-title">SpeakMate 练习报告 — 预览</span>
  <div class="toolbar-actions">
    <button class="btn btn-print" onclick="document.querySelector('embed').postMessage('print')">打印</button>
    <button class="btn btn-close" onclick="window.close()">关闭预览</button>
  </div>
</div>
<div class="pdf-container">
  <embed src="/api/reports/{report_id}/pdf" type="application/pdf" width="100%" height="100%">
</div>
</body>
</html>"""


def build_pdf(data: ReportData) -> bytes:
    """Generate a PDF report using SimSun Bold as body font, SimHei for titles."""
    _register_fonts()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=20 * mm,
        bottomMargin=20 * mm,
    )

    B = FONT_BODY_NAME
    T = FONT_TITLE_NAME

    style_heading = ParagraphStyle("heading", fontName=T, fontSize=18, textColor=colors.HexColor("#2563EB"), spaceAfter=12, leading=22)
    style_h2 = ParagraphStyle("h2", fontName=T, fontSize=13, spaceAfter=8, spaceBefore=14, leading=18)
    style_meta = ParagraphStyle("meta", fontName=B, fontSize=10, textColor=colors.HexColor("#6B7280"), leading=14)
    style_score = ParagraphStyle("score", fontName=B, fontSize=22, leading=28)
    style_score_label = ParagraphStyle("scoreLabel", fontName=B, fontSize=9, textColor=colors.HexColor("#6B7280"))
    style_turn = ParagraphStyle("turn", fontName=B, fontSize=9, textColor=colors.HexColor("#9CA3AF"), leading=12)
    style_chat = ParagraphStyle("chat", fontName=B, fontSize=10, leading=16, spaceAfter=2)
    style_corr = ParagraphStyle("corr", fontName=B, fontSize=10, leading=16, spaceAfter=3)
    style_empty = ParagraphStyle("empty", fontName=B, fontSize=10, textColor=colors.HexColor("#9CA3AF"))
    style_footer = ParagraphStyle("footer", fontName=B, fontSize=8, textColor=colors.HexColor("#9CA3AF"))

    elements: list = []

    # Title
    elements.append(Paragraph("SpeakMate 练习报告", style_heading))
    elements.append(Paragraph(
        f"场景: {data.scenario} &nbsp;|&nbsp; 时长: {data.duration} &nbsp;|&nbsp; 总分: {data.score}",
        style_meta,
    ))
    elements.append(Spacer(1, 8 * mm))

    # Score table
    score_data = [
        [Paragraph(str(data.grammar_score), style_score), Paragraph(str(data.pronunciation_score), style_score), Paragraph(str(data.fluency_score), style_score)],
        [Paragraph("语法", style_score_label), Paragraph("发音", style_score_label), Paragraph("流利度", style_score_label)],
    ]
    score_table = Table(score_data, colWidths=[38 * mm, 38 * mm, 38 * mm])
    score_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.HexColor("#E5E7EB")),
    ]))
    elements.append(Paragraph("得分概览", style_h2))
    elements.append(score_table)
    elements.append(Spacer(1, 6 * mm))

    # Conversation
    elements.append(Paragraph("对话记录", style_h2))
    for msg in data.conversation:
        elements.append(Paragraph(f"第 {msg['turn']} 轮", style_turn))
        elements.append(Paragraph(f"<b>你:</b> {_escape(msg['user'])}", style_chat))
        elements.append(Paragraph(f"<b>AI:</b> {_escape(msg['ai'])}", style_chat))
        elements.append(Spacer(1, 2 * mm))

    # Grammar corrections
    elements.append(Paragraph("语法纠错", style_h2))
    if data.grammar_items:
        for i, item in enumerate(data.grammar_items, 1):
            wrong = _escape(item.get("wrong", ""))
            correct = _escape(item.get("correct", ""))
            reason = _escape(item.get("reason", ""))
            text = f"{i}. <strike><font color='#EF4444'>{wrong}</font></strike> → <font color='#16A34A'><b>{correct}</b></font>  <font color='#6B7280'>({reason})</font>"
            elements.append(Paragraph(text, style_corr))
    else:
        elements.append(Paragraph("未发现语法错误。", style_empty))

    elements.append(Spacer(1, 4 * mm))

    # Pronunciation
    elements.append(Paragraph("发音指导", style_h2))
    if data.pronunciation_items:
        for i, item in enumerate(data.pronunciation_items, 1):
            word = _escape(item.get("word", ""))
            phonetic = _escape(item.get("phonetic", ""))
            tip = _escape(item.get("tip", ""))
            text = f"{i}. <b>{word}</b> <font color='#6B7280'>[{phonetic}]</font> — {tip}"
            elements.append(Paragraph(text, style_corr))
    else:
        elements.append(Paragraph("暂无发音指导数据。", style_empty))

    # Footer
    elements.append(Spacer(1, 10 * mm))
    gen_time = data.start_time.strftime("%Y-%m-%d %H:%M") if data.start_time else ""
    elements.append(Paragraph(f"由 SpeakMate 生成 | {gen_time}", style_footer))

    doc.build(elements)
    return buf.getvalue()


def _escape(text: str) -> str:
    """Escape HTML special characters."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
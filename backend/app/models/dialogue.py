"""Dialogue ORM model."""

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Dialogue(Base):
    __tablename__ = "dialogues"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    user_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    pronunciation_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    grammar_correction: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)

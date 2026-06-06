"""Evaluation ORM model."""

from typing import Optional

from sqlalchemy import Float, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    error_type: Mapped[str] = mapped_column(Text, nullable=False)
    error_count: Mapped[int] = mapped_column(Integer, default=0)
    grammar_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    pronunciation_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

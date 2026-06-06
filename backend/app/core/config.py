"""Application configuration loaded from .env / environment variables."""

import os
from typing import List

from dotenv import load_dotenv

load_dotenv()


class Settings:
    # LLM
    llm_api_key: str = os.getenv("LLM_API_KEY", "your-api-key-here")

    # Database
    db_path: str = os.getenv("DB_PATH", "./data/speakmate.db")

    # Whisper
    whisper_model: str = os.getenv("WHISPER_MODEL", "base")

    # Server
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))

    # CORS
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @property
    def database_url(self) -> str:
        return f"sqlite+aiosqlite:///{self.db_path}"


settings = Settings()

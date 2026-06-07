"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import register_routers
from .core.config import settings
from .core.database import engine
from .core.logging_config import setup_logging
from .models.base import Base

# Initialize logging before anything else
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown hook: create tables on startup."""
    # Create data directory if needed
    import os

    os.makedirs(os.path.dirname(settings.db_path) or ".", exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(
    title="SpeakMate API",
    description="AI 英语口语陪练 - 后端服务",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
register_routers(app)


@app.get("/api/health")
async def health():
    """Health check."""
    return {"status": "ok"}

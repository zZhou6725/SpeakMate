"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import register_routers
from .core.config import settings
from .core.database import engine
from .core.logging_config import setup_logging

# Initialize logging before anything else
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown hook: run migrations on startup."""
    import asyncio
    import os

    from alembic import command
    from alembic.config import Config

    alembic_ini = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
    alembic_cfg = Config(alembic_ini)
    await asyncio.to_thread(command.upgrade, alembic_cfg, "head")
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

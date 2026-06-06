"""Aggregate all sub-routers."""

from fastapi import APIRouter

from .scenarios import router as scenarios_router
from .dashboard import router as dashboard_router
from .history import router as history_router
from .chat import router as chat_router

api_router = APIRouter()
api_router.include_router(scenarios_router)
api_router.include_router(dashboard_router)
api_router.include_router(history_router)
api_router.include_router(chat_router)


def register_routers(app):
    """Attach all API routers to the FastAPI app."""
    app.include_router(api_router)

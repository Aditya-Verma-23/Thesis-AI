"""ThesisAI backend entrypoint."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import get_settings
from app.middleware.rate_limit import SlidingWindowRateLimiter
from app.routers import query
from app.utils.session_store import run_session_sweeper


@asynccontextmanager
async def lifespan(app: FastAPI):
    sweeper_task = asyncio.create_task(run_session_sweeper())
    logger.info("ThesisAI backend started")
    yield
    sweeper_task.cancel()
    logger.info("ThesisAI backend shutting down")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)

    # Enable CORS for Vite dev server and existing origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins + ["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(SlidingWindowRateLimiter)

    app.include_router(query.router)

    return app


app = create_app()

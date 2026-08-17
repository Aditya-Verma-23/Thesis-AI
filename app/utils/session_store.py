"""In-memory session store with TTL-based eviction and a background sweep task.

Fine for a single-process deployment. Swap for Redis if ThesisAI ever needs to
run multiple workers behind a load balancer.
"""
from __future__ import annotations

import asyncio
from datetime import datetime, timedelta

from loguru import logger

from app.config import get_settings
from app.models import ChatMessage, Session


class SessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, Session] = {}
        self._lock = asyncio.Lock()

    async def get_or_create(self, session_id: str | None) -> Session:
        async with self._lock:
            if session_id and session_id in self._sessions:
                session = self._sessions[session_id]
                session.last_active_at = datetime.utcnow()
                return session
            session = Session()
            self._sessions[session.session_id] = session
            return session

    async def append_message(self, session_id: str, message: ChatMessage) -> None:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session:
                session.history.append(message)
                session.last_active_at = datetime.utcnow()

    async def sweep_expired(self) -> None:
        settings = get_settings()
        cutoff = datetime.utcnow() - timedelta(seconds=settings.session_ttl_s)
        async with self._lock:
            expired = [sid for sid, s in self._sessions.items() if s.last_active_at < cutoff]
            for sid in expired:
                del self._sessions[sid]
        if expired:
            logger.info(f"Evicted {len(expired)} expired session(s)")


session_store = SessionStore()


async def run_session_sweeper() -> None:
    settings = get_settings()
    while True:
        await asyncio.sleep(settings.session_cleanup_interval_s)
        await session_store.sweep_expired()

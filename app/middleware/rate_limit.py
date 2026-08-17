"""Per-IP sliding-window rate limiter, in-memory (single-process)."""
from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings


class SlidingWindowRateLimiter(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/api/"):
            return await call_next(request)

        settings = get_settings()
        client_ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window = self._hits[client_ip]

        while window and now - window[0] > settings.rate_limit_window_s:
            window.popleft()

        if len(window) >= settings.rate_limit_requests:
            retry_after = int(settings.rate_limit_window_s - (now - window[0]))
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please slow down."},
                headers={"Retry-After": str(max(retry_after, 1))},
            )

        window.append(now)
        return await call_next(request)

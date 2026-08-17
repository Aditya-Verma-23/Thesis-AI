"""Async-wrapped DuckDuckGo web search (free, keyless, via the `ddgs` package)."""
from __future__ import annotations

import asyncio

from loguru import logger

from app.config import get_settings
from app.models import Citation, SourceType


def _search_sync(query: str, max_results: int) -> list[dict]:
    from ddgs import DDGS  # imported lazily so the app still boots without it installed

    with DDGS() as ddgs:
        return list(ddgs.text(query, max_results=max_results))


async def search_web(query: str) -> list[Citation]:
    settings = get_settings()
    try:
        results = await asyncio.wait_for(
            asyncio.to_thread(_search_sync, query, settings.web_max_results),
            timeout=settings.retrieval_timeout_s,
        )
    except Exception as exc:  # noqa: BLE001 - DDG lib raises assorted errors; degrade gracefully
        logger.warning(f"Web search failed: {exc}")
        return []

    citations: list[Citation] = []
    for r in results:
        citations.append(
            Citation(
                index=0,
                title=r.get("title") or "Untitled",
                url=r.get("href"),
                authors=[],
                year=None,
                source=SourceType.WEB,
                snippet=(r.get("body") or "")[:500],
            )
        )
    return citations

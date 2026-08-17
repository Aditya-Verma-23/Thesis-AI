"""Async Semantic Scholar retrieval (free public API, no key required for low volume)."""
from __future__ import annotations

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.models import Citation, SourceType

S2_API_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
FIELDS = "title,abstract,url,year,authors,externalIds"


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, max=4))
async def search_semantic_scholar(query: str) -> list[Citation]:
    settings = get_settings()
    params = {
        "query": query,
        "limit": settings.semantic_scholar_max_results,
        "fields": FIELDS,
    }
    try:
        async with httpx.AsyncClient(timeout=settings.retrieval_timeout_s) as client:
            resp = await client.get(S2_API_URL, params=params)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning(f"Semantic Scholar retrieval failed: {exc}")
        return []

    data = resp.json().get("data", [])
    citations: list[Citation] = []
    for paper in data:
        authors = [a.get("name", "") for a in paper.get("authors", []) if a.get("name")]
        citations.append(
            Citation(
                index=0,
                title=paper.get("title") or "Untitled",
                url=paper.get("url"),
                authors=authors,
                year=paper.get("year"),
                source=SourceType.SEMANTIC_SCHOLAR,
                snippet=(paper.get("abstract") or "")[:500],
            )
        )
    return citations

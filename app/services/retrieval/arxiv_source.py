"""Async arXiv retrieval (free, keyless Atom API)."""
from __future__ import annotations

import xml.etree.ElementTree as ET

import httpx
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.models import Citation, SourceType

ARXIV_API_URL = "http://export.arxiv.org/api/query"
_NS = {"atom": "http://www.w3.org/2005/Atom"}


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=0.5, max=4))
async def search_arxiv(query: str) -> list[Citation]:
    settings = get_settings()
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": settings.arxiv_max_results,
        "sortBy": "relevance",
        "sortOrder": "descending",
    }
    try:
        async with httpx.AsyncClient(timeout=settings.retrieval_timeout_s) as client:
            resp = await client.get(ARXIV_API_URL, params=params)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        logger.warning(f"arXiv retrieval failed: {exc}")
        return []

    root = ET.fromstring(resp.text)
    citations: list[Citation] = []
    for entry in root.findall("atom:entry", _NS):
        title_el = entry.find("atom:title", _NS)
        summary_el = entry.find("atom:summary", _NS)
        link_el = entry.find("atom:id", _NS)
        published_el = entry.find("atom:published", _NS)
        authors = [
            (a.findtext("atom:name", default="", namespaces=_NS) or "").strip()
            for a in entry.findall("atom:author", _NS)
        ]
        year = None
        if published_el is not None and published_el.text:
            year = int(published_el.text[:4])

        citations.append(
            Citation(
                index=0,
                title=(title_el.text or "").strip().replace("\n", " ") if title_el is not None else "Untitled",
                url=(link_el.text or "").strip() if link_el is not None else None,
                authors=authors,
                year=year,
                source=SourceType.ARXIV,
                snippet=(summary_el.text or "").strip().replace("\n", " ")[:500] if summary_el is not None else "",
            )
        )
    return citations

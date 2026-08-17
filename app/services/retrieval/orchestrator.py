"""Fans a query out to every requested source concurrently and merges results.

Any single source failing (timeout, HTTP error, empty) degrades gracefully -
the others still return. Citation indices are assigned only after merging so
they map 1:1 with what's shown to the user.
"""
from __future__ import annotations

import asyncio

from loguru import logger

from app.models import Citation, SourceType
from app.services.retrieval.arxiv_source import search_arxiv
from app.services.retrieval.semantic_scholar_source import search_semantic_scholar
from app.services.retrieval.web_source import search_web

_SOURCE_FUNCS = {
    SourceType.ARXIV: search_arxiv,
    SourceType.SEMANTIC_SCHOLAR: search_semantic_scholar,
    SourceType.WEB: search_web,
}


async def retrieve_all(query: str, sources: list[SourceType]) -> list[Citation]:
    tasks = {s: asyncio.create_task(_SOURCE_FUNCS[s](query)) for s in sources if s in _SOURCE_FUNCS}
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)

    merged: list[Citation] = []
    for source, result in zip(tasks.keys(), results):
        if isinstance(result, Exception):
            logger.warning(f"Source {source} raised: {result}")
            continue
        merged.extend(result)

    for i, citation in enumerate(merged, start=1):
        citation.index = i

    return merged

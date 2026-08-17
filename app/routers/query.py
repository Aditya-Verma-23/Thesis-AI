"""Quick Q/A endpoint: retrieves sources, then streams a synthesized, cited answer."""
from __future__ import annotations

import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from loguru import logger

from app.models import ChatMessage, QueryRequest, SourceType, StreamEventType
from app.services.llm import synthesize_answer
from app.services.retrieval.orchestrator import retrieve_all
from app.utils.session_store import session_store

router = APIRouter(prefix="/api", tags=["query"])

_STAGE_LABELS = {
    SourceType.ARXIV: "Searching arXiv...",
    SourceType.SEMANTIC_SCHOLAR: "Searching Semantic Scholar...",
    SourceType.WEB: "Searching the web...",
}


def _sse(event_type: StreamEventType, data: dict) -> str:
    return f"data: {json.dumps({'type': event_type.value, **data})}\n\n"


def _filter_summary(request: QueryRequest) -> str:
    """Build a short human-readable description of active filters."""
    f = request.filters
    parts = []
    if f.publication_types:
        parts.append(f"{len(f.publication_types)} pub type(s)")
    if f.date_start or f.date_end:
        date_range = f"{f.date_start or '?'} → {f.date_end or 'now'}"
        parts.append(f"date: {date_range}")
    return ", ".join(parts) if parts else "no extra filters"


@router.post("/query")
async def query(request: QueryRequest):
    session = await session_store.get_or_create(request.session_id)

    logger.info(
        "Query received | sources={} | filters=[{}]",
        [s.value for s in request.sources],
        _filter_summary(request),
    )

    async def event_stream():
        try:
            # Emit a filter summary stage so the UI can show it
            summary = _filter_summary(request)
            if summary != "no extra filters":
                yield _sse(StreamEventType.STAGE, {"message": f"Applying filters: {summary}"})

            for source in request.sources:
                yield _sse(StreamEventType.STAGE, {"message": _STAGE_LABELS.get(source, "Searching...")})

            citations = await retrieve_all(request.query, request.sources)

            yield _sse(
                StreamEventType.STAGE,
                {"message": f"Found {len(citations)} source(s). Synthesizing answer..."},
            )

            answer_text = ""
            async for token in synthesize_answer(request.query, citations):
                answer_text += token
                yield _sse(StreamEventType.TOKEN, {"content": token})

            yield _sse(
                StreamEventType.CITATIONS,
                {"citations": [c.model_dump(mode="json") for c in citations]},
            )

            await session_store.append_message(
                session.session_id,
                ChatMessage(role="user", content=request.query),
            )
            await session_store.append_message(
                session.session_id,
                ChatMessage(role="assistant", content=answer_text, citations=citations),
            )

            yield _sse(StreamEventType.DONE, {"session_id": session.session_id})

        except Exception as exc:  # noqa: BLE001
            logger.exception("Query pipeline failed")
            yield _sse(StreamEventType.ERROR, {"message": str(exc)})

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    session = await session_store.get_or_create(session_id)
    return session.model_dump(mode="json")

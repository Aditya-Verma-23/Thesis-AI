"""Answer synthesis via a local Ollama model, called through its OpenAI-compatible
/v1/chat/completions endpoint with plain `requests` in a thread (keeps the rest of
the app fully async without pulling in an extra client library)."""
from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator

import requests
from loguru import logger

from app.config import get_settings
from app.models import Citation

SYSTEM_PROMPT = """You are ThesisAI, a research assistant. Answer the user's question using ONLY \
the numbered sources provided below. Cite claims inline using bracketed numbers like [1] or [2][3] \
that match the source list. If the sources don't cover something, say so plainly instead of guessing. \
Write your ENTIRE response strictly as a single, continuous paragraph suitable for a literature review. Do not use line breaks, bullet points, or multiple paragraphs. Do not invent sources or facts."""


def _format_sources(citations: list[Citation]) -> str:
    lines = []
    for c in citations:
        author_str = ", ".join(c.authors[:3]) + (" et al." if len(c.authors) > 3 else "")
        year_str = f" ({c.year})" if c.year else ""
        lines.append(f"[{c.index}] {c.title}{year_str} — {author_str}\n{c.snippet}")
    return "\n\n".join(lines) if lines else "(no sources retrieved)"


def _stream_sync(url: str, payload: dict, timeout: int):
    with requests.post(url, json=payload, timeout=timeout, stream=True) as resp:
        resp.raise_for_status()
        for line in resp.iter_lines(decode_unicode=True):
            if not line or not line.startswith("data:"):
                continue
            data = line[len("data:"):].strip()
            if data == "[DONE]":
                break
            try:
                chunk = json.loads(data)
            except json.JSONDecodeError:
                continue
            delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
            if delta:
                yield delta


async def synthesize_answer(query: str, citations: list[Citation]) -> AsyncIterator[str]:
    """Yields answer tokens as they stream from the local model."""
    settings = get_settings()
    url = f"{settings.ollama_base_url}/chat/completions"
    payload = {
        "model": settings.ollama_model,
        "temperature": settings.llm_synthesis_temperature,
        "stream": True,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Question: {query}\n\nSources:\n{_format_sources(citations)}",
            },
        ],
    }

    queue: asyncio.Queue[str | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def producer():
        try:
            for token in _stream_sync(url, payload, settings.llm_request_timeout_s):
                loop.call_soon_threadsafe(queue.put_nowait, token)
        except Exception as exc:  # noqa: BLE001
            logger.error(f"LLM streaming failed: {exc}")
            loop.call_soon_threadsafe(
                queue.put_nowait, "\n\n_[Answer generation failed — is Ollama running?]_"
            )
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)

    asyncio.get_running_loop().run_in_executor(None, producer)

    while True:
        token = await queue.get()
        if token is None:
            break
        yield token

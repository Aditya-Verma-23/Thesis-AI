# ThesisAI

A self-hosted "Quick Q/A" research assistant modeled on AnswerThis.io — ask a research
question, it searches arXiv, Semantic Scholar, and the web concurrently, then streams
a cited, synthesized answer using a local LLM.

## What's included (this pass)

- **Quick Q/A only.** The other AnswerThis workflows (Literature Review, Systematic
  Review, Data Analysis, Research Gaps, Paper Chat) are shown in the UI as disabled
  tabs / "coming soon" — nothing there is wired up yet, by design, so we scoped it
  properly per your call.
- **Sources:** arXiv + Semantic Scholar + DuckDuckGo web search, all free/keyless.
  The filter panel also lists PubMed, OpenAlex, ClinicalTrials.gov, FDA/EMA, and
  My Library as visibly disabled "coming soon" entries — matching AnswerThis's real
  layout without pretending we've actually integrated them.
- **UI:** single-file `static/index.html`, light theme with the maroon/pink accent
  from your screenshots — sidebar, home/composer view, workflow tabs, source filter
  drawer, and a streaming chat view with numbered citation chips and source cards.
- **Backend:** modular FastAPI package (`app/{routers,services,middleware,utils}`),
  pydantic-settings config, loguru logging, httpx + tenacity for retrieval, SSE
  streaming, UUID session management with TTL eviction, sliding-window per-IP rate
  limiting — same shape as your other projects.

## Running it

```bash
cd backend
pip install -r requirements.txt --break-system-packages   # or use a venv
```

You need a local Ollama model running for answer synthesis:

```bash
ollama pull qwen2.5:14b-instruct     # or any chat model you prefer
ollama serve                          # usually already running as a service
```

Copy `.env.example` to `.env` if you want to override defaults (model name, ports,
rate limits, etc.) — see `app/config.py` for every setting.

```bash
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000** — the FastAPI app serves the frontend directly from
`static/`, so there's nothing separate to run for the UI.

## Notes on this environment's test run

I smoke-tested the full pipeline here: server boots, static UI serves, SSE streaming
works, and — because this sandbox can't reach arxiv.org, semanticscholar.org, or
Ollama — I confirmed the graceful-degradation path fires correctly (each source logs
a warning and the pipeline continues; the LLM step returns a clear inline message
instead of hanging). On your machine, with real network access and Ollama running,
retrieval and synthesis should both come back with real data.

## Next steps / open questions

- Which Ollama model do you want as the default? `qwen2.5:14b-instruct` is a
  placeholder in `config.py` — swap `THESISAI_OLLAMA_MODEL` for whatever you
  actually have pulled (or point `THESISAI_OLLAMA_BASE_URL` at Groq's
  OpenAI-compatible endpoint if you'd rather use that instead of local inference).
- When you're ready for Literature Review or another workflow, I can build it next
  as its own tab + endpoint rather than trying to fake it now.
- The DuckDuckGo wrapper depends on the `ddgs` package's scraping approach, which
  DuckDuckGo can rate-limit under load — worth keeping an eye on if this gets real
  traffic.

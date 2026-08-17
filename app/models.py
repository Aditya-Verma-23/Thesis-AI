"""Pydantic v2 schemas for requests, responses, and internal data."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    ARXIV = "arxiv"
    SEMANTIC_SCHOLAR = "semantic_scholar"
    WEB = "web"


class PublicationType(str, Enum):
    JOURNAL = "journal"
    REVIEW = "review"
    CONFERENCE = "conference"
    PREPRINT = "preprint"
    BOOKS = "books"


class DatabaseSource(str, Enum):
    SEMANTIC_SCHOLAR = "semantic_scholar"
    OPENALEX = "openalex"
    PUBMED = "pubmed"
    ARXIV = "arxiv"
    CLINICAL_TRIALS = "clinical_trials"
    WEB_SEARCH = "web_search"
    PATENTS = "patents"
    MEDICARE = "medicare"
    MY_LIBRARY = "my_library"


class JournalQuality(str, Enum):
    Q1  = "Q1"
    Q2  = "Q2"
    Q3  = "Q3"
    Q4  = "Q4"
    ALL = "All"


class WebDomain(str, Enum):
    ALL = "all"
    GOV = "gov"
    EDU = "edu"


class SearchFilters(BaseModel):
    """Optional search filter settings sent from the frontend filter panel."""
    publication_types: list[PublicationType] = Field(
        default_factory=lambda: [PublicationType.JOURNAL, PublicationType.REVIEW, PublicationType.CONFERENCE],
        description="Publication types to include in search results"
    )
    databases: list[DatabaseSource] = Field(
        default_factory=lambda: [DatabaseSource.SEMANTIC_SCHOLAR, DatabaseSource.ARXIV, DatabaseSource.WEB_SEARCH],
        description="Database / source to query"
    )
    date_start: str | None = Field(None, description="ISO-8601 date string (YYYY-MM-DD) — inclusive lower bound")
    date_end:   str | None = Field(None, description="ISO-8601 date string (YYYY-MM-DD) — inclusive upper bound")
    min_citations: int = Field(0, ge=0, le=20, description="Minimum citation count filter (0 = no minimum)")
    journal_quality: JournalQuality = Field(JournalQuality.ALL, description="Minimum journal quartile (Q1 is most selective; All = no filter)")
    web_filter_domains: list[WebDomain] = Field(
        default_factory=lambda: [WebDomain.ALL],
        description="Internet domain filter: all | gov | edu"
    )


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, max_length=2000)
    session_id: str | None = None
    sources: list[SourceType] = Field(
        default_factory=lambda: [SourceType.ARXIV, SourceType.SEMANTIC_SCHOLAR, SourceType.WEB]
    )
    filters: SearchFilters = Field(
        default_factory=SearchFilters,
        description="Advanced filter options from the UI filter panel"
    )


class Citation(BaseModel):
    index: int
    title: str
    url: str | None = None
    authors: list[str] = Field(default_factory=list)
    year: int | None = None
    source: SourceType
    snippet: str = ""


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    citations: list[Citation] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Session(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active_at: datetime = Field(default_factory=datetime.utcnow)
    history: list[ChatMessage] = Field(default_factory=list)


class StreamEventType(str, Enum):
    STAGE = "stage"          # progress narration, e.g. "Searching arXiv..."
    TOKEN = "token"          # a chunk of the synthesized answer
    CITATIONS = "citations"  # final citation list
    DONE = "done"
    ERROR = "error"

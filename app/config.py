"""Application configuration via pydantic-settings."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="THESISAI_", extra="ignore")

    # App
    app_name: str = "ThesisAI"
    debug: bool = False

    # LLM (local Ollama, OpenAI-compatible endpoint)
    ollama_base_url: str = "http://localhost:11434/v1"
    ollama_model: str = "qwen2.5:14b-instruct"
    llm_synthesis_temperature: float = 0.3
    llm_request_timeout_s: int = 90

    # Retrieval
    arxiv_max_results: int = 6
    semantic_scholar_max_results: int = 6
    web_max_results: int = 5
    retrieval_timeout_s: int = 15

    # Rate limiting (sliding window, per IP)
    rate_limit_requests: int = 20
    rate_limit_window_s: int = 3600

    # Session management
    session_ttl_s: int = 60 * 60 * 6  # 6 hours
    session_cleanup_interval_s: int = 300

    # CORS
    cors_allow_origins: list[str] = ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()

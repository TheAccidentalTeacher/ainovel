"""
Application settings and configuration management.

Uses pydantic-settings to load configuration from environment variables
with type validation and sensible defaults.
"""

from functools import lru_cache
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables.
    
    All settings have defaults suitable for development; override via .env or Railway vars.
    """
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
    
    # Application
    environment: str = Field(default="development", description="Environment: development, staging, production")
    port: int = Field(default=8000, description="API server port")
    log_level: str = Field(default="INFO", description="Logging level")
    
    # Security
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:5173"],
        description="Allowed CORS origins"
    )
    api_key_header: str = Field(default="X-API-Key", description="API key header name")
    
    # Database
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection string"
    )
    mongodb_database: str = Field(default="ai_novel_generator", description="MongoDB database name")
    
    # Redis / Celery
    redis_uri: str = Field(default="redis://localhost:6379/0", description="Redis connection string")
    celery_broker_url: str = Field(default="redis://localhost:6379/0", description="Celery broker URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/1", description="Celery result backend")
    
    # AI Provider API Keys
    openai_api_key: str = Field(default="", description="OpenAI API key")
    anthropic_api_key: str = Field(default="", description="Anthropic API key")
    
    # AI Configuration Defaults
    default_model_provider: str = Field(default="anthropic", description="Default AI provider: openai or anthropic")
    default_model_name: str = Field(default="claude-3-5-sonnet-20241022", description="Default model name")
    default_temperature: float = Field(default=0.8, ge=0.0, le=2.0, description="Default temperature")
    default_max_tokens: int = Field(default=4096, ge=1, le=200000, description="Default max tokens per request")
    
    # Generation Limits
    max_premise_words: int = Field(default=5000, description="Maximum words in premise")
    max_chapter_count: int = Field(default=100, description="Maximum chapters per book")
    max_word_count_per_book: int = Field(default=250000, description="Maximum total words per book")
    summarization_threshold: int = Field(default=5, description="Start summarizing after N chapters")
    context_window_chapters: int = Field(default=5, description="Number of full recent chapters to include in context")
    
    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | List[str]) -> List[str]:
        """Parse CORS origins from comma-separated string or list."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment.lower() == "production"
    
    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment.lower() == "development"


@lru_cache
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    Settings are loaded once and cached for the application lifetime.
    Use this function instead of instantiating Settings directly.
    """
    return Settings()

from pydantic_settings import BaseSettings
from typing import Optional
import secrets


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Nexus AI"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    FRONTEND_URL: str = "http://localhost:3000"

    # AI Keys (can be overridden per-user from DB)
    ANTHROPIC_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_AI_API_KEY: Optional[str] = None

    # Database — defaults to SQLite for zero-config local dev
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexus.db"

    # Redis — optional, gracefully disabled if not running
    REDIS_URL: str = "redis://localhost:6379"

    # ERPNext
    ERPNEXT_URL: Optional[str] = None
    ERPNEXT_API_KEY: Optional[str] = None
    ERPNEXT_API_SECRET: Optional[str] = None

    # Security
    SECRET_KEY: str = "nexus-dev-secret-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Vector DB
    CHROMA_PATH: str = "./chroma_db"

    # Pollinations (free, no key needed)
    POLLINATIONS_URL: str = "https://text.pollinations.ai/openai"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()

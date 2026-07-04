from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    gemini_api_key: str = ""
    sarvam_api_key: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    vapid_public_key: str = ""
    vapid_private_key: str = ""
    rescan_secret: str = ""
    demo_secret: str = ""  # set to enable /demo/reset; leave blank in prod

    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://navyasathi.pages.dev",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()

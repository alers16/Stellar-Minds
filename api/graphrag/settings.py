from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_BACK_",
        extra="ignore",
    )

    store: str = Field("memory")
    store_path: str = Field("data/chats.json")
    chatbot: str = Field("dummy")
    
settings = AppSettings()
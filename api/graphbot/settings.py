from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from pathlib import Path


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="APP_BACK_",
        extra="ignore",
    )

    store: str = Field("memory")
    store_path: str = Field("data/chats.json")
    chatbot: str = Field("graphrag")

    graphrag_root: Path = Field(default=Path(""), env="GRAPHRAG_ROOT")

settings = AppSettings()
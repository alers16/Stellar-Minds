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

    rate_limits_enabled: bool = Field(True)
    rate_create_chat: str = Field("3/minute;30/hour;100/day")
    rate_send_message: str = Field("5/10second;60/minute;1000/day")

settings = AppSettings()
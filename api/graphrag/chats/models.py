from dataclasses import dataclass, field
from enum import Enum

from ..store import BaseModel


class ROLE(str, Enum):
    ASSISTANT = "assistant"
    USER = "user"

@dataclass
class ChatMessage:
    role: ROLE
    content: str

@dataclass
class Chat(BaseModel):
    messages: list[ChatMessage] = field(default_factory=list)
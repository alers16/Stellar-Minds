from dataclasses import dataclass
from typing import List

from ..models import ChatMessage, ROLE


@dataclass(frozen=True)
class ChatBotMessage:
    role: str
    content: str

def to_chatbot_messages(messages: List[ChatMessage]) -> List[ChatBotMessage]:
    return [ChatBotMessage(role=m.role.value, content=m.content) for m in messages]

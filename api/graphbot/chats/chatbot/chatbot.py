from abc import ABC, abstractmethod
from .chatbot_message import ChatBotMessage


class ChatBot(ABC):

    @abstractmethod
    async def reply(self, user_input: str, chat_history: list[ChatBotMessage], method: str) -> str:
        pass

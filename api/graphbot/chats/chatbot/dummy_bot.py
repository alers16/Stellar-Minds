from .chatbot import ChatBot
from .chatbot_message import ChatBotMessage


class DummyBot(ChatBot):

    async def reply(self, user_input: str, chat_history: list[ChatBotMessage], method: str) -> str:
        return user_input[::-1]

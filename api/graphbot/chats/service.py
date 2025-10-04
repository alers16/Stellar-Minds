import asyncio
from collections import defaultdict
from typing import Dict
from uuid import UUID

from .models import ROLE, ChatMessage, Chat
from .chatbot import ChatBot, to_chatbot_messages
from ..store import BaseStore


class ChatBusyError(RuntimeError):
    pass


class ChatService:
    def __init__(self, store: BaseStore[Chat], chatbot: ChatBot):
        self.store = store
        self.chatbot = chatbot

        self._locks: Dict[UUID, asyncio.Lock] = defaultdict(asyncio.Lock)
    
    # "Repository"
    def create_chat(self) -> Chat:
        new_chat = Chat()
        if not self.store.create(new_chat):
            raise Exception("Could not create a new chat")
        return new_chat

    def get_chat(self, chat_uuid: UUID) -> Chat | None:
        return self.store.get(chat_uuid)

    def require_chat(self, chat_uuid: UUID) -> Chat:
        return self.store.require(chat_uuid)

    def add_message(self, chat_uuid: UUID, role: ROLE, content: str) -> ChatMessage:
        chat_msg = ChatMessage(role=role, content=content)
        self.store.mutate(chat_uuid, lambda c: c.messages.append(chat_msg))
        return chat_msg

    def delete_chat(self, chat_uuid: UUID) -> bool:
        return self.store.delete(chat_uuid)

    # Service
    def count_messages(self, chat_uuid: UUID) -> int:
        return len(self.require_chat(chat_uuid).messages)

    async def reply_to_user(self, chat_uuid: UUID, user_text: str, method: str) -> str:
        lock = self._locks[chat_uuid]

        if lock.locked():
            raise ChatBusyError("An user message is already being processed.")

        async with lock:
            chat = self.require_chat(chat_uuid)
            chat_history = to_chatbot_messages(chat.messages)

            assistant_answer = await self.chatbot.reply(user_text, chat_history, method)

            self.add_message(chat_uuid, ROLE.USER, user_text)
            self.add_message(chat_uuid, ROLE.ASSISTANT, assistant_answer)

            return assistant_answer

from fastapi import Request

from .chats.service import ChatService


class Deps:

    @classmethod
    def get_chat_service(cls, request: Request) -> ChatService:
        return request.app.state.chat_service




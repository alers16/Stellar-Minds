from .settings import AppSettings
from .chats.models import Chat

from .store import MemoryStore
from .chats.chatbot import DummyBot

def make_store(settings: AppSettings):
    store = settings.store.lower()
    if store == "memory":
        return MemoryStore[Chat]()
    
    raise RuntimeError(f"Unknown store: {settings.store}")

def make_chatbot(settings: AppSettings):
    chatbot = settings.chatbot.lower()
    if chatbot in "dummy":
        return DummyBot()
    elif chatbot == "graphrag":
        from .chats.chatbot.graphrag_bot import GraphRAGBot
        return GraphRAGBot()

    raise RuntimeError(f"Unknown chatbot: {settings.chatbot}")

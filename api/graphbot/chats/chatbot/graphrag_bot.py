import asyncio
from pathlib import Path

from graphrag.cli.query import run_drift_search, run_global_search, run_local_search
from graphrag.cli.main import SearchType

from .chatbot import ChatBot
from .chatbot_message import ChatBotMessage
from ...settings import settings

INVALID_METHOD_ERROR = "Invalid method"

class GraphRAGBot(ChatBot):

    async def reply(
        self,
        user_input: str,
        chat_history: list[ChatBotMessage],
        method: str,
        config: Path | None = None,
    ) -> str:
        # Ejecutamos la búsqueda sin bloquear el loop actual porque
        # las funciones `run_*_search` usan `asyncio.run` internamente.
        return await asyncio.to_thread(
            self._run_search,
            user_input,
            chat_history,
            method,
            config,
        )

    def _run_search(
        self,
        user_input: str,
        chat_history: list[ChatBotMessage],
        method: str,
        config: Path | None,
    ) -> str:
        match method:
            case SearchType.LOCAL.value:
                response, _context_data = run_local_search(
                    config_filepath=config,
                    data_dir=None,
                    root_dir=settings.graphrag_root,
                    streaming=False,
                    community_level=2,
                    response_type="Multiple Paragraphs",
                    query=user_input,
                )
            case SearchType.GLOBAL.value:
                response, _context_data = run_global_search(
                    config_filepath=config,
                    root_dir=settings.graphrag_root,
                    streaming=False,
                    query=user_input,
                )
            case SearchType.DRIFT.value:
                response, _context_data = run_drift_search(
                    config_filepath=config,
                    root_dir=settings.graphrag_root,
                    streaming=False,  # Drift search does not support streaming (yet)
                    query=user_input,
                )
            case _:
                raise ValueError(INVALID_METHOD_ERROR)

        return response

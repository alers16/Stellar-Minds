from .chatbot import ChatBot
from .chatbot_message import ChatBotMessage
from graphrag.cli.query import run_drift_search, run_global_search, run_local_search
from graphrag.cli.main import SearchType
from pathlib import Path
from ...settings import settings

INVALID_METHOD_ERROR = "Invalid method"

class GraphRAGBot(ChatBot):

    async def reply(self, user_input: str, chat_history: list[ChatBotMessage], method: str, config: Path = None) -> str:
        # quizas podemos tomar chat_history y concatenarlo a user_input en un unico string
        response = None
        match method:
            case SearchType.LOCAL:
                response, context_data = run_local_search(
                    config_filepath=config,
                    root_dir=settings.graphrag_root,
                    streaming=False,
                    query=user_input,
                )
            case SearchType.GLOBAL:
                response, context_data = run_global_search(
                    config_filepath=config,
                    root_dir=settings.graphrag_root,
                    streaming=False,
                    query=user_input,
                )
            case SearchType.DRIFT:
                response, context_data = run_drift_search(
                    config_filepath=config,
                    root_dir=settings.graphrag_root,
                    streaming=False,  # Drift search does not support streaming (yet)
                    query=user_input,
                )
            case _:
                raise ValueError(INVALID_METHOD_ERROR)
        return response

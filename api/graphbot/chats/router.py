from uuid import UUID
from fastapi import APIRouter, Request, Response, status, Depends, HTTPException

from .schemas import PromptAnswerResponse, MessageRequest, CreateChatResponse
from .service import ChatService, ChatBusyError
from ..deps import Deps

router = APIRouter(tags=["chats"])


@router.get("", response_model=CreateChatResponse, status_code=status.HTTP_201_CREATED)
def create_chat(
    request: Request,
    response: Response,
    service: ChatService = Depends(Deps.get_chat_service),
) -> CreateChatResponse:
    
    new_chat = service.create_chat()

    response.headers["Location"] = f"/api/v1/chats/{new_chat.uuid}/messages"

    return CreateChatResponse(chat_uuid=new_chat.uuid)


@router.post("/{chat_uuid}/messages", response_model=PromptAnswerResponse, status_code=status.HTTP_200_OK)
async def post_chat_message(
    request: Request,
    chat_uuid: UUID,
    payload: MessageRequest,
    service: ChatService = Depends(Deps.get_chat_service),
) -> PromptAnswerResponse:
    try:
        answer = await service.reply_to_user(chat_uuid, payload.message, payload.metodo)

        return PromptAnswerResponse(answer=answer)
    
    except ChatBusyError as e:
        raise HTTPException(status_code=409, detail=str(e))

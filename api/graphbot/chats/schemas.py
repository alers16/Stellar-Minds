from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class CreateChatResponse(BaseModel):
    chat_uuid: UUID = Field(example=str(uuid4()))

class MessageRequest(BaseModel):
    message: str = Field(example="¡Hola! ¿Qué tal?")
    metodo: str = Field(example="local")

class PromptAnswerResponse(BaseModel):
    answer: str = Field(example="No puedo ayudarte con eso.")

class ChatMessageResponse(BaseModel):
    role: str = Field(example="assistant")
    content: str = Field(example="¡Hola! ¿Qué tal?")

class ChatResponse(BaseModel):
    uuid: UUID = Field(default_factory=uuid4, example=str(uuid4()))
    messages: list[ChatMessageResponse] = Field(default_factory=list, example=[])

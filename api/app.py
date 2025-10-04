import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse, JSONResponse

from graphbot.store.base_store import ObjectNotFoundError
from assay_finder.router import router as assay_router
from gap_finder.router import router as gap_router
from graphbot.chats.router import router as graph_chat_router

from graphbot.chats.service import ChatService
from graphbot.settings import settings
from graphbot.factory import make_store, make_chatbot

from ai import OpenAIProvider

load_dotenv(override=True)

FRONTEND_URLS = os.getenv("FRONTEND_URLS", "")  # "https://midominio.com,https://preview.vercel.app"

def key_func(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else request.client.host

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.settings = settings

    store = make_store(settings)
    chatbot = make_chatbot(settings)

    app.state.chat_service = ChatService(store, chatbot)
    app.state.provider = OpenAIProvider(api_key=os.getenv("OPENAI_API_KEY"))

    yield

app = FastAPI(
    title="Chatbot API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,  # ⬅️ moderno, reemplaza on_event('startup'|'shutdown')
)


app.add_middleware(CORSMiddleware,
    allow_origins=[o.strip() for o in FRONTEND_URLS.split(",") if o.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ObjectNotFoundError)
async def object_not_found_handler(request: Request, exc: ObjectNotFoundError):
    return JSONResponse(status_code=404, content={"detail": f"Object not found: {exc}"})


app.include_router(assay_router)
app.include_router(gap_router)
app.include_router(graph_chat_router, prefix="/api/v1/chats")

@app.get("/")
def root():
    return {"status": "ok"}

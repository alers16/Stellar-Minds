import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from assay_finder.router import router as assay_router

FRONTEND_URLS = os.getenv("FRONTEND_URLS", "")  # "https://midominio.com,https://preview.vercel.app"
ROOT_PATH = os.getenv("FASTAPI_ROOT_PATH", "/api")  # como el proyecto sirve bajo /api

app = FastAPI(
    title="API FastAPI en Vercel (monorepo)",
    root_path=ROOT_PATH,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in FRONTEND_URLS.split(",") if o.strip()] or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assay_router)

@app.get("/")
def root():
    return {"status": "ok"}

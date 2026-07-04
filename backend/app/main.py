from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes.cases import router as cases_router
from app.routes.documents import router as documents_router
from app.routes.draft import router as draft_router
from app.routes.speech import router as speech_router
from app.routes.watch import router as watch_router

app = FastAPI(title="NavyaSathi API", version="0.1.0", docs_url="/docs")

s = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=s.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases_router)
app.include_router(documents_router)
app.include_router(draft_router)
app.include_router(speech_router)
app.include_router(watch_router)


@app.get("/health", tags=["ops"])
async def health():
    return {"status": "ok"}

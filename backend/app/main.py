from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.controllers.download_controller import router as download_router

app = FastAPI(
    title="MP3 Downloader API",
    description="Download MP3 audio from YouTube and Spotify links",
    version="1.0.0",
)

# Allow requests from the Next.js frontend (local dev + Vercel preview URLs)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(download_router)


@app.get("/health")
async def health():
    return {"status": "ok"}

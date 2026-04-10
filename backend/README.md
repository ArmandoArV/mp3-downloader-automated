# MP3 Downloader Backend

FastAPI backend that downloads MP3 audio from YouTube and Spotify links using yt-dlp and spotdl.

## API Endpoints

- `POST /api/info` — Get metadata (title, thumbnail, duration) for a URL
- `POST /api/download` — Download and stream MP3 audio
- `GET /health` — Health check

## Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

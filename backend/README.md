# MP3 Downloader Backend

Flask backend that downloads MP3 audio from YouTube and Spotify links using yt-dlp and spotdl.

## Structure

```
backend/
├── app/
│   ├── __init__.py            # Flask app factory + CORS
│   ├── routes/
│   │   └── download_routes.py # Blueprint URL definitions
│   ├── controllers/
│   │   └── download_controller.py  # Request/response handling
│   └── services/
│       └── download_service.py     # Pure download business logic
├── run.py                     # Entry point
└── requirements.txt
```

## API Endpoints

- `POST /api/info` — Get metadata (title, thumbnail, duration) for a URL
- `POST /api/download` — Download and stream MP3 audio
- `GET /api/health` — Health check

## Running Locally

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The server starts on `http://localhost:5000`.

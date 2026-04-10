# MP3 Downloader

A full-stack monorepo application for downloading MP3 audio from YouTube and Spotify links.

## Project Structure

```
mp3-downloader-automated/
├── frontend/          # Next.js 15 TypeScript app (Tailwind CSS + Fluent UI)
├── backend/           # Python FastAPI app (yt-dlp + spotdl)
├── package.json       # Monorepo root (npm workspaces)
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **ffmpeg** — required by yt-dlp for audio conversion  
  - macOS: `brew install ffmpeg`  
  - Ubuntu: `sudo apt install ffmpeg`  
  - Windows: [Download from ffmpeg.org](https://ffmpeg.org/download.html)

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The API runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Both at once (from root)

```bash
npm install
npm run dev
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API base URL |

Create `frontend/.env.local` and set:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Features

- Paste one or more YouTube or Spotify URLs
- Downloads audio as 192 kbps MP3
- Streams the file directly to your browser
- Optionally save to a local folder using the File System Access API (Chrome/Edge)
- Fluent UI design with live per-track progress

## Deployment Notes (Vercel)

Deploy the `frontend` directory to Vercel. Set the `NEXT_PUBLIC_API_URL` environment variable in the Vercel dashboard to point to your hosted backend (e.g., a Railway or Fly.io deployment).

The backend is a standard FastAPI app and can be hosted on any platform that supports Python (Railway, Fly.io, Render, etc.).

## Legal Notice

This tool is intended for **personal use only**. Downloading copyrighted content without permission may violate the terms of service of the respective platforms and applicable laws. Users are solely responsible for how they use this software.

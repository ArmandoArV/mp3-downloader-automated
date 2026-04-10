# MP3 Downloader

A full-stack monorepo application for downloading MP3 audio from YouTube and Spotify — including full **Spotify playlist** support with drag-and-drop reordering, quality selection, concurrent downloads, and duplicate detection.

## Project Structure

```
mp3-downloader-automated/
├── frontend/          # Next.js 15 TypeScript app (Tailwind CSS + Fluent UI + @dnd-kit)
├── backend/           # Python Flask app (yt-dlp + Spotify embed scraping)
├── package.json       # Monorepo root (npm workspaces)
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **yt-dlp** — `pip install yt-dlp`
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

> **Note:** No Spotify API keys are needed. Playlist data is fetched via Spotify's public embed page.

## Features

### Single Track Downloads
- Paste a YouTube or Spotify URL
- Downloads audio as MP3
- Streams the file directly to your browser

### Spotify Playlist Downloads
- Paste any Spotify playlist URL → fetches all tracks instantly
- **Drag-and-drop reordering** — rearrange tracks in your preferred download order
- **Sort & Shuffle** — sort by Original order, Title, Artist, or shuffle randomly
- **Track selection** — checkboxes to pick exactly which tracks to download
- **Audio quality selector** — choose 128 / 192 / 256 / 320 kbps
- **Concurrent downloads** — downloads 3 tracks in parallel for faster completion
- **Duplicate detection** — tracks you've already downloaded show a green "Saved" badge and are auto-deselected; "New only" button to quickly select undownloaded tracks
- **Cancel support** — stop an in-progress batch download at any time

### General
- Optionally save to a local folder using the File System Access API (Chrome/Edge)
- Unicode-safe filenames (RFC 5987 encoding for special characters)
- Fluent UI design with live per-track progress and overall progress bar
- Tabbed interface — switch between Single Tracks and Playlist modes

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS v4, Fluent UI v9, @dnd-kit |
| Backend | Flask, yt-dlp, BeautifulSoup (Spotify embed scraping) |
| Audio | yt-dlp → ffmpeg → MP3 at selectable bitrate |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/info` | Get video/track metadata |
| `POST` | `/api/download` | Download a single track (accepts `url`, `quality`) |
| `POST` | `/api/playlist/info` | Fetch Spotify playlist tracks |
| `POST` | `/api/playlist/download` | Download a playlist track by name/artist (accepts `name`, `artists`, `quality`) |

## How Spotify Playlist Download Works

1. The backend fetches `https://open.spotify.com/embed/playlist/{id}` and parses the `__NEXT_DATA__` JSON from the page
2. This returns up to 100 tracks with title, artist, album, duration, and cover art — no API keys required
3. Each track is downloaded by searching YouTube (`ytsearch1:{artist} - {track}`) via yt-dlp and converting to MP3

## Deployment Notes (Vercel)

Deploy the `frontend` directory to Vercel. Set the `NEXT_PUBLIC_API_URL` environment variable in the Vercel dashboard to point to your hosted backend (e.g., a Railway or Fly.io deployment).

The backend is a standard Flask app and can be hosted on any platform that supports Python (Railway, Fly.io, Render, etc.).

## Legal Notice

This tool is intended for **personal use only**. Downloading copyrighted content without permission may violate the terms of service of the respective platforms and applicable laws. Users are solely responsible for how they use this software.

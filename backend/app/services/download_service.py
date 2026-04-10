import json
import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Generator
from urllib.parse import urlparse

import requests as http_requests
import yt_dlp


class DownloadService:
    """
    Pure business logic for fetching metadata and downloading audio.
    Has no knowledge of HTTP or Flask.
    """

    # ------------------------------------------------------------------ #
    # helpers
    # ------------------------------------------------------------------ #

    @staticmethod
    def _sanitize(name: str) -> str:
        """Remove characters that are invalid in filenames."""
        return re.sub(r'[\\/*?:"<>|]', "_", name).strip()

    @staticmethod
    def _is_spotify(url: str) -> bool:
        try:
            parsed = urlparse(url)
            return parsed.netloc in (
                "open.spotify.com",
                "play.spotify.com",
                "spotify.com",
            ) or url.startswith("spotify:")
        except Exception:  # noqa: BLE001
            return False

    @staticmethod
    def _is_spotify_playlist(url: str) -> bool:
        try:
            parsed = urlparse(url)
            is_spotify = parsed.netloc in (
                "open.spotify.com",
                "play.spotify.com",
                "spotify.com",
            )
            return is_spotify and "/playlist/" in parsed.path
        except Exception:  # noqa: BLE001
            return False

    # ------------------------------------------------------------------ #
    # public API
    # ------------------------------------------------------------------ #

    def get_info(self, url: str) -> dict:
        """Return metadata for a YouTube or Spotify URL."""
        if self._is_spotify(url):
            return {
                "title": url,
                "duration": None,
                "thumbnail": None,
                "source": "spotify",
            }

        ydl_opts = {
            "quiet": True,
            "no_warnings": True,
            "skip_download": True,
            "noplaylist": True,
        }
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get("title", "Unknown"),
                "duration": info.get("duration"),
                "thumbnail": info.get("thumbnail"),
                "source": "youtube",
            }

    def download_audio(self, url: str, quality: str = "192") -> tuple[Generator[bytes, None, None], str]:
        """
        Download audio and return (byte_generator, filename).
        The generator streams the MP3 in 64 KB chunks and cleans up afterwards.
        """
        if self._is_spotify(url):
            return self._download_spotify(url)
        return self._download_youtube(url, quality=quality)

    # ------------------------------------------------------------------ #
    # private helpers
    # ------------------------------------------------------------------ #

    ALLOWED_QUALITIES = {"128", "192", "256", "320"}

    def _download_youtube(self, url: str, override_filename: str | None = None, quality: str = "192") -> tuple[Generator[bytes, None, None], str]:
        if quality not in self.ALLOWED_QUALITIES:
            quality = "192"
        tmp_dir = tempfile.mkdtemp()

        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": os.path.join(tmp_dir, "%(title)s.%(ext)s"),
            "noplaylist": True,
            "quiet": True,
            "no_warnings": True,
            "postprocessors": [
                {
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                    "preferredquality": quality,
                }
            ],
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = self._sanitize(info.get("title", "audio"))

        mp3_files = list(Path(tmp_dir).glob("*.mp3"))
        if not mp3_files:
            raise FileNotFoundError("yt-dlp did not produce an MP3 file")

        mp3_path = mp3_files[0]
        filename = f"{self._sanitize(override_filename)}.mp3" if override_filename else f"{title}.mp3"

        def _gen() -> Generator[bytes, None, None]:
            try:
                with open(mp3_path, "rb") as f:
                    while chunk := f.read(65536):
                        yield chunk
            finally:
                shutil.rmtree(tmp_dir, ignore_errors=True)

        return _gen(), filename

    def _download_spotify(self, url: str) -> tuple[Generator[bytes, None, None], str]:
        """Download a Spotify track via spotdl."""
        if shutil.which("spotdl") is None:
            raise RuntimeError("spotdl is not installed. Run: pip install spotdl")

        tmp_dir = tempfile.mkdtemp()
        result = subprocess.run(
            ["spotdl", "--output", tmp_dir, url],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr or "spotdl failed")

        mp3_files = list(Path(tmp_dir).glob("*.mp3"))
        if not mp3_files:
            raise FileNotFoundError("spotdl did not produce an MP3 file")

        mp3_path = mp3_files[0]
        filename = mp3_path.name

        def _gen() -> Generator[bytes, None, None]:
            try:
                with open(mp3_path, "rb") as f:
                    while chunk := f.read(65536):
                        yield chunk
            finally:
                shutil.rmtree(tmp_dir, ignore_errors=True)

        return _gen(), filename

    # ------------------------------------------------------------------ #
    # playlist support
    # ------------------------------------------------------------------ #

    @staticmethod
    def _extract_playlist_id(url: str) -> str:
        parsed = urlparse(url)
        parts = parsed.path.strip("/").split("/")
        if len(parts) >= 2 and parts[0] == "playlist":
            return parts[1].split("?")[0]
        raise ValueError("Could not extract playlist ID from URL")

    def get_playlist_info(self, url: str) -> dict:
        """Fetch track listing via the Spotify embed page (no API key needed)."""
        if not self._is_spotify_playlist(url):
            raise ValueError("URL is not a Spotify playlist")

        playlist_id = self._extract_playlist_id(url)
        embed_url = f"https://open.spotify.com/embed/playlist/{playlist_id}"

        resp = http_requests.get(embed_url, timeout=15)
        resp.raise_for_status()

        match = re.search(r'__NEXT_DATA__.*?>(.*?)</script>', resp.text)
        if not match:
            raise RuntimeError("Could not parse Spotify embed page")

        data = json.loads(match.group(1))
        entity = data["props"]["pageProps"]["state"]["data"]["entity"]

        playlist_name = entity.get("name", "Unknown Playlist")
        cover_art = entity.get("coverArt", {})
        cover_sources = cover_art.get("sources", [])
        playlist_cover = cover_sources[0]["url"] if cover_sources else ""

        tracks = []
        for i, t in enumerate(entity.get("trackList", [])):
            if not t.get("isPlayable"):
                continue
            # Convert spotify:track:ID to a full URL
            uri = t.get("uri", "")
            track_id = uri.split(":")[-1] if uri.startswith("spotify:track:") else ""
            track_url = f"https://open.spotify.com/track/{track_id}" if track_id else ""

            tracks.append({
                "index": i,
                "name": t.get("title", "Unknown"),
                "artists": t.get("subtitle", "Unknown"),
                "album": "",
                "duration": round(t.get("duration", 0) / 1000),
                "url": track_url,
                "cover_url": playlist_cover,
            })

        return {
            "name": playlist_name,
            "total": len(tracks),
            "tracks": tracks,
        }

    def download_playlist_track(self, track_name: str, track_artists: str, quality: str = "192") -> tuple[Generator[bytes, None, None], str]:
        """Download a playlist track by searching YouTube for name + artist."""
        query = f"ytsearch1:{track_artists} - {track_name}"
        desired_filename = f"{track_artists} - {track_name}"
        return self._download_youtube(query, override_filename=desired_filename, quality=quality)


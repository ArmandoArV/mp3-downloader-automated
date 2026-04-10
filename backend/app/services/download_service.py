import os
import re
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Generator
from urllib.parse import urlparse

import yt_dlp


# ────────────────────────────────────────────────────────────────
# helpers
# ────────────────────────────────────────────────────────────────

def _sanitize(name: str) -> str:
    """Remove characters that are invalid in filenames."""
    return re.sub(r'[\\/*?:"<>|]', "_", name).strip()


def _is_spotify(url: str) -> bool:
    try:
        parsed = urlparse(url)
        return parsed.netloc in ("open.spotify.com", "play.spotify.com", "spotify.com") or url.startswith("spotify:")
    except Exception:
        return False


# ────────────────────────────────────────────────────────────────
# info
# ────────────────────────────────────────────────────────────────

def get_info(url: str) -> dict:
    """Return metadata for a YouTube or Spotify URL."""
    if _is_spotify(url):
        # spotdl doesn't have a standalone info call; use yt-dlp via Spotify's
        # oEmbed as a best-effort.  For now return minimal info.
        return {"title": url, "duration": None, "thumbnail": None, "source": "spotify"}

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


# ────────────────────────────────────────────────────────────────
# download
# ────────────────────────────────────────────────────────────────

def download_audio(url: str) -> tuple[Generator[bytes, None, None], str]:
    """
    Download audio and return (byte_generator, filename).

    The generator streams the mp3 file in 64 KB chunks.
    The caller is responsible for cleanup; we use a TemporaryDirectory so the
    OS reclaims it automatically once the generator is exhausted or GC'd.
    """
    if _is_spotify(url):
        return _download_spotify(url)
    return _download_youtube(url)


def _download_youtube(url: str) -> tuple[Generator[bytes, None, None], str]:
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
                "preferredquality": "192",
            }
        ],
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = _sanitize(info.get("title", "audio"))

    # Find the mp3 produced
    mp3_files = list(Path(tmp_dir).glob("*.mp3"))
    if not mp3_files:
        raise FileNotFoundError("yt-dlp did not produce an MP3 file")
    mp3_path = mp3_files[0]
    filename = f"{title}.mp3"

    def _gen() -> Generator[bytes, None, None]:
        try:
            with open(mp3_path, "rb") as f:
                while chunk := f.read(65536):
                    yield chunk
        finally:
            # cleanup
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except OSError:
                pass

    return _gen(), filename


def _download_spotify(url: str) -> tuple[Generator[bytes, None, None], str]:
    """Download a Spotify track by looking it up on YouTube via spotdl."""
    if shutil.which("spotdl") is None:
        raise RuntimeError(
            "spotdl is not installed. Run: pip install spotdl"
        )

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
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except OSError:
                pass

    return _gen(), filename

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.download_model import DownloadRequest, InfoRequest, InfoResponse
from app.services import download_service

router = APIRouter(prefix="/api", tags=["download"])


@router.post("/info", response_model=InfoResponse)
async def get_info(req: InfoRequest):
    """Return metadata (title, thumbnail, duration) for a given URL."""
    try:
        data = download_service.get_info(req.url)
        return InfoResponse(**data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/download")
async def download(req: DownloadRequest):
    """
    Download the audio for *url* and stream it back as an MP3.
    The frontend can either trigger a browser download or save it to the
    user-selected directory via the File System Access API.
    """
    try:
        gen, filename = download_service.download_audio(req.url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    safe_filename = filename.replace('"', '\\"')
    return StreamingResponse(
        gen,
        media_type="audio/mpeg",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_filename}"',
            "X-Filename": safe_filename,
        },
    )

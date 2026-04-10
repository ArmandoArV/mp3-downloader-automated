from pydantic import BaseModel
from typing import Optional


class DownloadRequest(BaseModel):
    url: str


class InfoRequest(BaseModel):
    url: str


class InfoResponse(BaseModel):
    title: str
    duration: Optional[int] = None
    thumbnail: Optional[str] = None
    source: str  # "youtube" or "spotify"


class ErrorResponse(BaseModel):
    detail: str

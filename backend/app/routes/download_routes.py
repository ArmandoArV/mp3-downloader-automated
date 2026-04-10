from flask import Blueprint, jsonify

from app.controllers.download_controller import DownloadController

download_bp = Blueprint("download", __name__, url_prefix="/api")
_ctrl = DownloadController()


@download_bp.get("/health")
def health():
    return jsonify({"status": "ok"})


@download_bp.post("/info")
def info():
    return _ctrl.get_info()


@download_bp.post("/download")
def download():
    return _ctrl.download()


@download_bp.post("/playlist/info")
def playlist_info():
    return _ctrl.playlist_info()


@download_bp.post("/playlist/download")
def playlist_download():
    return _ctrl.playlist_download()

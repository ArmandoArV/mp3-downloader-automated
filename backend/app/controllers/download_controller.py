from urllib.parse import quote

from flask import Response, jsonify, request, stream_with_context

from app.services.download_service import DownloadService


def _safe_headers(filename: str) -> dict:
    """Build Content-Disposition and X-Filename headers safe for latin-1."""
    ascii_name = filename.encode("ascii", "replace").decode("ascii").replace('"', '\\"')
    utf8_name = quote(filename, safe="")
    return {
        "Content-Disposition": f"attachment; filename=\"{ascii_name}\"; filename*=UTF-8''{utf8_name}",
        "X-Filename": utf8_name,
    }


class DownloadController:
    """
    Handles HTTP-level concerns (parsing request JSON, shaping responses,
    mapping service exceptions to HTTP status codes).  Business logic lives
    in DownloadService.
    """

    def __init__(self) -> None:
        self._service = DownloadService()

    # ------------------------------------------------------------------ #
    # GET /api/health (delegated from routes)
    # ------------------------------------------------------------------ #

    def health(self):
        return jsonify({"status": "ok"})

    # ------------------------------------------------------------------ #
    # POST /api/info
    # ------------------------------------------------------------------ #

    def get_info(self):
        body = request.get_json(silent=True) or {}
        url = body.get("url", "").strip()
        if not url:
            return jsonify({"error": "url is required"}), 400

        try:
            data = self._service.get_info(url)
            return jsonify(data)
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": str(exc)}), 400

    # ------------------------------------------------------------------ #
    # POST /api/download
    # ------------------------------------------------------------------ #

    def download(self):
        body = request.get_json(silent=True) or {}
        url = body.get("url", "").strip()
        quality = body.get("quality", "192")
        if not url:
            return jsonify({"error": "url is required"}), 400

        try:
            gen, filename = self._service.download_audio(url, quality=quality)
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": str(exc)}), 400

        safe_filename = filename.replace('"', '\\"')
        return Response(
            stream_with_context(gen),
            mimetype="audio/mpeg",
            headers=_safe_headers(filename),
        )

    # ------------------------------------------------------------------ #
    # POST /api/playlist/info
    # ------------------------------------------------------------------ #

    def playlist_info(self):
        body = request.get_json(silent=True) or {}
        url = body.get("url", "").strip()
        if not url:
            return jsonify({"error": "url is required"}), 400

        try:
            data = self._service.get_playlist_info(url)
            return jsonify(data)
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": str(exc)}), 400

    # ------------------------------------------------------------------ #
    # POST /api/playlist/download
    # ------------------------------------------------------------------ #

    def playlist_download(self):
        body = request.get_json(silent=True) or {}
        name = body.get("name", "").strip()
        artists = body.get("artists", "").strip()
        quality = body.get("quality", "192")
        if not name:
            return jsonify({"error": "name is required"}), 400

        try:
            gen, filename = self._service.download_playlist_track(name, artists, quality=quality)
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": str(exc)}), 400

        safe_filename = filename.replace('"', '\\"')
        return Response(
            stream_with_context(gen),
            mimetype="audio/mpeg",
            headers=_safe_headers(filename),
        )

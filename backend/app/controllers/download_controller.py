from flask import Response, jsonify, request, stream_with_context

from app.services.download_service import DownloadService


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
        if not url:
            return jsonify({"error": "url is required"}), 400

        try:
            gen, filename = self._service.download_audio(url)
        except Exception as exc:  # noqa: BLE001
            return jsonify({"error": str(exc)}), 400

        safe_filename = filename.replace('"', '\\"')
        return Response(
            stream_with_context(gen),
            mimetype="audio/mpeg",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}"',
                "X-Filename": safe_filename,
            },
        )

from flask import Flask
from flask_cors import CORS


def create_app() -> Flask:
    app = Flask(__name__)

    CORS(
        app,
        origins=[
            "http://localhost:3000",
            "http://localhost:3001",
        ],
        allow_headers=["Content-Type"],
        expose_headers=["Content-Disposition", "X-Filename"],
        supports_credentials=True,
    )

    from app.routes.download_routes import download_bp  # noqa: PLC0415
    app.register_blueprint(download_bp)

    return app

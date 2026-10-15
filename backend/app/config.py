from pathlib import Path
import os

APP_DIRECTORY = Path(__file__).resolve().parent
BACKEND_DIRECTORY = APP_DIRECTORY.parent

DATA_DIRECTORY = APP_DIRECTORY / "data"
CATALOG_PATH = DATA_DIRECTORY / "catalog.json"
SCHEMA_PATH = DATA_DIRECTORY / "schema.sql"
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BACKEND_DIRECTORY / "atlas.sqlite3")))
FRONTEND_DIRECTORY = BACKEND_DIRECTORY.parent / "frontend" / "dist"
SESSION_TTL = 7 * 24 * 60 * 60
SECURE_COOKIE = os.getenv("COOKIE_SECURE", "0") == "1"
DEFAULT_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173," "http://localhost:8000,http://127.0.0.1:8000"
)
ALLOWED_ORIGINS = set(os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(","))
AUTH_ATTEMPT_WINDOW = 600
MAX_AUTH_ATTEMPTS = 20

TRUSTED_PROXY_IPS = os.getenv("FORWARDED_ALLOW_IPS", "")

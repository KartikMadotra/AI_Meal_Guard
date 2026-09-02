"""
AI MealGuard — Application Configuration.

Loads settings from environment variables / .env file.
"""

from pathlib import Path
from pydantic_settings import BaseSettings


# ── Paths ───────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent          # project root
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"


class Settings(BaseSettings):
    """Application-wide settings, populated from env vars / .env."""

    # Server
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    debug: bool = True

    # Database
    database_url: str = f"sqlite+aiosqlite:///{DATA_DIR / 'mealguard.db'}"

    # AI Model
    model_path: str = str(BASE_DIR / "backend" / "models" / "mealguard.pt")
    use_gpu: bool = False

    # Uploads
    upload_dir: str = str(UPLOAD_DIR)
    max_upload_size_mb: int = 10

    model_config = {"env_file": str(BASE_DIR / ".env"), "extra": "ignore"}


settings = Settings()

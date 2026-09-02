"""
AI MealGuard — Image Preprocessing.

Placeholder for image validation, resizing, and normalization.
"""

from pathlib import Path


def validate_image(file_path: str) -> bool:
    """Check that the file exists and has a supported image extension."""
    path = Path(file_path)
    supported = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    return path.exists() and path.suffix.lower() in supported


def preprocess(file_path: str) -> str:
    """
    Preprocess the image for the AI model.

    In the real system this would:
    - Resize to model input size
    - Normalize pixel values
    - Apply any augmentation

    Currently returns the path unchanged (mock).
    """
    return file_path

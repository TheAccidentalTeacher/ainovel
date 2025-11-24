"""
Genres API endpoints.

Provides genre and subgenre catalog for UI selection.
"""

from typing import List

import structlog
from fastapi import APIRouter

from backend.models.schemas import Genre
from backend.services.genre_service import get_genres

logger = structlog.get_logger()
router = APIRouter()


@router.get(
    "/genres",
    response_model=List[Genre],
    summary="List Genres",
    description="Get all available genres with subgenres, ordered with Christian and Romance first"
)
async def list_genres() -> List[Genre]:
    """
    Retrieve the complete genre catalog.
    
    Returns list of genres with subgenres, ordered by preference
    (Christian and Romance appear first).
    
    Returns:
        List[Genre]: All available genres
    """
    genres = await get_genres()
    return genres

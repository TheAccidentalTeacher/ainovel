"""
Genre service for managing genre catalog.

Loads and caches genres from static JSON file.
"""

import json
import os
from pathlib import Path
from typing import List

import structlog

from models.schemas import Genre

logger = structlog.get_logger()

_genre_cache: List[Genre] = []


async def get_genres() -> List[Genre]:
    """
    Get all available genres with subgenres.
    
    Loads from config/genres.json and caches in memory.
    Genres are sorted by order, with Christian and Romance first.
    
    Returns:
        List[Genre]: All available genres
    """
    global _genre_cache
    
    if _genre_cache:
        return _genre_cache
    
    # Load from JSON file
    project_root = Path(__file__).parent.parent.parent
    genres_path = project_root / "config" / "genres.json"
    
    if not genres_path.exists():
        logger.error("genres_file_not_found", path=str(genres_path))
        return []
    
    try:
        with open(genres_path, "r", encoding="utf-8") as f:
            genres_data = json.load(f)
        
        _genre_cache = [Genre(**genre) for genre in genres_data]
        _genre_cache.sort(key=lambda g: g.order)
        
        logger.info("genres_loaded", count=len(_genre_cache))
        return _genre_cache
        
    except Exception as e:
        logger.error("genres_load_failed", error=str(e))
        return []


def clear_genre_cache() -> None:
    """Clear the genre cache (useful for testing or config updates)."""
    global _genre_cache
    _genre_cache = []

"""
Font Manager Utility
Handles Google Fonts API integration and font management
"""

from typing import Dict, List, Optional
import logging
import requests
import os
from pathlib import Path

logger = logging.getLogger(__name__)


class FontManager:
    """
    Manages font downloading, caching, and selection from Google Fonts.
    """
    
    # Google Fonts API key (would be in settings in production)
    GOOGLE_FONTS_API_URL = "https://www.googleapis.com/webfonts/v1/webfonts"
    
    # Cache directory for downloaded fonts
    FONT_CACHE_DIR = Path("book_covers/fonts_cache")
    
    # Genre to font family mapping (Google Fonts)
    GENRE_FONTS = {
        'romance': {
            'title': [
                {'family': 'Playfair Display', 'weights': [400, 700, 900]},
                {'family': 'Cormorant Garamond', 'weights': [400, 600, 700]},
                {'family': 'Libre Baskerville', 'weights': [400, 700]}
            ],
            'author': [
                {'family': 'Montserrat', 'weights': [300, 400, 600]},
                {'family': 'Lato', 'weights': [300, 400, 700]},
                {'family': 'Open Sans', 'weights': [300, 400, 600]}
            ]
        },
        'thriller': {
            'title': [
                {'family': 'Oswald', 'weights': [400, 600, 700]},
                {'family': 'Bebas Neue', 'weights': [400]},
                {'family': 'Montserrat', 'weights': [700, 800, 900]}
            ],
            'author': [
                {'family': 'Roboto', 'weights': [300, 400, 500]},
                {'family': 'Open Sans', 'weights': [400, 600]},
                {'family': 'Lato', 'weights': [400, 700]}
            ]
        },
        'mystery': {
            'title': [
                {'family': 'Montserrat', 'weights': [700, 800, 900]},
                {'family': 'Roboto Condensed', 'weights': [700]},
                {'family': 'Oswald', 'weights': [600, 700]}
            ],
            'author': [
                {'family': 'Open Sans', 'weights': [400, 600]},
                {'family': 'Roboto', 'weights': [400, 500]},
                {'family': 'Lato', 'weights': [400]}
            ]
        },
        'fantasy': {
            'title': [
                {'family': 'Cinzel', 'weights': [400, 700, 900]},
                {'family': 'Playfair Display', 'weights': [700, 900]},
                {'family': 'Libre Baskerville', 'weights': [700]}
            ],
            'author': [
                {'family': 'Lato', 'weights': [400, 700]},
                {'family': 'Open Sans', 'weights': [400, 600]},
                {'family': 'Montserrat', 'weights': [400, 600]}
            ]
        },
        'science_fiction': {
            'title': [
                {'family': 'Exo 2', 'weights': [700, 800, 900]},
                {'family': 'Audiowide', 'weights': [400]},
                {'family': 'Orbitron', 'weights': [700, 900]}
            ],
            'author': [
                {'family': 'Roboto', 'weights': [400, 500]},
                {'family': 'Open Sans', 'weights': [400, 600]},
                {'family': 'Montserrat', 'weights': [400, 600]}
            ]
        },
        'horror': {
            'title': [
                {'family': 'Creepster', 'weights': [400]},
                {'family': 'Nosifer', 'weights': [400]},
                {'family': 'Metal Mania', 'weights': [400]}
            ],
            'author': [
                {'family': 'Roboto', 'weights': [400]},
                {'family': 'Open Sans', 'weights': [400]},
                {'family': 'Lato', 'weights': [400]}
            ]
        },
        'literary_fiction': {
            'title': [
                {'family': 'Merriweather', 'weights': [400, 700, 900]},
                {'family': 'Playfair Display', 'weights': [400, 700]},
                {'family': 'Libre Baskerville', 'weights': [400, 700]}
            ],
            'author': [
                {'family': 'Lato', 'weights': [400, 700]},
                {'family': 'Open Sans', 'weights': [400, 600]},
                {'family': 'Montserrat', 'weights': [400, 600]}
            ]
        },
        'non_fiction': {
            'title': [
                {'family': 'Montserrat', 'weights': [700, 800, 900]},
                {'family': 'Roboto', 'weights': [700, 900]},
                {'family': 'Open Sans', 'weights': [700, 800]}
            ],
            'author': [
                {'family': 'Open Sans', 'weights': [600, 700]},
                {'family': 'Roboto', 'weights': [500, 700]},
                {'family': 'Lato', 'weights': [600, 700]}
            ]
        }
    }
    
    def __init__(self):
        """Initialize Font Manager"""
        self.font_cache_dir = Path(__file__).parent.parent / "fonts_cache"
        self.font_cache_dir.mkdir(parents=True, exist_ok=True)
        logger.info("FontManager initialized")
    
    def get_font_recommendations(self, genre: str) -> Dict:
        """
        Get font recommendations for a specific genre.
        
        Args:
            genre: Genre name (normalized)
        
        Returns:
            Dict with title and author font recommendations
        """
        recommendations = self.GENRE_FONTS.get(genre)
        
        if not recommendations:
            # Return default fonts
            logger.warning(f"No specific fonts for genre '{genre}', using defaults")
            recommendations = self.GENRE_FONTS['literary_fiction']
        
        return recommendations
    
    def get_font_pairing(
        self,
        genre: str,
        style_preference: Optional[str] = None
    ) -> Dict:
        """
        Get a complete font pairing (title + author fonts).
        
        Args:
            genre: Genre name
            style_preference: Optional style preference
        
        Returns:
            Dict with title_font and author_font specifications
        """
        recommendations = self.get_font_recommendations(genre)
        
        # Select first recommendation from each category
        title_font = recommendations['title'][0]
        author_font = recommendations['author'][0]
        
        return {
            'title_font': title_font['family'],
            'title_weight': str(title_font['weights'][-1]),  # Heaviest weight
            'author_font': author_font['family'],
            'author_weight': str(author_font['weights'][0])  # Lightest weight
        }
    
    async def download_font(
        self,
        font_family: str,
        weight: int = 400
    ) -> Optional[Path]:
        """
        Download font from Google Fonts API.
        
        Note: This is a placeholder. Full implementation would:
        1. Query Google Fonts API for font URL
        2. Download TTF/OTF file
        3. Cache locally
        4. Return path to font file
        
        Args:
            font_family: Font family name
            weight: Font weight (400, 700, etc.)
        
        Returns:
            Path to cached font file, or None if download fails
        """
        # Create safe filename
        safe_name = font_family.replace(' ', '_').lower()
        cache_path = self.font_cache_dir / f"{safe_name}_{weight}.ttf"
        
        # Check if already cached
        if cache_path.exists():
            logger.info(f"Font {font_family} {weight} already cached")
            return cache_path
        
        # TODO: Implement actual Google Fonts download
        # For now, log and return None
        logger.warning(f"Font download not yet implemented: {font_family} {weight}")
        return None
    
    def get_all_available_fonts(self) -> List[Dict]:
        """
        Get list of all fonts available across all genres.
        
        Returns:
            List of font specifications with metadata
        """
        all_fonts = []
        seen = set()
        
        for genre, fonts in self.GENRE_FONTS.items():
            for font_type in ['title', 'author']:
                for font in fonts[font_type]:
                    family = font['family']
                    if family not in seen:
                        seen.add(family)
                        all_fonts.append({
                            'family': family,
                            'weights': font['weights'],
                            'genres': [genre],
                            'type': font_type
                        })
        
        return all_fonts
    
    def validate_font_pairing(
        self,
        title_font: str,
        author_font: str
    ) -> Dict:
        """
        Validate if two fonts pair well together.
        
        Basic rules:
        - Serif + Sans-serif is good
        - Two similar fonts is usually bad
        - Decorative + Simple works
        
        Args:
            title_font: Title font family
            author_font: Author font family
        
        Returns:
            Dict with validation result and suggestions
        """
        # Classify fonts
        serif_fonts = [
            'Playfair Display', 'Cormorant Garamond', 'Libre Baskerville',
            'Merriweather', 'Cinzel'
        ]
        
        sans_serif_fonts = [
            'Montserrat', 'Lato', 'Open Sans', 'Roboto', 'Oswald',
            'Bebas Neue', 'Roboto Condensed'
        ]
        
        decorative_fonts = [
            'Creepster', 'Nosifer', 'Metal Mania', 'Audiowide',
            'Orbitron', 'Exo 2'
        ]
        
        title_type = self._classify_font(title_font, serif_fonts, sans_serif_fonts, decorative_fonts)
        author_type = self._classify_font(author_font, serif_fonts, sans_serif_fonts, decorative_fonts)
        
        # Pairing rules
        good_pairings = [
            ('serif', 'sans_serif'),
            ('sans_serif', 'serif'),
            ('decorative', 'sans_serif'),
            ('decorative', 'serif')
        ]
        
        is_good = (title_type, author_type) in good_pairings
        
        return {
            'valid': is_good,
            'title_type': title_type,
            'author_type': author_type,
            'recommendation': 'Good pairing' if is_good else 'Consider pairing serif with sans-serif'
        }
    
    def _classify_font(
        self,
        font: str,
        serif_list: List[str],
        sans_serif_list: List[str],
        decorative_list: List[str]
    ) -> str:
        """Classify font as serif, sans-serif, or decorative"""
        if font in serif_list:
            return 'serif'
        elif font in sans_serif_list:
            return 'sans_serif'
        elif font in decorative_list:
            return 'decorative'
        else:
            return 'unknown'

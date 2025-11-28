"""
Typography Engine Service
Handles text overlay and font rendering using PIL/Pillow
"""

from typing import Dict, Optional, Tuple
import logging
from PIL import Image, ImageDraw, ImageFont
import requests
from io import BytesIO

logger = logging.getLogger(__name__)


class TypographyEngine:
    """
    Handles text overlay on book cover images.
    Uses PIL/Pillow for rendering with Google Fonts.
    """
    
    # Google Fonts API base URL
    GOOGLE_FONTS_API = "https://fonts.googleapis.com/css2"
    
    def __init__(self):
        """Initialize the Typography Engine"""
        self.font_cache = {}
        logger.info("TypographyEngine initialized")
    
    async def add_text_to_cover(
        self,
        image_url: str,
        title: str,
        author: str,
        typography_config: Dict,
        title_color: Optional[str] = None,
        author_color: Optional[str] = None,
        auto_position: bool = True,
        title_position: Optional[Dict] = None,
        author_position: Optional[Dict] = None
    ) -> Tuple[Image.Image, Dict]:
        """
        Add title and author text to cover image.
        
        Args:
            image_url: URL of base cover image
            title: Book title text
            author: Author name text
            typography_config: Configuration from design brief
                - title_font (str): Font name
                - title_weight (str): Font weight
                - author_font (str): Font name
                - author_weight (str): Font weight
            title_color: Optional hex color for title
            author_color: Optional hex color for author
            auto_position: Whether to auto-position text
            title_position: Manual title position (x, y)
            author_position: Manual author position (x, y)
        
        Returns:
            Tuple of (PIL Image with text, position metadata)
        """
        logger.info(f"Adding typography to cover: {title}")
        
        # Load base image
        base_image = await self._load_image_from_url(image_url)
        
        # Create drawing context
        draw = ImageDraw.Draw(base_image)
        
        # Get image dimensions
        width, height = base_image.size
        
        # Calculate optimal text sizes and positions
        title_size = self._calculate_title_size(width, height, len(title))
        author_size = int(title_size * 0.4)  # Author name is typically 40% of title
        
        # Load fonts
        title_font = await self._get_font(
            typography_config.get('title_font', 'Montserrat'),
            title_size,
            typography_config.get('title_weight', '700')
        )
        
        author_font = await self._get_font(
            typography_config.get('author_font', 'Open Sans'),
            author_size,
            typography_config.get('author_weight', '400')
        )
        
        # Determine text colors
        if title_color:
            title_rgb = self._hex_to_rgb(title_color)
        else:
            title_rgb = self._determine_text_color(base_image, 'top')
            
        if author_color:
            author_rgb = self._hex_to_rgb(author_color)
        else:
            author_rgb = self._determine_text_color(base_image, 'bottom')
        
        # Position text
        if auto_position:
            title_pos = self._calculate_title_position(
                draw, title, title_font, width, height
            )
            author_pos = self._calculate_author_position(
                draw, author, author_font, width, height
            )
        else:
            title_pos = (title_position.get('x', 0), title_position.get('y', 0)) if title_position else (width // 2, height // 4)
            author_pos = (author_position.get('x', 0), author_position.get('y', 0)) if author_position else (width // 2, height * 3 // 4)
        
        # Add text with effects (shadow for contrast)
        self._draw_text_with_shadow(
            draw, title_pos, title, title_font, title_rgb
        )
        
        self._draw_text_with_shadow(
            draw, author_pos, author, author_font, author_rgb
        )
        
        # Store position metadata
        positions = {
            'title': {'x': title_pos[0], 'y': title_pos[1], 'font_size': title_size},
            'author': {'x': author_pos[0], 'y': author_pos[1], 'font_size': author_size}
        }
        
        logger.info("Typography added successfully")
        return base_image, positions
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    async def _load_image_from_url(self, url: str) -> Image.Image:
        """Load image from URL"""
        try:
            response = requests.get(url)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
            return image.convert('RGB')  # Ensure RGB mode
        except Exception as e:
            logger.error(f"Error loading image from URL: {e}")
            raise
    
    def _calculate_title_size(self, width: int, height: int, title_length: int) -> int:
        """Calculate optimal title font size based on image dimensions and text length"""
        # Base size is proportion of image width
        base_size = int(width * 0.12)  # 12% of width
        
        # Adjust for title length
        if title_length > 30:
            base_size = int(base_size * 0.8)
        elif title_length > 20:
            base_size = int(base_size * 0.9)
        
        # Ensure minimum and maximum bounds
        min_size = 40
        max_size = 150
        
        return max(min_size, min(max_size, base_size))
    
    async def _get_font(
        self,
        font_name: str,
        size: int,
        weight: str = '400'
    ) -> ImageFont.FreeTypeFont:
        """
        Get font from Google Fonts or fallback to system font.
        
        Note: In production, fonts should be downloaded and cached locally.
        For now, using PIL's default font with approximations.
        """
        cache_key = f"{font_name}_{size}_{weight}"
        
        if cache_key in self.font_cache:
            return self.font_cache[cache_key]
        
        # TODO: Implement actual Google Fonts download
        # For now, use PIL's default font scaled to size
        try:
            # Try to use a system font as fallback
            font = ImageFont.truetype("arial.ttf", size)
        except:
            # If no system font available, use default
            font = ImageFont.load_default()
        
        self.font_cache[cache_key] = font
        return font
    
    def _determine_text_color(
        self,
        image: Image.Image,
        region: str = 'top'
    ) -> Tuple[int, int, int]:
        """
        Determine optimal text color based on background.
        
        Args:
            image: PIL Image
            region: 'top' or 'bottom' - which region to sample
        
        Returns:
            RGB tuple for text color (white or black)
        """
        width, height = image.size
        
        # Sample region
        if region == 'top':
            sample_box = (0, 0, width, int(height * 0.3))
        else:
            sample_box = (0, int(height * 0.7), width, height)
        
        # Crop to region and get average brightness
        region_image = image.crop(sample_box)
        region_image = region_image.resize((50, 50))  # Downscale for faster processing
        
        # Calculate average brightness
        pixels = list(region_image.getdata())
        avg_brightness = sum(sum(pixel) for pixel in pixels) / (len(pixels) * 3)
        
        # If background is dark, use white text; if light, use black
        if avg_brightness < 128:
            return (255, 255, 255)  # White
        else:
            return (0, 0, 0)  # Black
    
    def _calculate_title_position(
        self,
        draw: ImageDraw.Draw,
        text: str,
        font: ImageFont.FreeTypeFont,
        width: int,
        height: int
    ) -> Tuple[int, int]:
        """Calculate title position (top third, centered)"""
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center horizontally, position in top third
        x = (width - text_width) // 2
        y = int(height * 0.15)  # 15% from top
        
        return (x, y)
    
    def _calculate_author_position(
        self,
        draw: ImageDraw.Draw,
        text: str,
        font: ImageFont.FreeTypeFont,
        width: int,
        height: int
    ) -> Tuple[int, int]:
        """Calculate author position (bottom, centered)"""
        # Get text bounding box
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        # Center horizontally, position near bottom
        x = (width - text_width) // 2
        y = int(height * 0.85)  # 85% from top (15% from bottom)
        
        return (x, y)
    
    def _draw_text_with_shadow(
        self,
        draw: ImageDraw.Draw,
        position: Tuple[int, int],
        text: str,
        font: ImageFont.FreeTypeFont,
        color: Tuple[int, int, int],
        shadow_offset: int = 3
    ):
        """Draw text with shadow for better contrast"""
        x, y = position
        
        # Determine shadow color (opposite of text color)
        if sum(color) > 384:  # If text is light
            shadow_color = (0, 0, 0)  # Dark shadow
        else:
            shadow_color = (255, 255, 255)  # Light shadow
        
        # Draw shadow (slightly offset)
        draw.text((x + shadow_offset, y + shadow_offset), text, font=font, fill=shadow_color)
        
        # Draw main text
        draw.text((x, y), text, font=font, fill=color)
    
    async def generate_layout_variations(
        self,
        image_url: str,
        title: str,
        author: str,
        typography_config: Dict,
        num_variations: int = 3
    ) -> list:
        """
        Generate multiple layout variations with different text positions.
        
        Returns:
            List of (image, metadata) tuples
        """
        logger.info(f"Generating {num_variations} layout variations")
        
        variations = []
        
        # Variation 1: Standard (top/bottom)
        variation1 = await self.add_text_to_cover(
            image_url, title, author, typography_config
        )
        variations.append(('standard', variation1))
        
        # TODO: Implement additional layout variations
        # Variation 2: Centered
        # Variation 3: Bottom-weighted
        
        return variations

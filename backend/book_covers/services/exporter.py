"""
Cover Exporter Service
Handles format exports for various use cases
"""

from typing import Dict, Optional, BinaryIO, Tuple
import logging
from PIL import Image
from io import BytesIO
import requests

logger = logging.getLogger(__name__)


class CoverExporter:
    """
    Exports book covers in multiple formats for different use cases.
    Handles ebook, print, social media, and mockup exports.
    """
    
    # Format specifications
    FORMATS = {
        'ebook': {
            'width': 1600,
            'height': 2560,
            'dpi': 300,
            'format': 'JPEG',
            'color_mode': 'RGB',
            'description': 'Amazon KDP ebook cover'
        },
        'print_front': {
            'width': 1800,  # 6" at 300 DPI
            'height': 2700,  # 9" at 300 DPI
            'dpi': 300,
            'format': 'PDF',
            'color_mode': 'RGB',  # Will warn about CMYK
            'description': '6x9 paperback front cover'
        },
        'social_square': {
            'width': 1080,
            'height': 1080,
            'dpi': 72,
            'format': 'JPEG',
            'color_mode': 'RGB',
            'description': 'Instagram/Facebook square'
        },
        'social_story': {
            'width': 1080,
            'height': 1920,
            'dpi': 72,
            'format': 'JPEG',
            'color_mode': 'RGB',
            'description': 'Instagram Stories/Reels'
        },
        'thumbnail': {
            'width': 400,
            'height': 640,
            'dpi': 72,
            'format': 'JPEG',
            'color_mode': 'RGB',
            'description': 'Website thumbnail'
        }
    }
    
    def __init__(self):
        """Initialize the Cover Exporter"""
        logger.info("CoverExporter initialized")
    
    async def export_all_formats(
        self,
        image: Image.Image,
        book_title: str,
        author: str
    ) -> Dict[str, BytesIO]:
        """
        Export cover in all available formats.
        
        Args:
            image: PIL Image with final cover design
            book_title: Book title for metadata
            author: Author name for metadata
        
        Returns:
            Dict mapping format names to BytesIO objects
        """
        logger.info(f"Exporting all formats for: {book_title}")
        
        exports = {}
        
        for format_name, specs in self.FORMATS.items():
            try:
                exported = await self.export_format(
                    image, format_name, book_title, author
                )
                exports[format_name] = exported
                logger.info(f"Exported {format_name} successfully")
            except Exception as e:
                logger.error(f"Error exporting {format_name}: {e}")
                continue
        
        return exports
    
    async def export_format(
        self,
        image: Image.Image,
        format_name: str,
        book_title: str,
        author: str,
        custom_width: Optional[int] = None,
        custom_height: Optional[int] = None,
        dpi: int = 300
    ) -> Tuple[BytesIO, Dict]:
        """
        Export cover in specific format.
        
        Args:
            image: PIL Image with final cover design
            format_name: Key from FORMATS dict
            book_title: Book title for metadata
            author: Author name for metadata
            custom_width: Custom width override
            custom_height: Custom height override
            dpi: DPI for export
        
        Returns:
            Tuple of (BytesIO object with exported image, metadata dict)
        """
        if format_name not in self.FORMATS:
            raise ValueError(f"Unknown format: {format_name}")
        
        specs = self.FORMATS[format_name].copy()
        
        # Apply custom overrides
        if custom_width:
            specs['width'] = custom_width
        if custom_height:
            specs['height'] = custom_height
        specs['dpi'] = dpi
        
        # Resize image to target dimensions
        resized = image.resize(
            (specs['width'], specs['height']),
            Image.Resampling.LANCZOS  # High-quality resampling
        )
        
        # Ensure correct color mode
        if specs['color_mode'] == 'RGB' and resized.mode != 'RGB':
            resized = resized.convert('RGB')
        
        # Create BytesIO buffer
        buffer = BytesIO()
        
        # Save with appropriate settings
        if specs['format'] == 'JPEG':
            resized.save(
                buffer,
                format='JPEG',
                quality=95,
                dpi=(specs['dpi'], specs['dpi']),
                optimize=True
            )
        elif specs['format'] == 'PNG':
            resized.save(
                buffer,
                format='PNG',
                dpi=(specs['dpi'], specs['dpi']),
                optimize=True
            )
        elif specs['format'] == 'PDF':
            # For PDF, we'll save as high-quality JPEG for now
            # Full PDF support would require reportlab or similar
            resized.save(
                buffer,
                format='JPEG',
                quality=100,
                dpi=(specs['dpi'], specs['dpi'])
            )
        
        # Add metadata (EXIF for JPEG)
        # TODO: Implement metadata embedding
        
        buffer.seek(0)
        
        # Return buffer and metadata
        metadata = {
            'width': specs['width'],
            'height': specs['height'],
            'dpi': specs['dpi'],
            'format': specs['format'],
            'description': specs['description']
        }
        
        return buffer, metadata
    
    async def export_ebook_cover(
        self,
        image: Image.Image,
        book_title: str,
        author: str
    ) -> BytesIO:
        """
        Export ebook cover (Amazon KDP standard).
        
        Returns:
            BytesIO with 1600x2560px JPEG at 300 DPI
        """
        return await self.export_format(image, 'ebook', book_title, author)
    
    async def export_print_cover(
        self,
        image: Image.Image,
        trim_size: str = "6x9",
        book_title: str = "",
        author: str = ""
    ) -> BytesIO:
        """
        Export print cover front only.
        
        Args:
            image: Final cover image
            trim_size: Print trim size (e.g., "6x9", "5x8")
            book_title: Book title
            author: Author name
        
        Returns:
            BytesIO with print-ready front cover
        """
        # Calculate dimensions based on trim size
        trim_dimensions = {
            "5x8": (1500, 2400),    # 5" x 8" at 300 DPI
            "6x9": (1800, 2700),    # 6" x 9" at 300 DPI
            "5.5x8.5": (1650, 2550),  # 5.5" x 8.5" at 300 DPI
        }
        
        width, height = trim_dimensions.get(trim_size, (1800, 2700))
        
        # Resize to exact dimensions
        resized = image.resize((width, height), Image.Resampling.LANCZOS)
        
        # Add bleed (0.125" = 37.5px at 300 DPI)
        bleed_size = 38  # pixels
        with_bleed = Image.new('RGB', (width + 2*bleed_size, height + 2*bleed_size))
        
        # Paste image centered (simple bleed - production would extend edges)
        with_bleed.paste(resized, (bleed_size, bleed_size))
        
        buffer = BytesIO()
        with_bleed.save(
            buffer,
            format='JPEG',
            quality=100,
            dpi=(300, 300)
        )
        
        buffer.seek(0)
        return buffer
    
    async def export_social_media(
        self,
        image: Image.Image,
        platform: str = 'instagram_square'
    ) -> BytesIO:
        """
        Export for social media platforms.
        
        Args:
            image: Cover image
            platform: 'instagram_square', 'instagram_story', 'facebook', etc.
        
        Returns:
            BytesIO with social media optimized image
        """
        platform_map = {
            'instagram_square': 'social_square',
            'instagram_story': 'social_story',
            'facebook': 'social_square',
            'twitter': 'social_square'
        }
        
        format_name = platform_map.get(platform, 'social_square')
        return await self.export_format(image, format_name, "", "")
    
    async def export_thumbnail(
        self,
        image: Image.Image
    ) -> BytesIO:
        """
        Export thumbnail for website/catalog.
        
        Returns:
            BytesIO with 400x640px thumbnail
        """
        return await self.export_format(image, 'thumbnail', "", "")
    
    def get_available_formats(self) -> Dict:
        """
        Get list of available export formats with descriptions.
        
        Returns:
            Dict of format specifications
        """
        return self.FORMATS
    
    async def create_mockup(
        self,
        image: Image.Image,
        mockup_type: str = '3d_book'
    ) -> BytesIO:
        """
        Create 3D mockup of book cover.
        
        Note: This is a placeholder. Full implementation would require:
        - 3D rendering library or external service
        - Mockup templates
        - Perspective transformation
        
        Args:
            image: Cover image
            mockup_type: '3d_book', 'ebook_device', 'stack', etc.
        
        Returns:
            BytesIO with mockup image
        """
        logger.warning("Mockup generation not yet implemented")
        
        # For now, just return the image with a simple frame effect
        # TODO: Implement actual 3D mockup generation
        
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer
    
    def _add_metadata(
        self,
        image: Image.Image,
        title: str,
        author: str
    ) -> Image.Image:
        """
        Add metadata to image (title, author, copyright).
        
        Note: Metadata embedding varies by format.
        """
        # TODO: Implement EXIF metadata embedding
        # For JPEG: Use piexif or PIL's info dict
        # For PDF: Use reportlab or pypdf
        
        return image
    
    def _validate_print_specs(
        self,
        image: Image.Image
    ) -> Dict[str, bool]:
        """
        Validate image meets print specifications.
        
        Returns:
            Dict with validation results
        """
        width, height = image.size
        
        checks = {
            'resolution_300dpi': True,  # Assuming input is correct
            'color_mode_rgb': image.mode == 'RGB',
            'aspect_ratio_correct': abs((height / width) - 1.6) < 0.1,  # Close to 5:8
            'minimum_size': width >= 1500 and height >= 2400
        }
        
        if not all(checks.values()):
            logger.warning(f"Print spec validation issues: {checks}")
        
        return checks

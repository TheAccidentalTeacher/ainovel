"""
Color Utilities
Helper functions for color manipulation and analysis
"""

from typing import Dict, List, Tuple, Optional
import logging
from PIL import Image
import colorsys

logger = logging.getLogger(__name__)


class ColorUtils:
    """
    Utilities for color manipulation, extraction, and accessibility checking.
    """
    
    # WCAG contrast ratio standards
    WCAG_AA_NORMAL = 4.5  # Minimum for normal text
    WCAG_AA_LARGE = 3.0   # Minimum for large text (18pt+)
    WCAG_AAA_NORMAL = 7.0  # Enhanced for normal text
    
    @staticmethod
    def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
        """
        Convert RGB tuple to hex color string.
        
        Args:
            rgb: (r, g, b) tuple with values 0-255
        
        Returns:
            Hex color string (e.g., '#FF5733')
        """
        return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])
    
    @staticmethod
    def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """
        Convert hex color string to RGB tuple.
        
        Args:
            hex_color: Hex color string (e.g., '#FF5733' or 'FF5733')
        
        Returns:
            (r, g, b) tuple with values 0-255
        """
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    @staticmethod
    def rgb_to_cmyk(rgb: Tuple[int, int, int]) -> Tuple[float, float, float, float]:
        """
        Convert RGB to CMYK color space (for print).
        
        Args:
            rgb: (r, g, b) tuple with values 0-255
        
        Returns:
            (c, m, y, k) tuple with values 0-1
        """
        r, g, b = [x / 255.0 for x in rgb]
        
        k = 1 - max(r, g, b)
        
        if k == 1:
            return (0, 0, 0, 1)
        
        c = (1 - r - k) / (1 - k)
        m = (1 - g - k) / (1 - k)
        y = (1 - b - k) / (1 - k)
        
        return (c, m, y, k)
    
    @staticmethod
    def cmyk_to_rgb(cmyk: Tuple[float, float, float, float]) -> Tuple[int, int, int]:
        """
        Convert CMYK to RGB color space.
        
        Args:
            cmyk: (c, m, y, k) tuple with values 0-1
        
        Returns:
            (r, g, b) tuple with values 0-255
        """
        c, m, y, k = cmyk
        
        r = 255 * (1 - c) * (1 - k)
        g = 255 * (1 - m) * (1 - k)
        b = 255 * (1 - y) * (1 - k)
        
        return (int(r), int(g), int(b))
    
    @staticmethod
    def calculate_luminance(rgb: Tuple[int, int, int]) -> float:
        """
        Calculate relative luminance of a color (WCAG formula).
        
        Args:
            rgb: (r, g, b) tuple with values 0-255
        
        Returns:
            Luminance value between 0 and 1
        """
        def adjust(color_value):
            color_value = color_value / 255.0
            if color_value <= 0.03928:
                return color_value / 12.92
            else:
                return ((color_value + 0.055) / 1.055) ** 2.4
        
        r, g, b = rgb
        return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)
    
    @classmethod
    def calculate_contrast_ratio(
        cls,
        color1: Tuple[int, int, int],
        color2: Tuple[int, int, int]
    ) -> float:
        """
        Calculate WCAG contrast ratio between two colors.
        
        Args:
            color1: (r, g, b) tuple
            color2: (r, g, b) tuple
        
        Returns:
            Contrast ratio (1 to 21)
        """
        lum1 = cls.calculate_luminance(color1)
        lum2 = cls.calculate_luminance(color2)
        
        lighter = max(lum1, lum2)
        darker = min(lum1, lum2)
        
        return (lighter + 0.05) / (darker + 0.05)
    
    @classmethod
    def check_wcag_compliance(
        cls,
        text_color: Tuple[int, int, int],
        background_color: Tuple[int, int, int],
        large_text: bool = False
    ) -> Dict:
        """
        Check if color combination meets WCAG accessibility standards.
        
        Args:
            text_color: RGB tuple for text
            background_color: RGB tuple for background
            large_text: True if text is 18pt+ or 14pt+ bold
        
        Returns:
            Dict with compliance levels and recommendations
        """
        ratio = cls.calculate_contrast_ratio(text_color, background_color)
        
        threshold = cls.WCAG_AA_LARGE if large_text else cls.WCAG_AA_NORMAL
        aaa_threshold = cls.WCAG_AAA_NORMAL
        
        return {
            'contrast_ratio': round(ratio, 2),
            'wcag_aa': ratio >= threshold,
            'wcag_aaa': ratio >= aaa_threshold,
            'recommendation': 'Excellent contrast' if ratio >= aaa_threshold
                           else 'Good contrast' if ratio >= threshold
                           else 'Insufficient contrast - adjust colors'
        }
    
    @staticmethod
    def extract_dominant_colors(
        image: Image.Image,
        num_colors: int = 5
    ) -> List[Tuple[int, int, int]]:
        """
        Extract dominant colors from an image.
        
        Args:
            image: PIL Image
            num_colors: Number of dominant colors to extract
        
        Returns:
            List of RGB tuples
        """
        # Resize image for faster processing
        small_image = image.resize((100, 100))
        
        # Convert to RGB if needed
        if small_image.mode != 'RGB':
            small_image = small_image.convert('RGB')
        
        # Get all pixels
        pixels = list(small_image.getdata())
        
        # Simple color quantization using PIL
        paletted = small_image.convert('P', palette=Image.Palette.ADAPTIVE, colors=num_colors)
        palette = paletted.getpalette()
        
        # Extract the colors
        colors = []
        for i in range(num_colors):
            colors.append(tuple(palette[i*3:(i+1)*3]))
        
        logger.info(f"Extracted {len(colors)} dominant colors")
        return colors
    
    @classmethod
    def suggest_text_color(
        cls,
        background_color: Tuple[int, int, int]
    ) -> Tuple[int, int, int]:
        """
        Suggest optimal text color (black or white) for given background.
        
        Args:
            background_color: RGB tuple
        
        Returns:
            RGB tuple for text (white or black)
        """
        white = (255, 255, 255)
        black = (0, 0, 0)
        
        white_ratio = cls.calculate_contrast_ratio(white, background_color)
        black_ratio = cls.calculate_contrast_ratio(black, background_color)
        
        return white if white_ratio > black_ratio else black
    
    @staticmethod
    def lighten_color(rgb: Tuple[int, int, int], factor: float = 0.2) -> Tuple[int, int, int]:
        """
        Lighten a color by a factor.
        
        Args:
            rgb: (r, g, b) tuple
            factor: Amount to lighten (0-1, where 0=no change, 1=white)
        
        Returns:
            Lightened RGB tuple
        """
        h, l, s = colorsys.rgb_to_hls(rgb[0]/255, rgb[1]/255, rgb[2]/255)
        l = min(1, l + factor)
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return (int(r*255), int(g*255), int(b*255))
    
    @staticmethod
    def darken_color(rgb: Tuple[int, int, int], factor: float = 0.2) -> Tuple[int, int, int]:
        """
        Darken a color by a factor.
        
        Args:
            rgb: (r, g, b) tuple
            factor: Amount to darken (0-1, where 0=no change, 1=black)
        
        Returns:
            Darkened RGB tuple
        """
        h, l, s = colorsys.rgb_to_hls(rgb[0]/255, rgb[1]/255, rgb[2]/255)
        l = max(0, l - factor)
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return (int(r*255), int(g*255), int(b*255))
    
    @staticmethod
    def create_color_palette(
        base_color: Tuple[int, int, int],
        scheme: str = 'monochromatic'
    ) -> List[Tuple[int, int, int]]:
        """
        Create a color palette based on a base color.
        
        Args:
            base_color: RGB tuple
            scheme: 'monochromatic', 'complementary', 'analogous', 'triadic'
        
        Returns:
            List of RGB tuples forming a palette
        """
        r, g, b = base_color
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        
        palette = [base_color]
        
        if scheme == 'monochromatic':
            # Lighter and darker versions
            for factor in [0.3, -0.3]:
                new_v = max(0, min(1, v + factor))
                r2, g2, b2 = colorsys.hsv_to_rgb(h, s, new_v)
                palette.append((int(r2*255), int(g2*255), int(b2*255)))
        
        elif scheme == 'complementary':
            # Opposite hue
            h2 = (h + 0.5) % 1.0
            r2, g2, b2 = colorsys.hsv_to_rgb(h2, s, v)
            palette.append((int(r2*255), int(g2*255), int(b2*255)))
        
        elif scheme == 'analogous':
            # Adjacent hues
            for offset in [0.083, -0.083]:  # ~30 degrees
                h2 = (h + offset) % 1.0
                r2, g2, b2 = colorsys.hsv_to_rgb(h2, s, v)
                palette.append((int(r2*255), int(g2*255), int(b2*255)))
        
        elif scheme == 'triadic':
            # Three evenly spaced hues
            for offset in [0.333, 0.666]:
                h2 = (h + offset) % 1.0
                r2, g2, b2 = colorsys.hsv_to_rgb(h2, s, v)
                palette.append((int(r2*255), int(g2*255), int(b2*255)))
        
        return palette
    
    @staticmethod
    def validate_print_colors(rgb: Tuple[int, int, int]) -> Dict:
        """
        Check if RGB color can be accurately reproduced in CMYK print.
        
        Args:
            rgb: RGB tuple
        
        Returns:
            Dict with validation results and warnings
        """
        cmyk = ColorUtils.rgb_to_cmyk(rgb)
        rgb_converted_back = ColorUtils.cmyk_to_rgb(cmyk)
        
        # Calculate color shift
        shift = sum(abs(a - b) for a, b in zip(rgb, rgb_converted_back)) / 3
        
        warnings = []
        
        # Bright blues and greens often shift
        if rgb[2] > 200 and rgb[0] < 100:  # Bright blue
            warnings.append("Bright blue may shift in print - consider darker shade")
        
        if rgb[1] > 200 and rgb[2] < 100:  # Bright green
            warnings.append("Bright green may shift in print - consider adjusting")
        
        # Very saturated colors
        if max(rgb) - min(rgb) > 200:
            warnings.append("Highly saturated color - may appear duller in print")
        
        return {
            'rgb': rgb,
            'cmyk': tuple(round(x, 3) for x in cmyk),
            'rgb_converted_back': rgb_converted_back,
            'color_shift': round(shift, 2),
            'printable': shift < 30,  # Acceptable threshold
            'warnings': warnings
        }

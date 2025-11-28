"""
Image Generator Service
Handles AI image generation using DALL-E 3
"""

from typing import Dict, List, Optional
import logging
from openai import OpenAI
from config.settings import get_settings
import asyncio

logger = logging.getLogger(__name__)
settings = get_settings()


class ImageGenerator:
    """
    Generates book cover images using DALL-E 3.
    Creates multiple variations and handles image generation parameters.
    """
    
    def __init__(self):
        """Initialize the Image Generator with OpenAI API"""
        self.client = OpenAI(api_key=settings.openai_api_key)
        logger.info("ImageGenerator initialized")
    
    async def generate_variations(
        self,
        dalle_prompt: str,
        num_variations: int = 3,
        size: str = "1024x1792"  # Portrait aspect ratio for book covers
    ) -> List[Dict]:
        """
        Generate multiple cover image variations using DALL-E 3.
        
        Args:
            dalle_prompt: Optimized prompt for image generation
            num_variations: Number of variations to generate (default 3)
            size: Image size - "1024x1792" for portrait (5:8 ratio)
        
        Returns:
            List of dicts containing:
                - image_url (str): URL of generated image
                - prompt_used (str): Prompt that was used
                - variation_number (int): Variation index
                - metadata (Dict): Generation parameters
        """
        logger.info(f"Generating {num_variations} cover variations")
        
        variations = []
        
        # DALL-E 3 doesn't support multiple generations in one call
        # Generate sequentially with slight prompt variations
        for i in range(num_variations):
            try:
                # Add variation hint to prompt
                varied_prompt = self._add_variation_hint(dalle_prompt, i)
                
                # Generate image
                response = self.client.images.generate(
                    model="dall-e-3",
                    prompt=varied_prompt,
                    size=size,
                    quality="hd",  # High quality for print
                    n=1
                )
                
                image_data = {
                    'image_url': response.data[0].url,
                    'prompt_used': varied_prompt,
                    'variation_number': i + 1,
                    'metadata': {
                        'model': 'dall-e-3',
                        'size': size,
                        'quality': 'hd',
                        'revised_prompt': response.data[0].revised_prompt  # DALL-E 3 returns revised prompt
                    }
                }
                
                variations.append(image_data)
                logger.info(f"Generated variation {i + 1}/{num_variations}")
                
                # Small delay to avoid rate limiting
                if i < num_variations - 1:
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error generating variation {i + 1}: {e}")
                # Continue with other variations
                continue
        
        logger.info(f"Successfully generated {len(variations)} variations")
        return variations
    
    def _add_variation_hint(self, base_prompt: str, variation_index: int) -> str:
        """Add subtle variation hints to create different versions"""
        variation_hints = [
            "",  # First one uses original prompt
            "Alternative perspective, ",
            "Different lighting angle, ",
            "Varied composition, "
        ]
        
        hint = variation_hints[variation_index % len(variation_hints)]
        return hint + base_prompt
    
    async def generate_single_image(
        self,
        prompt: str,
        size: str = "1024x1792",
        quality: str = "hd"
    ) -> Dict:
        """
        Generate a single image with specific parameters.
        
        Args:
            prompt: Image generation prompt
            size: Image dimensions
            quality: "standard" or "hd"
        
        Returns:
            Dict with image_url and metadata
        """
        logger.info("Generating single image")
        
        try:
            response = self.client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size=size,
                quality=quality,
                n=1
            )
            
            result = {
                'image_url': response.data[0].url,
                'prompt_used': prompt,
                'metadata': {
                    'model': 'dall-e-3',
                    'size': size,
                    'quality': quality,
                    'revised_prompt': response.data[0].revised_prompt
                }
            }
            
            logger.info("Image generated successfully")
            return result
            
        except Exception as e:
            logger.error(f"Error generating image: {e}")
            raise
    
    async def refine_image(
        self,
        original_prompt: str,
        refinement_instructions: str,
        size: str = "1024x1792"
    ) -> Dict:
        """
        Generate refined version based on user feedback.
        
        Args:
            original_prompt: Original prompt that was used
            refinement_instructions: User's refinement requests
            size: Image dimensions
        
        Returns:
            Dict with refined image data
        """
        logger.info("Generating refined image")
        
        # Combine original prompt with refinements
        refined_prompt = f"{original_prompt}. Refinements: {refinement_instructions}"
        
        return await self.generate_single_image(refined_prompt, size)
    
    def get_available_sizes(self) -> List[Dict]:
        """
        Get available image sizes for DALL-E 3.
        
        Returns:
            List of available size options with descriptions
        """
        return [
            {
                'size': '1024x1792',
                'aspect_ratio': '5:8',
                'description': 'Portrait (recommended for book covers)',
                'recommended': True
            },
            {
                'size': '1792x1024',
                'aspect_ratio': '16:9',
                'description': 'Landscape',
                'recommended': False
            },
            {
                'size': '1024x1024',
                'aspect_ratio': '1:1',
                'description': 'Square',
                'recommended': False
            }
        ]

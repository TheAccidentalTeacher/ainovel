"""
Design Brief Generator Service
Creates professional design specifications using AI
"""

from typing import Dict, Optional
import logging
from anthropic import Anthropic
from config.settings import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class DesignBriefGenerator:
    """
    Generates professional book cover design briefs using Claude AI.
    Applies genre conventions and best practices from comprehensive guide.
    """
    
    def __init__(self):
        """Initialize the Design Brief Generator with Claude API"""
        self.client = Anthropic(api_key=settings.anthropic_api_key)
        logger.info("DesignBriefGenerator initialized")
    
    async def generate_brief(self, analysis: Dict, project_data: Optional[Dict]) -> Dict:
        """
        Generate comprehensive design brief using AI analysis.
        
        Args:
            analysis: Output from StoryAnalyzer
            project_data: Original project data with title, author, etc. Optional in standalone mode.
        
        Returns:
            Dict containing:
                - design_brief_text (str): Full brief description
                - dalle_prompt (str): Optimized DALL-E 3 prompt
                - typography_recommendations (Dict): Font and layout suggestions
                - color_scheme (Dict): Specific color values and palette
                - composition (str): Layout and composition guidance
                - reference_covers (List[str]): Similar successful covers
        """
        logger.info("Generating design brief with Claude AI")
        
        # Prepare context for Claude (project_data can be None in standalone mode)
        context = self._build_context(analysis, project_data)
        
        # Generate brief using Claude
        brief = await self._generate_with_claude(context)
        
        # Generate DALL-E prompt
        dalle_prompt = self._create_dalle_prompt(analysis, brief)
        
        # Log the complete prompt for debugging
        logger.info(f"=== DALL-E PROMPT GENERATED ===")
        logger.info(f"Genre: {analysis['genre']}")
        logger.info(f"Key Elements: {analysis.get('key_elements', [])}")
        logger.info(f"Color Scheme: {analysis.get('color_scheme', [])}")
        logger.info(f"Mood Keywords: {analysis.get('mood_keywords', [])}")
        logger.info(f"Full DALL-E Prompt ({len(dalle_prompt)} chars):")
        logger.info(dalle_prompt)
        logger.info(f"=== END DALL-E PROMPT ===")
        
        # Create detailed recommendations
        design_brief = {
            'genre': analysis['genre'],
            'subgenre': analysis.get('subgenre'),
            'tone': analysis['tone'],
            'visual_approach': analysis['visual_approach'],
            'design_brief_text': brief,
            'dalle_prompt': dalle_prompt,
            'typography_recommendations': self._recommend_typography(analysis),
            'color_scheme': self._detail_color_scheme(analysis['color_scheme']),
            'composition': self._recommend_composition(analysis),
            'imagery_style': analysis['imagery_style'],
            'reference_covers': []  # TODO: Could add cover database search
        }
        
        logger.info("Design brief generated successfully")
        return design_brief
    
    def _build_context(self, analysis: Dict, project_data: Optional[Dict]) -> str:
        """Build context prompt for Claude"""
        if not isinstance(project_data, dict):  # Standalone mode can pass None
            project_data = {}
        context = f"""
You are an expert book cover designer with deep knowledge of print-on-demand specifications,
genre conventions, and visual design principles. Create a professional design brief for a book cover.

BOOK INFORMATION:
Title: {project_data.get('title', 'Untitled')}
Author: {project_data.get('author', 'Author Name')}
Genre: {analysis['genre']}
Subgenre: {analysis.get('subgenre', 'Not specified')}
Tone: {analysis['tone']}
Premise: {project_data.get('premise', 'No premise provided')[:500]}

DESIGN ANALYSIS:
Visual Approach: {analysis['visual_approach']}
Recommended Colors: {', '.join(analysis['color_scheme'])}
Imagery Style: {analysis['imagery_style']}
Key Elements: {', '.join(analysis['key_elements'])}
Mood Keywords: {', '.join(analysis['mood_keywords'])}

TASK:
Create a comprehensive design brief that includes:
1. Overall concept and mood
2. Specific visual elements to include
3. Color palette with specific shades
4. Typography style and hierarchy
5. Composition and layout approach
6. Genre-appropriate conventions to follow

Keep the brief professional, actionable, and suitable for AI image generation.
Focus on elements that will work at thumbnail size.
"""
        return context
    
    async def _generate_with_claude(self, context: str) -> str:
        """Generate design brief using Claude API"""
        try:
            message = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                temperature=0.7,
                messages=[
                    {
                        "role": "user",
                        "content": context
                    }
                ]
            )
            
            brief = message.content[0].text
            logger.info("Claude generated design brief successfully")
            return brief
            
        except Exception as e:
            logger.error(f"Error generating brief with Claude: {e}")
            return self._fallback_brief(context)
    
    def _fallback_brief(self, context: str) -> str:
        """Generate basic brief if Claude fails"""
        return """
Professional book cover design brief:

CONCEPT: Genre-appropriate visual that captures the story's essence while following 
established conventions. Design must be legible at thumbnail size with strong visual hierarchy.

VISUAL ELEMENTS: Focus on key story elements that create immediate emotional connection.
Use imagery that signals genre clearly to target readers.

COLOR PALETTE: Follow genre conventions while standing out on virtual shelf.
Ensure high contrast for text readability.

TYPOGRAPHY: Bold, readable fonts appropriate for genre. Title must be prominent and 
legible at small sizes. Clear hierarchy between title and author name.

COMPOSITION: Rule of thirds, strong focal point, balanced negative space.
All important elements within safe zone (0.25" from edges).
"""
    
    def _create_dalle_prompt(self, analysis: Dict, brief: str) -> str:
        """
        Create optimized DALL-E 3 prompt for image generation.
        
        Uses structured format: [Setting/Scene] + [Visual Style] + [Mood/Atmosphere] + 
        [Key Elements] + [Color Palette] + [Technical Specs]
        """
        genre = analysis['genre'].replace('_', ' ').lower()
        tone = analysis['tone']
        visual_approach = analysis['visual_approach']
        key_elements = analysis.get('key_elements', [])[:5]
        mood_keywords = analysis.get('mood_keywords', [])[:4]
        color_scheme = analysis.get('color_scheme', [])
        imagery_style = analysis.get('imagery_style', 'photographic')
        
        # Get detailed color descriptions for the prompt
        color_descriptions = self._get_color_descriptions_for_prompt(color_scheme)
        
        # Build setting/scene based on key elements and genre
        scene_description = self._build_scene_description(genre, key_elements, visual_approach)
        
        # Get genre-specific visual guidance (much more detailed than before)
        genre_guidance = self._get_detailed_genre_guidance(genre, tone)
        
        # Build the structured prompt
        prompt_parts = []
        
        # 1. SCENE/SETTING (most important - sets the visual foundation)
        prompt_parts.append(scene_description)
        
        # 2. VISUAL STYLE (how it should look)
        style_description = self._get_style_description(imagery_style, genre)
        prompt_parts.append(style_description)
        
        # 3. MOOD/ATMOSPHERE (emotional impact)
        mood_description = self._build_mood_description(mood_keywords, tone)
        prompt_parts.append(mood_description)
        
        # 4. COLOR PALETTE (specific colors)
        if color_descriptions:
            prompt_parts.append(f"Color palette: {color_descriptions}")
        
        # 5. GENRE-SPECIFIC GUIDANCE
        if genre_guidance:
            prompt_parts.append(genre_guidance)
        
        # 6. COMPOSITION & TECHNICAL SPECS (always include)
        # IMPORTANT: Avoid saying "book cover" - DALL-E will literally draw a book!
        prompt_parts.extend([
            "Composition: vertical portrait orientation (9:16 aspect ratio), rule of thirds, strong focal point",
            "Leave clear negative space in upper third for future text overlay",
            "Dramatic high-contrast image suitable for small thumbnail viewing",
            "Ultra high quality digital artwork, photorealistic detail, 8K resolution",
            "Cinematic lighting with dramatic shadows and highlights",
            "Absolutely no text, letters, words, titles, or typography anywhere in the image"
        ])
        
        dalle_prompt = ". ".join(prompt_parts) + "."
        
        logger.info(f"DALL-E prompt created: {len(dalle_prompt)} characters")
        logger.debug(f"Full DALL-E prompt: {dalle_prompt}")
        return dalle_prompt
    
    def _get_color_descriptions_for_prompt(self, color_scheme: list) -> str:
        """Convert color names to descriptive terms for DALL-E"""
        color_descriptions = {
            'blood_red': 'deep blood red',
            'charcoal': 'dark charcoal gray',
            'midnight_blue': 'deep midnight blue',
            'gold': 'warm gold accents',
            'black': 'pure black shadows',
            'white': 'stark white highlights',
            'navy': 'rich navy blue',
            'deep_purple': 'deep royal purple',
            'emerald': 'vivid emerald green',
            'rose': 'soft rose pink',
            'silver': 'cool metallic silver',
            'cyan': 'electric cyan',
            'burgundy': 'deep burgundy wine',
            'forest_green': 'dark forest green',
            'cream': 'warm cream',
            'ivory': 'soft ivory'
        }
        
        descriptions = []
        for color in color_scheme[:3]:  # Max 3 colors
            if color in color_descriptions:
                descriptions.append(color_descriptions[color])
            else:
                descriptions.append(color.replace('_', ' '))
        
        if descriptions:
            return ', '.join(descriptions)
        return 'high contrast dark and light tones'
    
    def _build_scene_description(self, genre: str, key_elements: list, visual_approach: str) -> str:
        """Build detailed scene description based on elements and approach"""
        # Default scene starters by visual approach
        approach_scenes = {
            'character': 'Mysterious figure silhouette',
            'location': 'Sweeping atmospheric landscape',
            'icon': 'Powerful symbolic focal element',
            'typography': 'Minimalist background with texture'
        }
        
        base_scene = approach_scenes.get(visual_approach, 'Dramatic scene')
        
        # Build element descriptions
        if key_elements:
            elements_str = ', '.join(key_elements[:4])
            return f"{base_scene} featuring {elements_str}"
        
        return base_scene
    
    def _get_style_description(self, imagery_style: str, genre: str) -> str:
        """Get detailed style description for visual rendering"""
        style_templates = {
            'thriller': 'Photorealistic with high contrast, gritty texture, dramatic noir lighting, deep blacks and bright highlights',
            'survival thriller': 'Photorealistic harsh environment, raw and gritty texture, cold natural lighting, desolate atmosphere',
            'romance': 'Soft, dreamy lighting with romantic atmosphere, warm tones, slightly stylized',
            'fantasy': 'Rich digital painting style, detailed illustration, magical atmosphere with ethereal lighting',
            'science_fiction': 'Sleek digital art, photorealistic CGI quality, cool technological lighting',
            'horror': 'Dark atmospheric photography, unsettling shadows, gothic horror aesthetic',
            'mystery': 'Film noir style, atmospheric fog, strategic shadows concealing details',
            'literary_fiction': 'Artistic and sophisticated, minimalist yet meaningful imagery'
        }
        
        # Try exact match, then partial, then default
        for key in style_templates:
            if key in genre.lower():
                return f"Visual style: {style_templates[key]}"
        
        # Use the provided imagery_style or default
        return f"Visual style: {imagery_style}, dramatic cinematic quality"
    
    def _build_mood_description(self, mood_keywords: list, tone: str) -> str:
        """Build evocative mood description"""
        if not mood_keywords:
            mood_keywords = [tone] if tone else ['dramatic']
        
        # Expand mood keywords into evocative descriptions
        mood_expansions = {
            'dark': 'oppressive darkness, ominous shadows',
            'intense': 'palpable tension, electric atmosphere',
            'suspenseful': 'edge-of-seat tension, something lurking',
            'mysterious': 'enigmatic shadows, hidden secrets',
            'bleak': 'desolate emptiness, harsh isolation',
            'tense': 'coiled energy, imminent danger',
            'chilling': 'bone-cold fear, creeping dread',
            'hopeful': 'glimmer of light through darkness',
            'resilient': 'defiant strength against adversity',
            'romantic': 'warm intimacy, emotional connection',
            'melancholic': 'wistful longing, bittersweet emotion'
        }
        
        expanded_moods = []
        for mood in mood_keywords[:3]:
            mood_lower = mood.lower()
            if mood_lower in mood_expansions:
                expanded_moods.append(mood_expansions[mood_lower])
            else:
                expanded_moods.append(mood_lower)
        
        return f"Mood and atmosphere: {', '.join(expanded_moods)}"
    
    def _get_detailed_genre_guidance(self, genre: str, tone: str) -> str:
        """Get detailed genre-specific visual guidance for DALL-E"""
        genre_lower = genre.lower()
        
        # Comprehensive genre guidance based on book cover design documentation
        guidance = {
            'thriller': (
                "Thriller conventions: obscured or silhouetted figure, urban or isolated setting, "
                "high contrast with deep shadows, sense of pursuit or danger, "
                "cool blue and yellow accents on black, backlit dramatic scene, "
                "single ominous focal point that creates immediate tension"
            ),
            'survival thriller': (
                "Survival thriller elements: harsh wilderness environment, isolated human figure dwarfed by nature, "
                "brutal weather conditions (snow, storm, extreme cold), abandoned or broken man-made objects, "
                "muted desaturated colors with red or gold accent, sense of desperate isolation, "
                "nature as both beautiful and deadly, single figure against vast emptiness"
            ),
            'romance': (
                "Romance conventions: couple in intimate pose or emotional connection, "
                "warm lighting (sunset, candlelight), flowing fabric or natural elements, "
                "soft focus background, passionate or tender moment frozen in time, "
                "warm color palette with pink, gold, deep red accents"
            ),
            'mystery': (
                "Mystery conventions: symbolic clue object prominently featured, "
                "fog or shadows obscuring details, noir lighting with single light source, "
                "empty atmospheric setting, sense of secrets and hidden truths, "
                "muted sophisticated color palette with one accent color"
            ),
            'fantasy': (
                "Fantasy conventions: epic scale landscape or magical setting, "
                "rich jewel-tone colors, intricate detailed elements, "
                "sense of wonder and magic, dramatic fantasy lighting, "
                "heroic figure or powerful artifact as focal point"
            ),
            'science_fiction': (
                "Sci-fi conventions: futuristic technology or cosmic scale, "
                "cool blue and silver tones with neon accents, "
                "sleek surfaces, distant planets or advanced cities, "
                "sense of vast scale and technological wonder"
            ),
            'horror': (
                "Horror conventions: deep shadows with minimal light, "
                "unsettling focal element partially revealed, "
                "gothic or abandoned setting, visceral dread atmosphere, "
                "desaturated palette with blood red accent, creeping wrongness"
            ),
            'literary_fiction': (
                "Literary fiction: sophisticated minimalism, artistic interpretation, "
                "symbolic imagery over literal depiction, "
                "elegant restrained color palette, thoughtful composition"
            )
        }
        
        # Try exact match first
        if genre_lower in guidance:
            return guidance[genre_lower]
        
        # Try partial matches
        for key in guidance:
            if key in genre_lower or genre_lower in key:
                return guidance[key]
        
        # Check for compound genres (e.g., "christian survival thriller")
        for key in guidance:
            if key.split()[0] in genre_lower.split():
                return guidance[key]
        
        return ""
    
    def _recommend_typography(self, analysis: Dict) -> Dict:
        """Recommend typography based on genre and analysis"""
        genre = analysis['genre']
        
        # Font recommendations by genre (using Google Fonts)
        font_map = {
            'romance': {
                'title_font': 'Playfair Display',
                'title_weight': '700',
                'author_font': 'Montserrat',
                'author_weight': '400',
                'style': 'elegant'
            },
            'thriller': {
                'title_font': 'Oswald',
                'title_weight': '700',
                'author_font': 'Roboto',
                'author_weight': '400',
                'style': 'bold'
            },
            'mystery': {
                'title_font': 'Montserrat',
                'title_weight': '800',
                'author_font': 'Open Sans',
                'author_weight': '400',
                'style': 'bold'
            },
            'fantasy': {
                'title_font': 'Cinzel',
                'title_weight': '700',
                'author_font': 'Lato',
                'author_weight': '400',
                'style': 'ornate'
            },
            'science_fiction': {
                'title_font': 'Exo 2',
                'title_weight': '700',
                'author_font': 'Roboto',
                'author_weight': '400',
                'style': 'modern'
            },
            'horror': {
                'title_font': 'Creepster',
                'title_weight': '400',
                'author_font': 'Roboto',
                'author_weight': '400',
                'style': 'unsettling'
            },
            'literary_fiction': {
                'title_font': 'Merriweather',
                'title_weight': '700',
                'author_font': 'Lato',
                'author_weight': '400',
                'style': 'sophisticated'
            },
            'non_fiction': {
                'title_font': 'Montserrat',
                'title_weight': '800',
                'author_font': 'Open Sans',
                'author_weight': '600',
                'style': 'professional'
            }
        }
        
        default = {
            'title_font': 'Montserrat',
            'title_weight': '700',
            'author_font': 'Open Sans',
            'author_weight': '400',
            'style': 'clean'
        }
        
        font_rec = font_map.get(genre, default)
        
        # Match TypographyRecommendation model: title_font, author_font, style, hierarchy
        return {
            'title_font': font_rec['title_font'],
            'author_font': font_rec['author_font'],
            'style': font_rec['style'],
            'hierarchy': f"Title in {font_rec['title_font']} ({font_rec['title_weight']}), Author in {font_rec['author_font']} ({font_rec['author_weight']})"
        }
    
    def _detail_color_scheme(self, color_names: list) -> Dict:
        """Convert color names to specific RGB/HEX values"""
        color_values = {
            # Reds
            'blood_red': {'hex': '#8B0000', 'rgb': (139, 0, 0)},
            'red': {'hex': '#DC143C', 'rgb': (220, 20, 60)},
            'burgundy': {'hex': '#800020', 'rgb': (128, 0, 32)},
            'rose': {'hex': '#E3879E', 'rgb': (227, 135, 158)},
            
            # Blues
            'navy': {'hex': '#000080', 'rgb': (0, 0, 128)},
            'deep_blue': {'hex': '#00008B', 'rgb': (0, 0, 139)},
            'midnight_blue': {'hex': '#191970', 'rgb': (25, 25, 112)},
            'sky_blue': {'hex': '#87CEEB', 'rgb': (135, 206, 235)},
            'cyan': {'hex': '#00CED1', 'rgb': (0, 206, 209)},
            'electric_blue': {'hex': '#0892D0', 'rgb': (8, 146, 208)},
            
            # Greens
            'forest_green': {'hex': '#228B22', 'rgb': (34, 139, 34)},
            'emerald': {'hex': '#50C878', 'rgb': (80, 200, 120)},
            'sage': {'hex': '#9DC183', 'rgb': (157, 193, 131)},
            
            # Purples
            'purple': {'hex': '#800080', 'rgb': (128, 0, 128)},
            'deep_purple': {'hex': '#4B0082', 'rgb': (75, 0, 130)},
            
            # Yellows/Golds
            'gold': {'hex': '#FFD700', 'rgb': (255, 215, 0)},
            'golden_yellow': {'hex': '#FFDF00', 'rgb': (255, 223, 0)},
            'bright_yellow': {'hex': '#FFFF00', 'rgb': (255, 255, 0)},
            
            # Neutrals
            'black': {'hex': '#000000', 'rgb': (0, 0, 0)},
            'white': {'hex': '#FFFFFF', 'rgb': (255, 255, 255)},
            'charcoal': {'hex': '#36454F', 'rgb': (54, 69, 79)},
            'gray': {'hex': '#808080', 'rgb': (128, 128, 128)},
            'ivory': {'hex': '#FFFFF0', 'rgb': (255, 255, 240)},
            'cream': {'hex': '#FFFDD0', 'rgb': (255, 253, 208)},
            
            # Browns
            'silver': {'hex': '#C0C0C0', 'rgb': (192, 192, 192)}
        }
        
        palette = []
        for color_name in color_names:
            if color_name in color_values:
                palette.append({
                    'name': color_name,
                    'hex': color_values[color_name]['hex'],
                    'rgb': color_values[color_name]['rgb']
                })
        
        # Return structure matching ColorScheme model: primary/accent as hex strings, mood as string
        if palette:
            primary_color = palette[0]
            accent_color = palette[1] if len(palette) > 1 else {'name': 'white', 'hex': '#FFFFFF', 'rgb': (255, 255, 255)}
            primary_name = primary_color['name']
            accent_name = accent_color['name']
        else:
            # Fallback to black/white if no colors matched
            primary_color = {'name': 'black', 'hex': '#000000', 'rgb': (0, 0, 0)}
            accent_color = {'name': 'white', 'hex': '#FFFFFF', 'rgb': (255, 255, 255)}
            primary_name = 'black'
            accent_name = 'white'
        
        return {
            'primary': primary_color['hex'],
            'accent': accent_color['hex'],
            'background': palette[2]['hex'] if len(palette) > 2 else None,
            'text': '#FFFFFF',  # Default white text
            'mood': f"{primary_name} with {accent_name} accent"
        }
    
    def _recommend_composition(self, analysis: Dict) -> str:
        """Recommend composition approach"""
        visual_approach = analysis['visual_approach']
        
        compositions = {
            'character': 'Center or rule-of-thirds character placement with strong eye-line. Leave top third clear for title. Use depth of field to create separation.',
            'location': 'Sweeping vista with clear focal point. Rule of thirds horizon line. Title space at top or bottom third. Create depth with foreground/background elements.',
            'icon': 'Central iconic element with negative space around it. Symmetrical or slightly off-center for interest. Bold, simple, readable at small size.',
            'typography': 'Text as primary visual element. Creative type manipulation. Background texture or subtle imagery. Strong hierarchy and contrast.'
        }
        
        return compositions.get(visual_approach, 'Balanced composition with clear focal point and hierarchy.')

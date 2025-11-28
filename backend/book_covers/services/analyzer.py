"""
Story Analyzer Service
Extracts design requirements from project/premise data
"""

from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


class StoryAnalyzer:
    """
    Analyzes story elements to extract book cover design requirements.
    Reads existing project data (premise, genre, themes) and maps to design specifications.
    """
    
    # Genre mapping with design characteristics
    GENRE_CHARACTERISTICS = {
        'romance': {
            'visual_approach': 'character',
            'color_warmth': 'warm',
            'typography_style': 'elegant',
            'common_elements': ['couples', 'embracing', 'romantic settings']
        },
        'thriller': {
            'visual_approach': 'character',
            'color_warmth': 'cool',
            'typography_style': 'bold',
            'common_elements': ['obscured faces', 'urban settings', 'shadows']
        },
        'mystery': {
            'visual_approach': 'icon',
            'color_warmth': 'cool',
            'typography_style': 'bold',
            'common_elements': ['symbolic objects', 'silhouettes', 'keys']
        },
        'fantasy': {
            'visual_approach': 'location',
            'color_warmth': 'varied',
            'typography_style': 'ornate',
            'common_elements': ['landscapes', 'magical items', 'creatures']
        },
        'science_fiction': {
            'visual_approach': 'location',
            'color_warmth': 'cool',
            'typography_style': 'modern',
            'common_elements': ['spaceships', 'planets', 'technology']
        },
        'horror': {
            'visual_approach': 'icon',
            'color_warmth': 'dark',
            'typography_style': 'unsettling',
            'common_elements': ['shadows', 'gothic elements', 'abandoned locations']
        },
        'literary_fiction': {
            'visual_approach': 'typography',
            'color_warmth': 'varied',
            'typography_style': 'sophisticated',
            'common_elements': ['abstract imagery', 'minimalist', 'artistic']
        },
        'non_fiction': {
            'visual_approach': 'typography',
            'color_warmth': 'varied',
            'typography_style': 'professional',
            'common_elements': ['symbolic imagery', 'clean design', 'author photo']
        }
    }
    
    # Tone to color scheme mapping
    TONE_COLORS = {
        'dark': ['black', 'deep_red', 'charcoal', 'navy'],
        'light': ['white', 'cream', 'sky_blue', 'rose'],
        'intense': ['blood_red', 'electric_blue', 'gold', 'black'],
        'suspenseful': ['midnight_blue', 'charcoal', 'blood_red', 'gold'],
        'mysterious': ['deep_purple', 'midnight_blue', 'forest_green', 'charcoal'],
        'romantic': ['rose', 'gold', 'burgundy', 'ivory'],
        'hopeful': ['sky_blue', 'gold', 'emerald', 'white'],
        'melancholic': ['gray', 'midnight_blue', 'purple', 'rose'],
        'tense': ['blood_red', 'charcoal', 'midnight_blue', 'gold'],
        'chilling': ['midnight_blue', 'charcoal', 'white', 'blood_red'],
        'resilient': ['gold', 'charcoal', 'emerald', 'midnight_blue'],
        'bleak': ['charcoal', 'gray', 'midnight_blue', 'blood_red']
    }
    
    def __init__(self):
        """Initialize the Story Analyzer"""
        logger.info("StoryAnalyzer initialized")
    
    async def analyze_text(self, manuscript_text: str) -> Dict:
        """
        Analyze raw manuscript text to extract design requirements (standalone mode).
        
        Uses AI to deeply analyze the manuscript for accurate genre, tone, themes,
        and visual elements suitable for book cover design.
        
        Args:
            manuscript_text: Raw text from manuscript file
        
        Returns:
            Dict with design requirements from AI analysis
        """
        logger.info(f"Analyzing manuscript text ({len(manuscript_text)} chars)")
        
        # Import AI service
        from services.ai_service import get_ai_service
        from models.schemas import AIConfig, AIProvider
        
        # Prepare manuscript sample for analysis
        # For very long manuscripts, analyze key sections
        sample_text = self._prepare_manuscript_sample(manuscript_text)
        
        # Create analysis prompt
        analysis_prompt = f"""Analyze this manuscript text to extract book cover design requirements.

MANUSCRIPT TEXT:
{sample_text}

Provide a detailed analysis in the following JSON format:
{{
    "genre": "Primary genre (Mystery, Romance, Fantasy, Science Fiction, Thriller, Horror, Literary Fiction, etc.)",
    "subgenre": "Specific subgenre if applicable (e.g., 'cozy mystery', 'dark romance', 'epic fantasy')",
    "tone": "Overall tone (dark, light, suspenseful, romantic, mysterious, hopeful, melancholic, intense, etc.)",
    "themes": ["List 3-5 major themes from the story"],
    "setting": "Primary setting description (e.g., 'Victorian London', 'space station', 'modern city')",
    "key_elements": ["List 3-5 key visual elements that could appear on the cover (objects, symbols, imagery)"],
    "mood": "Overall mood in 2-3 descriptive words",
    "time_period": "Time period if relevant (contemporary, historical, futuristic, etc.)",
    "protagonist_description": "Brief visual description of main character if relevant for cover"
}}

Focus on elements that would translate well to visual book cover design.
Be specific and avoid generic descriptions."""
        
        system_prompt = """You are an expert book cover designer and literary analyst. 
Your job is to analyze manuscripts and extract design-relevant information for creating compelling book covers.
Focus on genre conventions, visual atmosphere, key symbolic elements, and marketability.
Provide accurate, specific analysis based on the actual content."""
        
        try:
            # Use GPT-4o with 128K token context window for literary analysis
            ai_config = AIConfig(
                provider=AIProvider.OPENAI,
                model_name="gpt-4o",
                temperature=0.3,  # Lower temperature for more consistent analysis
                max_tokens=4000  # Increased for detailed analysis output
            )
            
            ai_service = get_ai_service()
            
            logger.info(f"Sending manuscript to GPT-4o ({len(sample_text)} characters)")
            
            result = await ai_service.generate_text(
                prompt=analysis_prompt,
                config=ai_config,
                system_prompt=system_prompt
            )
            
            # Parse JSON response
            import json
            content = result['content'].strip()
            
            # Extract JSON from markdown code blocks if present
            if '```json' in content:
                content = content.split('```json')[1].split('```')[0].strip()
            elif '```' in content:
                content = content.split('```')[1].split('```')[0].strip()
            
            analysis = json.loads(content)
            
            logger.info(f"AI Analysis complete - Genre: {analysis.get('genre')}, Tone: {analysis.get('tone')}")
            return analysis
            
        except Exception as e:
            logger.error(f"Error during AI analysis: {e}", exc_info=True)
            # Fallback to basic keyword analysis
            logger.warning("Falling back to keyword-based analysis")
            return self._fallback_keyword_analysis(manuscript_text)
    
    def _prepare_manuscript_sample(self, manuscript_text: str, max_chars: int = 400000) -> str:
        """
        Prepare manuscript text for AI analysis using full context window.
        GPT-4o supports 128K tokens (~400K characters).
        
        Args:
            manuscript_text: Full manuscript text
            max_chars: Maximum characters (default 400K for GPT-4o's context window)
        
        Returns:
            Full or trimmed manuscript text
        """
        total_length = len(manuscript_text)
        
        if total_length <= max_chars:
            logger.info(f"Using full manuscript: {total_length} characters")
            return manuscript_text
        
        # If exceeds limit, take beginning and end sections to capture narrative arc
        logger.warning(f"Manuscript exceeds {max_chars} chars, sampling beginning and end")
        half = max_chars // 2
        
        sample = f"""[BEGINNING - First {half} characters]
{manuscript_text[:half]}

[END - Last {half} characters]
{manuscript_text[-half:]}"""
        
        logger.info(f"Prepared manuscript sample: {len(sample)} chars from {total_length} total")
        return sample
    
    def _fallback_keyword_analysis(self, manuscript_text: str) -> Dict:
        """
        Fallback keyword-based analysis if AI fails.
        Returns basic analysis based on simple keyword matching.
        """
        logger.info("Using fallback keyword analysis")
        
        analysis = {
            'genre': 'General Fiction',
            'subgenre': None,
            'tone': 'engaging',
            'themes': ['compelling', 'engaging', 'captivating'],
            'setting': None,
            'key_elements': ['text', 'color', 'simplicity'],
            'mood': 'engaging, compelling'
        }
        
        # Simple keyword-based genre detection
        text_lower = manuscript_text.lower()
        if 'murder' in text_lower or 'detective' in text_lower or 'crime' in text_lower:
            analysis['genre'] = 'Mystery'
            analysis['tone'] = 'suspenseful'
            analysis['themes'] = ['mystery', 'suspense', 'investigation']
            analysis['key_elements'] = ['shadows', 'urban', 'silhouettes']
        elif 'love' in text_lower or 'romance' in text_lower or 'heart' in text_lower:
            analysis['genre'] = 'Romance'
            analysis['tone'] = 'romantic'
            analysis['themes'] = ['love', 'passion', 'romance']
            analysis['key_elements'] = ['couples', 'embracing', 'hearts']
        elif 'magic' in text_lower or 'wizard' in text_lower or 'dragon' in text_lower:
            analysis['genre'] = 'Fantasy'
            analysis['tone'] = 'magical'
            analysis['themes'] = ['magic', 'adventure', 'quest']
            analysis['key_elements'] = ['magical items', 'landscapes', 'fantasy creatures']
        elif 'space' in text_lower or 'alien' in text_lower or 'robot' in text_lower:
            analysis['genre'] = 'Science Fiction'
            analysis['tone'] = 'futuristic'
            analysis['themes'] = ['technology', 'future', 'exploration']
            analysis['key_elements'] = ['spaceships', 'planets', 'technology']
        
        return analysis
    
    async def analyze_project(self, project_data: Dict) -> Dict:
        """
        Analyze project data to extract design requirements.
        
        Args:
            project_data: Dictionary containing project information
                - genre (str): Primary genre
                - premise (str): Story premise/description
                - themes (List[str]): Story themes
                - tone (str): Overall tone
                - setting (str): Story setting
                - characters (List): Main characters
        
        Returns:
            Dict with design requirements:
                - genre (str): Normalized genre
                - subgenre (str): Specific subgenre if identified
                - tone (str): Story tone
                - visual_approach (str): character/location/icon/typography
                - color_scheme (List[str]): Recommended colors
                - imagery_style (str): Style description
                - key_elements (List[str]): Important visual elements
                - mood_keywords (List[str]): Keywords for image generation
        """
        logger.info(f"Analyzing project: {project_data.get('title', 'Untitled')}")
        
        # Extract basic info
        genre = self._normalize_genre(project_data.get('genre', ''))
        premise = project_data.get('premise', '')
        themes = project_data.get('themes', [])
        tone = project_data.get('tone', 'neutral')
        setting = project_data.get('setting', '')
        
        # Get genre characteristics
        genre_char = self.GENRE_CHARACTERISTICS.get(genre, {})
        
        # Analyze tone and mood
        mood_keywords = self._extract_mood_keywords(premise, themes, tone)
        
        # Determine visual approach
        visual_approach = self._determine_visual_approach(
            genre, premise, setting, project_data.get('characters', [])
        )
        
        # Generate color scheme recommendations
        color_scheme = self._recommend_colors(genre, tone, themes)
        
        # Use provided key_elements if available (from AI manuscript analysis)
        # Otherwise extract from premise/setting/themes
        key_elements = project_data.get('key_elements', [])
        if not key_elements:
            key_elements = self._extract_key_elements(premise, setting, themes)
        
        # Determine imagery style
        imagery_style = self._determine_imagery_style(genre, tone)
        
        analysis = {
            'genre': genre,
            'subgenre': self._detect_subgenre(genre, themes, premise),
            'tone': tone,
            'visual_approach': visual_approach,
            'color_scheme': color_scheme,
            'imagery_style': imagery_style,
            'key_elements': key_elements,
            'mood_keywords': mood_keywords,
            'genre_characteristics': genre_char
        }
        
        logger.info(f"Analysis complete - Visual approach: {visual_approach}")
        return analysis
    
    def _normalize_genre(self, genre: str) -> str:
        """Normalize genre string to standard format"""
        genre_lower = genre.lower().strip()
        
        # Map common variations
        genre_map = {
            'sci-fi': 'science_fiction',
            'scifi': 'science_fiction',
            'sf': 'science_fiction',
            'lit fic': 'literary_fiction',
            'literary': 'literary_fiction',
            'rom': 'romance',
            'romantic': 'romance'
        }
        
        return genre_map.get(genre_lower, genre_lower.replace(' ', '_'))
    
    def _detect_subgenre(self, genre: str, themes: List[str], premise: str) -> Optional[str]:
        """Detect specific subgenre from themes and premise"""
        premise_lower = premise.lower()
        themes_lower = [t.lower() for t in themes]
        
        subgenre_keywords = {
            'romance': {
                'contemporary': ['modern', 'contemporary', 'today'],
                'historical': ['historical', 'regency', 'victorian', 'medieval'],
                'paranormal': ['vampire', 'werewolf', 'supernatural', 'paranormal'],
                'dark': ['dark romance', 'mafia', 'enemies']
            },
            'thriller': {
                'psychological': ['psychological', 'mind', 'mental', 'twisted'],
                'action': ['action', 'chase', 'explosion', 'fight'],
                'political': ['political', 'government', 'conspiracy'],
                'legal': ['lawyer', 'court', 'trial', 'legal']
            },
            'fantasy': {
                'epic': ['epic', 'quest', 'world', 'kingdom'],
                'urban': ['urban', 'city', 'modern', 'contemporary'],
                'dark': ['dark fantasy', 'grimdark', 'gothic'],
                'cozy': ['cozy', 'light', 'wholesome', 'comfort']
            }
        }
        
        if genre in subgenre_keywords:
            for subgenre, keywords in subgenre_keywords[genre].items():
                if any(kw in premise_lower or kw in ' '.join(themes_lower) for kw in keywords):
                    return subgenre
        
        return None
    
    def _extract_mood_keywords(self, premise: str, themes: List[str], tone: str) -> List[str]:
        """Extract mood keywords for image generation"""
        keywords = []
        
        # Parse tone - it might be comma-separated like "Suspenseful, intense, bleak"
        tone_parts = [t.strip().lower() for t in (tone or '').split(',')]
        keywords.extend(tone_parts)
        
        # Extract emotional keywords from premise
        emotion_keywords = [
            'dark', 'light', 'mysterious', 'romantic', 'intense', 'peaceful',
            'ominous', 'hopeful', 'melancholic', 'joyful', 'suspenseful',
            'dramatic', 'serene', 'chaotic', 'intimate', 'epic', 'bleak',
            'tense', 'chilling', 'resilient', 'harsh', 'cold', 'desolate'
        ]
        
        premise_lower = premise.lower()
        for keyword in emotion_keywords:
            if keyword in premise_lower:
                keywords.append(keyword)
        
        # Add relevant themes
        keywords.extend(themes[:3])  # Limit to top 3 themes
        
        return list(set(keywords))  # Remove duplicates
    
    def _determine_visual_approach(
        self, genre: str, premise: str, setting: str, characters: List
    ) -> str:
        """Determine best visual approach for the cover"""
        # Get default from genre
        default_approach = self.GENRE_CHARACTERISTICS.get(
            genre, {}
        ).get('visual_approach', 'icon')
        
        # Override based on strong indicators
        premise_lower = premise.lower()
        
        # Strong character focus
        if characters and len(characters) > 0:
            if any(word in premise_lower for word in ['protagonist', 'hero', 'heroine', 'character']):
                return 'character'
        
        # Strong setting focus
        if setting and any(word in premise_lower for word in ['world', 'kingdom', 'city', 'planet', 'realm']):
            return 'location'
        
        # Typography-led indicators
        if genre in ['literary_fiction', 'non_fiction']:
            return 'typography'
        
        return default_approach
    
    def _recommend_colors(self, genre: str, tone: str, themes: List[str]) -> List[str]:
        """Recommend color scheme based on genre, tone, and themes"""
        colors = []
        
        # Normalize genre to lowercase for matching
        genre_lower = genre.lower().replace(' ', '_')
        
        # Parse tone - it might be comma-separated like "Suspenseful, intense, hopeful"
        tone_parts = [t.strip().lower() for t in (tone or '').split(',')]
        
        # Check each tone word against TONE_COLORS
        for tone_word in tone_parts:
            tone_colors = self.TONE_COLORS.get(tone_word, [])
            if tone_colors:
                colors.extend(tone_colors[:2])  # Add top 2 tone colors
                break  # Found a match, stop looking
        
        # Add genre-specific color
        genre_colors = {
            'romance': ['rose', 'gold', 'burgundy'],
            'thriller': ['blood_red', 'charcoal', 'gold'],
            'survival_thriller': ['midnight_blue', 'charcoal', 'gold'],
            'christian_survival_thriller': ['midnight_blue', 'gold', 'charcoal'],
            'mystery': ['navy', 'charcoal', 'deep_blue'],
            'fantasy': ['purple', 'emerald', 'gold'],
            'science_fiction': ['cyan', 'silver', 'electric_blue'],
            'horror': ['black', 'blood_red', 'charcoal'],
            'literary_fiction': ['ivory', 'charcoal', 'sage'],
            'non_fiction': ['navy', 'white', 'charcoal']
        }
        
        # Try exact match first, then partial match
        matched_genre = None
        if genre_lower in genre_colors:
            matched_genre = genre_lower
        else:
            # Try partial matching for compound genres like "survival thriller"
            for key in genre_colors:
                if key in genre_lower or genre_lower in key:
                    matched_genre = key
                    break
            # If still no match, try base genre (first word)
            if not matched_genre:
                base_genre = genre_lower.split('_')[0].split(' ')[0]
                if base_genre in genre_colors:
                    matched_genre = base_genre
        
        if matched_genre:
            colors.extend(genre_colors[matched_genre][:2])
        else:
            # Default colors for unknown genres
            colors.extend(['charcoal', 'gold'])
        
        # Remove duplicates while preserving order
        seen = set()
        unique_colors = []
        for color in colors:
            if color not in seen:
                seen.add(color)
                unique_colors.append(color)
        
        return unique_colors[:4]  # Max 4 colors
    
    def _extract_key_elements(
        self, premise: str, setting: str, themes: List[str]
    ) -> List[str]:
        """Extract key visual elements from story details"""
        elements = []
        
        # Common visual element keywords
        element_keywords = {
            'objects': ['sword', 'book', 'ring', 'key', 'crown', 'weapon', 'artifact'],
            'nature': ['forest', 'mountain', 'ocean', 'desert', 'sky', 'stars', 'moon'],
            'architecture': ['castle', 'building', 'city', 'tower', 'bridge', 'ruins'],
            'abstract': ['shadow', 'light', 'darkness', 'mystery', 'secret']
        }
        
        text = f"{premise} {setting} {' '.join(themes)}".lower()
        
        for category, keywords in element_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    elements.append(keyword)
        
        return list(set(elements))[:5]  # Max 5 key elements
    
    def _determine_imagery_style(self, genre: str, tone: str) -> str:
        """Determine imagery style (photorealistic, illustrated, abstract, etc.)"""
        style_map = {
            'romance': 'photographic or stylized illustration',
            'thriller': 'photographic with high contrast',
            'mystery': 'atmospheric photography',
            'fantasy': 'detailed illustration or digital painting',
            'science_fiction': 'digital art or photorealistic CGI',
            'horror': 'dark photography or gothic illustration',
            'literary_fiction': 'artistic or abstract',
            'non_fiction': 'clean photography or symbolic imagery'
        }
        
        base_style = style_map.get(genre, 'photographic')
        
        # Modify based on tone
        if tone in ['dark', 'intense']:
            base_style += ', dramatic lighting'
        elif tone in ['light', 'hopeful']:
            base_style += ', bright and clean'
        
        return base_style

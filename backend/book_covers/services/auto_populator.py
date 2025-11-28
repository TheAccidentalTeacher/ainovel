"""
Auto-populate service for book cover designer.
Generates creative content and technical presets using AI.
"""

import os
from anthropic import Anthropic
from typing import Dict, Any, Optional
import json


class AutoPopulateService:
    """Service for auto-populating book cover designer fields using AI."""
    
    def __init__(self):
        self.anthropic = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    
    async def generate_auto_populate_data(
        self,
        project_title: str,
        project_premise: str,
        genre: Optional[str] = None,
        existing_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate auto-populate data for book cover designer.
        
        Args:
            project_title: The project title
            project_premise: The story premise/synopsis
            genre: Optional genre override
            existing_analysis: Optional existing story analysis data
            
        Returns:
            Dictionary containing:
            - title_text: AI-generated book title
            - author_text: AI-generated author name
            - title_alternatives: List of alternative titles
            - author_alternatives: List of alternative author names
            - genre_detected: Detected genre
            - mood_keywords: Mood/atmosphere keywords
            - color_recommendations: Color scheme suggestions
            - typography_suggestions: Font style recommendations
        """
        
        # Build context from existing analysis if available
        context = ""
        if existing_analysis:
            context = f"""
Existing Analysis:
- Genre: {existing_analysis.get('genre', 'Not specified')}
- Subgenre: {existing_analysis.get('subgenre', 'Not specified')}
- Tone: {existing_analysis.get('tone', 'Not specified')}
- Themes: {', '.join(existing_analysis.get('themes', []))}
- Visual Elements: {', '.join(existing_analysis.get('visual_elements', []))}
"""
        
        # Create prompt for Claude
        prompt = f"""You are an expert book cover designer and publishing consultant. Based on the following project information, generate creative and professional suggestions for a book cover.

Project Title: {project_title}

Project Premise:
{project_premise}

{context}

Genre Override: {genre if genre else "Use your best judgment"}

Please provide comprehensive suggestions in the following JSON format:

{{
  "title_text": "A compelling, marketable book title (2-5 words)",
  "author_text": "A professional author name (realistic pen name)",
  "title_alternatives": [
    "Alternative title option 1",
    "Alternative title option 2",
    "Alternative title option 3"
  ],
  "author_alternatives": [
    "Alternative author name 1",
    "Alternative author name 2",
    "Alternative author name 3"
  ],
  "genre_detected": "Primary genre",
  "subgenre_detected": "Specific subgenre",
  "mood_keywords": ["keyword1", "keyword2", "keyword3"],
  "color_recommendations": {{
    "primary": "#HEXCODE",
    "accent": "#HEXCODE",
    "background": "#HEXCODE",
    "rationale": "Why these colors work for this genre/mood"
  }},
  "typography_suggestions": {{
    "title_style": "Bold serif/sans-serif/decorative etc.",
    "author_style": "Clean sans-serif/elegant serif etc.",
    "rationale": "Why these typography choices work"
  }},
  "visual_approach": "character-focused/iconography/typography-led/location-based",
  "key_visual_elements": ["element1", "element2", "element3"],
  "target_market": "Who would buy this book",
  "comparable_titles": ["Similar Book 1", "Similar Book 2"],
  "marketing_angle": "Unique selling proposition for the cover"
}}

Guidelines:
- Title should be punchy, memorable, and genre-appropriate
- Author name should sound professional and match genre conventions
- Colors should follow genre conventions (e.g., romance: pinks/purples, thriller: dark blues/blacks)
- Consider current market trends for the genre
- Make the title commercial and discoverable
- Ensure all suggestions are publication-ready

Return ONLY the JSON object, no additional text."""

        try:
            # Call Claude API
            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=2000,
                temperature=0.7,  # Balanced creativity
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            
            # Extract JSON from response
            response_text = response.content[0].text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            # Parse JSON
            auto_populate_data = json.loads(response_text.strip())
            
            # Add metadata
            auto_populate_data["source"] = "claude-3-5-sonnet"
            auto_populate_data["timestamp"] = "auto-generated"
            
            return auto_populate_data
            
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Response text: {response_text}")
            
            # Return fallback data
            return self._generate_fallback_data(project_title, project_premise, genre)
            
        except Exception as e:
            print(f"Error generating auto-populate data: {e}")
            
            # Return fallback data
            return self._generate_fallback_data(project_title, project_premise, genre)
    
    def _generate_fallback_data(
        self,
        project_title: str,
        project_premise: str,
        genre: Optional[str]
    ) -> Dict[str, Any]:
        """
        Generate basic fallback data if AI call fails.
        
        Args:
            project_title: Project title
            project_premise: Story premise
            genre: Genre if specified
            
        Returns:
            Basic auto-populate data dictionary
        """
        
        # Use project title as book title
        title_text = project_title if project_title else "Untitled Novel"
        
        # Generate simple alternatives
        title_alternatives = [
            f"{title_text}: The Beginning",
            f"The {title_text} Chronicles",
            f"{title_text} Unveiled"
        ]
        
        # Generic author names by genre
        genre_authors = {
            "romance": ["Emma Rose", "Sophia Sterling", "Isabella Hart"],
            "thriller": ["Michael Cross", "Alex Hunter", "James Ryder"],
            "fantasy": ["L.K. Moonweaver", "Aria Starlight", "Rowan Silvercrest"],
            "science fiction": ["Dr. Nova Kane", "C.L. Sterling", "Max Quantum"],
            "horror": ["Rachel Graves", "Victor Shadows", "Morgan Darkwood"],
            "mystery": ["Claire Detective", "Sam Noir", "Quinn Mystery"]
        }
        
        # Default author options
        author_options = genre_authors.get(
            genre.lower() if genre else "mystery",
            ["J.K. Author", "A.M. Writer", "S.R. Novelist"]
        )
        
        # Genre-based color schemes
        genre_colors = {
            "romance": {"primary": "#FF6B9D", "accent": "#FFD93D", "background": "#FFE5EC"},
            "thriller": {"primary": "#1A1A2E", "accent": "#E94560", "background": "#16213E"},
            "fantasy": {"primary": "#4A148C", "accent": "#FFD700", "background": "#1A237E"},
            "science fiction": {"primary": "#0A2463", "accent": "#00D9FF", "background": "#1E1E2E"},
            "horror": {"primary": "#000000", "accent": "#8B0000", "background": "#1C1C1C"},
            "mystery": {"primary": "#2C3E50", "accent": "#F39C12", "background": "#34495E"}
        }
        
        colors = genre_colors.get(
            genre.lower() if genre else "mystery",
            {"primary": "#333333", "accent": "#0066CC", "background": "#F5F5F5"}
        )
        
        return {
            "title_text": title_text,
            "author_text": author_options[0],
            "title_alternatives": title_alternatives,
            "author_alternatives": author_options,
            "genre_detected": genre if genre else "General Fiction",
            "subgenre_detected": "General",
            "mood_keywords": ["engaging", "compelling", "captivating"],
            "color_recommendations": {
                **colors,
                "rationale": f"Genre-appropriate color scheme for {genre if genre else 'general fiction'}"
            },
            "typography_suggestions": {
                "title_style": "Bold serif",
                "author_style": "Clean sans-serif",
                "rationale": "Professional and readable"
            },
            "visual_approach": "typography-led",
            "key_visual_elements": ["text", "color", "simplicity"],
            "target_market": "General readers",
            "comparable_titles": ["Market Leader 1", "Market Leader 2"],
            "marketing_angle": "A compelling new story",
            "source": "fallback",
            "timestamp": "auto-generated"
        }
    
    def get_preset_by_genre(self, genre: str) -> Dict[str, Any]:
        """
        Get technical presets for a specific genre.
        
        Args:
            genre: The genre name
            
        Returns:
            Dictionary with preset values for image generation and typography
        """
        
        presets = {
            "romance": {
                "image_style": "vivid",
                "image_quality": "hd",
                "color_scheme": {
                    "primary": "#FF6B9D",
                    "accent": "#FFD93D",
                    "background": "#FFE5EC"
                },
                "typography": {
                    "title_font": "Playfair Display",
                    "author_font": "Lato",
                    "title_weight": "bold"
                },
                "visual_keywords": ["romantic", "warm", "intimate", "emotional"]
            },
            "thriller": {
                "image_style": "natural",
                "image_quality": "hd",
                "color_scheme": {
                    "primary": "#1A1A2E",
                    "accent": "#E94560",
                    "background": "#16213E"
                },
                "typography": {
                    "title_font": "Oswald",
                    "author_font": "Roboto",
                    "title_weight": "bold"
                },
                "visual_keywords": ["dark", "tense", "mysterious", "suspenseful"]
            },
            "fantasy": {
                "image_style": "vivid",
                "image_quality": "hd",
                "color_scheme": {
                    "primary": "#4A148C",
                    "accent": "#FFD700",
                    "background": "#1A237E"
                },
                "typography": {
                    "title_font": "Cinzel",
                    "author_font": "Lora",
                    "title_weight": "bold"
                },
                "visual_keywords": ["magical", "epic", "fantastical", "mystical"]
            },
            "science fiction": {
                "image_style": "natural",
                "image_quality": "hd",
                "color_scheme": {
                    "primary": "#0A2463",
                    "accent": "#00D9FF",
                    "background": "#1E1E2E"
                },
                "typography": {
                    "title_font": "Orbitron",
                    "author_font": "Exo 2",
                    "title_weight": "bold"
                },
                "visual_keywords": ["futuristic", "technological", "alien", "cosmic"]
            },
            "horror": {
                "image_style": "natural",
                "image_quality": "hd",
                "color_scheme": {
                    "primary": "#000000",
                    "accent": "#8B0000",
                    "background": "#1C1C1C"
                },
                "typography": {
                    "title_font": "Creepster",
                    "author_font": "Roboto Condensed",
                    "title_weight": "bold"
                },
                "visual_keywords": ["dark", "terrifying", "ominous", "haunting"]
            },
            "mystery": {
                "image_style": "natural",
                "image_quality": "standard",
                "color_scheme": {
                    "primary": "#2C3E50",
                    "accent": "#F39C12",
                    "background": "#34495E"
                },
                "typography": {
                    "title_font": "Merriweather",
                    "author_font": "Open Sans",
                    "title_weight": "bold"
                },
                "visual_keywords": ["mysterious", "intriguing", "enigmatic", "shadowy"]
            }
        }
        
        # Return genre preset or default
        return presets.get(
            genre.lower(),
            {
                "image_style": "natural",
                "image_quality": "standard",
                "color_scheme": {
                    "primary": "#333333",
                    "accent": "#0066CC",
                    "background": "#F5F5F5"
                },
                "typography": {
                    "title_font": "Roboto",
                    "author_font": "Open Sans",
                    "title_weight": "bold"
                },
                "visual_keywords": ["professional", "clean", "readable"]
            }
        )

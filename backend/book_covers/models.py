"""
Database models for book cover generation.

These models are completely isolated and don't affect existing tables.
No foreign key constraints initially - just stores project_id as string.
"""

from datetime import datetime
from typing import Optional, Dict, List
from uuid import uuid4

from pydantic import BaseModel, Field


class ColorScheme(BaseModel):
    """Color scheme for book cover design."""
    primary: str = Field(..., description="Primary color (hex)")
    accent: str = Field(..., description="Accent color (hex)")
    background: Optional[str] = Field(None, description="Background color (hex)")
    text: Optional[str] = Field(None, description="Text color (hex)")
    mood: str = Field(..., description="Mood description")


class TypographyRecommendation(BaseModel):
    """Typography recommendations for book cover."""
    title_font: str = Field(..., description="Recommended font for title")
    author_font: str = Field(..., description="Recommended font for author name")
    style: str = Field(..., description="Typography style description")
    hierarchy: str = Field(..., description="Hierarchy notes")


class DesignBrief(BaseModel):
    """AI-generated design brief for book cover."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str = Field(..., description="Associated project ID")
    
    # Analysis Results
    genre: str = Field(..., description="Detected genre")
    subgenre: Optional[str] = Field(None, description="Detected subgenre")
    tone: str = Field(..., description="Story tone")
    visual_approach: str = Field(..., description="Visual approach (Character/Location/Icon/Typography)")
    
    # Design Specifications
    color_scheme: ColorScheme
    imagery_style: str = Field(..., description="Imagery style description")
    composition: str = Field(..., description="Composition description")
    typography_recommendations: TypographyRecommendation
    reference_covers: List[str] = Field(default_factory=list, description="Reference cover descriptions")
    
    # AI Generation
    dalle_prompt: str = Field(..., description="Generated DALL-E 3 prompt")
    generation_params: Dict = Field(default_factory=dict, description="Generation parameters")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "genre": "Psychological Thriller",
                "tone": "Dark, suspenseful, mysterious",
                "visual_approach": "Iconography",
                "color_scheme": {
                    "primary": "#1a1a2e",
                    "accent": "#f4d03f",
                    "mood": "Dark with tension-building yellow accent"
                },
                "imagery_style": "Minimalist, high-contrast silhouette",
                "composition": "Centered figure, obscured face, walking away"
            }
        }


class TextPosition(BaseModel):
    """Text position and styling."""
    x: int
    y: int
    width: int
    height: int
    font_size: int
    font_family: str
    color: str
    effects: Dict = Field(default_factory=dict)


class CoverIteration(BaseModel):
    """A single iteration/variation of a book cover."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    book_cover_id: str = Field(..., description="Parent book cover ID")
    
    # Generation Info
    image_url: str = Field(..., description="Generated image URL")
    prompt_used: str = Field(..., description="Prompt used for generation")
    variation_number: int = Field(..., description="Variation number")
    metadata: Dict = Field(default_factory=dict, description="Generation metadata")
    
    # User Feedback
    user_rating: Optional[int] = Field(None, ge=1, le=5, description="User rating (1-5 stars)")
    notes: Optional[str] = Field(None, description="User notes")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)


class BookCover(BaseModel):
    """Main book cover entity."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str = Field(..., description="Associated project ID (no FK constraint)")
    design_brief_id: Optional[str] = Field(None, description="Associated design brief ID")
    
    # Generated Assets
    base_image_url: Optional[str] = Field(None, description="Base generated image URL")
    final_image_url: Optional[str] = Field(None, description="Final cover with typography URL")
    mockup_url: Optional[str] = Field(None, description="3D mockup URL")
    
    # Configuration
    selected_font: Optional[str] = Field(None, description="Selected font family")
    title_position: Optional[TextPosition] = Field(None, description="Title text configuration")
    author_position: Optional[TextPosition] = Field(None, description="Author text configuration")
    
    # Metadata
    genre: Optional[str] = Field(None, description="Genre")
    color_scheme: Optional[ColorScheme] = Field(None, description="Color scheme")
    status: str = Field(default="draft", description="Status: draft, finalized")
    version: int = Field(default=1, description="Version number")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "genre": "Psychological Thriller",
                "status": "draft",
                "version": 1
            }
        }

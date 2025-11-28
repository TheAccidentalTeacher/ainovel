"""
API request/response schemas for book cover generation.

These schemas define the API contract between frontend and backend.
"""

from datetime import datetime
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

from .models import ColorScheme, TypographyRecommendation, TextPosition


# ============================================================================
# STORY ANALYSIS
# ============================================================================

class StoryAnalysisRequest(BaseModel):
    """Request to analyze a story for cover design."""
    project_id: str = Field(..., description="Project ID to analyze")


class StoryAnalysisResponse(BaseModel):
    """Story analysis results."""
    project_id: str
    genre: str
    subgenre: Optional[str]
    tone: str
    themes: List[str]
    setting: Optional[str]
    key_elements: List[str]
    mood: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "genre": "Psychological Thriller",
                "subgenre": "Domestic Suspense",
                "tone": "Dark, tense, mysterious",
                "themes": ["betrayal", "paranoia", "identity"],
                "setting": "Modern suburban neighborhood",
                "key_elements": ["isolated woman", "unreliable narrator", "dark secrets"],
                "mood": "Suspenseful with underlying dread"
            }
        }


# ============================================================================
# DESIGN BRIEF
# ============================================================================

class DesignBriefRequest(BaseModel):
    """Request to generate design brief."""
    project_id: str = Field(..., description="Project ID")
    story_analysis: Optional[StoryAnalysisResponse] = Field(None, description="Pre-computed story analysis")


class DesignBriefResponse(BaseModel):
    """Generated design brief."""
    id: str
    project_id: str
    genre: str
    subgenre: Optional[str]
    tone: str
    visual_approach: str
    color_scheme: ColorScheme
    imagery_style: str
    composition: str
    typography_recommendations: TypographyRecommendation
    reference_covers: List[str]
    dalle_prompt: str
    created_at: datetime


# ============================================================================
# IMAGE GENERATION
# ============================================================================

class ImageGenerationRequest(BaseModel):
    """Request to generate cover image with DALL-E 3."""
    design_brief_id: str = Field(..., description="Design brief ID")
    custom_prompt: Optional[str] = Field(None, description="Optional custom prompt override")
    num_variations: int = Field(default=1, ge=1, le=4, description="Number of variations to generate")
    style: str = Field(default="vivid", description="Style: vivid or natural")
    quality: str = Field(default="standard", description="Quality: standard or hd")


class ImageGenerationResponse(BaseModel):
    """Generated image results."""
    book_cover_id: str
    iterations: List[Dict] = Field(..., description="List of generated iterations")
    status: str
    message: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_cover_id": "456e7890-e89b-12d3-a456-426614174111",
                "iterations": [
                    {
                        "id": "789e0123-e89b-12d3-a456-426614174222",
                        "image_url": "https://storage.../cover_v1.png",
                        "variation_number": 1
                    }
                ],
                "status": "success"
            }
        }


# ============================================================================
# TYPOGRAPHY
# ============================================================================

class TypographyConfigRequest(BaseModel):
    """Request to add typography to cover."""
    book_cover_id: str = Field(..., description="Book cover ID")
    title_text: str = Field(..., description="Title text")
    author_text: str = Field(..., description="Author text")
    
    # Optional overrides
    title_font: Optional[str] = Field(None, description="Title font family")
    author_font: Optional[str] = Field(None, description="Author font family")
    title_color: Optional[str] = Field(None, description="Title color (hex)")
    author_color: Optional[str] = Field(None, description="Author color (hex)")
    
    # Auto-positioning
    auto_position: bool = Field(default=True, description="Auto-position text")
    
    # Manual positioning (if auto_position=False)
    title_position: Optional[TextPosition] = None
    author_position: Optional[TextPosition] = None


class TypographyConfigResponse(BaseModel):
    """Typography configuration results."""
    book_cover_id: str
    final_image_url: str
    title_position: TextPosition
    author_position: TextPosition
    status: str
    message: Optional[str] = None


# ============================================================================
# EXPORT
# ============================================================================

class ExportRequest(BaseModel):
    """Request to export cover in specific format."""
    book_cover_id: str = Field(..., description="Book cover ID")
    format: str = Field(..., description="Format: ebook_kdp, print_kdp, ingram_spark, custom")
    
    # For print formats
    spine_width: Optional[float] = Field(None, ge=0, description="Spine width in inches")
    page_count: Optional[int] = Field(None, ge=24, description="Page count")
    paper_type: Optional[str] = Field(None, description="Paper type: white, cream")
    
    # Custom dimensions
    custom_width: Optional[int] = Field(None, description="Custom width in pixels")
    custom_height: Optional[int] = Field(None, description="Custom height in pixels")
    dpi: int = Field(default=300, description="DPI for export")


class ExportResponse(BaseModel):
    """Export results."""
    book_cover_id: str
    format: str
    file_url: str
    file_size_bytes: int
    dimensions: Dict[str, int]
    dpi: int
    status: str
    message: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "book_cover_id": "456e7890-e89b-12d3-a456-426614174111",
                "format": "ebook_kdp",
                "file_url": "https://storage.../cover_ebook_1600x2560.jpg",
                "file_size_bytes": 2456789,
                "dimensions": {"width": 1600, "height": 2560},
                "dpi": 300,
                "status": "success"
            }
        }


# ============================================================================
# COVER CRUD
# ============================================================================

class BookCoverListResponse(BaseModel):
    """List of book covers for a project."""
    project_id: str
    covers: List[Dict]
    total: int


class BookCoverDetailResponse(BaseModel):
    """Detailed book cover information."""
    id: str
    project_id: str
    design_brief_id: Optional[str]
    base_image_url: Optional[str]
    final_image_url: Optional[str]
    mockup_url: Optional[str]
    genre: Optional[str]
    color_scheme: Optional[ColorScheme]
    status: str
    version: int
    created_at: datetime
    updated_at: datetime
    
    # Related data
    design_brief: Optional[DesignBriefResponse] = None
    iterations: List[Dict] = Field(default_factory=list)


# ============================================================================
# AUTO-POPULATE
# ============================================================================

class AutoPopulateRequest(BaseModel):
    """Request to auto-populate cover designer fields."""
    genre_override: Optional[str] = Field(None, description="Override detected genre")
    use_existing_analysis: bool = Field(True, description="Use existing story analysis if available")


class AutoPopulateResponse(BaseModel):
    """Auto-populate data for book cover designer."""
    project_id: str
    title_text: str = Field(..., description="AI-generated book title")
    author_text: str = Field(..., description="AI-generated author name")
    title_alternatives: List[str] = Field(..., description="Alternative title options")
    author_alternatives: List[str] = Field(..., description="Alternative author name options")
    genre_detected: str = Field(..., description="Detected or specified genre")
    subgenre_detected: Optional[str] = Field(None, description="Specific subgenre")
    mood_keywords: List[str] = Field(..., description="Mood and atmosphere keywords")
    color_recommendations: Dict = Field(..., description="Recommended color scheme with rationale")
    typography_suggestions: Dict = Field(..., description="Typography style recommendations with rationale")
    visual_approach: str = Field(..., description="Recommended visual approach")
    key_visual_elements: List[str] = Field(..., description="Key elements to feature")
    target_market: str = Field(..., description="Target audience description")
    comparable_titles: List[str] = Field(..., description="Similar successful books")
    marketing_angle: str = Field(..., description="Unique selling proposition")
    technical_presets: Dict = Field(..., description="Technical presets for image generation")
    source: str = Field(..., description="Source of data (claude/fallback)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "project_id": "123e4567-e89b-12d3-a456-426614174000",
                "title_text": "Echoes of Yesterday",
                "author_text": "Sarah Mitchell",
                "title_alternatives": [
                    "The Memory Keeper",
                    "Whispers of Time",
                    "Yesterday's Echo"
                ],
                "author_alternatives": [
                    "S.M. Mitchell",
                    "Sarah M. Cross",
                    "S. Mitchell"
                ],
                "genre_detected": "Literary Fiction",
                "subgenre_detected": "Contemporary",
                "mood_keywords": ["contemplative", "nostalgic", "intimate"],
                "color_recommendations": {
                    "primary": "#2C3E50",
                    "accent": "#E8B4B8",
                    "background": "#F5E6D3",
                    "rationale": "Muted, sophisticated palette that conveys introspection and warmth"
                },
                "typography_suggestions": {
                    "title_style": "Elegant serif with generous letter spacing",
                    "author_style": "Clean sans-serif",
                    "rationale": "Sophisticated typography that appeals to literary fiction readers"
                },
                "visual_approach": "typography-led",
                "key_visual_elements": ["vintage photograph", "handwritten notes", "faded memories"],
                "target_market": "Literary fiction readers, ages 30-60, appreciates thoughtful prose",
                "comparable_titles": ["The Light We Lost", "Before We Were Yours"],
                "marketing_angle": "A poignant exploration of memory and identity",
                "technical_presets": {
                    "image_style": "natural",
                    "image_quality": "standard",
                    "color_scheme": {
                        "primary": "#2C3E50",
                        "accent": "#E8B4B8",
                        "background": "#F5E6D3"
                    },
                    "typography": {
                        "title_font": "Merriweather",
                        "author_font": "Open Sans",
                        "title_weight": "bold"
                    },
                    "visual_keywords": ["nostalgic", "intimate", "reflective"]
                },
                "source": "claude-3-5-sonnet"
            }
        }


# ============================================================================
# ERROR RESPONSES
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: Optional[str] = None
    status_code: int

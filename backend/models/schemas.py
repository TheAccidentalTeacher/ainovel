"""
Pydantic models for Projects, Premises, Outlines, Chapters, and Summaries.

These models define the schema for MongoDB documents and API request/response contracts.
Uses Pydantic v2 for validation and serialization.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class ProjectStatus(str, Enum):
    """Project lifecycle states."""
    DRAFT = "draft"
    PREMISE_READY = "premise_ready"
    STORY_BIBLE_READY = "story_bible_ready"
    OUTLINE_READY = "outline_ready"
    GENERATING = "generating"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"


class ChapterStatus(str, Enum):
    """Chapter generation states."""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    ERROR = "error"


class AIProvider(str, Enum):
    """Supported AI model providers."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


# ==================== Configuration Models ====================

class AIConfig(BaseModel):
    """
    AI generation configuration settings.
    
    Stores per-project or per-generation AI parameters with defaults
    pulled from application settings.
    """
    provider: AIProvider = Field(default=AIProvider.ANTHROPIC, description="AI provider")
    model_name: str = Field(default="claude-sonnet-4-20250514", description="Model identifier")
    temperature: float = Field(default=0.8, ge=0.0, le=2.0, description="Sampling temperature")
    max_tokens: int = Field(default=4096, ge=1, le=200000, description="Max tokens per request")
    top_p: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Nucleus sampling")
    frequency_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0)
    presence_penalty: Optional[float] = Field(default=None, ge=-2.0, le=2.0)
    stop_sequences: Optional[List[str]] = Field(default=None, description="Stop generation sequences")
    
    # Prompt template references
    outline_template: str = Field(default="default_outline", description="Outline generation template ID")
    chapter_template: str = Field(default="default_chapter", description="Chapter generation template ID")
    summary_template: str = Field(default="default_summary", description="Summarization template ID")
    
    # Context management
    summarization_threshold: int = Field(default=5, description="Start summarizing after N chapters")
    context_window_chapters: int = Field(default=5, description="Full chapters to include in context")


# ==================== Core Domain Models ====================

class Genre(BaseModel):
    """Genre metadata."""
    id: str = Field(default_factory=lambda: str(uuid4()), description="Unique genre ID")
    name: str = Field(..., description="Genre name")
    subgenres: List[str] = Field(default_factory=list, description="Available subgenres")
    description: Optional[str] = Field(None, description="Genre description")
    order: int = Field(default=999, description="Display order")


class Premise(BaseModel):
    """
    Novel premise submitted by user.
    
    Contains the core idea, setting, characters, themes - up to 5000 words.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Premise ID")
    project_id: str = Field(..., description="Parent project ID")
    genre: str = Field(..., description="Primary genre")
    subgenre: Optional[str] = Field(None, description="Subgenre if applicable")
    target_word_count: int = Field(..., ge=1000, le=250000, description="Target manuscript word count")
    target_chapter_count: int = Field(..., ge=1, le=100, description="Target number of chapters")
    content: str = Field(..., min_length=10, description="Premise text (up to 5000 words)")
    word_count: int = Field(0, description="Actual word count of premise")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @field_validator("content")
    @classmethod
    def validate_word_count(cls, v: str) -> str:
        """Validate premise does not exceed 5000 words."""
        words = len(v.split())
        if words > 5000:
            raise ValueError(f"Premise exceeds 5000 words (found {words} words)")
        return v
    
    def update_word_count(self) -> None:
        """Update word count based on content."""
        self.word_count = len(self.content.split())


class Character(BaseModel):
    """Detailed character profile for Story Bible."""
    id: str = Field(default_factory=lambda: str(uuid4()), description="Character ID")
    name: str = Field(..., description="Character full name")
    aliases: Optional[List[str]] = Field(default_factory=list, description="Alternate names, nicknames")
    age: Optional[str] = Field(None, description="Age or age range")
    physical_description: str = Field(default="", description="Detailed appearance")
    personality: str = Field(default="", description="Key personality traits")
    backstory: str = Field(default="", description="Character history and background")
    goals: str = Field(default="", description="Character motivations and goals")
    character_arc: str = Field(default="", description="How character changes throughout story")
    relationships: Dict[str, str] = Field(default_factory=dict, description="Relationships to other characters")
    quirks: str = Field(default="", description="Unique features, mannerisms, habits")
    role: str = Field(default="", description="Role in story (protagonist, antagonist, mentor, etc.)")
    
    # Enhanced fields for human-like writing
    practical_complications: str = Field(default="", description="How unusual traits affect daily life: custom furniture, modified clothing, environmental interactions, practical adaptations")
    sensory_signatures: str = Field(default="", description="Non-visual sensory details: scent, voice quality, texture of hands, sound of movement, distinctive sensory markers")
    internal_obstacles: str = Field(default="", description="Contradictory desires, past hurts, emotional blocks, psychological complexity, unresolved trauma")
    speech_patterns: str = Field(default="", description="Deflection habits, favorite evasions, inarticulate moments, how they avoid directness, verbal tics")


class Setting(BaseModel):
    """Location or setting for Story Bible."""
    id: str = Field(default_factory=lambda: str(uuid4()), description="Setting ID")
    name: str = Field(..., description="Location name")
    description: str = Field(default="", description="Detailed physical description")
    atmosphere: str = Field(default="", description="Mood, feeling, tone of location")
    significance: str = Field(default="", description="Why this location matters to the plot")
    special_features: str = Field(default="", description="Unique rules, properties, or elements")
    sensory_palette: List[str] = Field(default_factory=list, description="Specific multi-sensory details: distinctive smells, textures, sounds, tastes beyond visual description")


class StoryBible(BaseModel):
    """
    Complete Story Bible with characters, settings, themes, and plot structure.
    
    Generated from premise or manually created. Used as context for all AI generation.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Story Bible ID")
    project_id: str = Field(..., description="Parent project ID")
    
    # Core components
    characters: List[Character] = Field(default_factory=list, description="All characters")
    settings: List[Setting] = Field(default_factory=list, description="All locations")
    
    # Themes and tone
    themes: List[str] = Field(default_factory=list, description="Major themes")
    humor_style: str = Field(default="", description="Humor level and style notes")
    tone_notes: str = Field(default="", description="Overall tone, pacing, voice guidelines")
    genre_guidelines: str = Field(default="", description="Genre-specific elements and constraints")
    
    # Plot structure
    main_plot_arc: str = Field(default="", description="Primary story arc (beginning → end)")
    subplots: List[str] = Field(default_factory=list, description="B-story, C-story descriptions")
    key_milestones: List[str] = Field(default_factory=list, description="Major plot events")
    
    # Metadata
    version: int = Field(default=1, description="Story Bible version")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ChapterOutline(BaseModel):
    """
    Single chapter outline with structured context and prose summary.
    
    Combines structured data (characters, locations, events) with narrative prose.
    Total ~500 words: 200 structured + 300 prose.
    """
    chapter_index: int = Field(..., ge=1, description="Chapter number (1-indexed)")
    title: str = Field(..., min_length=1, description="Chapter title")
    
    # Structured context data (~200 words)
    opening_scene: str = Field(default="", description="Where/when chapter starts (50-100 words)")
    characters_present: List[str] = Field(default_factory=list, description="Character names in this chapter")
    locations: List[str] = Field(default_factory=list, description="Settings used in this chapter")
    plot_events: List[str] = Field(default_factory=list, description="Key events/actions (3-5 bullet points)")
    character_development: str = Field(default="", description="Emotional beats, relationship changes (50-100 words)")
    subplots_advanced: str = Field(default="", description="B-story, C-story progress (optional, ~50 words)")
    closing_scene: str = Field(default="", description="How chapter ends, hook/transition (50-100 words)")
    tone_notes: List[str] = Field(default_factory=list, description="Humor, tension, romance tags")
    
    # Prose summary (~300 words)
    summary_prose: str = Field(default="", description="Narrative chapter summary (300 words)")
    
    # Enhanced guidance for human-like writing
    imperfection_notes: str = Field(default="", description="Small disasters, awkward moments, failed attempts, things going slightly wrong in this chapter")
    sensory_focus: List[str] = Field(default_factory=list, description="Which senses to emphasize: smell, texture, sound, taste (guide non-visual sensory details)")
    conflict_complexity: str = Field(default="", description="Notes on which conflicts should NOT resolve cleanly, emotional messiness, unresolved tensions")
    
    # Target
    target_word_count: int = Field(default=3000, ge=100, description="Target words for this chapter")
    notes: Optional[str] = Field(None, description="Additional notes or instructions")


class Outline(BaseModel):
    """
    Complete chapter-by-chapter outline generated from premise.
    
    User can review and edit before starting manuscript generation.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Outline ID")
    project_id: str = Field(..., description="Parent project ID")
    chapters: List[ChapterOutline] = Field(default_factory=list, description="Chapter breakdown")
    total_target_words: int = Field(0, description="Sum of all chapter target word counts")
    ai_config: AIConfig = Field(default_factory=AIConfig, description="Config used for generation")
    generation_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadata: tokens, latency, model, prompt"
    )
    version: int = Field(default=1, description="Outline version number")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    def calculate_total_words(self) -> int:
        """Calculate total target word count from chapters."""
        return sum(ch.target_word_count for ch in self.chapters)


class Chapter(BaseModel):
    """
    Single generated chapter with full content and metadata.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Chapter ID")
    project_id: str = Field(..., description="Parent project ID")
    chapter_index: int = Field(..., ge=1, description="Chapter number")
    title: str = Field(..., description="Chapter title")
    content: str = Field(default="", description="Full chapter text")
    word_count: int = Field(0, description="Actual word count")
    status: ChapterStatus = Field(default=ChapterStatus.PENDING, description="Generation status")
    error_message: Optional[str] = Field(None, description="Error details if failed")
    ai_config: AIConfig = Field(default_factory=AIConfig, description="Config used for generation")
    generation_metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Metadata: tokens, latency, model, prompt hash"
    )
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(None, description="Timestamp when generation completed")
    
    def update_word_count(self) -> None:
        """Update word count based on content."""
        self.word_count = len(self.content.split())


class ChapterSummary(BaseModel):
    """
    Condensed summary of one or more chapters for context management.
    
    Used to reduce prompt size when generating later chapters.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Summary ID")
    project_id: str = Field(..., description="Parent project ID")
    chapter_range: str = Field(..., description="Range of chapters summarized (e.g., '1-5')")
    summary: str = Field(..., description="Condensed summary text")
    word_count: int = Field(0, description="Summary word count")
    ai_config: AIConfig = Field(default_factory=AIConfig, description="Config used for summarization")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Project(BaseModel):
    """
    Top-level project representing a novel in progress.
    
    Aggregates premise, outline, chapters, and tracks overall generation state.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Project ID")
    user_id: Optional[str] = Field(None, description="Owner user ID (for future multi-user)")
    title: str = Field(default="Untitled Novel", description="Project/book title")
    status: ProjectStatus = Field(default=ProjectStatus.DRAFT, description="Current project state")
    
    # References to nested documents
    premise_id: Optional[str] = Field(None, description="Active premise ID")
    story_bible_id: Optional[str] = Field(None, description="Active Story Bible ID")
    outline_id: Optional[str] = Field(None, description="Active outline ID")
    
    # Metadata
    genre: Optional[str] = Field(None, description="Primary genre")
    subgenre: Optional[str] = Field(None, description="Subgenre")
    total_chapters: int = Field(0, description="Total chapters planned")
    completed_chapters: int = Field(0, description="Chapters successfully generated")
    total_word_count: int = Field(0, description="Cumulative manuscript word count")
    
    # Configuration
    ai_config: AIConfig = Field(default_factory=AIConfig, description="Project AI configuration")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    generation_started_at: Optional[datetime] = Field(None)
    generation_completed_at: Optional[datetime] = Field(None)
    
    def update_progress(self, chapters: List[Chapter]) -> None:
        """Update project progress metrics based on chapters."""
        self.completed_chapters = sum(1 for ch in chapters if ch.status == ChapterStatus.COMPLETED)
        self.total_word_count = sum(ch.word_count for ch in chapters if ch.status == ChapterStatus.COMPLETED)
        self.updated_at = datetime.utcnow()


# ==================== API Request/Response Models ====================

class CreateProjectRequest(BaseModel):
    """Request to create a new project with premise."""
    title: Optional[str] = Field(None, description="Project title")
    genre: str = Field(..., description="Primary genre")
    subgenre: Optional[str] = Field(None, description="Subgenre")
    target_word_count: int = Field(..., ge=1000, le=250000)
    target_chapter_count: int = Field(..., ge=1, le=100)
    premise: str = Field(..., min_length=10, description="Premise content (up to 5000 words)")
    ai_config: Optional[AIConfig] = Field(None, description="Custom AI config")


class ProjectResponse(BaseModel):
    """Project response with embedded premise, story bible, and outline info."""
    project: Project
    premise: Optional[Premise] = None
    story_bible: Optional[StoryBible] = None
    outline: Optional[Outline] = None


class GenerateOutlineRequest(BaseModel):
    """Request to generate outline from premise."""
    project_id: str
    ai_config: Optional[AIConfig] = Field(None, description="Override AI config for this generation")


class UpdateOutlineRequest(BaseModel):
    """Request to update outline chapters."""
    chapters: List[ChapterOutline]


class StartGenerationRequest(BaseModel):
    """Request to start manuscript generation."""
    project_id: str
    outline_id: str
    ai_config: Optional[AIConfig] = Field(None, description="Override AI config")


class ChapterResponse(BaseModel):
    """Single chapter response."""
    chapter: Chapter


class ProjectListResponse(BaseModel):
    """List of projects."""
    projects: List[Project]
    total: int
    page: int
    page_size: int


class GenerateStoryBibleRequest(BaseModel):
    """Request to generate Story Bible from premise."""
    project_id: str
    ai_config: Optional[AIConfig] = Field(None, description="Override AI config for generation")


class UpdateStoryBibleRequest(BaseModel):
    """Request to update Story Bible."""
    characters: List[Character]
    settings: List[Setting]
    themes: List[str]
    humor_style: str
    tone_notes: str
    genre_guidelines: str
    main_plot_arc: str
    subplots: List[str]
    key_milestones: List[str]


class StoryBibleResponse(BaseModel):
    """Story Bible response."""
    story_bible: StoryBible

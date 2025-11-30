"""
Pydantic models for the Guided Premise Builder.

These models represent the multi-step wizard for collecting structured premise details
with AI assistance before generating the final premium premise.
"""

from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any
from uuid import uuid4

from pydantic import BaseModel, Field


class BuilderSessionStatus(str, Enum):
    """Premise builder session lifecycle states."""
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class HeatLevel(str, Enum):
    """Romance heat level ratings."""
    SWEET = "sweet"  # Kissing only
    WARM = "warm"  # Closed-door intimacy implied
    HOT = "hot"  # Open-door sensual scenes
    STEAMY = "steamy"  # Explicit romantic content


class POVStyle(str, Enum):
    """Point of view options."""
    FIRST_PERSON_SINGLE = "first_person_single"
    FIRST_PERSON_MULTI = "first_person_multi"
    THIRD_PERSON_LIMITED = "third_person_limited"
    THIRD_PERSON_OMNISCIENT = "third_person_omniscient"
    ALTERNATING = "alternating"


class TenseStyle(str, Enum):
    """Narrative tense options."""
    PAST = "past"
    PRESENT = "present"


class PacingPreference(str, Enum):
    """Story pacing preferences."""
    FAST = "fast"  # Action-packed, quick scene changes
    MODERATE = "moderate"  # Balanced action and reflection
    SLOW = "slow"  # Contemplative, character-focused


# ==================== Step-Specific Profile Models ====================

class ProjectStub(BaseModel):
    """Step 0: Basic project identification."""
    title: str = Field(..., min_length=1, max_length=200, description="Project title")
    folder: Optional[str] = Field(None, max_length=100, description="Optional folder/series for organization")
    logline: Optional[str] = Field(None, max_length=25000, description="Story concept or elevator pitch")


class GenreProfile(BaseModel):
    """Step 1: Genre and audience selection."""
    primary_genre: str = Field(..., description="Main genre")
    secondary_genre: Optional[str] = Field(None, description="Optional blended genre")
    subgenres: List[str] = Field(default_factory=list, description="Specific subgenres within primary")
    audience_rating: str = Field(default="general", description="Age/content rating (general, YA, adult)")
    
    # AI-generated suggestions stored for reference
    suggested_tropes: List[str] = Field(default_factory=list, description="Common tropes for selected genres")


class ToneThemeProfile(BaseModel):
    """Step 2: Tone, themes, and story atmosphere."""
    tone_adjectives: List[str] = Field(default_factory=list, description="Descriptive tone words (dark, hopeful, humorous, etc.)")
    darkness_level: int = Field(default=5, ge=1, le=10, description="1=lighthearted, 10=grimdark")
    humor_level: int = Field(default=5, ge=1, le=10, description="1=serious, 10=comedic")
    themes: List[str] = Field(default_factory=list, description="Major thematic elements")
    emotional_tone: Optional[str] = Field(None, max_length=2000, description="Overall emotional journey (e.g., 'despair to hope', 'innocence lost')")
    core_values: List[str] = Field(default_factory=list, description="Core values explored (justice, family, freedom, etc.)")
    central_question: Optional[str] = Field(None, max_length=2000, description="The big question the story explores (e.g., 'What makes us human?')")
    atmospheric_elements: List[str] = Field(default_factory=list, description="Atmosphere/mood descriptors (claustrophobic, whimsical, foreboding, etc.)")
    heat_level: Optional[HeatLevel] = Field(None, description="Romance heat level (if applicable)")


class CharacterSeed(BaseModel):
    """Single character seed for Step 3."""
    name: str = Field(..., description="Character name")
    role: str = Field(..., description="protagonist, antagonist, supporting, mentor, etc.")
    brief_description: str = Field(..., max_length=2000, description="Character description (can be expanded by AI)")
    goal: Optional[str] = Field(None, max_length=500, description="What they want")
    flaw: Optional[str] = Field(None, max_length=500, description="Internal obstacle or weakness")
    arc_notes: Optional[str] = Field(None, max_length=500, description="How they change")


class CharacterSeeds(BaseModel):
    """Step 3: Character collection."""
    protagonist: Optional[CharacterSeed] = Field(None, description="Main character")
    antagonist: Optional[CharacterSeed] = Field(None, description="Primary opposition")
    supporting_cast: List[CharacterSeed] = Field(default_factory=list, description="Secondary characters")


class PlotIntent(BaseModel):
    """Step 4: Plot expectations and structure."""
    # Core Conflict & Stakes
    primary_conflict: str = Field(..., max_length=2000, description="Central story problem/question")
    conflict_types: List[str] = Field(default_factory=list, description="Conflict categories (internal, interpersonal, societal, supernatural, etc.)")
    stakes: str = Field(..., max_length=1000, description="What's at risk if protagonist fails")
    stakes_layers: List[str] = Field(default_factory=list, description="Personal, relational, global stakes")
    
    # Three-Act Structure Points
    inciting_incident: Optional[str] = Field(None, max_length=1000, description="What kicks off the story")
    first_plot_point: Optional[str] = Field(None, max_length=1000, description="Point of no return / entering new world")
    midpoint_shift: Optional[str] = Field(None, max_length=1000, description="Major revelation or reversal that changes everything")
    second_plot_point: Optional[str] = Field(None, max_length=1000, description="All is lost moment / dark night of the soul")
    climax_confrontation: Optional[str] = Field(None, max_length=1000, description="Final confrontation/showdown")
    resolution: Optional[str] = Field(None, max_length=1000, description="How conflicts resolve and loose ends tie up")
    
    # Story Beats & Moments
    key_story_beats: List[str] = Field(default_factory=list, description="Major plot beats and turning points")
    emotional_beats: List[str] = Field(default_factory=list, description="Key emotional moments and character reactions")
    
    # Ending & Tone
    ending_vibe: str = Field(default="hopeful", description="How story ends emotionally (triumph, bittersweet, tragic, open, ambiguous)")
    final_image: Optional[str] = Field(None, max_length=500, description="The last scene/moment that closes the story")
    
    # Subplots & Threads
    romantic_subplot: Optional[str] = Field(None, max_length=1000, description="Romance thread if applicable")
    secondary_subplot: Optional[str] = Field(None, max_length=1000, description="B-story or secondary character arc")
    thematic_subplot: Optional[str] = Field(None, max_length=1000, description="Philosophical or thematic exploration thread")
    additional_subplots: List[str] = Field(default_factory=list, description="Other plot threads")
    
    # Twists & Surprises
    major_twists: List[str] = Field(default_factory=list, description="Plot twists and revelations")
    red_herrings: List[str] = Field(default_factory=list, description="Misdirections and false leads")
    
    # Pacing & Tension
    tension_escalation: Optional[str] = Field(None, max_length=1000, description="How tension builds throughout")
    pacing_notes: Optional[str] = Field(None, max_length=1000, description="Pacing strategy and rhythm")


class StructureTargets(BaseModel):
    """Step 5: Technical structure and format."""
    target_word_count: int = Field(..., ge=1000, le=250000, description="Total manuscript words")
    target_chapter_count: int = Field(..., ge=1, le=100, description="Number of chapters or acts")
    pov_style: POVStyle = Field(default=POVStyle.THIRD_PERSON_LIMITED, description="Narrative perspective")
    tense_style: TenseStyle = Field(default=TenseStyle.PAST, description="Narrative tense")
    pacing_preference: PacingPreference = Field(default=PacingPreference.MODERATE, description="Overall pacing")
    
    # Calculated fields (AI assists)
    average_chapter_length: Optional[int] = Field(None, description="Auto-calculated target words per chapter")


class ConstraintsProfile(BaseModel):
    """Step 6: Content constraints, tropes, and must-haves."""
    tropes_to_include: List[str] = Field(default_factory=list, description="Desired story tropes")
    tropes_to_avoid: List[str] = Field(default_factory=list, description="Tropes to explicitly exclude")
    content_warnings: List[str] = Field(default_factory=list, description="Sensitive content user wants to include/address")
    content_restrictions: List[str] = Field(default_factory=list, description="Content user wants to avoid (violence, profanity, etc.)")
    faith_elements: Optional[str] = Field(None, max_length=500, description="Religious/spiritual content guidance (Christian, inspirational, secular)")
    cultural_considerations: Optional[str] = Field(None, max_length=500, description="Cultural accuracy, sensitivity notes")
    must_have_scenes: List[str] = Field(default_factory=list, description="Specific scenes or moments that must appear")


class PremiseArtifact(BaseModel):
    """Generated premise artifact (baseline or premium)."""
    content: str = Field(..., description="Full premise text")
    word_count: int = Field(default=0, description="Word count of premise")
    model_used: str = Field(..., description="AI model that generated this")
    provider: str = Field(..., description="AI provider (openai, anthropic)")
    temperature: float = Field(default=0.8, description="Generation temperature")
    tokens_used: int = Field(default=0, description="Total tokens consumed")
    generation_time_seconds: float = Field(default=0.0, description="Time to generate")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Structured metadata extracted from premium premise
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="JSON metadata (key conflicts, promise, target metrics)"
    )


class StoryBibleArtifact(BaseModel):
    """
    Generated Story Bible - comprehensive narrative blueprint.
    
    Synthesizes all wizard data + premium premise + professional craft standards
    from 63-source research compilation. Designed to be 'so uber awesome that 
    novelists would be jealous of us.'
    """
    # Core Sections
    characters: str = Field(..., description="Deep character profiles with arcs, psychology, relationships, transformation")
    world: str = Field(..., description="Settings, rules, history, culture, worldbuilding details")
    themes: str = Field(..., description="Central questions, values, motifs, philosophical depth")
    plot: str = Field(..., description="Structure, beats, turning points, subplots, pacing strategy")
    style: str = Field(..., description="Voice, tone, POV, prose techniques, narrative approach")
    
    # Generation metadata
    total_word_count: int = Field(default=0, description="Combined word count of all sections")
    section_word_counts: Dict[str, int] = Field(
        default_factory=dict,
        description="Word count per section (characters, world, themes, plot, style)"
    )
    model_used: str = Field(..., description="AI model (Claude Sonnet 4.5 recommended)")
    provider: str = Field(..., description="AI provider (anthropic)")
    temperature: float = Field(default=0.85, description="Generation temperature")
    tokens_used: int = Field(default=0, description="Total tokens consumed")
    generation_time_seconds: float = Field(default=0.0, description="Time to generate")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Research integration tracking
    genre_frameworks_applied: List[str] = Field(
        default_factory=list,
        description="Genre-specific frameworks from research (e.g., 'Hero\'s Journey', 'Romance Beat Sheet')"
    )
    character_systems_applied: List[str] = Field(
        default_factory=list,
        description="Character frameworks used (e.g., 'Campbell Archetypes', 'Jung Psychology', 'Hauge Identity vs Desire')"
    )
    structure_system_used: str = Field(
        default="Three-Act Structure",
        description="Primary plot structure system applied"
    )


class PremiseRefinement(BaseModel):
    """Single refinement request in Step 7 or 8."""
    request: str = Field(..., description="User's modification request")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# ==================== Main Session Model ====================

class PremiseBuilderSession(BaseModel):
    """
    Complete premise builder session tracking all wizard steps.
    
    Persisted after each step for autosave/resume functionality.
    """
    id: str = Field(default_factory=lambda: str(uuid4()), description="Session ID")
    project_id: Optional[str] = Field(None, description="Associated project (if attaching to existing)")
    status: BuilderSessionStatus = Field(default=BuilderSessionStatus.IN_PROGRESS)
    current_step: int = Field(default=0, ge=0, le=8, description="Last completed step (0-8)")
    
    # Step data (None until completed)
    project_stub: Optional[ProjectStub] = None
    genre_profile: Optional[GenreProfile] = None
    tone_theme_profile: Optional[ToneThemeProfile] = None
    character_seeds: Optional[CharacterSeeds] = None
    plot_intent: Optional[PlotIntent] = None
    structure_targets: Optional[StructureTargets] = None
    constraints_profile: Optional[ConstraintsProfile] = None
    baseline_premise: Optional[PremiseArtifact] = None
    premium_premise: Optional[PremiseArtifact] = None
    story_bible: Optional[StoryBibleArtifact] = None
    
    # Iteration tracking
    refinement_history: List[PremiseRefinement] = Field(default_factory=list, description="Modification requests")
    
    # Metadata
    version: int = Field(default=1, description="Optimistic locking version")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ==================== API Request/Response Models ====================

class CreateBuilderSessionRequest(BaseModel):
    """Request to start a new premise builder session."""
    project_id: Optional[str] = Field(None, description="Attach to existing project or create new")
    title: Optional[str] = Field(None, description="Initial project title")


class UpdateBuilderStepRequest(BaseModel):
    """Generic request to update a specific step's data."""
    step: int = Field(..., ge=0, le=8, description="Step number being updated")
    data: Dict[str, Any] = Field(..., description="Step-specific data payload")


class AIAssistRequest(BaseModel):
    """Request lightweight AI assistance for current step."""
    action: str = Field(..., description="Specific AI action (e.g., 'expand_character', 'suggest_themes')")
    context: Dict[str, Any] = Field(default_factory=dict, description="Relevant context for AI")
    user_input: Optional[str] = Field(None, description="User's text input for AI to work with")


class AIAssistResponse(BaseModel):
    """Response from AI assistant."""
    suggestion: str = Field(..., description="AI-generated suggestion or expansion")
    alternatives: List[str] = Field(default_factory=list, description="Alternative suggestions")
    tokens_used: int = Field(default=0)


class GenerateBaselinePremiseRequest(BaseModel):
    """Request to synthesize baseline premise from collected steps (Step 7)."""
    refinement_prompt: Optional[str] = Field(None, description="User modification request")


class GeneratePremiumPremiseRequest(BaseModel):
    """Request to generate final premium premise (Step 8)."""
    refinement_prompt: Optional[str] = Field(None, description="Final modification request")


class CompleteBuilderSessionRequest(BaseModel):
    """Request to finalize session and persist premise to project."""
    accept_premium_premise: bool = Field(default=True, description="Use premium premise or manual override")
    manual_premise_override: Optional[str] = Field(None, description="User's manual premise if rejecting AI")


class BuilderSessionResponse(BaseModel):
    """Response containing full session state."""
    session: PremiseBuilderSession
    next_step: int = Field(..., description="Suggested next step number")
    can_generate_baseline: bool = Field(default=False, description="Whether baseline synthesis is available")
    can_generate_premium: bool = Field(default=False, description="Whether premium generation is available")
    can_complete: bool = Field(default=False, description="Whether session can be finalized")


class BuilderProgressSummary(BaseModel):
    """Summary of builder progress for dashboard."""
    session_id: str
    title: str
    current_step: int
    total_steps: int = Field(default=8)
    status: BuilderSessionStatus
    updated_at: datetime

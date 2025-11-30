"""
Premise Builder Story Bible Generation Service

Synthesizes comprehensive narrative blueprint from completed premise builder sessions.
This is the culmination of the 8-step guided wizard + 2000-word premium premise.

Based on 63-source research compilation (Tasks 1-7) documented in:
docs/RESEARCH_SOURCES_COMPILATION.md

Generates 5 core sections:
1. CHARACTERS - Deep profiles with arcs, psychology, relationships (800-1200 words)
2. WORLD - Settings, rules, history, culture (800-1200 words)
3. THEMES - Central questions, values, motifs (800-1200 words)
4. PLOT - Structure, beats, turning points, subplots (800-1200 words)
5. STYLE - Voice, tone, POV, prose techniques (800-1200 words)

Total target: 4000-6000 words of professional narrative blueprint.

Uses Claude Sonnet 4.5 for maximum quality and depth.
"""

import time
import structlog
from typing import Dict, Any, List

from anthropic import Anthropic
from config.settings import get_settings
from models.premise_builder import PremiseBuilderSession, StoryBibleArtifact

logger = structlog.get_logger(__name__)
settings = get_settings()


class PremiseBuilderStoryBibleService:
    """Generate comprehensive story bibles from completed premise builder sessions."""
    
    def __init__(self):
        self.anthropic = Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-20250514"  # Latest Claude Sonnet 4.5
        self.temperature = 0.85  # Creative but coherent
        self.max_tokens = 100000  # Claude Sonnet 4.5 supports up to 200K context - use maximum for comprehensive story bible
    
    async def generate_story_bible(
        self,
        session: PremiseBuilderSession
    ) -> StoryBibleArtifact:
        """
        Generate complete story bible from session data.
        
        Prerequisites:
        - Premium premise must exist
        - All wizard steps (0-6) must be completed
        
        Returns:
            StoryBibleArtifact with all 5 sections populated
        
        Raises:
            ValueError if prerequisites not met
        """
        # Validate prerequisites
        if not session.premium_premise:
            raise ValueError("Premium premise required before generating story bible")
        
        if session.current_step < 6:
            raise ValueError("All wizard steps must be completed before generating story bible")
        
        logger.info("story_bible_generation_started", session_id=session.id)
        start_time = time.time()
        
        try:
            # Build comprehensive context from all wizard data
            context = self._build_comprehensive_context(session)
            
            # Determine genre-specific frameworks to apply
            frameworks = self._determine_frameworks(session)
            
            # Generate all 5 sections
            sections = await self._generate_all_sections(context, frameworks)
            
            # Calculate metrics
            generation_time = time.time() - start_time
            total_tokens = sections["total_tokens"]
            section_word_counts = {
                "characters": len(sections["characters"].split()),
                "world": len(sections["world"].split()),
                "themes": len(sections["themes"].split()),
                "plot": len(sections["plot"].split()),
                "style": len(sections["style"].split())
            }
            total_word_count = sum(section_word_counts.values())
            
            # Create artifact
            story_bible = StoryBibleArtifact(
                characters=sections["characters"],
                world=sections["world"],
                themes=sections["themes"],
                plot=sections["plot"],
                style=sections["style"],
                total_word_count=total_word_count,
                section_word_counts=section_word_counts,
                model_used=self.model,
                provider="anthropic",
                temperature=self.temperature,
                tokens_used=total_tokens,
                generation_time_seconds=generation_time,
                genre_frameworks_applied=frameworks["genre_frameworks"],
                character_systems_applied=frameworks["character_systems"],
                structure_system_used=frameworks["structure_system"]
            )
            
            logger.info(
                "story_bible_generation_completed",
                session_id=session.id,
                total_word_count=total_word_count,
                generation_time_seconds=generation_time,
                tokens_used=total_tokens
            )
            
            return story_bible
            
        except Exception as e:
            logger.error(
                "story_bible_generation_failed",
                session_id=session.id,
                error=str(e),
                exc_info=True
            )
            raise
    
    def _build_comprehensive_context(self, session: PremiseBuilderSession) -> str:
        """
        Build complete context from all wizard steps + premium premise.
        
        This is the comprehensive synthesis that makes the story bible "uber awesome."
        """
        parts = []
        
        # Premium Premise (2000-word foundation)
        parts.append("=== PREMIUM PREMISE (2000-WORD SYNTHESIS) ===\n")
        parts.append(session.premium_premise.content)
        parts.append("\n\n")
        
        # Project Core
        if session.project_stub:
            ps = session.project_stub
            parts.append("=== PROJECT CORE ===\n")
            parts.append(f"Title: {ps.title}\n")
            if ps.folder:
                parts.append(f"Series/Folder: {ps.folder}\n")
            if ps.logline:
                parts.append(f"Logline: {ps.logline}\n")
            parts.append("\n")
        
        # Genre & Style
        if session.genre_profile:
            gp = session.genre_profile
            parts.append("=== GENRE & STYLE ===\n")
            parts.append(f"Primary Genre: {gp.primary_genre}\n")
            if gp.secondary_genre:
                parts.append(f"Secondary Genre: {gp.secondary_genre}\n")
            if gp.subgenres:
                parts.append(f"Subgenres: {', '.join(gp.subgenres)}\n")
            parts.append(f"Audience Rating: {gp.audience_rating}\n")
            if gp.suggested_tropes:
                parts.append(f"Genre Tropes: {', '.join(gp.suggested_tropes)}\n")
            parts.append("\n")
        
        # Tone & Themes
        if session.tone_theme_profile:
            ttp = session.tone_theme_profile
            parts.append("=== TONE & THEMES ===\n")
            if ttp.tone_adjectives:
                parts.append(f"Tone: {', '.join(ttp.tone_adjectives)}\n")
            parts.append(f"Darkness Level: {ttp.darkness_level}/10\n")
            parts.append(f"Humor Level: {ttp.humor_level}/10\n")
            if ttp.themes:
                parts.append(f"Major Themes: {', '.join(ttp.themes)}\n")
            if ttp.emotional_tone:
                parts.append(f"Emotional Journey: {ttp.emotional_tone}\n")
            if ttp.core_values:
                parts.append(f"Core Values: {', '.join(ttp.core_values)}\n")
            if ttp.central_question:
                parts.append(f"Central Question: {ttp.central_question}\n")
            if ttp.atmospheric_elements:
                parts.append(f"Atmosphere: {', '.join(ttp.atmospheric_elements)}\n")
            if ttp.heat_level:
                parts.append(f"Romance Heat Level: {ttp.heat_level.value}\n")
            parts.append("\n")
        
        # Characters
        if session.character_seeds:
            cs = session.character_seeds
            parts.append("=== CHARACTER SEEDS ===\n")
            if cs.protagonist:
                p = cs.protagonist
                parts.append(f"PROTAGONIST: {p.name}\n")
                parts.append(f"  Description: {p.brief_description}\n")
                if p.goal:
                    parts.append(f"  Goal: {p.goal}\n")
                if p.flaw:
                    parts.append(f"  Flaw: {p.flaw}\n")
                if p.arc_notes:
                    parts.append(f"  Arc: {p.arc_notes}\n")
                parts.append("\n")
            
            if cs.antagonist:
                a = cs.antagonist
                parts.append(f"ANTAGONIST: {a.name}\n")
                parts.append(f"  Description: {a.brief_description}\n")
                if a.goal:
                    parts.append(f"  Goal: {a.goal}\n")
                if a.flaw:
                    parts.append(f"  Flaw: {a.flaw}\n")
                if a.arc_notes:
                    parts.append(f"  Arc: {a.arc_notes}\n")
                parts.append("\n")
            
            if cs.supporting_cast:
                parts.append("SUPPORTING CAST:\n")
                for char in cs.supporting_cast:
                    parts.append(f"  {char.name} ({char.role}): {char.brief_description}\n")
                    if char.goal:
                        parts.append(f"    Goal: {char.goal}\n")
                    if char.flaw:
                        parts.append(f"    Flaw: {char.flaw}\n")
                parts.append("\n")
        
        # Plot Structure
        if session.plot_intent:
            pi = session.plot_intent
            parts.append("=== PLOT STRUCTURE ===\n")
            parts.append(f"Primary Conflict: {pi.primary_conflict}\n")
            if pi.conflict_types:
                parts.append(f"Conflict Types: {', '.join(pi.conflict_types)}\n")
            parts.append(f"Stakes: {pi.stakes}\n")
            if pi.stakes_layers:
                parts.append(f"Stakes Layers: {', '.join(pi.stakes_layers)}\n")
            parts.append("\n")
            
            parts.append("STORY BEATS:\n")
            if pi.inciting_incident:
                parts.append(f"  Inciting Incident: {pi.inciting_incident}\n")
            if pi.first_plot_point:
                parts.append(f"  First Plot Point: {pi.first_plot_point}\n")
            if pi.midpoint_shift:
                parts.append(f"  Midpoint: {pi.midpoint_shift}\n")
            if pi.second_plot_point:
                parts.append(f"  Second Plot Point: {pi.second_plot_point}\n")
            if pi.climax_confrontation:
                parts.append(f"  Climax: {pi.climax_confrontation}\n")
            if pi.resolution:
                parts.append(f"  Resolution: {pi.resolution}\n")
            parts.append("\n")
            
            if pi.key_story_beats:
                parts.append("KEY BEATS:\n")
                for beat in pi.key_story_beats:
                    parts.append(f"  - {beat}\n")
                parts.append("\n")
            
            if pi.emotional_beats:
                parts.append("EMOTIONAL BEATS:\n")
                for beat in pi.emotional_beats:
                    parts.append(f"  - {beat}\n")
                parts.append("\n")
            
            parts.append(f"Ending Vibe: {pi.ending_vibe}\n")
            if pi.final_image:
                parts.append(f"Final Image: {pi.final_image}\n")
            parts.append("\n")
            
            # Subplots
            if pi.romantic_subplot or pi.secondary_subplot or pi.thematic_subplot or pi.additional_subplots:
                parts.append("SUBPLOTS:\n")
                if pi.romantic_subplot:
                    parts.append(f"  Romantic: {pi.romantic_subplot}\n")
                if pi.secondary_subplot:
                    parts.append(f"  Secondary: {pi.secondary_subplot}\n")
                if pi.thematic_subplot:
                    parts.append(f"  Thematic: {pi.thematic_subplot}\n")
                for subplot in pi.additional_subplots:
                    parts.append(f"  Additional: {subplot}\n")
                parts.append("\n")
            
            # Twists & Red Herrings
            if pi.major_twists:
                parts.append("MAJOR TWISTS:\n")
                for twist in pi.major_twists:
                    parts.append(f"  - {twist}\n")
                parts.append("\n")
            
            if pi.red_herrings:
                parts.append("RED HERRINGS:\n")
                for herring in pi.red_herrings:
                    parts.append(f"  - {herring}\n")
                parts.append("\n")
            
            if pi.tension_escalation:
                parts.append(f"Tension Escalation: {pi.tension_escalation}\n")
            if pi.pacing_notes:
                parts.append(f"Pacing Notes: {pi.pacing_notes}\n")
            parts.append("\n")
        
        # Structure & Format
        if session.structure_targets:
            st = session.structure_targets
            parts.append("=== STRUCTURE & FORMAT ===\n")
            parts.append(f"Target Word Count: {st.target_word_count:,} words\n")
            parts.append(f"Target Chapters: {st.target_chapter_count}\n")
            parts.append(f"POV: {st.pov_style.value}\n")
            parts.append(f"Tense: {st.tense_style.value}\n")
            parts.append(f"Pacing: {st.pacing_preference.value}\n")
            if st.average_chapter_length:
                parts.append(f"Average Chapter Length: {st.average_chapter_length:,} words\n")
            parts.append("\n")
        
        # Content Guidelines (MUST RESPECT)
        if session.constraints_profile:
            cp = session.constraints_profile
            parts.append("=== CONTENT GUIDELINES (MUST RESPECT) ===\n")
            if cp.tropes_to_include:
                parts.append(f"Tropes to Include: {', '.join(cp.tropes_to_include)}\n")
            if cp.tropes_to_avoid:
                parts.append(f"Tropes to Avoid: {', '.join(cp.tropes_to_avoid)}\n")
            if cp.content_warnings:
                parts.append(f"Content Warnings: {', '.join(cp.content_warnings)}\n")
            if cp.content_restrictions:
                parts.append(f"Content Restrictions: {', '.join(cp.content_restrictions)}\n")
            if cp.faith_elements:
                parts.append(f"Faith Elements: {cp.faith_elements}\n")
            if cp.cultural_considerations:
                parts.append(f"Cultural Considerations: {cp.cultural_considerations}\n")
            if cp.must_have_scenes:
                parts.append("Must-Have Scenes:\n")
                for scene in cp.must_have_scenes:
                    parts.append(f"  - {scene}\n")
            parts.append("\n")
        
        return "".join(parts)
    
    def _determine_frameworks(self, session: PremiseBuilderSession) -> Dict[str, Any]:
        """
        Determine which research frameworks to apply based on genre and story type.
        
        Based on comprehensive research from 63 sources (Tasks 1-7) documented in:
        docs/RESEARCH_SOURCES_COMPILATION.md
        
        Applies genre-specific best practices from:
        - Task 1-5: 21 genre conventions
        - Task 6: 8 character development frameworks
        - Task 7: 8 plot structure systems
        """
        frameworks = {
            "genre_frameworks": [],
            "character_systems": [],
            "structure_system": "Three-Act Structure"  # Default
        }
        
        if not session.genre_profile:
            return frameworks
        
        primary = session.genre_profile.primary_genre.lower()
        secondary = session.genre_profile.secondary_genre.lower() if session.genre_profile.secondary_genre else None
        
        # Genre-specific frameworks (from Task 1-5 research)
        if "fantasy" in primary or "fantasy" in str(secondary):
            frameworks["genre_frameworks"].append("Hero's Journey (Campbell)")
            frameworks["structure_system"] = "Hero's Journey (17 stages)"
            frameworks["character_systems"].append("Campbell Archetypes")
            frameworks["character_systems"].append("Jung Shadow Integration")
        
        if "romance" in primary or "romance" in str(secondary):
            frameworks["genre_frameworks"].append("Romance Beat Sheet (Gold)")
            frameworks["genre_frameworks"].append("HEA/HFN Requirement")
            frameworks["character_systems"].append("Hauge Identity vs Desire")
            if "Journey" not in frameworks["structure_system"]:
                frameworks["structure_system"] = "Romance Beat Sheet over Three-Act"
        
        if "mystery" in primary or "thriller" in primary:
            frameworks["genre_frameworks"].append("Save the Cat (Snyder)")
            frameworks["genre_frameworks"].append("Story Engineering Pinch Points")
            frameworks["genre_frameworks"].append("Fair Play Rules (Mystery)")
            frameworks["structure_system"] = "Save the Cat (15 beats)"
        
        if "horror" in primary:
            frameworks["genre_frameworks"].append("Save the Cat (darkness emphasis)")
            frameworks["character_systems"].append("Victim → Survivor Arc")
        
        if "literary" in primary:
            frameworks["genre_frameworks"].append("Kishōtenketsu (contemplative option)")
            frameworks["character_systems"].append("Jung Deep Psychology")
            frameworks["character_systems"].append("Enneagram Complexity")
            frameworks["structure_system"] = "Flexible (Basic Beat Sheet or Kishōtenketsu)"
        
        if "young adult" in primary or "ya" in primary:
            frameworks["genre_frameworks"].append("Hero's Journey (coming-of-age)")
            frameworks["character_systems"].append("Identity Formation")
        
        # Universal character systems (Task 6)
        if "Campbell Archetypes" not in frameworks["character_systems"]:
            frameworks["character_systems"].append("Character Arc Types (Weiland)")
        
        frameworks["character_systems"].append("Voice Differentiation")
        frameworks["character_systems"].append("Show-Don't-Tell Balance")
        
        # Universal structure (Task 7)
        frameworks["genre_frameworks"].append("Scene-Sequel Pattern (Swain)")
        frameworks["genre_frameworks"].append("Linked/Chiastic Structure (Weiland)")
        
        return frameworks
    
    async def _generate_all_sections(
        self,
        context: str,
        frameworks: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate all 5 story bible sections using Claude Sonnet 4.5.
        
        Sections generated:
        1. CHARACTERS - Deep profiles with psychology, arcs, relationships
        2. WORLD - Settings, rules, history, culture
        3. THEMES - Central questions, values, motifs
        4. PLOT - Structure, beats, turning points, subplots
        5. STYLE - Voice, tone, POV, prose techniques
        
        Each section target: 800-1200 words
        Total target: 4000-6000 words
        """
        system_prompt = self._build_system_prompt(frameworks)
        user_prompt = self._build_user_prompt(context)
        
        try:
            response = self.anthropic.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=system_prompt,
                messages=[{
                    "role": "user",
                    "content": user_prompt
                }]
            )
            
            # Parse response into sections
            content = response.content[0].text
            sections = self._parse_sections(content)
            sections["total_tokens"] = response.usage.input_tokens + response.usage.output_tokens
            
            return sections
            
        except Exception as e:
            logger.error("claude_api_error", error=str(e), exc_info=True)
            raise
    
    def _build_system_prompt(self, frameworks: Dict[str, Any]) -> str:
        """Build system prompt incorporating research frameworks."""
        prompt = """You are an expert Story Bible architect for novelists. Your task is to create comprehensive, professional-quality story bibles that would make novelists jealous.

You have been trained on 63 authoritative sources covering:
- 21 genre conventions (fantasy, SF, mystery, thriller, romance, horror, literary, YA, historical, etc.)
- 8 character development frameworks (Campbell, Jung, Weiland arcs, Hauge identity-vs-desire, etc.)
- 8 plot structure systems (Three-Act, Hero's Journey, Save the Cat, Story Engineering, Scene-Sequel, Kishōtenketsu)
- Professional craft standards from MWA, RWA, SFWA, ITW, HWA, Authors Guild

Your story bible will synthesize:
1. All wizard data (8 steps of detailed planning)
2. 2000-word premium premise (comprehensive foundation)
3. Genre-specific best practices
4. Professional novelist standards

FRAMEWORKS TO APPLY FOR THIS STORY:
"""
        
        prompt += f"Structure System: {frameworks['structure_system']}\n"
        prompt += f"Genre Frameworks: {', '.join(frameworks['genre_frameworks'])}\n"
        prompt += f"Character Systems: {', '.join(frameworks['character_systems'])}\n\n"
        
        prompt += """Generate 5 comprehensive sections using these exact headers:

## 1. CHARACTERS

Deep character profiles including:
- Protagonist: Psychology (Jung functions), transformation arc (Weiland), goals/flaws, voice characteristics, relationships
- Antagonist: Motivations (understandable, not evil for evil's sake), methods, relationship to protagonist
- Supporting Cast: Function in story (mentor, ally, trickster), distinct voices, their own arcs
- Character Web: How relationships evolve throughout story
- Arc Integration: How internal change aligns with external plot beats

Apply relevant character frameworks and ensure each character is psychologically complex and distinct.

TARGET: 800-1200 words with deep psychological insight

## 2. WORLD

Comprehensive worldbuilding including:
- Primary Settings: Vivid locations with sensory details, symbolic significance
- Rules & Systems: Magic/technology/social systems with clear limitations and costs
- History: Backstory that informs present conflict
- Culture: Values, customs, social structures, power dynamics
- Atmosphere: Mood and tone of world (claustrophobic, whimsical, foreboding, etc.)

Ground fantasy/SF elements in internal logic. Historical fiction must reflect period authenticity.

TARGET: 800-1200 words with rich sensory detail

## 3. THEMES

Thematic depth including:
- Central Question: The big philosophical/moral question story explores
- Core Values: Values being tested or affirmed
- Motifs & Symbols: Recurring images/objects with symbolic weight
- Thematic Threads: How theme weaves through character arcs and plot
- Subtext: Deeper meanings beneath surface story
- Resolution: How theme is explored (not necessarily answered definitively)

Literary fiction prioritizes theme. Genre fiction uses theme to deepen entertainment.

TARGET: 800-1200 words with philosophical depth

## 4. PLOT

Structural blueprint including:
- Beat-by-Beat Breakdown: All major plot points with precise placement percentages
- Act Structure: Setup, confrontation, resolution with proper proportions
- Causality Chain: How each event leads logically to next (cause-effect)
- Subplots: Romantic, secondary character, thematic threads interwoven
- Pacing Strategy: Scene-Sequel rhythm, tension escalation, breathing room
- Turning Points: Reversals, revelations, escalations at key moments
- Climax: How dramatic question answers and character arc completes

Apply genre-appropriate structure while maintaining flexibility for creative execution.

TARGET: 800-1200 words with detailed beat breakdown

## 5. STYLE

Narrative approach including:
- Voice: Narrative personality (distinctive, consistent, appropriate to story)
- Tone: Emotional atmosphere (matches darkness/humor levels from wizard)
- POV Strategy: How chosen POV serves story, when perspective shifts occur
- Prose Techniques: Show-don't-tell balance, sensory detail emphasis, dialogue style
- Pacing: Sentence/paragraph rhythm, chapter structure, scene length variation
- Genre Style: Conventions specific to genre (cozy vs noir mystery, epic vs urban fantasy)

Ensure style serves story and character, not imposed externally.

TARGET: 800-1200 words with specific stylistic guidance

IMPORTANT GUIDELINES:
✓ Each section should be 800-1200 words (comprehensive depth)
✓ Reference specific details from wizard data (character names, settings, plot beats)
✓ Apply professional craft standards (not formulaic, but structurally sound)
✓ Integrate all 5 sections (characters drive plot, world reflects theme, style serves story)
✓ Honor all content guidelines and constraints from wizard
✓ Make it "so uber awesome that novelists would be jealous"

Write clearly, professionally, and with authority. This is a working document for a serious writer.
"""
        
        return prompt
    
    def _build_user_prompt(self, context: str) -> str:
        """Build user prompt with complete context."""
        return f"""Generate a comprehensive Story Bible for this project.

{context}

Create all 5 sections (CHARACTERS, WORLD, THEMES, PLOT, STYLE) with professional depth and integration. Each section 800-1200 words. Reference specific details from the wizard data above.

Begin with:
## 1. CHARACTERS
"""
    
    def _parse_sections(self, content: str) -> Dict[str, str]:
        """
        Parse Claude's response into 5 distinct sections.
        
        Expected format:
        ## 1. CHARACTERS
        [content]
        ## 2. WORLD
        [content]
        ## 3. THEMES
        [content]
        ## 4. PLOT
        [content]
        ## 5. STYLE
        [content]
        """
        sections = {
            "characters": "",
            "world": "",
            "themes": "",
            "plot": "",
            "style": ""
        }
        
        # Split on section headers
        parts = content.split("## ")
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            # Identify section
            if part.startswith("1. CHARACTERS"):
                sections["characters"] = part.replace("1. CHARACTERS", "").strip()
            elif part.startswith("2. WORLD"):
                sections["world"] = part.replace("2. WORLD", "").strip()
            elif part.startswith("3. THEMES"):
                sections["themes"] = part.replace("3. THEMES", "").strip()
            elif part.startswith("4. PLOT"):
                sections["plot"] = part.replace("4. PLOT", "").strip()
            elif part.startswith("5. STYLE"):
                sections["style"] = part.replace("5. STYLE", "").strip()
        
        # Fallback: if parsing failed, put everything in characters
        if not any(sections.values()):
            sections["characters"] = content
            logger.warning("section_parsing_failed_using_fallback")
        
        return sections


# Singleton instance
_premise_builder_story_bible_service = None


def get_premise_builder_story_bible_service() -> PremiseBuilderStoryBibleService:
    """Get or create singleton PremiseBuilderStoryBibleService instance."""
    global _premise_builder_story_bible_service
    if _premise_builder_story_bible_service is None:
        _premise_builder_story_bible_service = PremiseBuilderStoryBibleService()
    return _premise_builder_story_bible_service

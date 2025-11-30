"""
Story Bible Generation Service

Extracts structured Story Bible (characters, settings, themes, plot) from premise
using AI. Provides deep character profiles, setting details, and narrative structure.
"""

import json
import logging
from typing import Dict, Any, List

from models.schemas import (
    StoryBible,
    Character,
    Setting,
    Premise,
    AIConfig
)
from services.ai_service import get_ai_service

logger = logging.getLogger(__name__)


STORY_BIBLE_SYSTEM_PROMPT = """You are an expert narrative analyst and story development consultant. Your job is to extract comprehensive Story Bible information from a novel premise.

**Your Task:**
Parse the premise and extract:
1. **Characters**: All named characters with deep profiles (physical description, personality, backstory, goals, character arc, relationships, quirks, role)
2. **Settings**: All locations with detailed descriptions, atmosphere, significance, special features
3. **Themes**: Major themes present in the story
4. **Humor Style**: Description of humor level and style (if applicable)
5. **Tone Notes**: Overall tone, pacing, voice, POV guidelines
6. **Genre Guidelines**: Genre-specific elements and constraints
7. **Main Plot Arc**: Primary story arc from beginning to end
8. **Subplots**: Secondary storylines (B-story, C-story)
9. **Key Milestones**: Major plot events/turning points

**Format Requirements:**
- Be thorough and detailed - this Story Bible will be used to maintain consistency across the entire novel
- For characters: extract physical details, personality traits, backstory, motivations, arc, relationships
- For settings: vivid descriptions, mood/atmosphere, why they matter
- Extract exact names, ages, and details from the premise
- Maintain the tone and genre style of the original premise
- Return valid JSON matching the specified schema

**Response must be valid JSON only, no explanatory text.**"""


def create_story_bible_prompt(premise: Premise, expanded_premise: str = None, content_restrictions: list[str] = None, tropes_to_avoid: list[str] = None) -> str:
    """Create the story bible generation prompt with constraints and expanded premise."""
    
    constraints_section = ""
    if content_restrictions or tropes_to_avoid:
        constraints_section = "\n\n**CRITICAL CONSTRAINTS - MUST RESPECT:**\n"
        if content_restrictions:
            constraints_section += f"**Content to AVOID:** {', '.join(content_restrictions)}\n"
            constraints_section += "Do NOT add language suggesting these avoided topics should be 'handled tastefully' or 'addressed sensitively' - if the author wants to AVOID it, OMIT it entirely from the Story Bible.\n"
        if tropes_to_avoid:
            constraints_section += f"**Tropes to EXCLUDE:** {', '.join(tropes_to_avoid)}\n"
    
    # Use expanded premise if available, fallback to basic premise
    premise_content = expanded_premise if expanded_premise else premise.content
    premise_type = "EXPANDED PREMISE" if expanded_premise else "PREMISE"
    
    return f"""Generate a comprehensive Story Bible from this novel premise.

This Story Bible will be used directly for outline generation and chapter writing, so it must be thorough and detailed.
Target: 3500-4500 words total across all sections.
CRITICAL: Prioritize depth and richness in character development and plot structure. Ensure complete, valid JSON."""

**Genre:** {premise.genre}
**Subgenre:** {premise.subgenre or 'None'}
**Target Word Count:** {premise.target_word_count:,} words
**Target Chapters:** {premise.target_chapter_count}
{constraints_section}
**{premise_type}:**
{premise_content}

---

Extract and structure all Story Bible components. Return JSON with this exact structure:

{{
  "characters": [
    {{
      "name": "Full Character Name",
      "aliases": ["Nickname", "Alternate Name"],
      "age": "Age or range",
      "physical_description": "Detailed appearance with vivid sensory details (150-200 words)",
      "personality": "Deep personality profile with contradictions, strengths, flaws, fears (150-200 words)",
      "backstory": "Comprehensive character history and formative experiences (200-250 words)",
      "goals": "Layered motivations, conscious and unconscious desires, what drives them (100-150 words)",
      "character_arc": "Complete transformation arc from beginning through end, including setbacks (150-200 words)",
      "relationships": {{"Character Name": "relationship description"}},
      "quirks": "Unique features, mannerisms, habits, verbal tics (80-120 words)",
      "role": "protagonist/antagonist/love interest/mentor/supporting/etc",
      "practical_complications": "How unusual traits affect daily life: custom furniture, modified clothing, environmental interactions (80-120 words). Example for three-legged character: 'Custom three-legged stool at workbench, modified trousers, distinctive walking rhythm, children ask questions, needs wider doorways'",
      "sensory_signatures": "Non-visual sensory details: scent, voice, texture, sound of movement, distinctive sounds (80-120 words). Example: 'Voice has slight rasp, hands smell of sawdust and lemon oil, footsteps create three-beat rhythm, calloused hands'",
      "internal_obstacles": "Contradictory desires, past hurts, emotional blocks, psychological barriers (80-120 words). Example: 'Fears being seen as curiosity not person, wants love but expects rejection, struggles between pride and shame'",
      "speech_patterns": "Deflection habits, evasions, inarticulate moments, unique voice (80-120 words). Example: 'Changes subject when emotions run deep, uses humor to deflect, goes silent when hurt, says I should go when wants to stay'"
    }}
  ],
  "settings": [
    {{
      "name": "Location Name",
      "description": "Rich physical description with spatial layout and key features (150-200 words)",
      "atmosphere": "Mood, feeling, tone, emotional resonance (80-120 words)",
      "significance": "Why it matters to plot and characters, thematic connections (80-120 words)",
      "special_features": "Unique rules, properties, elements, hidden details (80-120 words)",
      "sensory_palette": ["sawdust smell", "lemon oil scent", "smooth wood texture", "rhythmic sanding sounds", "wood shavings underfoot", "temperature", "lighting quality"]
    }}
  ],
  "themes": ["Theme 1 with explanation", "Theme 2 with explanation", "Theme 3 with explanation"],
  "humor_style": "Detailed description of humor level, style, and examples (120-150 words)",
  "tone_notes": "Comprehensive tone guidelines: voice, pacing, POV, narrative distance, emotional register (150-200 words)",
  "genre_guidelines": "Genre-specific elements, conventions, and expectations to maintain (150-200 words)",
  "main_plot_arc": "Detailed primary story arc with all major turning points: beginning → inciting incident → rising action → midpoint → complications → climax → resolution (300-400 words)",
  "subplots": ["B-story description with arc (100-150 words)", "C-story description with arc (100-150 words)"],
  "key_milestones": ["Major event 1 (detailed)", "Major event 2 (detailed)", "Midpoint revelation", "Dark night of soul", "Climax", "Resolution"]
}}

Be thorough and detailed. This Story Bible will maintain consistency across the entire novel generation process.

**DEPTH STRATEGY:**
- Main characters (protagonist, antagonist, love interest): Use FULL word counts for all fields
- Supporting characters: Focus on 3-4 key fields (physical, personality, role, goals)
- Minor characters: Brief entries (50-100 words total)

**CRITICAL: You MUST return complete, valid JSON. Ensure all strings are properly closed and all brackets/braces are balanced. If approaching token limit, reduce detail on supporting characters but keep protagonist/antagonist comprehensive.**"""


async def generate_story_bible_from_premise(
    premise: Premise,
    ai_config: AIConfig,
    content_restrictions: list[str] = None,
    tropes_to_avoid: list[str] = None
) -> StoryBible:
    """
    Generate a Story Bible by analyzing the premise with AI.
    
    Args:
        premise: The novel premise to analyze
        ai_config: AI configuration for generation
        content_restrictions: Content the author wants to avoid (e.g., "sexual content", "violence")
        tropes_to_avoid: Story tropes to exclude
        
    Returns:
        StoryBible with extracted characters, settings, themes, plot structure
        
    Raises:
        ValueError: If AI response is invalid or parsing fails
        Exception: For AI service errors
    """
    logger.info(
        f"Generating Story Bible for premise_id={premise.id}, "
        f"model={ai_config.model_name}, "
        f"restrictions={content_restrictions}, tropes_to_avoid={tropes_to_avoid}"
    )
    
    # Claude Sonnet 4.5 supports up to 200K input context, 8K output tokens
    # Use 8K for comprehensive Story Bibles (4000-6000 words)
    # This feeds directly into outline generation
    ai_config.max_tokens = 8000
    
    # Create AI service
    ai_service = get_ai_service()
    
    # Build prompt with expanded premise if available
    expanded_premise = getattr(premise, 'expanded_content', None)
    system_prompt = STORY_BIBLE_SYSTEM_PROMPT
    user_prompt = create_story_bible_prompt(premise, expanded_premise, content_restrictions, tropes_to_avoid)
    
    logger.debug(f"System prompt length: {len(system_prompt)} chars")
    logger.debug(f"User prompt length: {len(user_prompt)} chars")
    
    # Call AI
    try:
        logger.info(f"Calling AI service with max_tokens={ai_config.max_tokens}, model={ai_config.model_name}")
        logger.info(f"User prompt length: {len(user_prompt)} chars")
        
        response_data = await ai_service.generate_text(
            prompt=user_prompt,
            config=ai_config,
            system_prompt=system_prompt
        )
        
        response_text = response_data["content"]
        
        logger.info(f"AI response received: {len(response_text)} chars")
        logger.debug(f"Raw AI response preview: {response_text[:500]}...")
        
        # Parse JSON response
        story_bible_data = parse_story_bible_json(response_text)
        
        # Create Character objects
        characters = [
            Character(
                name=char_data["name"],
                aliases=char_data.get("aliases", []),
                age=char_data.get("age"),
                physical_description=char_data.get("physical_description", ""),
                personality=char_data.get("personality", ""),
                backstory=char_data.get("backstory", ""),
                goals=char_data.get("goals", ""),
                character_arc=char_data.get("character_arc", ""),
                relationships=char_data.get("relationships", {}),
                quirks=char_data.get("quirks", ""),
                role=char_data.get("role", ""),
                practical_complications=char_data.get("practical_complications", ""),
                sensory_signatures=char_data.get("sensory_signatures", ""),
                internal_obstacles=char_data.get("internal_obstacles", ""),
                speech_patterns=char_data.get("speech_patterns", "")
            )
            for char_data in story_bible_data.get("characters", [])
        ]
        
        # Create Setting objects
        settings = [
            Setting(
                name=setting_data["name"],
                description=setting_data.get("description", ""),
                atmosphere=setting_data.get("atmosphere", ""),
                significance=setting_data.get("significance", ""),
                special_features=setting_data.get("special_features", ""),
                sensory_palette=setting_data.get("sensory_palette", [])
            )
            for setting_data in story_bible_data.get("settings", [])
        ]
        
        # Create StoryBible
        story_bible = StoryBible(
            project_id=premise.project_id,
            characters=characters,
            settings=settings,
            themes=story_bible_data.get("themes", []),
            humor_style=story_bible_data.get("humor_style", ""),
            tone_notes=story_bible_data.get("tone_notes", ""),
            genre_guidelines=story_bible_data.get("genre_guidelines", ""),
            main_plot_arc=story_bible_data.get("main_plot_arc", ""),
            subplots=story_bible_data.get("subplots", []),
            key_milestones=story_bible_data.get("key_milestones", [])
        )
        
        logger.info(
            f"Story Bible generated successfully: "
            f"{len(characters)} characters, {len(settings)} settings"
        )
        
        return story_bible
        
    except Exception as e:
        logger.error(f"Story Bible generation failed: {e}", exc_info=True)
        raise


def parse_story_bible_json(response: str) -> Dict[str, Any]:
    """
    Parse AI response as JSON, handling markdown code blocks and incomplete responses.
    
    Args:
        response: Raw AI response text
        
    Returns:
        Parsed JSON dictionary
        
    Raises:
        ValueError: If JSON parsing fails
    """
    # Strip markdown code blocks if present
    content = response.strip()
    
    # Remove ```json ... ``` wrappers
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[0].strip().startswith("```"):
            lines = lines[1:]  # Remove first ```json line
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]  # Remove closing ```
        content = "\n".join(lines)
    
    # Parse JSON
    try:
        data = json.loads(content)
        logger.debug(f"Successfully parsed Story Bible JSON: {list(data.keys())}")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        logger.error(f"Response length: {len(content)} chars")
        logger.error(f"Response content preview: {content[:1000]}...")
        logger.error(f"Response content tail: ...{content[-500:]}")
        
        # Try to fix incomplete JSON by closing unterminated strings and structures
        logger.warning("Attempting to repair incomplete JSON response...")
        try:
            # Find the last complete object/array before the error
            # Truncate at the error position and try to close structures
            error_pos = e.pos if hasattr(e, 'pos') else len(content)
            truncated = content[:error_pos]
            
            # Count unclosed brackets
            open_braces = truncated.count('{') - truncated.count('}')
            open_brackets = truncated.count('[') - truncated.count(']')
            
            # Try to close the JSON
            repaired = truncated.rstrip(',\n ')
            
            # Close any unterminated string
            if truncated.count('"') % 2 != 0:
                repaired += '"'
            
            # Close arrays and objects
            repaired += ']' * open_brackets
            repaired += '}' * open_braces
            
            logger.info(f"Attempting parse of repaired JSON ({len(repaired)} chars)")
            data = json.loads(repaired)
            logger.warning(f"Successfully parsed REPAIRED JSON with keys: {list(data.keys())}")
            return data
        except Exception as repair_error:
            logger.error(f"JSON repair failed: {repair_error}")
            raise ValueError(f"Failed to parse Story Bible JSON: {e}. Repair attempt also failed.")


def format_story_bible_for_context(story_bible: StoryBible) -> str:
    """
    Format Story Bible as concise text for inclusion in AI prompts.
    
    Args:
        story_bible: StoryBible object
        
    Returns:
        Formatted text suitable for prompt context
    """
    lines = ["=== STORY BIBLE ===\n"]
    
    # Characters
    lines.append("**CHARACTERS:**")
    for char in story_bible.characters:
        lines.append(f"\n- **{char.name}** ({char.role})")
        if char.aliases:
            lines.append(f"  Aliases: {', '.join(char.aliases)}")
        if char.age:
            lines.append(f"  Age: {char.age}")
        lines.append(f"  Physical: {char.physical_description[:150]}...")
        lines.append(f"  Personality: {char.personality[:150]}...")
        lines.append(f"  Goals: {char.goals[:100]}...")
        lines.append(f"  Arc: {char.character_arc[:150]}...")
    
    # Settings
    lines.append("\n**SETTINGS:**")
    for setting in story_bible.settings:
        lines.append(f"\n- **{setting.name}**")
        lines.append(f"  {setting.description[:200]}...")
        lines.append(f"  Atmosphere: {setting.atmosphere[:100]}...")
    
    # Themes & Tone
    lines.append("\n**THEMES:**")
    for theme in story_bible.themes:
        lines.append(f"- {theme}")
    
    lines.append(f"\n**TONE:** {story_bible.tone_notes}")
    lines.append(f"**HUMOR:** {story_bible.humor_style}")
    
    # Plot
    lines.append(f"\n**MAIN PLOT ARC:**\n{story_bible.main_plot_arc}")
    
    if story_bible.subplots:
        lines.append("\n**SUBPLOTS:**")
        for i, subplot in enumerate(story_bible.subplots, 1):
            lines.append(f"{i}. {subplot}")
    
    lines.append("\n" + "="*50)
    
    return "\n".join(lines)

"""
Outline generation service.

Handles AI-powered outline generation from premise using configured templates and models.
Now includes Story Bible context and generates structured chapter summaries.
"""

import json
from typing import Dict, Any, Optional

import structlog

from models.schemas import (
    Premise,
    Outline,
    ChapterOutline,
    AIConfig,
    Project,
    StoryBible
)
from services.ai_service import get_ai_service
from services.story_bible_service import format_story_bible_for_context

logger = structlog.get_logger()


def _get_darkness_guidance(level: int) -> str:
    """Get AI guidance for darkness level."""
    guidance = {
        1: "Pure lighthearted - conflicts resolve easily, minimal tension, feel-good throughout",
        2: "Mostly cheerful - small challenges that build character, gentle emotional beats",
        3: "Lightly serious - meaningful conflicts with low real danger, uplifting resolution",
        4: "Gentle drama - emotional depth without trauma, relationships tested but not broken",
        5: "Balanced - authentic challenges, earned victories, bittersweet moments possible",
        6: "Moderately dark - real consequences, difficult choices, some pain but not overwhelming",
        7: "Notably dark - trauma possible, morally gray situations, victories come with cost",
        8: "Very dark - brutal realism, characters broken and changed, hope is fragile",
        9: "Grimdark - nihilistic elements, pyrrhic victories, goodness is rare and costly",
        10: "Maximum darkness - unflinching brutality, systemic evil, survival is the only victory"
    }
    return guidance.get(level, "")


def _get_humor_guidance(level: int) -> str:
    """Get AI guidance for humor level."""
    guidance = {
        1: "Deadly serious - zero comedic relief, tension never breaks, characters don't joke",
        2: "Mostly serious - occasional wry observation, but humor is fleeting and dry",
        3: "Lightly earnest - understated humor, characters may smile but rarely laugh",
        4: "Gentle humor - situational comedy, gentle teasing, wholesome funny moments",
        5: "Balanced - comedy emerges organically from character/situation, not forced",
        6: "Moderately funny - witty banter, comedic subplots, laugh-out-loud moments",
        7: "Very humorous - running gags, comedic set pieces, even serious moments have levity",
        8: "Predominantly comedy - constant jokes, physical comedy, characters are comedic archetypes",
        9: "Farcical - absurd scenarios, slapstick dominates, reality takes a backseat",
        10: "Pure comedy - maximalist humor, no sincere moments, everything is a punchline"
    }
    return guidance.get(level, "")


OUTLINE_SYSTEM_PROMPT = """You are an expert novel outlining consultant. You MUST return valid JSON with structured chapter data.

**THEOLOGICAL FRAMEWORK FOR CHRISTIAN FICTION:**
When working with Christian genre fiction, assume conservative evangelical/Reformed Baptist theology:
- Grace through faith alone (sola fide), not works-based salvation
- Scripture as ultimate authority (sola scriptura)
- Personal conversion and relationship with Christ
- Believer's baptism by immersion
- Congregational church governance
- Avoid Catholic sacramental theology, papal authority, or salvation through church/sacraments (except in historical settings where Catholicism is period-accurate)
These theological underpinnings should naturally inform character worldviews, moral reasoning, and spiritual themes without being preachy or didactic.

**CRITICAL: You must return ONLY valid JSON in this EXACT format:**

```json
{
  "chapters": [
    {
      "chapter_index": 1,
      "title": "Chapter Title Here",
      "opening_scene": "Specific description of where/when chapter opens (50-100 words)",
      "characters_present": ["Character Name 1", "Character Name 2"],
      "locations": ["Location Name 1", "Location Name 2"],
      "plot_events": [
        "First major event",
        "Second major event",
        "Third major event"
      ],
      "character_development": "Emotional beats and relationship changes in this chapter (50-100 words)",
      "subplots_advanced": "Progress on B-stories and C-stories (optional, ~50 words)",
      "closing_scene": "How chapter ends, cliffhanger or transition (50-100 words)",
      "tone_notes": ["humor", "tension", "romance"],
      "summary_prose": "Flowing narrative summary of the entire chapter with vivid detail, key dramatic moments, character interactions, and plot progression (~300 words)"
    }
  ]
}
```

**Each chapter MUST include ALL fields above:**
- opening_scene: WHERE and WHEN (specific setting, time of day)
- characters_present: EXACT character names from Story Bible
- locations: Setting names from Story Bible
- plot_events: 3-5 bullet points of what HAPPENS
- character_development: Emotional/relationship changes
- subplots_advanced: B-story progress (can be empty string if none)
- closing_scene: Chapter ending and hook
- tone_notes: Mood tags as array
- summary_prose: Rich narrative description (~300 words)
- imperfection_notes: ONE small disaster or awkward moment (examples: stumbling over words, hitting wrong note, child interrupting, food running out, mistiming entrance, failed attempt at something)
- sensory_focus: Which non-visual senses to emphasize (examples: ["smell", "texture"] for workshop, ["sound", "taste"] for kitchen, ["smell", "sound"] for forest)
- conflict_complexity: Note if any conflict should remain messy/unresolved (example: "Romantic tension stays awkward and uncertain" or "Argument doesn't resolve cleanly, both stay hurt")

**Requirements:**
- Use Story Bible characters and settings
- Maintain genre tone and conventions
- Each chapter advances main plot
- EVERY chapter needs at least one imperfection/awkward moment
- Return ONLY the JSON, no other text"""


def create_outline_prompt(
    premise: Premise,
    story_bible: Optional[StoryBible],
    target_chapter_count: int
) -> str:
    """Create the outline generation prompt."""
    
    # Format Story Bible context if available
    story_bible_context = ""
    if story_bible:
        story_bible_context = format_story_bible_for_context(story_bible)
    else:
        story_bible_context = "(No Story Bible available - extract from premise)"
    
    # Build comprehensive genre guidance
    genre_guidance = f"""**Genre:** {premise.genre}"""
    if premise.subgenre:
        genre_guidance += f"\n**Subgenre:** {premise.subgenre}"
    
    if premise.subgenres:
        genre_guidance += f"\n**Subgenres to Blend:** {', '.join(premise.subgenres)}"
        genre_guidance += f"\n  → Your outline MUST authentically incorporate elements from ALL these subgenres"
    
    if premise.comedy_elements:
        genre_guidance += f"\n**Comedy Elements:** {', '.join(premise.comedy_elements)}"
        genre_guidance += f"\n  → CRITICAL: Showcase these comedy styles prominently in appropriate chapters"
    
    if premise.tone_adjectives:
        genre_guidance += f"\n**Tone:** {', '.join(premise.tone_adjectives)}"
    
    if premise.darkness_level is not None:
        darkness_guidance = _get_darkness_guidance(premise.darkness_level)
        genre_guidance += f"\n**Darkness Level:** {premise.darkness_level}/10 - {darkness_guidance}"
    
    if premise.humor_level is not None:
        humor_guidance = _get_humor_guidance(premise.humor_level)
        genre_guidance += f"\n**Humor Level:** {premise.humor_level}/10 - {humor_guidance}"
    
    if premise.themes:
        genre_guidance += f"\n**Themes to Explore:** {', '.join(premise.themes)}"
    
    return f"""Generate a detailed {target_chapter_count}-chapter outline for this novel:

{genre_guidance}

**Target Word Count:** {premise.target_word_count:,} words
**Target Chapters:** {target_chapter_count}
**Words per Chapter:** ~{premise.target_word_count // target_chapter_count:,}

{story_bible_context}

**Premise:**
{premise.content}

---

Generate {target_chapter_count} chapters with structured data + prose summaries. Return JSON:

{{
  "chapters": [
    {{
      "chapter_index": 1,
      "title": "Chapter Title",
      "opening_scene": "Where/when chapter starts (50-100 words)",
      "characters_present": ["Character Name 1", "Character Name 2"],
      "locations": ["Location 1", "Location 2"],
      "plot_events": [
        "Key event 1",
        "Key event 2",
        "Key event 3"
      ],
      "character_development": "Emotional beats, relationship changes (50-100 words)",
      "subplots_advanced": "B-story progress (optional, ~50 words)",
      "closing_scene": "How chapter ends (50-100 words)",
      "tone_notes": ["humor", "tension", "romance"],
      "summary_prose": "Narrative chapter summary in flowing prose (~300 words). This should read like a detailed summary, not bullet points.",
      "imperfection_notes": "One small disaster or awkward moment (e.g., stumbling over words, hitting wrong note, child interrupting important moment)",
      "sensory_focus": ["smell", "texture"],
      "conflict_complexity": "Note if conflict stays messy (e.g., 'Romantic moment stays awkward, both uncertain' or leave empty if resolves)",
      "target_word_count": {premise.target_word_count // target_chapter_count}
    }}
  ]
}}

Generate all {target_chapter_count} chapters now."""


async def generate_outline_from_premise(
    premise: Premise,
    project: Project,
    ai_config: AIConfig,
    story_bible: Optional[StoryBible] = None,
) -> Outline:
    """
    Generate a chapter-by-chapter outline from premise and Story Bible using AI.
    
    Args:
        premise: The premise document with genre, word count targets
        project: The parent project
        ai_config: AI configuration for generation
        story_bible: Optional Story Bible with characters, settings, themes
        
    Returns:
        Outline: Generated outline with structured chapter data
        
    Raises:
        ValueError: If AI returns invalid format
        Exception: On AI service errors
    """
    logger.info(
        "outline_generation_started",
        project_id=project.id,
        premise_id=premise.id,
        genre=premise.genre,
        target_chapters=premise.target_chapter_count,
        has_story_bible=story_bible is not None
    )
    
    # Create AI service
    ai_service = get_ai_service()
    
    # Build prompts
    system_prompt = OUTLINE_SYSTEM_PROMPT
    user_prompt = create_outline_prompt(premise, story_bible, premise.target_chapter_count)
    
    logger.debug(f"System prompt length: {len(system_prompt)} chars")
    logger.debug(f"User prompt length: {len(user_prompt)} chars")
    
    # Override max_tokens for outline generation
    # Claude Sonnet 4.5 supports up to 64K output tokens
    # Allocate ~1200 tokens per chapter to ensure complete structured summaries
    # Use full 64K capacity for large novels (supports 50+ chapters with rich detail)
    ai_config.max_tokens = min(64000, max(12000, premise.target_chapter_count * 1200))
    
    try:
        # Call AI
        response_data = await ai_service.generate_text(
            prompt=user_prompt,
            config=ai_config,
            system_prompt=system_prompt
        )
        
        response_text = response_data["content"]
        
        logger.info(f"AI response received: {len(response_text)} chars")
        
        # Parse JSON response
        outline_data = parse_outline_json(response_text)
        
        # DEBUG: Log first chapter structure
        if outline_data.get("chapters") and len(outline_data["chapters"]) > 0:
            first_ch = outline_data["chapters"][0]
            logger.info(f"First chapter keys from AI: {list(first_ch.keys())}")
            logger.info(f"Has opening_scene: {bool(first_ch.get('opening_scene'))}")
            logger.info(f"Has characters_present: {bool(first_ch.get('characters_present'))}")
            logger.info(f"Has plot_events: {bool(first_ch.get('plot_events'))}")
        
        # Build structured chapter outlines
        chapters = []
        for ch_data in outline_data.get("chapters", []):
            chapter = ChapterOutline(
                chapter_index=ch_data.get("chapter_index", len(chapters) + 1),
                title=ch_data.get("title", f"Chapter {len(chapters) + 1}"),
                opening_scene=ch_data.get("opening_scene", ""),
                characters_present=ch_data.get("characters_present", []),
                locations=ch_data.get("locations", []),
                plot_events=ch_data.get("plot_events", []),
                character_development=ch_data.get("character_development", ""),
                subplots_advanced=ch_data.get("subplots_advanced", ""),
                closing_scene=ch_data.get("closing_scene", ""),
                tone_notes=ch_data.get("tone_notes", []),
                summary_prose=ch_data.get("summary_prose", ""),
                imperfection_notes=ch_data.get("imperfection_notes", ""),
                sensory_focus=ch_data.get("sensory_focus", []),
                conflict_complexity=ch_data.get("conflict_complexity", ""),
                target_word_count=ch_data.get("target_word_count", 3000),
                notes=ch_data.get("notes"),
            )
            chapters.append(chapter)
        
        # Create outline
        outline = Outline(
            project_id=project.id,
            chapters=chapters,
            total_target_words=sum(ch.target_word_count for ch in chapters),
            ai_config=ai_config,
            generation_metadata={
                "model": ai_config.model_name,
                "provider": ai_config.provider.value,
                "premise_word_count": premise.word_count,
                "has_story_bible": story_bible is not None,
                "story_bible_characters": len(story_bible.characters) if story_bible else 0,
            },
        )
        
        logger.info(
            "outline_generated",
            project_id=project.id,
            outline_id=outline.id,
            chapters=len(chapters),
            total_words=outline.total_target_words
        )
        
        return outline
        
    except Exception as e:
        logger.error(
            "outline_generation_failed",
            project_id=project.id,
            error=str(e),
            error_type=type(e).__name__
        )
        raise


def parse_outline_json(response: str) -> Dict[str, Any]:
    """
    Parse AI response as JSON, handling markdown code blocks.
    
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
        logger.debug(f"Successfully parsed outline JSON: {len(data.get('chapters', []))} chapters")
        return data
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing failed: {e}")
        logger.error(f"Response content: {content[:1000]}...")
        raise ValueError(f"Failed to parse outline JSON: {e}")

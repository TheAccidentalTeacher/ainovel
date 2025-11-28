"""
Context builder for chapter generation.

Assembles the optimal context window for generating each chapter,
balancing comprehensive information with token limits.
"""

from typing import Optional
from dataclasses import dataclass
import structlog

from models.schemas import (
    Premise,
    StoryBible,
    ChapterOutline,
    Chapter,
    ChapterSummary,
)

logger = structlog.get_logger()

# Context strategy thresholds
RECENT_CHAPTERS_FULL_TEXT = 2  # Last N chapters included as full text
SUMMARY_BATCH_SIZE = 5  # Batch older chapters into summaries of 5

@dataclass
class ChapterContext:
    """Assembled context for chapter generation."""
    story_bible: Optional[StoryBible]
    premise: Premise
    current_chapter_outline: ChapterOutline
    previous_chapters_full: list[Chapter]  # Last 1-2 chapters in full
    previous_chapters_summaries: list[ChapterSummary]  # Older chapters as summaries
    estimated_tokens: int
    
    def format_for_prompt(self) -> str:
        """Format context into a structured prompt."""
        sections = []
        
        # Story Bible (always first - the "rules")
        if self.story_bible:
            sections.append("=" * 80)
            sections.append("STORY BIBLE - CANONICAL REFERENCE")
            sections.append("=" * 80)
            sections.append(format_story_bible_compact(self.story_bible))
            sections.append("")
        
        # Premise with comprehensive genre guidance
        sections.append("=" * 80)
        sections.append("STORY PREMISE")
        sections.append("=" * 80)
        
        genre_line = f"Genre: {self.premise.genre}"
        if self.premise.subgenre:
            genre_line += f" / {self.premise.subgenre}"
        sections.append(genre_line)
        
        if self.premise.subgenres:
            sections.append(f"Subgenres to Blend: {', '.join(self.premise.subgenres)}")
        
        if self.premise.comedy_elements:
            sections.append(f"Comedy Elements: {', '.join(self.premise.comedy_elements)}")
            sections.append("  → Showcase these comedy styles where appropriate")
        
        if self.premise.tone_adjectives:
            sections.append(f"Tone: {', '.join(self.premise.tone_adjectives)}")
        
        if self.premise.darkness_level is not None:
            sections.append(f"Darkness Level: {self.premise.darkness_level}/10")
        
        if self.premise.humor_level is not None:
            sections.append(f"Humor Level: {self.premise.humor_level}/10")
        
        if self.premise.themes:
            sections.append(f"Themes: {', '.join(self.premise.themes)}")
        
        sections.append(f"Target: {self.premise.target_word_count:,} words in {self.premise.target_chapter_count} chapters")
        sections.append("")
        sections.append(self.premise.content)
        sections.append("")
        
        # Previous chapters (summaries of old + full text of recent)
        if self.previous_chapters_summaries or self.previous_chapters_full:
            sections.append("=" * 80)
            sections.append("STORY SO FAR")
            sections.append("=" * 80)
            
            # Summaries first
            for summary in self.previous_chapters_summaries:
                sections.append(f"\n### Chapters {summary.chapter_range} (Summary)")
                sections.append(summary.summary)
                sections.append("")
            
            # Recent full chapters
            for chapter in self.previous_chapters_full:
                sections.append(f"\n### Chapter {chapter.chapter_index}: {chapter.title} (Full Text)")
                sections.append(f"[{chapter.word_count} words]")
                sections.append("")
                sections.append(chapter.content)
                sections.append("")
        
        # Current chapter instructions
        sections.append("=" * 80)
        sections.append(f"NOW WRITE: CHAPTER {self.current_chapter_outline.chapter_index}")
        sections.append("=" * 80)
        sections.append(format_chapter_outline_structured(self.current_chapter_outline))
        
        return "\n".join(sections)


def format_story_bible_compact(story_bible: StoryBible) -> str:
    """Format Story Bible in a compact, reference-friendly format."""
    parts = []
    
    # Characters
    if story_bible.characters:
        parts.append("### CHARACTERS")
        for char in story_bible.characters:
            char_lines = [f"\n**{char.name}**"]
            if char.role:
                char_lines.append(f"Role: {char.role}")
            if char.personality:
                char_lines.append(f"Personality: {char.personality}")
            if char.goals:
                char_lines.append(f"Goals: {char.goals}")
            if char.character_arc:
                char_lines.append(f"Arc: {char.character_arc}")
            if char.quirks:
                char_lines.append(f"Quirks: {char.quirks}")
            # Enhanced fields for human-like writing
            if char.practical_complications:
                char_lines.append(f"Practical Complications: {char.practical_complications}")
            if char.sensory_signatures:
                char_lines.append(f"Sensory Signatures: {char.sensory_signatures}")
            if char.internal_obstacles:
                char_lines.append(f"Internal Obstacles: {char.internal_obstacles}")
            if char.speech_patterns:
                char_lines.append(f"Speech Patterns: {char.speech_patterns}")
            parts.append("\n".join(char_lines))
    
    # Settings
    if story_bible.settings:
        parts.append("\n### SETTINGS")
        for setting in story_bible.settings:
            setting_lines = [f"\n**{setting.name}**"]
            if setting.description:
                setting_lines.append(setting.description)
            if setting.atmosphere:
                setting_lines.append(f"Atmosphere: {setting.atmosphere}")
            if setting.special_features:
                setting_lines.append(f"Special: {setting.special_features}")
            if setting.sensory_palette:
                setting_lines.append(f"Sensory Palette: {', '.join(setting.sensory_palette)}")
            parts.append("\n".join(setting_lines))
    
    # Themes & Plot
    if story_bible.themes or story_bible.main_plot_arc:
        parts.append("\n### THEMES & PLOT")
        if story_bible.themes:
            parts.append(f"Themes: {', '.join(story_bible.themes)}")
        if story_bible.main_plot_arc:
            parts.append(f"Main Arc: {story_bible.main_plot_arc}")
        if story_bible.subplots:
            parts.append("Subplots:")
            for subplot in story_bible.subplots:
                parts.append(f"  - {subplot}")
    
    # Tone
    if story_bible.tone_notes or story_bible.humor_style:
        parts.append("\n### TONE & STYLE")
        if story_bible.humor_style:
            parts.append(f"Humor: {story_bible.humor_style}")
        if story_bible.tone_notes:
            parts.append(f"Tone: {story_bible.tone_notes}")
    
    return "\n".join(parts)


def format_chapter_outline_structured(outline: ChapterOutline) -> str:
    """Format chapter outline in clear, actionable format."""
    parts = [
        f"**Title:** {outline.title}",
        f"**Target Length:** {outline.target_word_count} words",
        ""
    ]
    
    if outline.opening_scene:
        parts.append("**Opening Scene:**")
        parts.append(outline.opening_scene)
        parts.append("")
    
    if outline.characters_present:
        parts.append(f"**Characters:** {', '.join(outline.characters_present)}")
        parts.append("")
    
    if outline.locations:
        parts.append(f"**Locations:** {', '.join(outline.locations)}")
        parts.append("")
    
    if outline.plot_events:
        parts.append("**Key Plot Events:**")
        for event in outline.plot_events:
            parts.append(f"  - {event}")
        parts.append("")
    
    if outline.character_development:
        parts.append("**Character Development:**")
        parts.append(outline.character_development)
        parts.append("")
    
    if outline.subplots_advanced:
        parts.append("**Subplots Advanced:**")
        for subplot in outline.subplots_advanced:
            parts.append(f"  - {subplot}")
        parts.append("")
    
    if outline.closing_scene:
        parts.append("**Closing Scene:**")
        parts.append(outline.closing_scene)
        parts.append("")
    
    if outline.tone_notes:
        parts.append(f"**Tone Notes:** {outline.tone_notes}")
        parts.append("")
    
    if outline.summary_prose:
        parts.append("**Narrative Summary:**")
        parts.append(outline.summary_prose)
        parts.append("")
    
    # Enhanced guidance for human-like writing
    if outline.imperfection_notes:
        parts.append("**Imperfection Guidance:**")
        parts.append(outline.imperfection_notes)
        parts.append("")
    
    if outline.sensory_focus:
        parts.append(f"**Sensory Focus:** Emphasize {', '.join(outline.sensory_focus)} in this chapter")
        parts.append("")
    
    if outline.conflict_complexity:
        parts.append("**Conflict Complexity:**")
        parts.append(outline.conflict_complexity)
        parts.append("")
    
    parts.append("---")
    parts.append("Write this chapter as compelling prose, maintaining the established voice and style.")
    parts.append(f"Aim for approximately {outline.target_word_count} words.")
    
    return "\n".join(parts)


async def build_chapter_context(
    project_id: str,
    chapter_index: int,
    premise: Premise,
    story_bible: Optional[StoryBible],
    current_outline: ChapterOutline,
    all_chapters: list[Chapter],
    all_summaries: list[ChapterSummary],
) -> ChapterContext:
    """
    Build optimal context for generating a specific chapter.
    
    Strategy:
    - Always include Story Bible (canonical reference)
    - Always include Premise
    - Last 1-2 chapters: full text
    - Chapters 3+ back: use summaries
    - If no summaries exist for older chapters, generate them on-demand
    
    Args:
        project_id: Project ID
        chapter_index: Chapter being generated
        premise: Story premise
        story_bible: Story Bible (if available)
        current_outline: Outline for chapter being generated
        all_chapters: All previously generated chapters
        all_summaries: All existing chapter summaries
        
    Returns:
        ChapterContext with assembled context
    """
    logger.info(
        "building_context",
        project_id=project_id,
        chapter_index=chapter_index,
        total_prev_chapters=len([ch for ch in all_chapters if ch.chapter_index < chapter_index]),
    )
    
    # Filter to only previous chapters
    previous_chapters = sorted(
        [ch for ch in all_chapters if ch.chapter_index < chapter_index],
        key=lambda x: x.chapter_index
    )
    
    # Determine which chapters get full text vs summary
    recent_chapters = previous_chapters[-RECENT_CHAPTERS_FULL_TEXT:] if previous_chapters else []
    older_chapters = previous_chapters[:-RECENT_CHAPTERS_FULL_TEXT] if len(previous_chapters) > RECENT_CHAPTERS_FULL_TEXT else []
    
    # Get summaries for older chapters
    summaries_to_use = []
    if older_chapters:
        # Try to find existing summaries
        older_indices = {ch.chapter_index for ch in older_chapters}
        for summary in all_summaries:
            summary_indices = parse_chapter_range(summary.chapter_range)
            if summary_indices and any(idx in older_indices for idx in summary_indices):
                summaries_to_use.append(summary)
        
        # TODO: In future, auto-generate missing summaries here
        # For now, we'll just note if summaries are missing
        covered_indices = set()
        for summary in summaries_to_use:
            covered_indices.update(parse_chapter_range(summary.chapter_range))
        
        missing_indices = older_indices - covered_indices
        if missing_indices:
            logger.warning(
                "missing_summaries",
                project_id=project_id,
                missing_chapters=sorted(missing_indices),
                note="Consider generating summaries for better context management"
            )
    
    # Estimate tokens (rough approximation: words * 1.3)
    estimated_tokens = 0
    if story_bible:
        # Estimate Story Bible size
        estimated_tokens += 3000  # Average Story Bible size
    estimated_tokens += len(premise.content.split()) * 1.3
    estimated_tokens += len(current_outline.summary_prose.split()) * 1.3
    for ch in recent_chapters:
        estimated_tokens += ch.word_count * 1.3
    for summary in summaries_to_use:
        estimated_tokens += summary.word_count * 1.3
    
    context = ChapterContext(
        story_bible=story_bible,
        premise=premise,
        current_chapter_outline=current_outline,
        previous_chapters_full=recent_chapters,
        previous_chapters_summaries=sorted(summaries_to_use, key=lambda x: x.chapter_range),
        estimated_tokens=int(estimated_tokens),
    )
    
    logger.info(
        "context_built",
        project_id=project_id,
        chapter_index=chapter_index,
        recent_chapters_full=len(recent_chapters),
        older_chapters_summarized=len(summaries_to_use),
        estimated_tokens=context.estimated_tokens,
    )
    
    return context


def parse_chapter_range(range_str: str) -> list[int]:
    """
    Parse chapter range string like '1' or '1-5' into list of indices.
    
    Args:
        range_str: Range string
        
    Returns:
        List of chapter indices
    """
    try:
        if '-' in range_str:
            start, end = range_str.split('-')
            return list(range(int(start), int(end) + 1))
        else:
            return [int(range_str)]
    except (ValueError, AttributeError):
        logger.warning("invalid_chapter_range", range_str=range_str)
        return []

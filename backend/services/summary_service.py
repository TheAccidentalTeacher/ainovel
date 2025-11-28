"""
Summary service for generating and managing chapter summaries.

Summaries are used to maintain context when generating later chapters
without hitting token limits.
"""

from typing import Optional
from datetime import datetime
import structlog

from models.schemas import Chapter, ChapterSummary, AIConfig, AIProvider
from services.ai_service import get_ai_service

logger = structlog.get_logger()

SUMMARY_SYSTEM_PROMPT = """You are a precise narrative summarizer for novel writing.

Your task is to create a concise but complete summary of a chapter that captures:
1. Key plot events and their consequences
2. Character development moments
3. Relationship changes
4. New information revealed
5. Unresolved tensions or open questions

Focus on WHAT HAPPENED and WHY IT MATTERS for future chapters.
Be specific about names, locations, and concrete actions.
Avoid vague statements like "tensions rose" - describe the actual conflict.

Keep summaries under 400 words while maintaining all critical details."""


async def generate_chapter_summary(
    chapter: Chapter,
    project_id: str,
) -> ChapterSummary:
    """
    Generate a condensed summary of a chapter.
    
    Args:
        chapter: The chapter to summarize
        project_id: Parent project ID
        
    Returns:
        ChapterSummary object
        
    Raises:
        Exception: On AI generation errors
    """
    logger.info(
        "generating_summary",
        project_id=project_id,
        chapter_index=chapter.chapter_index,
        chapter_words=chapter.word_count,
    )
    
    prompt = f"""Summarize this chapter for narrative continuity tracking:

**Chapter {chapter.chapter_index}: {chapter.title}**

{chapter.content}

Provide a detailed summary (300-400 words) covering:
- Main plot events in sequence
- Character actions and motivations
- Relationship changes
- Information revealed
- Open storylines or questions"""
    
    ai_config = AIConfig(
        provider=AIProvider.ANTHROPIC,
        model_name="claude-sonnet-4-20250514",
        max_tokens=1000,  # Summary should be ~400 words
        temperature=0.3,  # Lower temperature for factual summary
    )
    
    ai_service = get_ai_service()
    
    try:
        response_data = await ai_service.generate_text(
            prompt=prompt,
            config=ai_config,
            system_prompt=SUMMARY_SYSTEM_PROMPT,
        )
        
        summary_text = response_data["content"].strip()
        word_count = len(summary_text.split())
        
        summary = ChapterSummary(
            project_id=project_id,
            chapter_range=str(chapter.chapter_index),
            summary=summary_text,
            word_count=word_count,
            ai_config=ai_config,
        )
        
        logger.info(
            "summary_generated",
            project_id=project_id,
            chapter_index=chapter.chapter_index,
            summary_words=word_count,
        )
        
        return summary
        
    except Exception as e:
        logger.error(
            "summary_generation_failed",
            project_id=project_id,
            chapter_index=chapter.chapter_index,
            error=str(e),
        )
        raise


async def generate_multi_chapter_summary(
    chapters: list[Chapter],
    project_id: str,
) -> ChapterSummary:
    """
    Generate a condensed summary of multiple chapters (for very long contexts).
    
    Args:
        chapters: List of chapters to summarize together
        project_id: Parent project ID
        
    Returns:
        ChapterSummary covering all chapters
    """
    if not chapters:
        raise ValueError("No chapters provided for summarization")
    
    chapter_indices = [ch.chapter_index for ch in sorted(chapters, key=lambda x: x.chapter_index)]
    start_idx = min(chapter_indices)
    end_idx = max(chapter_indices)
    chapter_range = f"{start_idx}-{end_idx}"
    
    logger.info(
        "generating_multi_summary",
        project_id=project_id,
        chapter_range=chapter_range,
        num_chapters=len(chapters),
    )
    
    # Build combined context
    chapter_texts = []
    for ch in sorted(chapters, key=lambda x: x.chapter_index):
        chapter_texts.append(f"### Chapter {ch.chapter_index}: {ch.title}\n\n{ch.content}")
    
    combined_text = "\n\n---\n\n".join(chapter_texts)
    
    prompt = f"""Summarize these chapters as a continuous narrative arc:

{combined_text}

Provide a unified summary (400-600 words) covering:
- Major plot progression across all chapters
- Character arc developments
- Key relationship changes
- Critical information revealed
- Unresolved storylines carrying forward"""
    
    ai_config = AIConfig(
        provider=AIProvider.ANTHROPIC,
        model_name="claude-sonnet-4-20250514",
        max_tokens=1500,
        temperature=0.3,
    )
    
    ai_service = get_ai_service()
    
    try:
        response_data = await ai_service.generate_text(
            prompt=prompt,
            config=ai_config,
            system_prompt=SUMMARY_SYSTEM_PROMPT,
        )
        
        summary_text = response_data["content"].strip()
        word_count = len(summary_text.split())
        
        summary = ChapterSummary(
            project_id=project_id,
            chapter_range=chapter_range,
            summary=summary_text,
            word_count=word_count,
            ai_config=ai_config,
        )
        
        logger.info(
            "multi_summary_generated",
            project_id=project_id,
            chapter_range=chapter_range,
            summary_words=word_count,
        )
        
        return summary
        
    except Exception as e:
        logger.error(
            "multi_summary_generation_failed",
            project_id=project_id,
            chapter_range=chapter_range,
            error=str(e),
        )
        raise

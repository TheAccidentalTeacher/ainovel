"""
Bulk chapter generation endpoint for sequential generation of all chapters.

Provides server-sent events (SSE) streaming for progress updates during
multi-chapter generation with automatic context building and summarization.
"""

import asyncio
from typing import AsyncIterator
from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import StreamingResponse
import structlog
import json

from backend.models.database import get_database
from backend.models.schemas import (
    Project,
    Premise,
    StoryBible,
    Outline,
    Chapter,
    ChapterSummary,
    AIConfig,
    AIProvider,
)
from backend.services.chapter_service import generate_chapter_from_outline
from backend.services.summary_service import generate_chapter_summary

logger = structlog.get_logger()

router = APIRouter(prefix="/bulk", tags=["bulk-generation"])


@router.get("/{project_id}/generate-all")
async def generate_all_chapters(
    project_id: str = Path(..., description="Project ID"),
):
    """
    Generate all chapters sequentially with automatic context management.
    
    Returns server-sent events with progress updates:
    - chapter_started: {"chapter_index": N, "title": "..."}
    - chapter_progress: {"chapter_index": N, "word_count": X}
    - chapter_complete: {"chapter_index": N, "word_count": X, "chapter_id": "..."}
    - summary_complete: {"chapter_index": N, "summary_id": "..."}
    - error: {"chapter_index": N, "error": "..."}
    - complete: {"total_chapters": N, "total_words": X}
    """
    db = await get_database()
    
    # Fetch project and validate
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = Project(**project_doc)
    
    # Validate prerequisites
    if not project.premise_id or not project.outline_id:
        raise HTTPException(
            status_code=400,
            detail="Project must have premise and outline before generating chapters"
        )
    
    # Fetch premise
    premise_doc = await db.premises.find_one({"id": project.premise_id})
    if not premise_doc:
        raise HTTPException(status_code=404, detail="Premise not found")
    premise = Premise(**premise_doc)
    
    # Fetch outline
    outline_doc = await db.outlines.find_one({"id": project.outline_id})
    if not outline_doc:
        raise HTTPException(status_code=404, detail="Outline not found")
    outline = Outline(**outline_doc)
    
    # Fetch Story Bible (optional but recommended)
    story_bible = None
    if project.story_bible_id:
        story_bible_doc = await db.story_bibles.find_one({"id": project.story_bible_id})
        if story_bible_doc:
            story_bible = StoryBible(**story_bible_doc)
    
    logger.info(
        "bulk_generation_started",
        project_id=project_id,
        total_chapters=len(outline.chapters),
        has_story_bible=story_bible is not None,
    )
    
    async def generation_stream() -> AsyncIterator[str]:
        """Generate all chapters and yield progress events."""
        total_words = 0
        
        try:
            for chapter_outline in outline.chapters:
                chapter_index = chapter_outline.chapter_index
                
                # Send chapter started event
                yield f"data: {json.dumps({'event': 'chapter_started', 'chapter_index': chapter_index, 'title': chapter_outline.title})}\n\n"
                
                # Check if chapter already exists
                existing_chapter = await db.chapters.find_one({
                    "project_id": project_id,
                    "chapter_index": chapter_index,
                })
                
                if existing_chapter:
                    logger.info(
                        "chapter_already_exists",
                        project_id=project_id,
                        chapter_index=chapter_index,
                    )
                    yield f"data: {json.dumps({'event': 'chapter_skipped', 'chapter_index': chapter_index, 'reason': 'already_exists'})}\n\n"
                    continue
                
                try:
                    # Fetch previous chapters for context
                    previous_chapters_docs = await db.chapters.find({
                        "project_id": project_id,
                        "chapter_index": {"$lt": chapter_index}
                    }).sort("chapter_index", 1).to_list(length=None)
                    previous_chapters = [Chapter(**doc) for doc in previous_chapters_docs]
                    
                    # Fetch summaries for context
                    summaries_docs = await db.summaries.find({
                        "project_id": project_id
                    }).sort("created_at", 1).to_list(length=None)
                    previous_summaries = [ChapterSummary(**doc) for doc in summaries_docs]
                    
                    logger.info(
                        "generating_chapter",
                        project_id=project_id,
                        chapter_index=chapter_index,
                        context_chapters=len(previous_chapters),
                        context_summaries=len(previous_summaries),
                    )
                    
                    # Configure AI for more human-like variation
                    ai_config = AIConfig(
                        provider=AIProvider.ANTHROPIC,
                        model_name="claude-sonnet-4-20250514",
                        temperature=0.9,  # Higher for more creative variation
                        top_p=0.95,  # Add nucleus sampling for diversity
                    )
                    
                    # Generate chapter with context
                    chapter = await generate_chapter_from_outline(
                        chapter_outline=chapter_outline,
                        premise=premise,
                        story_bible=story_bible,
                        ai_config=ai_config,
                        project_id=project_id,
                        previous_chapters=previous_chapters,
                        previous_summaries=previous_summaries,
                    )
                    
                    # Save chapter
                    await db.chapters.insert_one(chapter.model_dump())
                    total_words += chapter.word_count
                    
                    # Send chapter complete event
                    yield f"data: {json.dumps({'event': 'chapter_complete', 'chapter_index': chapter_index, 'word_count': chapter.word_count, 'chapter_id': chapter.id})}\n\n"
                    
                    logger.info(
                        "chapter_generated",
                        project_id=project_id,
                        chapter_index=chapter_index,
                        word_count=chapter.word_count,
                    )
                    
                    # Auto-generate summary (skip for last chapter since nothing follows it)
                    if chapter_index < len(outline.chapters):
                        try:
                            summary = await generate_chapter_summary(chapter, project_id)
                            await db.summaries.insert_one(summary.model_dump())
                            
                            yield f"data: {json.dumps({'event': 'summary_complete', 'chapter_index': chapter_index, 'summary_id': summary.id})}\n\n"
                            
                            logger.info(
                                "summary_generated",
                                project_id=project_id,
                                chapter_index=chapter_index,
                                summary_words=summary.word_count,
                            )
                        except Exception as e:
                            logger.error(
                                "summary_generation_failed",
                                project_id=project_id,
                                chapter_index=chapter_index,
                                error=str(e),
                            )
                            # Continue even if summary fails
                            yield f"data: {json.dumps({'event': 'summary_error', 'chapter_index': chapter_index, 'error': str(e)})}\n\n"
                    
                    # Small delay to prevent rate limiting
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(
                        "chapter_generation_failed",
                        project_id=project_id,
                        chapter_index=chapter_index,
                        error=str(e),
                    )
                    yield f"data: {json.dumps({'event': 'error', 'chapter_index': chapter_index, 'error': str(e)})}\n\n"
                    # Continue to next chapter
                    continue
            
            # Send completion event
            yield f"data: {json.dumps({'event': 'complete', 'total_chapters': len(outline.chapters), 'total_words': total_words})}\n\n"
            
            logger.info(
                "bulk_generation_complete",
                project_id=project_id,
                total_chapters=len(outline.chapters),
                total_words=total_words,
            )
            
        except Exception as e:
            logger.error(
                "bulk_generation_fatal_error",
                project_id=project_id,
                error=str(e),
            )
            yield f"data: {json.dumps({'event': 'fatal_error', 'error': str(e)})}\n\n"
    
    return StreamingResponse(
        generation_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )

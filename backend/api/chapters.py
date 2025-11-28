"""
Chapter generation and management API endpoints.
"""

import structlog
from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse

from models.database import get_database
from models.schemas import (
    Chapter,
    ChapterOutline,
    ChapterSummary,
    Project,
    Premise,
    StoryBible,
    Outline,
    ProjectStatus,
)
from services.chapter_service import generate_chapter_from_outline, format_chapter_generation_prompt, CHAPTER_SYSTEM_PROMPT
from services.ai_service import get_ai_service

logger = structlog.get_logger()
router = APIRouter()


@router.get(
    "/{project_id}/chapters/{chapter_index}/generate-stream",
    summary="Generate Chapter (Streaming)",
    description="Generate a chapter with real-time streaming of the text as it's written"
)
async def generate_chapter_stream(project_id: str, chapter_index: int):
    """
    Stream chapter generation in real-time, word by word.
    
    Returns Server-Sent Events (SSE) with:
    - data: Generated text chunks
    - event: "done" when complete with chapter metadata JSON
    
    Args:
        project_id: Project UUID
        chapter_index: Zero-based chapter index from the outline
    """
    db = await get_database()
    
    # Fetch all required data (same validation as non-streaming)
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    project = Project(**project_doc)
    
    if not project.premise_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no premise"
        )
    
    premise_doc = await db.premises.find_one({"id": project.premise_id})
    if not premise_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Premise not found"
        )
    
    premise = Premise(**premise_doc)
    
    if not project.outline_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no outline - generate outline first"
        )
    
    outline_doc = await db.outlines.find_one({"id": project.outline_id})
    if not outline_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    outline = Outline(**outline_doc)
    
    if chapter_index < 0 or chapter_index >= len(outline.chapters):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid chapter index {chapter_index}. Outline has {len(outline.chapters)} chapters."
        )
    
    chapter_outline = outline.chapters[chapter_index]
    
    # Fetch Story Bible (optional)
    story_bible = None
    if project.story_bible_id:
        story_bible_doc = await db.story_bibles.find_one({"id": project.story_bible_id})
        if story_bible_doc:
            story_bible = StoryBible(**story_bible_doc)
    
    # Fetch previous chapters for context
    previous_chapters_docs = await db.chapters.find({
        "project_id": project_id,
        "chapter_index": {"$lt": chapter_index}
    }).sort("chapter_index", 1).to_list(length=None)
    previous_chapters = [Chapter(**doc) for doc in previous_chapters_docs]
    
    # Fetch existing summaries for context
    summaries_docs = await db.summaries.find({
        "project_id": project_id
    }).sort("created_at", 1).to_list(length=None)
    previous_summaries = [ChapterSummary(**doc) for doc in summaries_docs]
    
    logger.info(
        "context_loaded",
        project_id=project_id,
        chapter_index=chapter_index,
        prev_chapters=len(previous_chapters),
        prev_summaries=len(previous_summaries),
    )
    
    # Build prompt with context
    prompt, ai_config = format_chapter_generation_prompt(
        chapter_outline,
        premise,
        story_bible,
        previous_chapters,
        previous_summaries,
    )
    
    logger.info(
        "chapter_stream_started",
        project_id=project_id,
        chapter_index=chapter_index,
        target_words=chapter_outline.target_word_count,
    )
    
    # Stream generator
    async def event_generator():
        ai_service = get_ai_service()
        accumulated_text = []
        
        try:
            # Stream the chapter generation
            async for chunk in ai_service.generate_text_stream(
                prompt=prompt,
                config=ai_config,
                system_prompt=CHAPTER_SYSTEM_PROMPT,
            ):
                accumulated_text.append(chunk)
                # Send each chunk as SSE
                yield f"data: {chunk}\n\n"
            
            # Generation complete - save to database
            chapter_text = "".join(accumulated_text).strip()
            word_count = len(chapter_text.split())
            
            chapter = Chapter(
                id=str(uuid4()),
                project_id=project_id,
                chapter_index=chapter_index,
                title=chapter_outline.title,
                content=chapter_text,
                word_count=word_count,
                target_word_count=chapter_outline.target_word_count,
                status="completed",
                ai_config=ai_config,
                generation_metadata={},
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                completed_at=datetime.utcnow(),
            )
            
            # Check if chapter exists (update) or insert
            existing = await db.chapters.find_one({
                "project_id": project_id,
                "chapter_index": chapter_index
            })
            
            if existing:
                chapter.id = existing["id"]
                await db.chapters.update_one(
                    {"id": chapter.id},
                    {"$set": chapter.model_dump()}
                )
            else:
                await db.chapters.insert_one(chapter.model_dump())
            
            # Update project status
            if project.status == ProjectStatus.OUTLINE_READY:
                await db.projects.update_one(
                    {"id": project_id},
                    {"$set": {"status": ProjectStatus.GENERATING.value}}
                )
            
            logger.info(
                "chapter_stream_complete",
                project_id=project_id,
                chapter_id=chapter.id,
                word_count=word_count,
            )
            
            # Send completion event with metadata
            import json
            yield f"event: done\ndata: {json.dumps({'id': chapter.id, 'word_count': word_count, 'chapter_index': chapter_index})}\n\n"
            
        except Exception as e:
            logger.error(
                "chapter_stream_failed",
                project_id=project_id,
                chapter_index=chapter_index,
                error=str(e),
            )
            import json
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post(
    "/{project_id}/chapters/{chapter_index}/generate",
    response_model=Chapter,
    summary="Generate Chapter",
    description="Generate a single chapter from outline and Story Bible"
)
async def generate_chapter(project_id: str, chapter_index: int):
    """
    Generate a chapter for a project based on its outline and Story Bible.
    
    Args:
        project_id: Project UUID
        chapter_index: Zero-based chapter index from the outline
        
    Returns:
        Chapter: Generated chapter with prose content
        
    Raises:
        HTTPException: 404 if project/outline not found, 400 if prerequisites missing
    """
    db = await get_database()
    
    # Fetch project
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    project = Project(**project_doc)
    
    # Check for premise
    if not project.premise_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no premise"
        )
    
    premise_doc = await db.premises.find_one({"id": project.premise_id})
    if not premise_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Premise not found"
        )
    
    premise = Premise(**premise_doc)
    
    # Check for outline
    if not project.outline_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has no outline - generate outline first"
        )
    
    outline_doc = await db.outlines.find_one({"id": project.outline_id})
    if not outline_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    outline = Outline(**outline_doc)
    
    # Validate chapter index
    if chapter_index < 0 or chapter_index >= len(outline.chapters):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid chapter index {chapter_index}. Outline has {len(outline.chapters)} chapters."
        )
    
    chapter_outline = outline.chapters[chapter_index]
    
    # Fetch Story Bible (recommended but optional)
    story_bible = None
    if project.story_bible_id:
        story_bible_doc = await db.story_bibles.find_one({"id": project.story_bible_id})
        if story_bible_doc:
            story_bible = StoryBible(**story_bible_doc)
            logger.info(f"Using Story Bible: {story_bible.id}")
    else:
        logger.warning("No Story Bible found - chapter may lack consistency")
    
    # Use project AI config
    ai_config = project.ai_config
    
    # Generate chapter
    try:
        chapter = await generate_chapter_from_outline(
            chapter_outline=chapter_outline,
            premise=premise,
            story_bible=story_bible,
            ai_config=ai_config,
            project_id=project_id,
        )
        
        # Check if chapter already exists (update) or insert new
        existing_chapter = await db.chapters.find_one({
            "project_id": project_id,
            "chapter_index": chapter_index
        })
        
        if existing_chapter:
            # Update existing chapter
            chapter.id = existing_chapter["id"]  # Keep same ID
            chapter.version = existing_chapter.get("version", 1) + 1
            await db.chapters.update_one(
                {"id": chapter.id},
                {"$set": chapter.model_dump()}
            )
            logger.info("chapter_updated", project_id=project_id, chapter_id=chapter.id, version=chapter.version)
        else:
            # Insert new chapter
            await db.chapters.insert_one(chapter.model_dump())
            logger.info("chapter_saved", project_id=project_id, chapter_id=chapter.id)
        
        # Update project status to GENERATING if this is the first chapter
        if project.status == ProjectStatus.OUTLINE_READY:
            await db.projects.update_one(
                {"id": project_id},
                {"$set": {"status": ProjectStatus.GENERATING.value}}
            )
        
        return chapter
        
    except ValueError as e:
        logger.error("chapter_generation_error", project_id=project_id, chapter_index=chapter_index, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chapter generation failed: {str(e)}"
        )


@router.get(
    "/{project_id}/chapters",
    response_model=list[Chapter],
    summary="List Chapters",
    description="Get all generated chapters for a project"
)
async def list_chapters(project_id: str):
    """
    List all chapters for a project, ordered by chapter_index.
    
    Args:
        project_id: Project UUID
        
    Returns:
        list[Chapter]: All chapters, ordered by index
    """
    db = await get_database()
    
    # Verify project exists
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Fetch all chapters
    chapters_cursor = db.chapters.find({"project_id": project_id}).sort("chapter_index", 1)
    chapters_docs = await chapters_cursor.to_list(length=None)
    
    chapters = [Chapter(**doc) for doc in chapters_docs]
    
    logger.info("chapters_listed", project_id=project_id, count=len(chapters))
    
    return chapters


@router.get(
    "/{project_id}/chapters/{chapter_index}",
    response_model=Chapter,
    summary="Get Chapter",
    description="Get a specific chapter by index"
)
async def get_chapter(project_id: str, chapter_index: int):
    """
    Get a specific chapter by its index.
    
    Args:
        project_id: Project UUID
        chapter_index: Zero-based chapter index
        
    Returns:
        Chapter: Chapter object
        
    Raises:
        HTTPException: 404 if not found
    """
    db = await get_database()
    
    chapter_doc = await db.chapters.find_one({
        "project_id": project_id,
        "chapter_index": chapter_index
    })
    
    if not chapter_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapter {chapter_index} not found for project {project_id}"
        )
    
    return Chapter(**chapter_doc)


@router.delete(
    "/{project_id}/chapters/{chapter_index}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Chapter",
    description="Delete a specific chapter"
)
async def delete_chapter(project_id: str, chapter_index: int) -> None:
    """
    Delete a chapter by its index.
    
    Args:
        project_id: Project UUID
        chapter_index: Zero-based chapter index
        
    Raises:
        HTTPException: 404 if not found
    """
    db = await get_database()
    
    result = await db.chapters.delete_one({
        "project_id": project_id,
        "chapter_index": chapter_index
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chapter {chapter_index} not found for project {project_id}"
        )
    
    logger.info("chapter_deleted", project_id=project_id, chapter_index=chapter_index)


@router.delete(
    "/{project_id}/chapters",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete All Chapters",
    description="Delete all chapters for a project (used before regenerating)"
)
async def delete_all_chapters(project_id: str) -> None:
    """
    Delete all chapters for a project.
    
    Args:
        project_id: Project UUID
        
    Raises:
        HTTPException: 404 if project not found
    """
    db = await get_database()
    
    # Verify project exists
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Delete all chapters
    result = await db.chapters.delete_many({"project_id": project_id})
    
    # Also delete all summaries
    await db.summaries.delete_many({"project_id": project_id})
    
    logger.info("all_chapters_deleted", project_id=project_id, count=result.deleted_count)

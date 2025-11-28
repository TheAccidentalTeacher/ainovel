"""
Summary API endpoints for chapter summarization.

Provides endpoints to generate and retrieve chapter summaries for
context management in sequential chapter generation.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Path, Query
import structlog

from models.database import get_database
from models.schemas import ChapterSummary
from services.summary_service import (
    generate_chapter_summary,
    generate_multi_chapter_summary,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.post("/{project_id}/chapters/{chapter_index}", response_model=ChapterSummary)
async def create_chapter_summary(
    project_id: str = Path(..., description="Project ID"),
    chapter_index: int = Path(..., ge=1, description="Chapter index to summarize"),
):
    """
    Generate a summary of a specific chapter.
    
    The chapter must already exist. Summary is auto-saved to database.
    """
    db = await get_database()
    
    # Fetch the chapter
    chapter_doc = await db.chapters.find_one({
        "project_id": project_id,
        "chapter_index": chapter_index,
    })
    
    if not chapter_doc:
        raise HTTPException(
            status_code=404,
            detail=f"Chapter {chapter_index} not found for project {project_id}"
        )
    
    from models.schemas import Chapter
    chapter = Chapter(**chapter_doc)
    
    try:
        # Generate summary
        summary = await generate_chapter_summary(chapter, project_id)
        
        # Save to database
        await db.summaries.insert_one(summary.model_dump())
        
        logger.info(
            "summary_created",
            project_id=project_id,
            chapter_index=chapter_index,
            summary_id=summary.id,
        )
        
        return summary
        
    except Exception as e:
        logger.error(
            "summary_creation_failed",
            project_id=project_id,
            chapter_index=chapter_index,
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")


@router.post("/{project_id}/chapters/batch", response_model=ChapterSummary)
async def create_multi_chapter_summary(
    project_id: str = Path(..., description="Project ID"),
    chapter_indices: List[int] = Query(..., description="List of chapter indices to summarize together"),
):
    """
    Generate a summary covering multiple chapters.
    
    Useful for condensing older chapters into a single summary to save context tokens.
    """
    db = await get_database()
    
    if not chapter_indices:
        raise HTTPException(status_code=400, detail="Must provide at least one chapter index")
    
    # Fetch all requested chapters
    chapter_docs = await db.chapters.find({
        "project_id": project_id,
        "chapter_index": {"$in": chapter_indices},
    }).to_list(length=None)
    
    if len(chapter_docs) != len(chapter_indices):
        found_indices = {ch["chapter_index"] for ch in chapter_docs}
        missing = set(chapter_indices) - found_indices
        raise HTTPException(
            status_code=404,
            detail=f"Chapters not found: {sorted(missing)}"
        )
    
    from models.schemas import Chapter
    chapters = [Chapter(**doc) for doc in chapter_docs]
    
    try:
        # Generate multi-chapter summary
        summary = await generate_multi_chapter_summary(chapters, project_id)
        
        # Save to database
        await db.summaries.insert_one(summary.model_dump())
        
        logger.info(
            "multi_summary_created",
            project_id=project_id,
            chapter_range=summary.chapter_range,
            summary_id=summary.id,
        )
        
        return summary
        
    except Exception as e:
        logger.error(
            "multi_summary_creation_failed",
            project_id=project_id,
            chapter_indices=chapter_indices,
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=f"Failed to generate summary: {str(e)}")


@router.get("/{project_id}", response_model=List[ChapterSummary])
async def get_project_summaries(
    project_id: str = Path(..., description="Project ID"),
):
    """
    Get all summaries for a project.
    
    Returns summaries ordered by chapter range.
    """
    db = await get_database()
    
    summary_docs = await db.summaries.find(
        {"project_id": project_id}
    ).sort("created_at", 1).to_list(length=None)
    
    summaries = [ChapterSummary(**doc) for doc in summary_docs]
    
    logger.info(
        "summaries_retrieved",
        project_id=project_id,
        count=len(summaries),
    )
    
    return summaries


@router.get("/{project_id}/chapters/{chapter_index}", response_model=ChapterSummary)
async def get_chapter_summary(
    project_id: str = Path(..., description="Project ID"),
    chapter_index: int = Path(..., ge=1, description="Chapter index"),
):
    """
    Get summary for a specific chapter.
    
    Returns the summary if it exists, or 404 if not found.
    """
    db = await get_database()
    
    # Look for exact chapter or a range containing this chapter
    summary_doc = await db.summaries.find_one({
        "project_id": project_id,
        "chapter_range": {"$regex": f"^{chapter_index}$|^{chapter_index}-|^.*-{chapter_index}$"},
    })
    
    if not summary_doc:
        raise HTTPException(
            status_code=404,
            detail=f"Summary not found for chapter {chapter_index}"
        )
    
    return ChapterSummary(**summary_doc)


@router.delete("/{project_id}/summaries/{summary_id}")
async def delete_summary(
    project_id: str = Path(..., description="Project ID"),
    summary_id: str = Path(..., description="Summary ID"),
):
    """
    Delete a specific summary.
    """
    db = await get_database()
    
    result = await db.summaries.delete_one({
        "id": summary_id,
        "project_id": project_id,
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    logger.info(
        "summary_deleted",
        project_id=project_id,
        summary_id=summary_id,
    )
    
    return {"message": "Summary deleted successfully"}

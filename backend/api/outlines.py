"""
Outline generation and management API endpoints.
"""

import structlog
from fastapi import APIRouter, HTTPException, status

from backend.models.database import get_database
from backend.models.schemas import (
    GenerateOutlineRequest,
    UpdateOutlineRequest,
    Outline,
    Project,
    Premise,
    ProjectStatus,
)
from backend.services.outline_service import generate_outline_from_premise

logger = structlog.get_logger()
router = APIRouter()


@router.post(
    "/{project_id}/generate-outline",
    response_model=Outline,
    summary="Generate Outline",
    description="Generate chapter-by-chapter outline from premise using AI"
)
async def generate_outline(project_id: str, request: GenerateOutlineRequest):
    """
    Generate an outline for a project based on its premise.
    
    Args:
        project_id: Project UUID
        request: Optional AI config override
        
    Returns:
        Outline: Generated outline
        
    Raises:
        HTTPException: 404 if project not found, 400 if no premise
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
    
    # Fetch Story Bible if exists
    story_bible = None
    if project.story_bible_id:
        story_bible_doc = await db.story_bibles.find_one({"id": project.story_bible_id})
        if story_bible_doc:
            from backend.models.schemas import StoryBible
            story_bible = StoryBible(**story_bible_doc)
            logger.info(f"Using Story Bible: {story_bible.id}")
    else:
        logger.warning("No Story Bible found for project - outline may lack consistency")
    
    # Use provided config or project default
    ai_config = request.ai_config or project.ai_config
    
    # Generate outline
    try:
        outline = await generate_outline_from_premise(premise, project, ai_config, story_bible)
        
        # Save to database
        await db.outlines.insert_one(outline.model_dump())
        
        # Update project
        await db.projects.update_one(
            {"id": project_id},
            {
                "$set": {
                    "outline_id": outline.id,
                    "status": ProjectStatus.OUTLINE_READY.value,
                }
            }
        )
        
        logger.info("outline_saved", project_id=project_id, outline_id=outline.id)
        
        return outline
        
    except ValueError as e:
        logger.error("outline_generation_error", project_id=project_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Outline generation failed: {str(e)}"
        )


@router.put(
    "/{project_id}/outlines/{outline_id}",
    response_model=Outline,
    summary="Update Outline",
    description="Update outline chapters (increments version)"
)
async def update_outline(
    project_id: str,
    outline_id: str,
    request: UpdateOutlineRequest
):
    """
    Update an existing outline with edited chapters.
    
    Args:
        project_id: Project UUID
        outline_id: Outline UUID
        request: Updated chapters
        
    Returns:
        Outline: Updated outline
        
    Raises:
        HTTPException: 404 if not found
    """
    db = await get_database()
    
    # Fetch outline
    outline_doc = await db.outlines.find_one({"id": outline_id, "project_id": project_id})
    if not outline_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    outline = Outline(**outline_doc)
    
    # Update chapters and version
    outline.chapters = request.chapters
    outline.total_target_words = sum(ch.target_word_count for ch in request.chapters)
    outline.version += 1
    
    from datetime import datetime
    outline.updated_at = datetime.utcnow()
    
    # Save
    await db.outlines.update_one(
        {"id": outline_id},
        {"$set": outline.model_dump()}
    )
    
    logger.info(
        "outline_updated",
        project_id=project_id,
        outline_id=outline_id,
        version=outline.version,
        chapters=len(outline.chapters)
    )
    
    return outline


@router.delete(
    "/{project_id}/outlines/{outline_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Outline",
    description="Delete an outline and clear project's outline reference"
)
async def delete_outline(project_id: str, outline_id: str) -> None:
    """
    Delete an outline and update the project status.
    
    Args:
        project_id: Project UUID
        outline_id: Outline UUID
        
    Raises:
        HTTPException: 404 if not found
    """
    db = await get_database()
    
    # Check outline exists
    outline_doc = await db.outlines.find_one({"id": outline_id, "project_id": project_id})
    if not outline_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Outline not found"
        )
    
    # Delete outline
    await db.outlines.delete_one({"id": outline_id})
    
    # Update project - clear outline_id and set status back to story_bible_ready or premise_ready
    project_doc = await db.projects.find_one({"id": project_id})
    if project_doc:
        new_status = ProjectStatus.STORY_BIBLE_READY.value if project_doc.get("story_bible_id") else ProjectStatus.PREMISE_READY.value
        await db.projects.update_one(
            {"id": project_id},
            {
                "$set": {"status": new_status},
                "$unset": {"outline_id": ""}
            }
        )
    
    logger.info("outline_deleted", project_id=project_id, outline_id=outline_id)

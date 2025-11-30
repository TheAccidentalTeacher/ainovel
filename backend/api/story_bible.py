"""
Story Bible API Endpoints

REST API for Story Bible generation, retrieval, and updates.
Manages character profiles, settings, themes, and plot structure.
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.schemas import (
    StoryBible,
    StoryBibleResponse,
    GenerateStoryBibleRequest,
    UpdateStoryBibleRequest,
    Premise,
    Project,
    AIConfig
)
from services.story_bible_service import generate_story_bible_from_premise
from services.ai_service import generate_ai_content
from models.database import get_database
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/projects/{project_id}/generate-story-bible", response_model=StoryBibleResponse)
async def generate_story_bible(
    project_id: str,
    ai_config: Optional[AIConfig] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Generate Story Bible from project premise using AI.
    
    Extracts characters, settings, themes, and plot structure from the premise.
    """
    logger.info(f"Story Bible generation requested for project_id={project_id}")
    
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get premise
    if not project.get("premise_id"):
        raise HTTPException(status_code=400, detail="Project has no premise")
    
    premise_doc = await db.premises.find_one({"id": project["premise_id"]})
    if not premise_doc:
        raise HTTPException(status_code=404, detail="Premise not found")
    
    premise = Premise(**premise_doc)
    
    # Use project AI config if not provided
    if ai_config is None:
        if "ai_config" in project:
            ai_config = AIConfig(**project["ai_config"])
        else:
            ai_config = AIConfig()
    
    logger.info(f"Using model: {ai_config.model_name}")
    
    # Try to get constraints from premise builder session if this project came from wizard
    content_restrictions = []
    tropes_to_avoid = []
    
    # Check if there's a premise builder session linked to this project
    builder_session = await db.premise_builder_sessions.find_one({"project_id": project_id})
    if builder_session and builder_session.get("constraints_profile"):
        constraints = builder_session["constraints_profile"]
        content_restrictions = constraints.get("content_restrictions", [])
        tropes_to_avoid = constraints.get("tropes_to_avoid", [])
        logger.info(f"Found builder constraints: restrictions={content_restrictions}, tropes={tropes_to_avoid}")
    
    try:
        logger.info(f"Calling generate_story_bible_from_premise with premise_id={premise.id}")
        logger.info(f"Premise content length: {len(premise.content)} chars")
        logger.info(f"Premise has expanded_content: {hasattr(premise, 'expanded_content')}")
        logger.info(f"Content restrictions: {content_restrictions}")
        logger.info(f"Tropes to avoid: {tropes_to_avoid}")
        logger.info(f"AI config: model={ai_config.model_name}, provider={ai_config.provider}")
        
        # Generate Story Bible with constraints
        try:
            story_bible = await generate_story_bible_from_premise(
                premise, 
                ai_config,
                content_restrictions=content_restrictions,
                tropes_to_avoid=tropes_to_avoid
            )
            logger.info(f"Story Bible generation completed successfully")
        except Exception as gen_error:
            logger.error(f"Story Bible generation service error: {gen_error}", exc_info=True)
            raise
        
        # Save to database
        story_bible_dict = story_bible.model_dump()
        
        # Check if Story Bible already exists
        existing = await db.story_bibles.find_one({"project_id": project_id})
        if existing:
            # Update existing
            story_bible.id = existing["id"]
            story_bible.version = existing.get("version", 1) + 1
            story_bible_dict = story_bible.model_dump()
            await db.story_bibles.replace_one({"id": story_bible.id}, story_bible_dict)
            logger.info(f"Updated existing Story Bible: {story_bible.id}")
        else:
            # Insert new
            await db.story_bibles.insert_one(story_bible_dict)
            logger.info(f"Created new Story Bible: {story_bible.id}")
        
        # Update project to reference Story Bible
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"story_bible_id": story_bible.id}}
        )
        
        logger.info(f"Story Bible generation complete: {story_bible.id}")
        
        return StoryBibleResponse(story_bible=story_bible)
        
    except Exception as e:
        logger.error(f"Story Bible generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Story Bible generation failed: {str(e)}")


@router.get("/projects/{project_id}/story-bible", response_model=StoryBibleResponse)
async def get_story_bible(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get Story Bible for a project."""
    logger.info(f"Story Bible retrieval for project_id={project_id}")
    
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get Story Bible
    story_bible_id = project.get("story_bible_id")
    if not story_bible_id:
        raise HTTPException(status_code=404, detail="Project has no Story Bible")
    
    story_bible_doc = await db.story_bibles.find_one({"id": story_bible_id})
    if not story_bible_doc:
        raise HTTPException(status_code=404, detail="Story Bible not found")
    
    story_bible = StoryBible(**story_bible_doc)
    
    return StoryBibleResponse(story_bible=story_bible)


@router.put("/projects/{project_id}/story-bible", response_model=StoryBibleResponse)
async def update_story_bible(
    project_id: str,
    request: UpdateStoryBibleRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update Story Bible with manual edits."""
    logger.info(f"Story Bible update for project_id={project_id}")
    
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get existing Story Bible
    story_bible_id = project.get("story_bible_id")
    if not story_bible_id:
        raise HTTPException(status_code=404, detail="Project has no Story Bible")
    
    existing_doc = await db.story_bibles.find_one({"id": story_bible_id})
    if not existing_doc:
        raise HTTPException(status_code=404, detail="Story Bible not found")
    
    existing = StoryBible(**existing_doc)
    
    # Update fields
    existing.characters = request.characters
    existing.settings = request.settings
    existing.themes = request.themes
    existing.humor_style = request.humor_style
    existing.tone_notes = request.tone_notes
    existing.genre_guidelines = request.genre_guidelines
    existing.main_plot_arc = request.main_plot_arc
    existing.subplots = request.subplots
    existing.key_milestones = request.key_milestones
    existing.version += 1
    
    from datetime import datetime
    existing.updated_at = datetime.utcnow()
    
    # Save
    updated_dict = existing.model_dump()
    await db.story_bibles.replace_one({"id": story_bible_id}, updated_dict)
    
    logger.info(f"Story Bible updated: {story_bible_id} v{existing.version}")
    
    return StoryBibleResponse(story_bible=existing)


@router.delete("/projects/{project_id}/story-bible")
async def delete_story_bible(
    project_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete Story Bible (for regeneration)."""
    logger.info(f"Story Bible deletion for project_id={project_id}")
    
    # Get project
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    story_bible_id = project.get("story_bible_id")
    if not story_bible_id:
        raise HTTPException(status_code=404, detail="Project has no Story Bible")
    
    # Delete Story Bible
    result = await db.story_bibles.delete_one({"id": story_bible_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Story Bible not found")
    
    # Update project
    await db.projects.update_one(
        {"id": project_id},
        {"$unset": {"story_bible_id": ""}}
    )
    
    logger.info(f"Story Bible deleted: {story_bible_id}")
    
    return {"message": "Story Bible deleted successfully"}


class EnhanceTextRequest(BaseModel):
    text: str
    instruction: str


@router.post("/projects/{project_id}/enhance-text")
async def enhance_text(
    project_id: str,
    request: EnhanceTextRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Enhance text using AI for Story Bible editing.
    
    Takes a text selection and an enhancement instruction,
    returns the enhanced version.
    """
    logger.info(f"Text enhancement requested for project_id={project_id}")
    logger.info(f"Text length: {len(request.text)}, Instruction: {request.instruction}")
    
    # Get project to check AI config
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get AI config from project or use default
    ai_config = AIConfig()
    if "ai_config" in project:
        ai_config = AIConfig(**project["ai_config"])
    
    try:
        prompt = f"""{request.instruction}

Original text:
{request.text}

Enhanced version:"""
        
        enhanced = await generate_ai_content(
            prompt=prompt,
            ai_config=ai_config,
            max_tokens=2000,
            temperature=0.8
        )
        
        logger.info(f"Text enhancement complete. Original: {len(request.text)} Enhanced: {len(enhanced)}")
        
        return {
            "enhanced_text": enhanced.strip(),
            "original_length": len(request.text),
            "enhanced_length": len(enhanced)
        }
        
    except Exception as e:
        logger.error(f"Text enhancement failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Text enhancement failed: {str(e)}")

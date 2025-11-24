"""
Project API endpoints.

Handles CRUD operations for projects, premises, and outline management.
"""

from typing import List, Optional
from uuid import uuid4

import structlog
from fastapi import APIRouter, HTTPException, status, Query
from pydantic import BaseModel

from backend.config.settings import get_settings
from backend.models.database import get_database
from backend.models.schemas import (
    CreateProjectRequest,
    Project,
    ProjectResponse,
    ProjectListResponse,
    Premise,
    ProjectStatus,
)

logger = structlog.get_logger()
router = APIRouter()


@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Project",
    description="Create a new novel project with premise"
)
async def create_project(request: CreateProjectRequest) -> ProjectResponse:
    """
    Create a new novel generation project.
    
    Args:
        request: Project creation parameters including premise
        
    Returns:
        ProjectResponse: Created project with premise
    """
    db = await get_database()
    settings = get_settings()
    
    # Create project (ai_config will use default_factory if not provided)
    project_data = {
        "id": str(uuid4()),
        "title": request.title or f"{request.genre} Novel",
        "genre": request.genre,
        "subgenre": request.subgenre,
        "total_chapters": request.target_chapter_count,
        "status": ProjectStatus.DRAFT,
    }
    
    # Only include ai_config if explicitly provided
    if request.ai_config:
        project_data["ai_config"] = request.ai_config
    
    project = Project(**project_data)
    
    # Create premise
    premise = Premise(
        id=str(uuid4()),
        project_id=project.id,
        genre=request.genre,
        subgenre=request.subgenre,
        target_word_count=request.target_word_count,
        target_chapter_count=request.target_chapter_count,
        content=request.premise,
    )
    premise.update_word_count()
    
    # Link premise to project
    project.premise_id = premise.id
    
    # Save to database
    await db.projects.insert_one(project.model_dump())
    await db.premises.insert_one(premise.model_dump())
    
    logger.info(
        "project_created",
        project_id=project.id,
        genre=project.genre,
        chapters=project.total_chapters,
        premise_words=premise.word_count
    )
    
    return ProjectResponse(project=project, premise=premise)


@router.get(
    "",
    response_model=ProjectListResponse,
    summary="List Projects",
    description="List all projects with pagination"
)
async def list_projects(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[ProjectStatus] = Query(default=None, description="Filter by status"),
) -> ProjectListResponse:
    """
    List projects with pagination and optional status filtering.
    
    Args:
        page: Page number (1-indexed)
        page_size: Number of items per page
        status_filter: Optional status filter
        
    Returns:
        ProjectListResponse: Paginated list of projects
    """
    db = await get_database()
    
    query = {}
    if status_filter:
        query["status"] = status_filter.value
    
    # Count total
    total = await db.projects.count_documents(query)
    
    # Fetch paginated results
    skip = (page - 1) * page_size
    cursor = db.projects.find(query).sort("created_at", -1).skip(skip).limit(page_size)
    
    projects = [Project(**doc) async for doc in cursor]
    
    return ProjectListResponse(
        projects=projects,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get Project",
    description="Get project details with premise and outline"
)
async def get_project(project_id: str) -> ProjectResponse:
    """
    Retrieve a project by ID with embedded premise and outline.
    
    Args:
        project_id: Project UUID
        
    Returns:
        ProjectResponse: Project with nested data
        
    Raises:
        HTTPException: 404 if project not found
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
    
    # Fetch premise if exists
    premise = None
    if project.premise_id:
        premise_doc = await db.premises.find_one({"id": project.premise_id})
        if premise_doc:
            premise = Premise(**premise_doc)
    
    # Fetch Story Bible if exists
    story_bible = None
    if project.story_bible_id:
        story_bible_doc = await db.story_bibles.find_one({"id": project.story_bible_id})
        if story_bible_doc:
            from backend.models.schemas import StoryBible
            story_bible = StoryBible(**story_bible_doc)
    
    # Fetch outline if exists
    outline = None
    if project.outline_id:
        outline_doc = await db.outlines.find_one({"id": project.outline_id})
        if outline_doc:
            from backend.models.schemas import Outline
            outline = Outline(**outline_doc)
    
    return ProjectResponse(project=project, premise=premise, story_bible=story_bible, outline=outline)


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete Project",
    description="Delete a project and all associated data"
)
async def delete_project(project_id: str) -> None:
    """
    Delete a project and all associated premises, outlines, chapters, summaries.
    
    Args:
        project_id: Project UUID
        
    Raises:
        HTTPException: 404 if project not found
    """
    db = await get_database()
    
    # Check project exists
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Delete all associated data
    await db.projects.delete_one({"id": project_id})
    await db.premises.delete_many({"project_id": project_id})
    await db.story_bibles.delete_many({"project_id": project_id})
    await db.outlines.delete_many({"project_id": project_id})
    await db.chapters.delete_many({"project_id": project_id})
    await db.summaries.delete_many({"project_id": project_id})
    
    logger.info("project_deleted", project_id=project_id)

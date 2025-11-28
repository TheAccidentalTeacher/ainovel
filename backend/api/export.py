"""
Export API endpoints for manuscript downloads.

Provides endpoints to export projects as DOCX, PDF, and other formats.
"""

from fastapi import APIRouter, HTTPException, Path
from fastapi.responses import StreamingResponse
import structlog

from models.database import get_database
from models.schemas import Project, Premise, Chapter
from services.export_service import generate_manuscript_docx, generate_manuscript_markdown

logger = structlog.get_logger()

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/{project_id}/manuscript.docx")
async def export_manuscript_docx(
    project_id: str = Path(..., description="Project ID"),
):
    """
    Export complete manuscript as DOCX file.
    
    Combines all generated chapters into a single formatted Word document
    with title page and proper chapter headings.
    """
    db = await get_database()
    
    # Fetch project
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    project = Project(**project_doc)
    
    # Fetch premise
    premise_doc = await db.premises.find_one({"id": project.premise_id})
    if not premise_doc:
        raise HTTPException(status_code=404, detail="Premise not found")
    premise = Premise(**premise_doc)
    
    # Fetch all chapters
    chapters_docs = await db.chapters.find({
        "project_id": project_id
    }).sort("chapter_index", 1).to_list(length=None)
    
    if not chapters_docs:
        raise HTTPException(
            status_code=400,
            detail="No chapters generated yet. Generate at least one chapter before exporting."
        )
    
    chapters = [Chapter(**doc) for doc in chapters_docs]
    
    logger.info(
        "exporting_manuscript_docx",
        project_id=project_id,
        project_title=project.title,
        chapter_count=len(chapters),
        total_words=sum(ch.word_count for ch in chapters),
    )
    
    # Generate DOCX
    try:
        docx_buffer = generate_manuscript_docx(
            project=project,
            premise=premise,
            chapters=chapters,
        )
        
        # Create safe filename
        safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in project.title)
        filename = f"{safe_title}.docx"
        
        return StreamingResponse(
            docx_buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except Exception as e:
        logger.error(
            "export_failed",
            project_id=project_id,
            error=str(e),
            error_type=type(e).__name__,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate manuscript: {str(e)}"
        )


@router.get("/{project_id}/manuscript.md")
async def export_manuscript_markdown(
    project_id: str = Path(..., description="Project ID"),
):
    """
    Export complete manuscript as Markdown file.
    
    Combines all generated chapters into a single Markdown document
    with title page and proper chapter headings.
    """
    db = await get_database()
    
    # Fetch project
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    project = Project(**project_doc)
    
    # Fetch premise
    premise_doc = await db.premises.find_one({"id": project.premise_id})
    if not premise_doc:
        raise HTTPException(status_code=404, detail="Premise not found")
    premise = Premise(**premise_doc)
    
    # Fetch all chapters
    chapters_docs = await db.chapters.find({
        "project_id": project_id
    }).sort("chapter_index", 1).to_list(length=None)
    
    if not chapters_docs:
        raise HTTPException(
            status_code=400,
            detail="No chapters generated yet. Generate at least one chapter before exporting."
        )
    
    chapters = [Chapter(**doc) for doc in chapters_docs]
    
    logger.info(
        "exporting_manuscript_markdown",
        project_id=project_id,
        project_title=project.title,
        chapter_count=len(chapters),
        total_words=sum(ch.word_count for ch in chapters),
    )
    
    # Generate Markdown
    try:
        markdown_content = generate_manuscript_markdown(
            project=project,
            premise=premise,
            chapters=chapters,
        )
        
        # Create safe filename
        safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in project.title)
        filename = f"{safe_title}.md"
        
        return StreamingResponse(
            iter([markdown_content.encode('utf-8')]),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    
    except Exception as e:
        logger.error(
            "export_markdown_failed",
            project_id=project_id,
            error=str(e),
            error_type=type(e).__name__,
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate markdown: {str(e)}"
        )


@router.get("/{project_id}/manuscript-text")
async def get_manuscript_text(
    project_id: str = Path(..., description="Project ID"),
):
    """
    Get manuscript text for direct use in book cover designer.
    Returns plain text without download headers.
    """
    db = await get_database()
    
    # Fetch project
    project_doc = await db.projects.find_one({"id": project_id})
    if not project_doc:
        raise HTTPException(status_code=404, detail="Project not found")
    project = Project(**project_doc)
    
    # Fetch premise
    premise_doc = await db.premises.find_one({"id": project.premise_id})
    if not premise_doc:
        raise HTTPException(status_code=404, detail="Premise not found")
    premise = Premise(**premise_doc)
    
    # Fetch all chapters
    chapters_docs = await db.chapters.find({
        "project_id": project_id
    }).sort("chapter_index", 1).to_list(length=None)
    
    if not chapters_docs:
        raise HTTPException(
            status_code=400,
            detail="No chapters generated yet."
        )
    
    chapters = [Chapter(**doc) for doc in chapters_docs]
    
    # Generate markdown (we'll use markdown format for consistency)
    markdown_content = generate_manuscript_markdown(
        project=project,
        premise=premise,
        chapters=chapters,
    )
    
    return {
        "project_id": project_id,
        "title": project.title,
        "text": markdown_content,
        "word_count": sum(ch.word_count for ch in chapters),
        "chapter_count": len(chapters)
    }

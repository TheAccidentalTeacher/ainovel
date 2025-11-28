"""
API routes for book cover generation.

This module is completely isolated and feature-flagged.
Routes will be commented out in main.py until ready.
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import List
from io import BytesIO
import base64
import json

from config.settings import Settings, get_settings
from models.database import get_database
from .schemas import (
    StoryAnalysisRequest, StoryAnalysisResponse,
    DesignBriefRequest, DesignBriefResponse,
    ImageGenerationRequest, ImageGenerationResponse,
    TypographyConfigRequest, TypographyConfigResponse,
    ExportRequest, ExportResponse,
    BookCoverListResponse, BookCoverDetailResponse,
    AutoPopulateRequest, AutoPopulateResponse,
    ErrorResponse
)

router = APIRouter()


# ============================================================================
# FEATURE FLAG CHECK
# ============================================================================

async def check_feature_enabled(settings: Settings = Depends(get_settings)):
    """Dependency to check if book cover feature is enabled."""
    if not settings.book_covers_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Book cover generation feature is not enabled. Set BOOK_COVERS_ENABLED=true in environment."
        )


@router.get("/health")
async def health_check(settings: Settings = Depends(get_settings)):
    """Check if book cover feature is available."""
    return {
        "status": "available" if settings.book_covers_enabled else "disabled",
        "feature": "book_covers",
        "version": "0.1.0"
    }


# ============================================================================
# STORY ANALYSIS
# ============================================================================

@router.post(
    "/analyze-manuscript",
    response_model=StoryAnalysisResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Analyze manuscript text for cover design",
    description="Extract genre, themes, tone from raw manuscript text (standalone mode)"
)
async def analyze_manuscript(request: dict):
    """
    Analyze raw manuscript text to extract design-relevant information.
    
    This is a standalone endpoint that doesn't require a project ID.
    Perfect for generating book covers from completed manuscripts.
    
    Returns structured analysis for design brief generation.
    """
    from .services.analyzer import StoryAnalyzer
    
    manuscript_text = request.get('manuscript_text', '')
    
    if not manuscript_text or len(manuscript_text) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Manuscript text must be at least 100 characters"
        )
    
    # Analyze the manuscript
    analyzer = StoryAnalyzer()
    analysis = await analyzer.analyze_text(manuscript_text)
    
    # Map to response schema
    return StoryAnalysisResponse(
        project_id='standalone',
        genre=analysis.get('genre', 'General Fiction'),
        subgenre=analysis.get('subgenre'),
        tone=analysis.get('tone', 'engaging'),
        themes=analysis.get('themes', ['compelling', 'engaging']),
        setting=analysis.get('setting'),
        key_elements=analysis.get('key_elements', ['text', 'color', 'simplicity']),
        mood=analysis.get('mood', 'engaging, compelling')
    )


@router.post(
    "/analyze-story",
    response_model=StoryAnalysisResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Analyze story for cover design",
    description="Extract genre, themes, tone, and visual elements from story premise"
)
async def analyze_story(request: StoryAnalysisRequest):
    """
    Analyze a story's premise to extract design-relevant information.
    
    This endpoint will:
    1. Fetch project premise data
    2. Extract genre, tropes, themes
    3. Identify tone and mood
    4. Suggest visual approaches
    
    Returns structured analysis for design brief generation.
    """
    from models.database import get_database
    from .services.analyzer import StoryAnalyzer
    
    # Fetch project from database
    db = await get_database()
    project = await db.projects.find_one({"id": request.project_id})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {request.project_id} not found"
        )
    
    # Analyze the project
    analyzer = StoryAnalyzer()
    analysis = await analyzer.analyze_project(project)
    
    # Map to response schema
    return StoryAnalysisResponse(
        project_id=request.project_id,
        genre=analysis.get('genre', 'unknown'),
        subgenre=analysis.get('subgenre'),
        tone=analysis.get('tone', 'neutral'),
        themes=project.get('themes', []),
        setting=project.get('setting'),
        key_elements=analysis.get('key_elements', []),
        mood=' '.join(analysis.get('mood_keywords', []))
    )


# ============================================================================
# DESIGN BRIEF GENERATION
# ============================================================================

@router.post(
    "/generate-brief",
    response_model=DesignBriefResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Generate design brief",
    description="Create AI-powered design brief with color schemes, typography, and DALL-E prompt"
)
async def generate_design_brief(http_request: Request, request: DesignBriefRequest):
    """
    Generate a comprehensive design brief using AI.
    
    This endpoint will:
    1. Use story analysis (or compute if not provided)
    2. Apply genre conventions from comprehensive guide
    3. Generate color scheme recommendations
    4. Suggest typography styles
    5. Create optimized DALL-E 3 prompt
    
    Returns complete design brief for image generation.
    """
    from models.database import get_database
    from .services.analyzer import StoryAnalyzer
    from .services.brief_generator import DesignBriefGenerator
    from .models import DesignBrief, ColorScheme, TypographyRecommendation
    from uuid import uuid4
    
    # Log RAW request body BEFORE Pydantic validation
    try:
        raw_body = await http_request.body()
        raw_json = json.loads(raw_body.decode('utf-8'))
        print("\n" + "🔴"*40)
        print("[RAW REQUEST] Raw JSON received from frontend:")
        print(json.dumps(raw_json, indent=2))
        if 'story_analysis' in raw_json and raw_json['story_analysis']:
            sa = raw_json['story_analysis']
            print(f"\n[RAW REQUEST] story_analysis.themes RAW VALUE: {repr(sa.get('themes'))}")
            print(f"[RAW REQUEST] story_analysis.themes RAW TYPE: {type(sa.get('themes'))}")
            print(f"[RAW REQUEST] story_analysis.key_elements RAW VALUE: {repr(sa.get('key_elements'))}")
        print("🔴"*40 + "\n")
    except Exception as e:
        print(f"[RAW REQUEST] Error logging raw body: {e}")
    
    print("\n" + "="*80)
    print("[BRIEF] Starting design brief generation")
    print("="*80)
    print(f"[BRIEF] Project ID: {request.project_id}")
    print(f"[BRIEF] Has story_analysis: {request.story_analysis is not None}")
    if request.story_analysis:
        print(f"[BRIEF] Story analysis data:")
        print(f"  - genre: {request.story_analysis.genre}")
        print(f"  - subgenre: {request.story_analysis.subgenre}")
        print(f"  - tone: {request.story_analysis.tone}")
        print(f"  - themes: {request.story_analysis.themes}")
        print(f"  - themes TYPE: {type(request.story_analysis.themes)}")
        print(f"  - themes LENGTH: {len(request.story_analysis.themes) if isinstance(request.story_analysis.themes, list) else 'NOT A LIST'}")
        print(f"  - themes CONTENT: {repr(request.story_analysis.themes)}")
        print(f"  - key_elements: {request.story_analysis.key_elements}")
        print(f"  - key_elements TYPE: {type(request.story_analysis.key_elements)}")
        print(f"  - key_elements CONTENT: {repr(request.story_analysis.key_elements)}")
        print(f"  - mood: {request.story_analysis.mood}")
    print("="*80 + "\n")
    
    db = await get_database()
    analyzer = StoryAnalyzer()
    
    # Get or compute story analysis
    project = None
    if request.story_analysis:
        if request.project_id != 'standalone':
            project = await db.projects.find_one({"id": request.project_id})
        
        if not project:
            # Build lightweight project data from provided story analysis (standalone mode)
            project = {
                'id': request.project_id,
                'title': 'Standalone Manuscript',
                'author': 'Unknown Author',
                'premise': request.story_analysis.mood or 'No premise provided',
                'genre': request.story_analysis.genre,
                'themes': request.story_analysis.themes or [],
                'tone': request.story_analysis.tone,
                'setting': request.story_analysis.setting,
                'key_elements': request.story_analysis.key_elements or [],
                'characters': []
            }
        
        analysis = await analyzer.analyze_project(project)
    else:
        # Fetch project and analyze
        project = await db.projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project {request.project_id} not found"
            )
        analysis = await analyzer.analyze_project(project)
    
    # Generate design brief
    generator = DesignBriefGenerator()
    brief_data = await generator.generate_brief(analysis, project)
    
    # Create DesignBrief model instance
    brief = DesignBrief(
        id=str(uuid4()),
        project_id=request.project_id,
        genre=brief_data['genre'],
        subgenre=brief_data.get('subgenre'),
        tone=brief_data['tone'],
        visual_approach=brief_data['visual_approach'],
        color_scheme=ColorScheme(**brief_data['color_scheme']),
        imagery_style=brief_data['imagery_style'],
        composition=brief_data['composition'],
        typography_recommendations=TypographyRecommendation(**brief_data['typography_recommendations']),
        reference_covers=brief_data.get('reference_covers', []),
        dalle_prompt=brief_data['dalle_prompt']
    )
    
    # Save to database
    await db.cover_design_briefs.insert_one(brief.model_dump())
    
    # Return response
    return DesignBriefResponse(
        id=brief.id,
        project_id=brief.project_id,
        genre=brief.genre,
        subgenre=brief.subgenre,
        tone=brief.tone,
        visual_approach=brief.visual_approach,
        color_scheme=brief.color_scheme,
        imagery_style=brief.imagery_style,
        composition=brief.composition,
        typography_recommendations=brief.typography_recommendations,
        reference_covers=brief.reference_covers,
        dalle_prompt=brief.dalle_prompt,
        created_at=brief.created_at
    )


# ============================================================================
# IMAGE GENERATION
# ============================================================================

@router.post(
    "/generate-image",
    response_model=ImageGenerationResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Generate cover image",
    description="Generate book cover base image using DALL-E 3"
)
async def generate_cover_image(request: ImageGenerationRequest):
    """
    Generate book cover image using DALL-E 3.
    
    This endpoint will:
    1. Fetch design brief
    2. Call DALL-E 3 API with optimized prompt
    3. Generate requested number of variations
    4. Store images and create cover iterations
    5. Return URLs and metadata
    
    Returns generated images ready for typography overlay.
    """
    from models.database import get_database
    from .services.image_generator import ImageGenerator
    from .models import BookCover, CoverIteration
    from uuid import uuid4
    
    db = await get_database()
    
    # Fetch design brief
    brief = await db.cover_design_briefs.find_one({"id": request.design_brief_id})
    if not brief:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Design brief {request.design_brief_id} not found"
        )
    
    # Use custom prompt or brief's prompt
    prompt = request.custom_prompt or brief.get('dalle_prompt')
    
    # Generate images
    generator = ImageGenerator()
    variations = await generator.generate_variations(
        dalle_prompt=prompt,
        num_variations=request.num_variations,
        size="1024x1792"  # Portrait for book covers
    )
    
    # Create BookCover document
    book_cover_id = str(uuid4())
    book_cover = BookCover(
        id=book_cover_id,
        project_id=brief['project_id'],
        design_brief_id=request.design_brief_id,
        base_image_url=variations[0]['image_url'],  # Use first variation as base
        genre=brief.get('genre', 'unknown'),
        status='generated',
        version=1
    )
    
    await db.book_covers.insert_one(book_cover.model_dump())
    
    # Create CoverIteration documents for each variation
    iterations = []
    for var in variations:
        iteration = CoverIteration(
            id=str(uuid4()),
            book_cover_id=book_cover_id,
            image_url=var['image_url'],
            prompt_used=var['prompt_used'],
            variation_number=var['variation_number'],
            metadata=var.get('metadata', {})
        )
        await db.cover_iterations.insert_one(iteration.model_dump())
        iterations.append(iteration.model_dump())
    
    return ImageGenerationResponse(
        book_cover_id=book_cover_id,
        iterations=iterations,
        status='success',
        message=f"Generated {len(variations)} variations successfully"
    )


# ============================================================================
# TYPOGRAPHY
# ============================================================================

@router.post(
    "/add-typography",
    response_model=TypographyConfigResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Add typography to cover",
    description="Overlay title and author text with professional typography"
)
async def add_typography(request: TypographyConfigRequest):
    """
    Add typography overlay to generated cover image.
    
    This endpoint will:
    1. Fetch base cover image
    2. Apply title text with selected font
    3. Apply author text
    4. Handle auto-positioning or use manual positions
    5. Apply effects (shadows, outlines, gradients)
    6. Generate final cover image
    
    Returns final cover with typography applied.
    """
    from models.database import get_database
    from .services.typography import TypographyEngine
    from .models import TextPosition
    import base64
    
    db = await get_database()
    
    # Fetch book cover
    cover = await db.book_covers.find_one({"id": request.book_cover_id})
    if not cover:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book cover {request.book_cover_id} not found"
        )
    
    # Get typography recommendations from design brief if available
    typography_config = {}
    if cover.get('design_brief_id'):
        brief = await db.cover_design_briefs.find_one({"id": cover['design_brief_id']})
        if brief and brief.get('typography_recommendations'):
            typo_rec = brief['typography_recommendations']
            typography_config = {
                'title_font': request.title_font or typo_rec.get('title_font', 'Montserrat'),
                'author_font': request.author_font or typo_rec.get('author_font', 'Open Sans'),
                'title_weight': '700',
                'author_weight': '400'
            }
    
    # Apply manual overrides
    if request.title_font:
        typography_config['title_font'] = request.title_font
    if request.author_font:
        typography_config['author_font'] = request.author_font
    
    # Use typography engine
    engine = TypographyEngine()
    final_image, positions = await engine.add_text_to_cover(
        image_url=cover['base_image_url'],
        title=request.title_text,
        author=request.author_text,
        typography_config=typography_config,
        title_color=request.title_color,
        author_color=request.author_color,
        auto_position=request.auto_position,
        title_position=request.title_position,
        author_position=request.author_position
    )
    
    # Convert image to base64 for now (TODO: upload to storage in Phase 4)
    buffered = BytesIO()
    final_image.save(buffered, format="PNG", dpi=(300, 300))
    img_str = base64.b64encode(buffered.getvalue()).decode()
    final_image_url = f"data:image/png;base64,{img_str}"
    
    # Update book cover with final image
    await db.book_covers.update_one(
        {"id": request.book_cover_id},
        {"$set": {
            "final_image_url": final_image_url,
            "status": "typography_applied",
            "title_text": request.title_text,
            "author_text": request.author_text
        }}
    )
    
    return TypographyConfigResponse(
        book_cover_id=request.book_cover_id,
        final_image_url=final_image_url,
        title_position=TextPosition(**positions['title']),
        author_position=TextPosition(**positions['author']),
        status="success",
        message="Typography applied successfully"
    )


# ============================================================================
# EXPORT
# ============================================================================

@router.post(
    "/export",
    response_model=ExportResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Export cover in specific format",
    description="Export finalized cover for KDP, IngramSpark, or custom specifications"
)
async def export_cover(request: ExportRequest):
    """
    Export book cover in print-ready or ebook format.
    
    Supported formats:
    - ebook: 1600x2560px JPEG, RGB, 300 DPI (Amazon KDP ebook)
    - print_front: 1800x2700px (6x9" at 300 DPI)
    - social_square: 1080x1080px for Instagram/Facebook
    - social_story: 1080x1920px for Instagram Stories
    - thumbnail: 400x640px for websites
    
    Returns download URL for exported file.
    """
    from models.database import get_database
    from .services.exporter import CoverExporter
    from PIL import Image
    import base64
    import io
    
    db = await get_database()
    
    # Fetch book cover
    cover = await db.book_covers.find_one({"id": request.book_cover_id})
    if not cover:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book cover {request.book_cover_id} not found"
        )
    
    # Get the final image (with typography) or base image
    image_url = cover.get('final_image_url') or cover.get('base_image_url')
    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cover has no image to export"
        )
    
    # Load image
    if image_url.startswith('data:image'):
        # Base64 encoded image
        img_data = image_url.split(',')[1]
        image_bytes = base64.b64decode(img_data)
        image = Image.open(io.BytesIO(image_bytes))
    else:
        # URL to fetch
        import requests
        response = requests.get(image_url)
        image = Image.open(io.BytesIO(response.content))
    
    # Export using exporter service
    exporter = CoverExporter()
    exported_file, metadata = await exporter.export_format(
        image=image,
        format_name=request.format,
        book_title=cover.get('title_text', 'Untitled'),
        author=cover.get('author_text', 'Unknown Author'),
        custom_width=request.custom_width,
        custom_height=request.custom_height,
        dpi=request.dpi
    )
    
    # Convert to base64 for now (TODO: upload to storage in Phase 4)
    exported_file.seek(0)
    file_data = exported_file.read()
    file_b64 = base64.b64encode(file_data).decode()
    
    format_type = metadata.get('format', 'JPEG').lower()
    if format_type == 'pdf':
        mime_type = 'application/pdf'
    else:
        mime_type = f'image/{format_type}'
    
    file_url = f"data:{mime_type};base64,{file_b64}"
    
    return ExportResponse(
        book_cover_id=request.book_cover_id,
        format=request.format,
        file_url=file_url,
        file_size_bytes=len(file_data),
        dimensions={
            "width": metadata['width'],
            "height": metadata['height']
        },
        dpi=metadata['dpi'],
        status="success",
        message=f"Cover exported in {request.format} format successfully"
    )


# ============================================================================
# COVER CRUD
# ============================================================================

@router.get(
    "/project/{project_id}",
    response_model=BookCoverListResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="List covers for project",
    description="Get all book covers associated with a project"
)
async def list_project_covers(project_id: str):
    """
    List all book covers for a project.
    
    Returns all versions and iterations of covers created for this project.
    """
    from models.database import get_database
    
    db = await get_database()
    covers = await db.book_covers.find({"project_id": project_id}).to_list(length=100)
    
    return BookCoverListResponse(
        project_id=project_id,
        covers=covers,
        total=len(covers)
    )


@router.get(
    "/{cover_id}",
    response_model=BookCoverDetailResponse,
    dependencies=[Depends(check_feature_enabled)],
    summary="Get cover details",
    description="Get detailed information about a specific book cover"
)
async def get_cover_details(cover_id: str):
    """
    Get detailed book cover information.
    
    Includes design brief, all iterations, and metadata.
    """
    from models.database import get_database
    
    db = await get_database()
    
    # Fetch cover
    cover = await db.book_covers.find_one({"id": cover_id})
    if not cover:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book cover {cover_id} not found"
        )
    
    # Fetch related design brief
    brief = None
    if cover.get('design_brief_id'):
        brief = await db.cover_design_briefs.find_one({"id": cover['design_brief_id']})
    
    # Fetch all iterations
    iterations = await db.cover_iterations.find({"book_cover_id": cover_id}).to_list(length=100)
    
    return BookCoverDetailResponse(
        cover=cover,
        design_brief=brief,
        iterations=iterations
    )


@router.delete(
    "/{cover_id}",
    dependencies=[Depends(check_feature_enabled)],
    summary="Delete book cover",
    description="Delete a book cover and all associated iterations"
)
async def delete_cover(cover_id: str):
    """
    Delete a book cover.
    
    This will also delete all associated iterations and files.
    """
    from models.database import get_database
    
    db = await get_database()
    
    # Check if cover exists
    cover = await db.book_covers.find_one({"id": cover_id})
    if not cover:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book cover {cover_id} not found"
        )
    
    # Delete all iterations
    await db.cover_iterations.delete_many({"book_cover_id": cover_id})
    
    # Delete the cover
    await db.book_covers.delete_one({"id": cover_id})
    
    # TODO: Delete image files from storage when file storage is implemented
    
    return {
        "success": True,
        "message": f"Book cover {cover_id} and associated iterations deleted successfully"
    }


# ============================================================================
# AUTO-POPULATE
# ============================================================================

@router.post(
    "/auto-populate/{project_id}",
    response_model=AutoPopulateResponse,
    dependencies=[Depends(check_feature_enabled)]
)
async def auto_populate_cover_data(
    project_id: str,
    request: AutoPopulateRequest,
    db=Depends(get_database)
):
    """
    Auto-populate book cover fields using AI.
    
    Generates creative content (title, author) and technical presets
    (colors, typography) based on project data and existing analysis.
    """
    from .services.auto_populator import AutoPopulateService
    
    # Get project data
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found"
        )
    
    # Get existing analysis if available
    existing_analysis = None
    if request.use_existing_analysis:
        cover = await db.book_covers.find_one(
            {"project_id": project_id},
            sort=[("created_at", -1)]
        )
        if cover and cover.get("story_analysis"):
            existing_analysis = cover["story_analysis"]
    
    # Generate auto-populate data
    auto_populator = AutoPopulateService()
    
    try:
        auto_data = await auto_populator.generate_auto_populate_data(
            project_title=project.get("title", "Untitled Project"),
            project_premise=project.get("premise", "") or project.get("description", ""),
            genre=request.genre_override,
            existing_analysis=existing_analysis
        )
        
        # Get technical presets
        genre_for_preset = auto_data.get("genre_detected", request.genre_override or "general")
        presets = auto_populator.get_preset_by_genre(genre_for_preset)
        
        # Combine data
        response_data = {
            **auto_data,
            "technical_presets": presets,
            "project_id": project_id
        }
        
        return AutoPopulateResponse(**response_data)
        
    except Exception as e:
        print(f"Error auto-populating: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating auto-populate data: {str(e)}"
        )

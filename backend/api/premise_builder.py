"""
Premise Builder API endpoints.

Multi-step wizard for guided premise creation with AI assistance.
"""

import logging
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.premise_builder import (
    BuilderSessionStatus,
    PremiseBuilderSession,
    CreateBuilderSessionRequest,
    UpdateBuilderStepRequest,
    AIAssistRequest,
    AIAssistResponse,
    GenerateBaselinePremiseRequest,
    GeneratePremiumPremiseRequest,
    CompleteBuilderSessionRequest,
    BuilderSessionResponse,
    BuilderProgressSummary,
    ProjectStub,
    GenreProfile,
    ToneThemeProfile,
    CharacterSeeds,
    PlotIntent,
    StructureTargets,
    ConstraintsProfile,
)
from models.database import get_database
from services.premise_builder_service import PremiseBuilderService
from services.premise_builder_story_bible_service import PremiseBuilderStoryBibleService


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/premise-builder", tags=["premise-builder"])


async def get_db() -> AsyncIOMotorDatabase:
    """Dependency to get database instance."""
    return await get_database()


@router.post("/sessions", response_model=BuilderSessionResponse)
async def create_builder_session(
    request: CreateBuilderSessionRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderSessionResponse:
    """
    Create a new premise builder session.
    
    Optionally attach to existing project or create new standalone session.
    """
    service = PremiseBuilderService(db)
    
    try:
        session = await service.create_session(
            project_id=request.project_id,
            initial_title=request.title
        )
        
        return BuilderSessionResponse(
            session=session,
            next_step=1,
            can_generate_baseline=False,
            can_generate_premium=False,
            can_complete=False
        )
    
    except Exception as e:
        logger.error(f"Failed to create builder session: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")


@router.get("/sessions/{session_id}", response_model=BuilderSessionResponse)
async def get_builder_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderSessionResponse:
    """
    Retrieve existing premise builder session.
    
    Returns full session state with computed flags for available actions.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Compute availability flags
    can_baseline = session.current_step >= 6 and all([
        session.genre_profile,
        session.tone_theme_profile,
        session.character_seeds,
        session.plot_intent,
        session.structure_targets,
        session.constraints_profile
    ])
    
    can_premium = can_baseline and session.baseline_premise is not None
    can_complete = session.premium_premise is not None
    
    return BuilderSessionResponse(
        session=session,
        next_step=min(session.current_step + 1, 8),
        can_generate_baseline=can_baseline,
        can_generate_premium=can_premium,
        can_complete=can_complete
    )


@router.patch("/sessions/{session_id}", response_model=BuilderSessionResponse)
async def update_builder_step(
    session_id: str,
    request: UpdateBuilderStepRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderSessionResponse:
    """
    Update specific step data in builder session.
    
    Validates step ordering and data schema before persisting.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Validate step progression (can update current or next step only)
    if request.step > session.current_step + 1:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot skip to step {request.step}. Complete step {session.current_step + 1} first."
        )
    
    try:
        # Update session with step data
        updated_session = await service.update_step(session_id, request.step, request.data)
        
        # Compute flags
        can_baseline = updated_session.current_step >= 6 and all([
            updated_session.genre_profile,
            updated_session.tone_theme_profile,
            updated_session.character_seeds,
            updated_session.plot_intent,
            updated_session.structure_targets,
            updated_session.constraints_profile
        ])
        
        can_premium = can_baseline and updated_session.baseline_premise is not None
        can_complete = updated_session.premium_premise is not None
        
        return BuilderSessionResponse(
            session=updated_session,
            next_step=min(updated_session.current_step + 1, 8),
            can_generate_baseline=can_baseline,
            can_generate_premium=can_premium,
            can_complete=can_complete
        )
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to update session {session_id} step {request.step}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to update step: {str(e)}")


@router.post("/sessions/{session_id}/ai", response_model=AIAssistResponse)
async def invoke_ai_assistant(
    session_id: str,
    request: AIAssistRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> AIAssistResponse:
    """
    Invoke lightweight AI assistant for current step.
    
    Supports actions like 'expand_character', 'suggest_themes', 'check_conflicts', etc.
    Uses GPT-4o or Claude Haiku for fast, inexpensive responses.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    try:
        response = await service.invoke_ai_assistant(
            session=session,
            action=request.action,
            context=request.context,
            user_input=request.user_input
        )
        
        return response
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"AI assistant failed for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI assistance failed: {str(e)}")


@router.post("/sessions/{session_id}/ai/debug")
async def debug_ai_prompt(
    session_id: str,
    request: AIAssistRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> dict:
    """
    DEBUG endpoint: Shows exact prompt that will be sent to AI.
    
    Returns the full prompt with all genre selections, comedy elements, etc.
    Use this to verify your selections are actually being included.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Build the prompt without actually calling AI
    prompt = service._build_assistant_prompt(
        session=session,
        action=request.action,
        context=request.context,
        user_input=request.user_input
    )
    
    return {
        "session_id": session_id,
        "action": request.action,
        "context": request.context,
        "full_prompt": prompt,
        "prompt_length": len(prompt),
        "comedy_elements_in_context": request.context.get("comedy_elements", []),
        "subgenres_in_context": request.context.get("subgenres", [])
    }


@router.post("/sessions/{session_id}/baseline", response_model=BuilderSessionResponse)
async def generate_baseline_premise(
    session_id: str,
    request: GenerateBaselinePremiseRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderSessionResponse:
    """
    Generate baseline premise synthesis from collected wizard data (Step 7).
    
    Uses GPT-4o to create coherent ~500-700 word premise from step inputs.
    User can iterate with refinement prompts.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Validate minimum prerequisites - need at least genre to generate anything meaningful
    if not session.genre_profile:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate baseline premise. At least genre (step 1) is required."
        )
    
    # Warn if skipping steps but allow generation to proceed
    # The AI will work with whatever information is available
    
    try:
        updated_session = await service.generate_baseline_premise(
            session_id=session_id,
            refinement_prompt=request.refinement_prompt
        )
        
        return BuilderSessionResponse(
            session=updated_session,
            next_step=8,
            can_generate_baseline=True,
            can_generate_premium=True,
            can_complete=False
        )
    
    except Exception as e:
        logger.error(f"Failed to generate baseline premise for {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Baseline generation failed: {str(e)}")


@router.post("/sessions/{session_id}/premium", response_model=BuilderSessionResponse)
async def generate_premium_premise(
    session_id: str,
    request: GeneratePremiumPremiseRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderSessionResponse:
    """
    Generate premium final premise using Claude Sonnet 4.5 or GPT-5 (Step 8).
    
    Produces ~700-1000 word long-form premise with structured metadata.
    This is the artifact that will be used for outline/chapter generation.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    if not session.baseline_premise:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate premium premise. Generate baseline premise first (Step 7)."
        )
    
    try:
        updated_session = await service.generate_premium_premise(
            session_id=session_id,
            refinement_prompt=request.refinement_prompt
        )
        
        return BuilderSessionResponse(
            session=updated_session,
            next_step=8,
            can_generate_baseline=True,
            can_generate_premium=True,
            can_complete=True
        )
    
    except Exception as e:
        logger.error(f"Failed to generate premium premise for {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Premium generation failed: {str(e)}")


@router.post("/sessions/{session_id}/story-bible", response_model=BuilderSessionResponse)
async def generate_story_bible(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderSessionResponse:
    """
    Generate comprehensive story bible from completed premise builder session (Step 9).
    
    Synthesizes all wizard data + 2000-word premium premise into professional
    narrative blueprint with 5 core sections:
    - Characters: Deep profiles with arcs, psychology, relationships (800-1200 words)
    - World: Settings, rules, history, culture (800-1200 words)
    - Themes: Central questions, values, motifs (800-1200 words)
    - Plot: Structure, beats, turning points, subplots (800-1200 words)
    - Style: Voice, tone, POV, prose techniques (800-1200 words)
    
    Total: 4000-6000+ words of novelist-quality narrative foundation.
    
    Prerequisites:
    - Premium premise must exist (Step 8 completed)
    - All wizard steps (0-6) must be completed
    
    Uses Claude Sonnet 4.5 with 100K max_tokens for comprehensive synthesis.
    Applies genre-specific frameworks from 63-source research compilation.
    """
    service = PremiseBuilderService(db)
    story_bible_service = PremiseBuilderStoryBibleService()
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    if not session.premium_premise:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate story bible. Premium premise required (complete Step 8 first)."
        )
    
    if session.current_step < 6:
        raise HTTPException(
            status_code=400,
            detail="Cannot generate story bible. Complete all wizard steps (0-6) first."
        )
    
    try:
        # Generate comprehensive story bible
        story_bible = await story_bible_service.generate_story_bible(session)
        
        # Update session with story bible
        session.story_bible = story_bible
        session.current_step = max(session.current_step, 9)  # Story bible is step 9
        
        # Save updated session
        db_session = db["premise_builder_sessions"]
        await db_session.update_one(
            {"_id": session.id},
            {"$set": {
                "story_bible": story_bible.dict(),
                "current_step": session.current_step,
                "updated_at": session.updated_at
            }}
        )
        
        logger.info(f"Story bible generated for session {session_id}")
        
        return BuilderSessionResponse(
            session=session,
            next_step=10,  # Ready for outline generation
            can_generate_baseline=True,
            can_generate_premium=True,
            can_complete=True
        )
    
    except ValueError as e:
        # Prerequisites not met
        logger.warning(f"Story bible generation prerequisites not met for {session_id}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        logger.error(f"Failed to generate story bible for {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Story bible generation failed: {str(e)}")


@router.post("/sessions/{session_id}/complete")
async def complete_builder_session(
    session_id: str,
    request: CompleteBuilderSessionRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict[str, Any]:
    """
    Finalize premise builder session and persist to project.
    
    Marks session as completed, creates or updates project with final premise,
    and optionally triggers Story Bible + Outline generation.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    if not request.accept_premium_premise and not request.manual_premise_override:
        raise HTTPException(
            status_code=400,
            detail="Must accept premium premise or provide manual override"
        )
    
    try:
        project_id = await service.complete_session(
            session_id=session_id,
            use_premium=request.accept_premium_premise,
            manual_premise=request.manual_premise_override
        )
        
        return {
            "message": "Premise builder session completed successfully",
            "session_id": session_id,
            "project_id": project_id,
            "next_action": "generate_story_bible"
        }
    
    except Exception as e:
        logger.error(f"Failed to complete session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Session completion failed: {str(e)}")


@router.get("/sessions/{session_id}/summary", response_model=BuilderProgressSummary)
async def get_session_summary(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> BuilderProgressSummary:
    """
    Get lightweight summary of session progress for dashboard display.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    title = "Untitled Novel"
    if session.project_stub and session.project_stub.title:
        title = session.project_stub.title
    
    return BuilderProgressSummary(
        session_id=session.id,
        title=title,
        current_step=session.current_step,
        total_steps=8,
        status=session.status,
        updated_at=session.updated_at
    )


@router.delete("/sessions/{session_id}")
async def abandon_builder_session(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Dict[str, str]:
    """
    Mark session as abandoned and optionally delete.
    """
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    try:
        await service.abandon_session(session_id)
        return {"message": f"Session {session_id} marked as abandoned"}
    
    except Exception as e:
        logger.error(f"Failed to abandon session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to abandon session: {str(e)}")


@router.get("/sessions/{session_id}/preview")
async def get_session_preview(
    session_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Get live HTML preview of premise decisions made so far.
    
    Returns a styled HTML document showing all decisions in a readable format.
    """
    from fastapi.responses import HTMLResponse
    from services.premise_preview_service import generate_preview_html
    
    service = PremiseBuilderService(db)
    
    session = await service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    try:
        html_content = generate_preview_html(session)
        return HTMLResponse(content=html_content)
    
    except Exception as e:
        logger.error(f"Failed to generate preview for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate preview: {str(e)}")

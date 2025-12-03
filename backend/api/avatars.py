"""
Avatar API Routes

FastAPI endpoints for multi-avatar system:
- Avatar chat (single avatar responses)
- Creative Board mode (multi-avatar discussions)
- Avatar switching
- Memory management
- Handoff import
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.database import get_database
from services.research_assistant_avatar import create_research_assistant
from services.debate_orchestrator import create_debate_orchestrator
from services.avatar_base import Avatar

router = APIRouter(prefix="/api/avatars", tags=["avatars"])


# ==================== Request/Response Models ====================

class AvatarChatRequest(BaseModel):
    """Request for single avatar chat"""
    avatar_id: str = Field(..., description="Avatar ID to use")
    message: str = Field(..., description="User message")
    project_id: Optional[str] = Field(None, description="Current project ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous messages")


class AvatarChatResponse(BaseModel):
    """Response from single avatar chat"""
    avatar_id: str
    avatar_name: str
    response: str
    timestamp: datetime
    project_id: Optional[str] = None


class CreativeBoardRequest(BaseModel):
    """Request to start a creative board session"""
    question: str = Field(..., description="Question for the creative board")
    project_id: Optional[str] = Field(None, description="Current project ID")
    context: Dict[str, Any] = Field(..., description="Manuscript/character context")
    participating_avatars: Optional[List[str]] = Field(None, description="Avatar IDs to include")
    rounds: int = Field(1, description="Number of debate rounds", ge=1, le=3)


class CreativeBoardResponse(BaseModel):
    """Response from creative board session"""
    session_id: str
    question: str
    participants: List[str]
    arguments: List[Dict[str, Any]]
    vote_tally: Dict[str, Any]
    synthesis: str
    research_citations: List[Dict[str, Any]]
    timestamp: datetime


class FeedbackRequest(BaseModel):
    """User feedback on agent response"""
    interaction_id: str = Field(..., description="Interaction ID being rated")
    feedback_type: str = Field(..., description="accept, reject, or edit")
    edited_response: Optional[str] = Field(None, description="User's edited version")


class MemoryResetRequest(BaseModel):
    """Request to reset avatar memory"""
    avatar_id: str = Field(..., description="Avatar ID to reset")
    categories: Optional[List[str]] = Field(None, description="Specific categories to reset (None = full reset)")


class HandoffImportRequest(BaseModel):
    """Import avatar from handoff prompt"""
    handoff_prompt: str = Field(..., description="Full handoff prompt from other AI tool")
    avatar_name: Optional[str] = Field(None, description="Override avatar name")


# ==================== Agent Management ====================

# Global avatar registry (TODO: Move to proper service/singleton)
_avatar_registry: Dict[str, Avatar] = {}


async def get_avatar_registry(
    db: AsyncIOMotorDatabase = Depends(get_database),
    user_id: Optional[str] = None
) -> Dict[str, Avatar]:
    """Get or initialize avatar registry with both built-in and custom avatars
    
    Args:
        db: Database connection
        user_id: Optional user ID to load custom avatars for that user
    
    Returns:
        Dict mapping avatar_id to Avatar instances (built-in + custom)
    """
    global _avatar_registry
    
    # Initialize built-in avatars once
    if not _avatar_registry:
        # Import all avatar factory functions
        from services.research_assistant_avatar import create_research_assistant
        from services.plot_architect_avatar import create_plot_architect
        from services.character_developer_avatar import create_character_developer
        from services.dialogue_coach_avatar import create_dialogue_coach
        from services.editor_supreme_avatar import create_editor_supreme
        from services.romance_expert_avatar import create_romance_expert
        from services.mystery_master_avatar import create_mystery_master
        
        # Initialize all built-in avatars
        avatars = [
            create_research_assistant(db=db),
            create_plot_architect(db=db),
            create_character_developer(db=db),
            create_dialogue_coach(db=db),
            create_editor_supreme(db=db),
            create_romance_expert(db=db),
            create_mystery_master(db=db),
        ]
        
        # Register all built-in avatars
        for avatar in avatars:
            _avatar_registry[avatar.avatar_id] = avatar
        
        print(f"✅ Initialized {len(_avatar_registry)} built-in avatars: {', '.join([a.short_name for a in avatars])}")
    
    # Start with built-in avatars
    registry = dict(_avatar_registry)
    
    # Load custom avatars for this user if user_id provided
    if user_id:
        from services.custom_avatar import list_user_avatars
        custom_avatars = await list_user_avatars(db, user_id)
        
        # Add custom avatars to registry
        for custom_avatar in custom_avatars:
            registry[custom_avatar.avatar_id] = custom_avatar
        
        if custom_avatars:
            print(f"✅ Loaded {len(custom_avatars)} custom avatars for user {user_id}")
    
    return registry


# ==================== Endpoints ====================

@router.get("/list")
async def list_avatars(
    user_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    List all available avatars with their details.
    Includes built-in avatars and custom avatars for the specified user.
    """
    registry = await get_avatar_registry(db, user_id=user_id)
    
    avatars_info = []
    for avatar in registry.values():
        avatar_dict = avatar.to_dict()
        # Add type indicator (built-in vs custom)
        from services.custom_avatar import CustomAvatar
        avatar_dict["is_custom"] = isinstance(avatar, CustomAvatar)
        avatars_info.append(avatar_dict)
    
    return {
        "avatars": avatars_info,
        "count": len(avatars_info),
        "built_in_count": len([a for a in avatars_info if not a["is_custom"]]),
        "custom_count": len([a for a in avatars_info if a["is_custom"]])
    }


@router.post("/chat")
async def avatar_chat(
    request: AvatarChatRequest,
    user_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> AvatarChatResponse:
    """
    Chat with a single avatar (built-in or custom).
    """
    registry = await get_avatar_registry(db, user_id=user_id)
    
    # Get requested avatar
    if request.agent_id not in registry:
        raise HTTPException(status_code=404, detail=f"Avatar {request.agent_id} not found")
    
    avatar = registry[request.agent_id]
    
    # Process message
    response = await agent.process_message(
        message=request.message,
        context=request.context,
        project_id=request.project_id,
        conversation_history=request.conversation_history
    )
    
    return AgentChatResponse(
        agent_id=agent.agent_id,
        agent_name=agent.name,
        response=response,
        timestamp=datetime.utcnow(),
        project_id=request.project_id
    )


@router.post("/debate")
async def start_debate(
    request: CreativeBoardRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> CreativeBoardResponse:
    """
    Start a creative board debate.
    
    Avatars will argue about the debate topic with witty, researched arguments
    citing RESEARCH_SOURCES_COMPILATION.md. Results include votes and synthesis.
    """
    registry = await get_agent_registry(db)
    
    # Get participating avatars
    if request.participating_agents:
        avatars = [registry[aid] for aid in request.participating_agents if aid in registry]
        if not avatars:
            raise HTTPException(status_code=400, detail="No valid avatars specified")
    else:
        avatars = list(registry.values())
    
    # Create Creative Board orchestrator
    orchestrator = create_debate_orchestrator(agents=avatars)
    
    # Conduct debate
    debate_result = await orchestrator.conduct_debate(
        debate_topic=request.debate_topic,
        user_context=request.context,
        participating_agents=request.participating_agents,
        rounds=request.rounds
    )
    
    # Store debate in database
    debate_doc = {
        **debate_result,
        "project_id": request.project_id,
        "user_id": "alana"  # TODO: Get from auth
    }
    
    result = await db.agent_debates.insert_one(debate_doc)
    debate_id = str(result.inserted_id)
    
    return DebateResponse(
        debate_id=debate_id,
        debate_topic=debate_result["debate_topic"],
        participants=debate_result["participants"],
        arguments=debate_result["arguments"],
        vote_tally=debate_result["vote_tally"],
        synthesis=debate_result["synthesis"],
        research_citations=debate_result["research_citations"],
        timestamp=debate_result["timestamp"]
    )


@router.get("/debates/{project_id}")
async def get_project_debates(
    project_id: str,
    limit: int = 10,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Get debate history for a project.
    """
    debates = await db.agent_debates.find(
        {"project_id": project_id}
    ).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    return {
        "project_id": project_id,
        "debates": debates,
        "count": len(debates)
    }


@router.post("/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, str]:
    """
    Submit feedback on agent response (for learning system).
    """
    # Find the interaction
    interaction = await db.agent_interactions.find_one({"_id": request.interaction_id})
    
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    
    agent_id = interaction["agent_id"]
    
    # Get agent
    registry = await get_agent_registry(db)
    if agent_id not in registry:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = registry[agent_id]
    
    # Record feedback
    await avatar.record_feedback(
        interaction_id=request.interaction_id,
        feedback_type=request.feedback_type,
        edited_response=request.edited_response
    )
    
    return {
        "status": "success",
        "message": f"Feedback recorded for {avatar.name}"
    }


@router.get("/memory/{agent_id}")
async def get_avatar_memory(
    agent_id: str,
    user_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Get avatar memory summary (what has been learned).
    """
    registry = await get_avatar_registry(db, user_id=user_id)
    
    if agent_id not in registry:
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    avatar = registry[agent_id]
    
    memory_summary = await avatar.get_memory_summary()
    
    return memory_summary


@router.post("/memory/reset")
async def reset_avatar_memory(
    request: MemoryResetRequest,
    user_id: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, str]:
    """
    Reset avatar memory (easy data destruction feature).
    """
    registry = await get_avatar_registry(db, user_id=user_id)
    
    if request.agent_id not in registry:
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    avatar = registry[request.agent_id]
    
    await avatar.reset_memory(categories=request.categories)
    
    reset_type = "full" if request.categories is None else "selective"
    
    return {
        "status": "success",
        "message": f"{reset_type.capitalize()} memory reset for {avatar.name}",
        "agent_id": avatar.avatar_id
    }


@router.post("/import-handoff")
async def import_handoff_bot(
    request: HandoffImportRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Import custom bot from handoff prompt (from ChatGPT, Claude, etc.).
    
    Parses handoff prompt and creates new custom agent.
    """
    # TODO: Implement handoff prompt parsing
    # Parse markdown structure:
    # - Extract bot name
    # - Extract personality
    # - Extract expertise
    # - Extract system prompt
    # - Create custom agent instance
    
    return {
        "status": "not_implemented",
        "message": "Handoff import coming in Phase 1 Week 2",
        "preview": {
            "handoff_length": len(request.handoff_prompt),
            "has_bot_name": request.bot_name is not None
        }
    }


@router.get("/health")
async def avatar_health(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Health check for avatar system.
    """
    registry = await get_avatar_registry(db)
    
    return {
        "status": "healthy",
        "avatars_loaded": len(registry),
        "research_doc_loaded": True,  # TODO: Check actual status
        "timestamp": datetime.utcnow()
    }

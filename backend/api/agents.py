"""
Agent API Routes

FastAPI endpoints for multi-agent system:
- Agent chat (single agent responses)
- Debate mode (multi-agent debates)
- Agent switching
- Memory management
- Handoff import
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.database import get_database
from services.research_assistant_agent import create_research_assistant
from services.debate_orchestrator import create_debate_orchestrator
from services.agent_base import Agent

router = APIRouter(prefix="/api/agents", tags=["agents"])


# ==================== Request/Response Models ====================

class AgentChatRequest(BaseModel):
    """Request for single agent chat"""
    agent_id: str = Field(..., description="Agent ID to use")
    message: str = Field(..., description="User message")
    project_id: Optional[str] = Field(None, description="Current project ID")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")
    conversation_history: Optional[List[Dict[str, str]]] = Field(None, description="Previous messages")


class AgentChatResponse(BaseModel):
    """Response from single agent chat"""
    agent_id: str
    agent_name: str
    response: str
    timestamp: datetime
    project_id: Optional[str] = None


class DebateRequest(BaseModel):
    """Request to start a debate"""
    debate_topic: str = Field(..., description="Question to debate")
    project_id: Optional[str] = Field(None, description="Current project ID")
    context: Dict[str, Any] = Field(..., description="Manuscript/character context")
    participating_agents: Optional[List[str]] = Field(None, description="Agent IDs to include")
    rounds: int = Field(1, description="Number of debate rounds", ge=1, le=3)


class DebateResponse(BaseModel):
    """Response from debate"""
    debate_id: str
    debate_topic: str
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
    """Request to reset agent memory"""
    agent_id: str = Field(..., description="Agent ID to reset")
    categories: Optional[List[str]] = Field(None, description="Specific categories to reset (None = full reset)")


class HandoffImportRequest(BaseModel):
    """Import bot from handoff prompt"""
    handoff_prompt: str = Field(..., description="Full handoff prompt from other AI tool")
    bot_name: Optional[str] = Field(None, description="Override bot name")


# ==================== Agent Management ====================

# Global agent registry (TODO: Move to proper service/singleton)
_agent_registry: Dict[str, Agent] = {}


async def get_agent_registry(db: AsyncIOMotorDatabase = Depends(get_database)) -> Dict[str, Agent]:
    """Get or initialize agent registry"""
    global _agent_registry
    
    if not _agent_registry:
        # Initialize first agent (Research Assistant)
        research_assistant = create_research_assistant(db=db)
        _agent_registry[research_assistant.agent_id] = research_assistant
        
        # TODO: Initialize other 11 agents
        print(f"✅ Initialized {len(_agent_registry)} agents")
    
    return _agent_registry


# ==================== Endpoints ====================

@router.get("/list")
async def list_agents(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    List all available agents with their details.
    """
    registry = await get_agent_registry(db)
    
    agents_info = [agent.to_dict() for agent in registry.values()]
    
    return {
        "agents": agents_info,
        "count": len(agents_info)
    }


@router.post("/chat")
async def agent_chat(
    request: AgentChatRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> AgentChatResponse:
    """
    Chat with a single agent.
    """
    registry = await get_agent_registry(db)
    
    # Get requested agent
    if request.agent_id not in registry:
        raise HTTPException(status_code=404, detail=f"Agent {request.agent_id} not found")
    
    agent = registry[request.agent_id]
    
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
    request: DebateRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> DebateResponse:
    """
    Start a multi-agent debate.
    
    Agents will argue about the debate topic with witty, researched arguments
    citing RESEARCH_SOURCES_COMPILATION.md. Results include votes and synthesis.
    """
    registry = await get_agent_registry(db)
    
    # Get participating agents
    if request.participating_agents:
        agents = [registry[aid] for aid in request.participating_agents if aid in registry]
        if not agents:
            raise HTTPException(status_code=400, detail="No valid agents specified")
    else:
        agents = list(registry.values())
    
    # Create debate orchestrator
    orchestrator = create_debate_orchestrator(agents=agents)
    
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
    await agent.record_feedback(
        interaction_id=request.interaction_id,
        feedback_type=request.feedback_type,
        edited_response=request.edited_response
    )
    
    return {
        "status": "success",
        "message": f"Feedback recorded for {agent.name}"
    }


@router.get("/memory/{agent_id}")
async def get_agent_memory(
    agent_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Get agent memory summary (what has been learned).
    """
    registry = await get_agent_registry(db)
    
    if agent_id not in registry:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = registry[agent_id]
    
    memory_summary = await agent.get_memory_summary()
    
    return memory_summary


@router.post("/memory/reset")
async def reset_agent_memory(
    request: MemoryResetRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, str]:
    """
    Reset agent memory (easy data destruction feature).
    """
    registry = await get_agent_registry(db)
    
    if request.agent_id not in registry:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent = registry[request.agent_id]
    
    await agent.reset_memory(categories=request.categories)
    
    reset_type = "full" if request.categories is None else "selective"
    
    return {
        "status": "success",
        "message": f"{reset_type.capitalize()} memory reset for {agent.name}",
        "agent_id": agent.agent_id
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
async def agent_health(
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Health check for agent system.
    """
    registry = await get_agent_registry(db)
    
    return {
        "status": "healthy",
        "agents_loaded": len(registry),
        "research_doc_loaded": True,  # TODO: Check actual status
        "timestamp": datetime.utcnow()
    }

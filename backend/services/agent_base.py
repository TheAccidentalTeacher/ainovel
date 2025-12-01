"""
Base Agent Class - Foundation for All Specialist Agents

This module defines the base Agent class that all specialist agents inherit from.
Provides core functionality: personality, memory, tool access, debate mode support.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime
from enum import Enum
import anthropic
import asyncio
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.settings import get_settings

settings = get_settings()


class AgentRole(str, Enum):
    """Agent specialist roles"""
    RESEARCH_ASSISTANT = "research_assistant"
    PLOT_ARCHITECT = "plot_architect"
    CHARACTER_DEVELOPER = "character_developer"
    ROMANCE_EXPERT = "romance_expert"
    MYSTERY_MASTER = "mystery_master"
    THRILLER_SPECIALIST = "thriller_specialist"
    FANTASY_WORLDBUILDER = "fantasy_worldbuilder"
    HORROR_CRAFTER = "horror_crafter"
    HISTORICAL_GUARDIAN = "historical_guardian"
    DIALOGUE_COACH = "dialogue_coach"
    EDITOR_SUPREME = "editor_supreme"
    GENRE_FUSION = "genre_fusion"
    CUSTOM = "custom"


class ProactiveMode(str, Enum):
    """Proactive assistance levels"""
    OFF = "off"
    GENTLE_NUDGE = "gentle_nudge"
    ACTIVE_PARTNER = "active_partner"
    AUTO_PILOT = "auto_pilot"


class Agent(ABC):
    """
    Base Agent class - all specialist agents inherit from this.
    
    Provides:
    - Personality system (name, role, voice, humor style)
    - Memory system (learned preferences, feedback tracking)
    - Tool access (web search, document analysis, etc.)
    - Debate mode support (argument generation, voting)
    - Learning system (aggressive with easy reset)
    """
    
    def __init__(
        self,
        agent_id: str,
        name: str,
        role: AgentRole,
        short_name: str,
        personality_description: str,
        debate_catchphrase: str,
        db: AsyncIOMotorDatabase,
        user_id: str = "alana"
    ):
        """
        Initialize base agent.
        
        Args:
            agent_id: Unique identifier (e.g., "research_assistant_001")
            name: Display name (e.g., "Research Assistant")
            role: AgentRole enum value
            short_name: Abbreviated name for UI (e.g., "Research")
            personality_description: One-line personality (e.g., "Dry British wit")
            debate_catchphrase: Signature phrase in debates
            db: MongoDB database connection
            user_id: User this agent serves
        """
        self.agent_id = agent_id
        self.name = name
        self.role = role
        self.short_name = short_name
        self.personality_description = personality_description
        self.debate_catchphrase = debate_catchphrase
        self.db = db
        self.user_id = user_id
        
        # Claude client for AI responses
        self.client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        
        # Agent brain (memory storage)
        self.brain_collection = db.agent_brains
        
        # Feedback tracking
        self.feedback_collection = db.agent_feedback
        
        # Tools registry
        self.available_tools: Dict[str, Callable] = {}
        self._register_tools()
    
    @abstractmethod
    def get_system_prompt(self) -> str:
        """
        Each agent defines its own system prompt.
        Must include personality, expertise, debate style, learning preferences.
        """
        pass
    
    @abstractmethod
    def get_expertise_domains(self) -> List[str]:
        """
        Return list of expertise domains (e.g., ["historical accuracy", "period research"])
        Used for routing questions to appropriate agents.
        """
        pass
    
    def _register_tools(self):
        """Register tools this agent can use. Override to add agent-specific tools."""
        # Base tools available to all agents
        self.available_tools = {
            "web_search": self._web_search_tool,
            "research_doc_search": self._research_doc_search_tool,
            "get_user_preferences": self._get_user_preferences_tool,
        }
    
    async def _web_search_tool(self, query: str, search_depth: str = "basic") -> Dict[str, Any]:
        """Web search tool (Tavily integration)"""
        # TODO: Implement Tavily web search
        return {
            "results": [],
            "query": query,
            "depth": search_depth
        }
    
    async def _research_doc_search_tool(self, query: str, max_results: int = 5) -> Dict[str, Any]:
        """
        Search RESEARCH_SOURCES_COMPILATION.md for relevant content.
        Returns results with line numbers for debate citations.
        """
        # TODO: Implement semantic search of research doc
        return {
            "results": [],
            "query": query
        }
    
    async def _get_user_preferences_tool(self) -> Dict[str, Any]:
        """Retrieve learned user preferences from agent brain"""
        brain = await self.brain_collection.find_one({
            "agent_id": self.agent_id,
            "user_id": self.user_id
        })
        
        if not brain:
            return {"preferences": {}, "learned": False}
        
        return {
            "preferences": brain.get("learned_preferences", {}),
            "learned": True,
            "last_updated": brain.get("updated_at")
        }
    
    async def process_message(
        self,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        project_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Process a user message and generate response.
        
        Args:
            message: User's input message
            context: Additional context (manuscript snippet, character info, etc.)
            project_id: Current project ID for context retrieval
            conversation_history: Previous messages in conversation
            
        Returns:
            Agent's response string
        """
        # Build full prompt with system prompt + user message + context
        system_prompt = self.get_system_prompt()
        
        # Add learned preferences to system prompt
        preferences = await self._get_user_preferences_tool()
        if preferences["learned"]:
            system_prompt += f"\n\nLEARNED USER PREFERENCES:\n{preferences['preferences']}"
        
        # Add project context if available
        if project_id:
            project_context = await self._get_project_context(project_id)
            if project_context:
                system_prompt += f"\n\nCURRENT PROJECT CONTEXT:\n{project_context}"
        
        # Build messages array
        messages = []
        
        # Add conversation history
        if conversation_history:
            messages.extend(conversation_history)
        
        # Add current message with context
        user_message = message
        if context:
            user_message += f"\n\nCONTEXT:\n{context}"
        
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Generate response using Claude
        response = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            temperature=0.8,  # Higher temp for personality/wit
            system=system_prompt,
            messages=messages
        )
        
        agent_response = response.content[0].text
        
        # Track this interaction for learning
        await self._track_interaction(message, agent_response, context)
        
        return agent_response
    
    async def generate_debate_argument(
        self,
        debate_topic: str,
        user_context: Dict[str, Any],
        opposing_arguments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate witty, researched argument for debate mode.
        
        Args:
            debate_topic: Question being debated
            user_context: Manuscript context, character info, etc.
            opposing_arguments: Arguments from other agents (to refute)
            
        Returns:
            Dict with argument text, citations, vote, reasoning
        """
        system_prompt = self.get_system_prompt()
        system_prompt += """

DEBATE MODE ACTIVATED:
- Generate witty, funny, off-the-wall arguments
- MUST cite RESEARCH_SOURCES_COMPILATION.md with line numbers
- Reference craft experts (Sanderson, Heyer, Christie, etc.)
- Make surprising cross-genre connections
- Use your signature catchphrase when appropriate
- Be entertaining but factually grounded

Your argument should be 2-4 paragraphs:
1. Opening statement (witty hook)
2. Evidence from research compilation (cite line numbers)
3. Refutation of opposing views (if any)
4. Conclusion with your vote

Format your response as:
ARGUMENT: [Your witty argument with research citations]
VOTE: [support/oppose/abstain]
REASONING: [One-sentence summary of your position]
"""
        
        # Build debate context
        debate_context = f"""
DEBATE TOPIC: {debate_topic}

USER CONTEXT:
{user_context}
"""
        
        if opposing_arguments:
            debate_context += "\n\nOPPOSING ARGUMENTS:\n"
            for arg in opposing_arguments:
                debate_context += f"\n{arg['agent_name']}: {arg['argument']}\n"
        
        # Generate argument
        response = await self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            temperature=0.9,  # Even higher temp for creative debate arguments
            system=system_prompt,
            messages=[{
                "role": "user",
                "content": debate_context
            }]
        )
        
        response_text = response.content[0].text
        
        # Parse response
        argument = ""
        vote = "abstain"
        reasoning = ""
        
        if "ARGUMENT:" in response_text:
            parts = response_text.split("VOTE:")
            argument = parts[0].replace("ARGUMENT:", "").strip()
            
            if len(parts) > 1:
                vote_parts = parts[1].split("REASONING:")
                vote = vote_parts[0].strip().lower()
                if len(vote_parts) > 1:
                    reasoning = vote_parts[1].strip()
        else:
            argument = response_text
        
        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "argument": argument,
            "vote": vote,
            "reasoning": reasoning,
            "catchphrase": self.debate_catchphrase,
            "timestamp": datetime.utcnow()
        }
    
    async def _get_project_context(self, project_id: str) -> Optional[str]:
        """Retrieve project context for agent to reference"""
        project = await self.db.projects.find_one({"_id": project_id})
        if not project:
            return None
        
        context_parts = []
        
        # Add premise if available
        if project.get("premise"):
            context_parts.append(f"PREMISE: {project['premise']}")
        
        # Add genre
        if project.get("genre"):
            context_parts.append(f"GENRE: {project['genre']}")
        
        # Add character info
        if project.get("characters"):
            char_summary = ", ".join([c.get("name", "Unnamed") for c in project["characters"][:5]])
            context_parts.append(f"CHARACTERS: {char_summary}")
        
        return "\n".join(context_parts) if context_parts else None
    
    async def _track_interaction(
        self,
        user_message: str,
        agent_response: str,
        context: Optional[Dict[str, Any]] = None
    ):
        """Track interaction for learning system"""
        await self.db.agent_interactions.insert_one({
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "user_message": user_message,
            "agent_response": agent_response,
            "context": context,
            "timestamp": datetime.utcnow(),
            "feedback": None  # Will be updated when user provides feedback
        })
    
    async def record_feedback(
        self,
        interaction_id: str,
        feedback_type: str,  # "accept", "reject", "edit"
        edited_response: Optional[str] = None
    ):
        """
        Record user feedback on agent response.
        Part of aggressive learning system.
        
        Args:
            interaction_id: ID of interaction being rated
            feedback_type: "accept", "reject", or "edit"
            edited_response: If user edited response, store their version
        """
        await self.feedback_collection.insert_one({
            "agent_id": self.agent_id,
            "user_id": self.user_id,
            "interaction_id": interaction_id,
            "feedback_type": feedback_type,
            "edited_response": edited_response,
            "timestamp": datetime.utcnow()
        })
        
        # Update agent brain with learned pattern
        await self._update_learned_patterns(feedback_type, edited_response)
    
    async def _update_learned_patterns(self, feedback_type: str, edited_response: Optional[str] = None):
        """Update agent brain based on feedback (aggressive learning)"""
        brain = await self.brain_collection.find_one({
            "agent_id": self.agent_id,
            "user_id": self.user_id
        })
        
        if not brain:
            # Initialize brain
            brain = {
                "agent_id": self.agent_id,
                "user_id": self.user_id,
                "learned_preferences": {},
                "accept_count": 0,
                "reject_count": 0,
                "edit_count": 0,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        
        # Update counts
        if feedback_type == "accept":
            brain["accept_count"] = brain.get("accept_count", 0) + 1
        elif feedback_type == "reject":
            brain["reject_count"] = brain.get("reject_count", 0) + 1
        elif feedback_type == "edit":
            brain["edit_count"] = brain.get("edit_count", 0) + 1
        
        brain["updated_at"] = datetime.utcnow()
        
        # Upsert brain document
        await self.brain_collection.update_one(
            {"agent_id": self.agent_id, "user_id": self.user_id},
            {"$set": brain},
            upsert=True
        )
    
    async def reset_memory(self, categories: Optional[List[str]] = None):
        """
        Reset agent memory (easy data destruction feature).
        
        Args:
            categories: Specific categories to reset, or None for full reset
        """
        if categories is None:
            # Nuclear option - wipe everything
            await self.brain_collection.delete_one({
                "agent_id": self.agent_id,
                "user_id": self.user_id
            })
            await self.feedback_collection.delete_many({
                "agent_id": self.agent_id,
                "user_id": self.user_id
            })
        else:
            # Selective reset
            brain = await self.brain_collection.find_one({
                "agent_id": self.agent_id,
                "user_id": self.user_id
            })
            
            if brain:
                for category in categories:
                    if category in brain.get("learned_preferences", {}):
                        del brain["learned_preferences"][category]
                
                brain["updated_at"] = datetime.utcnow()
                
                await self.brain_collection.update_one(
                    {"agent_id": self.agent_id, "user_id": self.user_id},
                    {"$set": brain}
                )
    
    async def get_memory_summary(self) -> Dict[str, Any]:
        """Get summary of what this agent has learned (for memory dashboard)"""
        brain = await self.brain_collection.find_one({
            "agent_id": self.agent_id,
            "user_id": self.user_id
        })
        
        if not brain:
            return {
                "agent_id": self.agent_id,
                "agent_name": self.name,
                "has_learned": False,
                "summary": "No learning data yet"
            }
        
        return {
            "agent_id": self.agent_id,
            "agent_name": self.name,
            "has_learned": True,
            "accept_count": brain.get("accept_count", 0),
            "reject_count": brain.get("reject_count", 0),
            "edit_count": brain.get("edit_count", 0),
            "learned_preferences": brain.get("learned_preferences", {}),
            "last_updated": brain.get("updated_at")
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize agent info for API responses"""
        return {
            "agent_id": self.agent_id,
            "name": self.name,
            "short_name": self.short_name,
            "role": self.role,
            "personality_description": self.personality_description,
            "debate_catchphrase": self.debate_catchphrase,
            "expertise_domains": self.get_expertise_domains(),
            "available_tools": list(self.available_tools.keys())
        }

"""
Chat service for AI conversation management.

Handles streaming responses, context management, token counting,
and conversation history for the chatbot system.
"""

import json
from datetime import datetime
from typing import AsyncGenerator, List, Optional, Dict, Any

import structlog
import tiktoken
from anthropic import AsyncAnthropic
from openai import AsyncOpenAI
from motor.motor_asyncio import AsyncIOMotorDatabase

from config.settings import get_settings
from models.schemas import Message, Conversation, ConversationSummary
from services.search_service import search_service

logger = structlog.get_logger()


class ChatService:
    """
    Service for managing chat conversations and AI responses.
    
    Handles:
    - Streaming AI responses via SSE
    - Token counting and context management
    - Auto-summarization at 150k token threshold
    - Conversation history retrieval
    """
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.settings = get_settings()
        self.anthropic = AsyncAnthropic(api_key=self.settings.anthropic_api_key)
        self.openai = AsyncOpenAI(api_key=self.settings.openai_api_key)
        self.max_tokens = 200000  # Claude Sonnet 4.5 context window
        self.summarization_threshold = 150000  # 75% of max tokens
        self.tokenizer = tiktoken.get_encoding("cl100k_base")  # GPT-4/Claude tokenizer
        
        # Model configurations
        self.models = {
            "claude-sonnet-4-20250514": {
                "provider": "anthropic", 
                "max_tokens": 200000, 
                "display_name": "Claude Sonnet 4.5",
                "description": "Best for creative writing, dialogue, and character development. Exceptional at understanding nuance, subtext, and emotional depth. Handles long manuscripts with 200k token context."
            },
            "gpt-5.1": {
                "provider": "openai", 
                "max_tokens": 200000, 
                "display_name": "GPT-5.1",
                "description": "Most advanced reasoning model. Excellent for complex plot structures, multi-threaded storylines, and analytical feedback. Best for brainstorming and story planning with deep logical connections."
            },
            "gpt-4o": {
                "provider": "openai", 
                "max_tokens": 128000, 
                "display_name": "GPT-4o",
                "description": "Balanced all-rounder with fast responses. Great for general writing assistance, quick edits, and conversational brainstorming. Strong at following instructions and maintaining consistency."
            },
            "gpt-4-turbo": {
                "provider": "openai", 
                "max_tokens": 128000, 
                "display_name": "GPT-4 Turbo",
                "description": "Fast and cost-effective. Good for drafting, outlining, and iterative revisions. Reliable for genre conventions and market expectations. Handles large context efficiently."
            },
            "gpt-4": {
                "provider": "openai", 
                "max_tokens": 8192, 
                "display_name": "GPT-4",
                "description": "Original GPT-4 with proven reliability. Best for focused tasks on individual scenes or chapters. Strong creative output with shorter context needs. Good for precision edits."
            },
        }
    
    async def stream_response(
        self,
        conversation_id: str,
        project_id: Optional[str] = None,
        model: str = "claude-sonnet-4-20250514",
        web_search_enabled: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Stream AI response via Server-Sent Events.
        
        Args:
            conversation_id: Conversation to respond to
            project_id: Optional project context
            model: Model identifier to use for response
            web_search_enabled: Whether to perform web search for context
            
        Yields:
            SSE-formatted response chunks
        """
        try:
            # Get conversation history
            messages = await self._get_conversation_messages(conversation_id)
            
            # Perform intelligent web search if enabled
            search_context = ""
            if web_search_enabled and messages:
                last_user_message = next((m for m in reversed(messages) if m.role == "user"), None)
                if last_user_message:
                    user_query = last_user_message.content.lower()
                    
                    # Intelligent search type selection
                    search_type = "standard"
                    if any(word in user_query for word in ["news", "recent", "current", "latest", "today"]):
                        # News search with time filter
                        search_type = "news"
                        search_results = await search_service.search_news(
                            query=last_user_message.content,
                            max_results=5,
                            time_range="week",
                            search_depth="advanced"
                        )
                    elif any(word in user_query for word in ["image", "photo", "picture", "visual", "look like", "appearance"]):
                        # Image search for visual references
                        search_type = "images"
                        search_results = await search_service.search_with_images(
                            query=last_user_message.content,
                            max_results=5,
                            with_descriptions=True
                        )
                    elif any(word in user_query for word in ["research", "detailed", "comprehensive", "explain", "how does"]):
                        # Deep research for complex topics
                        search_type = "research"
                        search_results = await search_service.research_deep_dive(
                            query=last_user_message.content,
                            max_results=8,
                            chunks_per_source=5
                        )
                    else:
                        # Standard search
                        search_type = "standard"
                        search_results = await search_service.search(
                            query=last_user_message.content,
                            max_results=5,
                            search_depth="advanced",
                            include_answer=True,
                            include_images=True
                        )
                    
                    if search_results.get("success"):
                        # Use deep context for research queries
                        include_raw = "research" in user_query or "detailed" in user_query
                        search_context = search_service.format_context(search_results, include_raw=include_raw)
                        
                        # Send search type and results to client
                        yield f"data: {json.dumps({'search_type': search_type})}\n\n"
                        yield f"data: {json.dumps({'search_results': search_results['results'][:5]})}\n\n"
                        
                        # Send images if available
                        if search_results.get('images'):
                            yield f"data: {json.dumps({'search_images': search_results['images'][:5]})}\n\n"
                        
                        # Send answer if available
                        if search_results.get("answer"):
                            yield f"data: {json.dumps({'search_answer': search_results['answer']})}\n\n"
            
            # Build context (with summarization if needed)
            context_messages = await self._build_context(conversation_id, messages, search_context)
            
            # Add project context if available
            system_prompt = await self._build_system_prompt(project_id)
            
            # Get model config
            model_config = self.models.get(model, self.models["claude-sonnet-4-20250514"])
            provider = model_config["provider"]
            
            # Stream from appropriate provider
            full_response = ""
            
            if provider == "anthropic":
                async with self.anthropic.messages.stream(
                    model=model,
                    max_tokens=4096,
                    temperature=0.7,
                    system=system_prompt,
                    messages=context_messages,
                ) as stream:
                    async for text in stream.text_stream:
                        full_response += text
                        yield f"data: {json.dumps({'content': text})}\n\n"
            
            elif provider == "openai":
                # Convert context messages for OpenAI (prepend system as first message)
                openai_messages = [{"role": "system", "content": system_prompt}] + context_messages
                
                stream = await self.openai.chat.completions.create(
                    model=model,
                    messages=openai_messages,
                    max_tokens=4096,
                    temperature=0.7,
                    stream=True,
                )
                
                async for chunk in stream:
                    if chunk.choices[0].delta.content:
                        text = chunk.choices[0].delta.content
                        full_response += text
                        yield f"data: {json.dumps({'content': text})}\n\n"
            
            # Save assistant response
            assistant_message = Message(
                conversation_id=conversation_id,
                role="assistant",
                content=full_response,
                model=model,
                token_count=await self._count_tokens(full_response),
            )
            await self.db.messages.insert_one(assistant_message.model_dump())
            
            # Update conversation metadata
            await self.db.conversations.update_one(
                {"id": conversation_id},
                {
                    "$set": {
                        "updated_at": datetime.utcnow(),
                        "last_message_at": datetime.utcnow(),
                    },
                    "$inc": {
                        "message_count": 1,
                        "total_tokens": assistant_message.token_count
                    }
                }
            )
            
            logger.info(
                "ai_response_streamed",
                conversation_id=conversation_id,
                response_length=len(full_response),
                tokens=assistant_message.token_count,
            )
            
            # Send completion event
            yield f"data: {json.dumps({'done': True})}\n\n"
            
        except Exception as e:
            logger.error("ai_streaming_failed", error=str(e), conversation_id=conversation_id)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    async def _get_conversation_messages(self, conversation_id: str) -> List[Message]:
        """Get all messages for a conversation in chronological order."""
        cursor = self.db.messages.find({"conversation_id": conversation_id}).sort("timestamp", 1)
        messages_data = await cursor.to_list(length=None)
        return [Message(**doc) for doc in messages_data]
    
    async def _build_context(
        self,
        conversation_id: str,
        messages: List[Message],
        search_context: str = ""
    ) -> List[Dict[str, str]]:
        """
        Build context messages for AI, with summarization if needed.
        
        If total tokens exceed 150k, summarizes early messages and keeps recent ones.
        Optionally prepends web search context to the last user message.
        """
        # Count total tokens
        total_tokens = sum(msg.token_count for msg in messages if msg.token_count > 0)
        
        # If under threshold, use full history
        if total_tokens < self.summarization_threshold:
            context_msgs = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
                if msg.role in ["user", "assistant"]
            ]
            
            # Add search context to last user message if available
            if search_context and context_msgs:
                last_user_idx = None
                for i in range(len(context_msgs) - 1, -1, -1):
                    if context_msgs[i]["role"] == "user":
                        last_user_idx = i
                        break
                
                if last_user_idx is not None:
                    context_msgs[last_user_idx]["content"] = (
                        f"{search_context}\n\n"
                        f"User Question: {context_msgs[last_user_idx]['content']}"
                    )
            
            return context_msgs
        
        # Need summarization
        logger.info(
            "conversation_summarization_triggered",
            conversation_id=conversation_id,
            total_tokens=total_tokens,
        )
        
        # Get existing summaries
        summaries = await self._get_summaries(conversation_id)
        
        # Calculate how many recent messages to keep (last 50k tokens)
        recent_token_budget = 50000
        recent_messages = []
        recent_tokens = 0
        
        for msg in reversed(messages):
            if recent_tokens + msg.token_count > recent_token_budget:
                break
            recent_messages.insert(0, msg)
            recent_tokens += msg.token_count
        
        # Messages to summarize (everything before recent messages)
        messages_to_summarize = messages[:len(messages) - len(recent_messages)]
        
        # Create new summary if needed
        if messages_to_summarize:
            summary_text = await self._create_summary(messages_to_summarize)
            new_summary = ConversationSummary(
                conversation_id=conversation_id,
                message_range=f"1-{len(messages_to_summarize)}",
                summary=summary_text,
                token_count=await self._count_tokens(summary_text),
            )
            await self.db.conversation_summaries.insert_one(new_summary.model_dump())
            summaries.append(new_summary)
        
        # Build context: summaries + recent messages
        context = []
        
        # Add summaries as system context
        if summaries:
            summary_content = "\n\n".join([
                f"Previous conversation summary ({s.message_range}): {s.summary}"
                for s in summaries
            ])
            context.append({"role": "user", "content": f"[Context Summary]\n{summary_content}"})
            context.append({"role": "assistant", "content": "I understand the previous context."})
        
        # Add recent messages
        context.extend([
            {"role": msg.role, "content": msg.content}
            for msg in recent_messages
            if msg.role in ["user", "assistant"]
        ])
        
        return context
    
    async def _get_summaries(self, conversation_id: str) -> List[ConversationSummary]:
        """Get all summaries for a conversation."""
        cursor = self.db.conversation_summaries.find({"conversation_id": conversation_id}).sort("created_at", 1)
        summaries_data = await cursor.to_list(length=None)
        return [ConversationSummary(**doc) for doc in summaries_data]
    
    async def _create_summary(self, messages: List[Message]) -> str:
        """
        Create a condensed summary of messages using Claude.
        
        Args:
            messages: Messages to summarize
            
        Returns:
            Summary text
        """
        # Build messages text
        messages_text = "\n\n".join([
            f"{msg.role.upper()}: {msg.content}"
            for msg in messages
        ])
        
        # Ask Claude to summarize
        response = await self.anthropic.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            temperature=0.3,
            messages=[{
                "role": "user",
                "content": f"""Summarize this conversation concisely, preserving key information, decisions, and context that would be needed for future messages:

{messages_text}

Provide a clear, factual summary."""
            }]
        )
        
        return response.content[0].text
    
    async def _count_tokens(self, text: str) -> int:
        """
        Count tokens in text using tiktoken.
        
        Uses cl100k_base encoding (GPT-4/Claude compatible).
        """
        return len(self.tokenizer.encode(text))
    
    async def _build_system_prompt(self, project_id: Optional[str] = None) -> str:
        """
        Build system prompt with optional project context.
        
        Phase 1: Generic helpful assistant.
        Phase 2: Will load bot personality and brain documents.
        """
        base_prompt = """You are a helpful AI writing assistant for novelists. You help with:
- Brainstorming ideas and plot development
- Character development and dialogue
- Story structure and pacing
- Genre conventions and reader expectations
- Overcoming writer's block

Be encouraging, insightful, and practical. Ask clarifying questions when needed.
Provide specific, actionable suggestions rather than generic advice."""
        
        # Add project context if available
        if project_id:
            project_context = await self._get_project_context(project_id)
            if project_context:
                base_prompt += f"\n\n[Project Context]\n{project_context}"
        
        return base_prompt
    
    async def _get_project_context(self, project_id: str) -> Optional[str]:
        """
        Get project context (premise, outline, characters) for AI.
        
        Loads project metadata to make bot aware of current novel.
        """
        try:
            # Get project
            project_data = await self.db.projects.find_one({"id": project_id})
            if not project_data:
                return None
            
            context_parts = []
            
            # Add premise if available
            if project_data.get("premise_id"):
                premise_data = await self.db.premises.find_one({"id": project_data["premise_id"]})
                if premise_data:
                    context_parts.append(f"Novel Premise:\n{premise_data['content'][:1000]}")  # First 1000 chars
            
            # Add story bible if available
            if project_data.get("story_bible_id"):
                story_bible_data = await self.db.storybibles.find_one({"id": project_data["story_bible_id"]})
                if story_bible_data:
                    # Add character names
                    characters = story_bible_data.get("characters", [])
                    if characters:
                        char_names = [c.get("name", "Unknown") for c in characters[:5]]  # First 5
                        context_parts.append(f"Main Characters: {', '.join(char_names)}")
                    
                    # Add themes
                    themes = story_bible_data.get("themes", [])
                    if themes:
                        context_parts.append(f"Themes: {', '.join(themes)}")
            
            return "\n\n".join(context_parts) if context_parts else None
            
        except Exception as e:
            logger.error("project_context_retrieval_failed", error=str(e), project_id=project_id)
            return None

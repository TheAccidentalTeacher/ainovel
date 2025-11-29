"""
Chat API endpoints for conversations and messages.

Phase 1: Core chatbot with long context, auto-save, conversation management.
Handles conversation CRUD, message streaming (SSE), and context persistence.
"""

from datetime import datetime
from typing import List, Optional

import structlog
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.database import get_database
from models.schemas import (
    Conversation,
    Message,
    ConversationResponse,
    ConversationListResponse,
    CreateConversationRequest,
    SendMessageRequest,
    RenameConversationRequest,
)
from services.chat_service import ChatService

logger = structlog.get_logger()
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(request: CreateConversationRequest):
    """
    Create a new conversation.
    
    Returns empty conversation ready for messages.
    """
    db = await get_database()
    
    try:
        # Create conversation document
        conversation = Conversation(
            user_id=request.user_id,
            project_id=request.project_id,
            bot_id=request.bot_id,
            title=request.title or "New Chat",
        )
        
        # Insert into database
        result = await db.conversations.insert_one(conversation.model_dump())
        
        if not result.inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create conversation")
        
        logger.info(
            "conversation_created",
            conversation_id=conversation.id,
            user_id=request.user_id,
            project_id=request.project_id,
        )
        
        return ConversationResponse(
            conversation=conversation,
            messages=[]
        )
        
    except Exception as e:
        logger.error("conversation_creation_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    user_id: str = Query(..., description="User ID to filter conversations"),
    project_id: Optional[str] = Query(None, description="Optional project ID filter"),
    limit: int = Query(50, ge=1, le=100, description="Max conversations to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
):
    """
    List conversations for a user, optionally filtered by project.
    
    Returns conversations sorted by most recent first.
    """
    db = await get_database()
    
    try:
        # Build query filter
        query_filter = {"user_id": user_id}
        if project_id:
            query_filter["project_id"] = project_id
        
        # Get conversations
        cursor = db.conversations.find(query_filter).sort("updated_at", -1).skip(offset).limit(limit)
        conversations_data = await cursor.to_list(length=limit)
        
        # Count total
        total = await db.conversations.count_documents(query_filter)
        
        # Parse conversations
        conversations = [Conversation(**doc) for doc in conversations_data]
        
        logger.info(
            "conversations_listed",
            user_id=user_id,
            project_id=project_id,
            count=len(conversations),
            total=total,
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=total
        )
        
    except Exception as e:
        logger.error("conversations_list_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list conversations: {str(e)}")


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: str):
    """
    Get a conversation with full message history.
    
    Returns all messages in chronological order.
    """
    db = await get_database()
    
    try:
        # Get conversation
        conversation_data = await db.conversations.find_one({"id": conversation_id})
        if not conversation_data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = Conversation(**conversation_data)
        
        # Get all messages
        messages_cursor = db.messages.find({"conversation_id": conversation_id}).sort("timestamp", 1)
        messages_data = await messages_cursor.to_list(length=None)
        messages = [Message(**doc) for doc in messages_data]
        
        logger.info(
            "conversation_retrieved",
            conversation_id=conversation_id,
            message_count=len(messages),
        )
        
        return ConversationResponse(
            conversation=conversation,
            messages=messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("conversation_retrieval_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversation: {str(e)}")


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str, 
    request: SendMessageRequest,
    model: str = Query("claude-sonnet-4-20250514", description="AI model to use"),
    web_search: bool = Query(False, description="Enable web search for additional context")
):
    """
    Send a message and get streaming AI response.
    
    Returns Server-Sent Events (SSE) stream of response chunks.
    User message is saved immediately. Assistant response is saved after streaming completes.
    Optionally performs web search for additional context.
    """
    db = await get_database()
    chat_service = ChatService(db)
    
    try:
        # Verify conversation exists
        conversation_data = await db.conversations.find_one({"id": conversation_id})
        if not conversation_data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        conversation = Conversation(**conversation_data)
        
        # Save user message
        user_message = Message(
            conversation_id=conversation_id,
            role="user",
            content=request.content,
        )
        await db.messages.insert_one(user_message.model_dump())
        
        # Update conversation metadata
        await db.conversations.update_one(
            {"id": conversation_id},
            {
                "$set": {
                    "updated_at": datetime.utcnow(),
                    "last_message_at": datetime.utcnow(),
                },
                "$inc": {"message_count": 1}
            }
        )
        
        logger.info(
            "user_message_sent",
            conversation_id=conversation_id,
            message_length=len(request.content),
            model=model,
            web_search_enabled=web_search,
        )
        
        # Stream AI response
        return StreamingResponse(
            chat_service.stream_response(conversation_id, conversation.project_id, model, web_search),
            media_type="text/event-stream",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("message_send_failed", error=str(e), conversation_id=conversation_id)
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def rename_conversation(conversation_id: str, request: RenameConversationRequest):
    """
    Rename a conversation.
    """
    db = await get_database()
    
    try:
        # Update conversation
        result = await db.conversations.update_one(
            {"id": conversation_id},
            {
                "$set": {
                    "title": request.title,
                    "updated_at": datetime.utcnow(),
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Get updated conversation
        conversation_data = await db.conversations.find_one({"id": conversation_id})
        conversation = Conversation(**conversation_data)
        
        # Get messages
        messages_cursor = db.messages.find({"conversation_id": conversation_id}).sort("timestamp", 1)
        messages_data = await messages_cursor.to_list(length=None)
        messages = [Message(**doc) for doc in messages_data]
        
        logger.info(
            "conversation_renamed",
            conversation_id=conversation_id,
            new_title=request.title,
        )
        
        return ConversationResponse(
            conversation=conversation,
            messages=messages
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("conversation_rename_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to rename conversation: {str(e)}")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Delete a conversation and all its messages.
    """
    db = await get_database()
    
    try:
        # Delete all messages
        messages_result = await db.messages.delete_many({"conversation_id": conversation_id})
        
        # Delete conversation
        conversation_result = await db.conversations.delete_one({"id": conversation_id})
        
        if conversation_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        logger.info(
            "conversation_deleted",
            conversation_id=conversation_id,
            messages_deleted=messages_result.deleted_count,
        )
        
        return {
            "status": "deleted",
            "conversation_id": conversation_id,
            "messages_deleted": messages_result.deleted_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("conversation_deletion_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")


@router.get("/models")
async def get_available_models():
    """
    Get list of available AI models.
    """
    db = await get_database()
    chat_service = ChatService(db)
    
    return {
        "models": [
            {
                "id": model_id,
                "name": config["display_name"],
                "provider": config["provider"],
                "max_tokens": config["max_tokens"],
                "description": config["description"]
            }
            for model_id, config in chat_service.models.items()
        ]
    }

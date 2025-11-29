"""
Context API endpoints for managing conversation organization.

Provides CRUD operations for contexts, allowing users to:
- Create new contexts with custom names, icons, and colors
- List all contexts
- Update context details
- Delete contexts
- Activate/deactivate contexts (only one active at a time)
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, HTTPException, status
from pymongo import ReturnDocument

from models.database import get_database
from models.context import Context, ContextCreate, ContextUpdate, ContextResponse

router = APIRouter()


@router.post("/contexts", response_model=ContextResponse, status_code=status.HTTP_201_CREATED)
async def create_context(context_data: ContextCreate):
    """
    Create a new context.
    
    The new context will be created in inactive state. Use the toggle endpoint
    to activate it if desired.
    """
    db = get_database()
    
    # Create context document
    context_doc = {
        "name": context_data.name,
        "icon": context_data.icon,
        "color": context_data.color,
        "description": context_data.description,
        "is_active": False,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "user_id": "alana"  # Hardcoded for now
    }
    
    # Insert into MongoDB
    result = await db.contexts.insert_one(context_doc)
    context_doc["_id"] = str(result.inserted_id)
    
    # Count conversations in this context (will be 0 for new context)
    conversation_count = await db.conversations.count_documents({"context_id": context_doc["_id"]})
    
    return ContextResponse(
        **context_doc,
        conversation_count=conversation_count
    )


@router.get("/contexts", response_model=List[ContextResponse])
async def list_contexts(user_id: str = "alana"):
    """
    List all contexts for the current user.
    
    Returns contexts sorted by:
    1. Active context first (if any)
    2. Most recently updated
    """
    db = get_database()
    
    # Fetch all contexts for user
    cursor = db.contexts.find({"user_id": user_id}).sort([
        ("is_active", -1),  # Active first
        ("updated_at", -1)  # Then by most recent
    ])
    
    contexts = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        
        # Count conversations in this context
        conversation_count = await db.conversations.count_documents({"context_id": doc["_id"]})
        
        contexts.append(ContextResponse(
            **doc,
            conversation_count=conversation_count
        ))
    
    return contexts


@router.get("/contexts/{context_id}", response_model=ContextResponse)
async def get_context(context_id: str):
    """Get a specific context by ID."""
    db = get_database()
    
    context = await db.contexts.find_one({"_id": context_id})
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Context {context_id} not found"
        )
    
    context["_id"] = str(context["_id"])
    
    # Count conversations
    conversation_count = await db.conversations.count_documents({"context_id": context_id})
    
    return ContextResponse(
        **context,
        conversation_count=conversation_count
    )


@router.patch("/contexts/{context_id}", response_model=ContextResponse)
async def update_context(context_id: str, context_update: ContextUpdate):
    """
    Update a context's details.
    
    Only provided fields will be updated. Use PATCH with only the fields you want to change.
    """
    db = get_database()
    
    # Build update document (only include provided fields)
    update_data = {}
    if context_update.name is not None:
        update_data["name"] = context_update.name
    if context_update.icon is not None:
        update_data["icon"] = context_update.icon
    if context_update.color is not None:
        update_data["color"] = context_update.color
    if context_update.description is not None:
        update_data["description"] = context_update.description
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update"
        )
    
    # Always update the updated_at timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Update in MongoDB
    updated_context = await db.contexts.find_one_and_update(
        {"_id": context_id},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER
    )
    
    if not updated_context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Context {context_id} not found"
        )
    
    updated_context["_id"] = str(updated_context["_id"])
    
    # Count conversations
    conversation_count = await db.conversations.count_documents({"context_id": context_id})
    
    return ContextResponse(
        **updated_context,
        conversation_count=conversation_count
    )


@router.post("/contexts/{context_id}/toggle", response_model=ContextResponse)
async def toggle_context(context_id: str):
    """
    Activate or deactivate a context.
    
    When activating a context:
    - All other contexts are automatically deactivated (only one can be active)
    - The specified context is set to active
    
    When deactivating a context:
    - The context is simply set to inactive
    - No other context is automatically activated
    """
    db = get_database()
    
    # Get current context
    context = await db.contexts.find_one({"_id": context_id})
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Context {context_id} not found"
        )
    
    new_active_state = not context["is_active"]
    
    if new_active_state:
        # Activating this context - deactivate all others first
        await db.contexts.update_many(
            {"user_id": context["user_id"], "_id": {"$ne": context_id}},
            {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
        )
    
    # Toggle the target context
    updated_context = await db.contexts.find_one_and_update(
        {"_id": context_id},
        {"$set": {"is_active": new_active_state, "updated_at": datetime.utcnow()}},
        return_document=ReturnDocument.AFTER
    )
    
    updated_context["_id"] = str(updated_context["_id"])
    
    # Count conversations
    conversation_count = await db.conversations.count_documents({"context_id": context_id})
    
    return ContextResponse(
        **updated_context,
        conversation_count=conversation_count
    )


@router.delete("/contexts/{context_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_context(context_id: str):
    """
    Delete a context.
    
    WARNING: This will also delete all conversations associated with this context.
    This operation cannot be undone.
    """
    db = get_database()
    
    # Check if context exists
    context = await db.contexts.find_one({"_id": context_id})
    if not context:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Context {context_id} not found"
        )
    
    # Delete all conversations in this context
    await db.conversations.delete_many({"context_id": context_id})
    
    # Delete the context itself
    await db.contexts.delete_one({"_id": context_id})
    
    return None

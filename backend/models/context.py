"""
Context models for organizing conversations by topic/purpose.

A Context represents a thematic container for conversations, allowing users to:
- Group related chats (e.g., "Romance Projects", "Research", "Brainstorming")
- Apply context-specific settings
- Organize their workspace
- Switch between different "modes" of interaction

Only one context can be active at a time.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Context(BaseModel):
    """
    Context model for conversation organization.
    
    Attributes:
        id: Unique identifier (MongoDB ObjectId as string)
        name: User-defined name (e.g., "Romance Projects")
        icon: Emoji or icon identifier (e.g., "📖", "heart", "sparkles")
        color: Hex color for visual identification (e.g., "#7C3AED")
        description: Optional user notes about the context
        is_active: Whether this context is currently active (only one can be active)
        created_at: Timestamp when context was created
        updated_at: Timestamp of last modification
        user_id: User who owns this context (for future multi-user support)
    """
    id: Optional[str] = Field(None, alias="_id")
    name: str = Field(..., min_length=1, max_length=100)
    icon: str = Field(default="💬")
    color: str = Field(default="#7C3AED")  # WriteMind violet
    description: Optional[str] = Field(None, max_length=500)
    is_active: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: str = Field(default="alana")  # Hardcoded for now
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "Romance Projects",
                "icon": "📖",
                "color": "#EC4899",
                "description": "All conversations related to romance novel writing",
                "is_active": True,
                "created_at": "2025-11-29T10:00:00Z",
                "updated_at": "2025-11-29T10:00:00Z",
                "user_id": "alana"
            }
        }


class ContextCreate(BaseModel):
    """Request schema for creating a new context."""
    name: str = Field(..., min_length=1, max_length=100)
    icon: str = Field(default="💬")
    color: str = Field(default="#7C3AED")
    description: Optional[str] = Field(None, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Sci-Fi Projects",
                "icon": "🚀",
                "color": "#3B82F6",
                "description": "Science fiction novel development"
            }
        }


class ContextUpdate(BaseModel):
    """Request schema for updating an existing context."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    icon: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Fantasy Writing",
                "icon": "⚔️",
                "color": "#8B5CF6"
            }
        }


class ContextResponse(BaseModel):
    """Response schema for context operations."""
    id: str = Field(..., alias="_id")
    name: str
    icon: str
    color: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    conversation_count: int = Field(default=0)  # Number of conversations in this context
    
    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "name": "Romance Projects",
                "icon": "📖",
                "color": "#EC4899",
                "description": "All conversations related to romance novel writing",
                "is_active": True,
                "created_at": "2025-11-29T10:00:00Z",
                "updated_at": "2025-11-29T10:00:00Z",
                "conversation_count": 12
            }
        }

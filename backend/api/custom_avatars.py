"""
Custom Avatar API Endpoints
Allows users to create, edit, fork, and delete custom avatars
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List, Optional
from datetime import datetime

from models.database import get_database
from services.custom_avatar import (
    create_custom_avatar,
    fork_builtin_avatar,
    update_custom_avatar,
    delete_custom_avatar,
    load_custom_avatar,
    list_user_avatars,
    MAX_CUSTOM_AVATARS_PER_USER
)
from pydantic import BaseModel, Field


# ==================== Request/Response Models ====================

class CreateCustomAvatarRequest(BaseModel):
    """Request to create a new custom avatar from scratch"""
    user_id: str = Field(..., description="ID of the user creating the avatar")
    name: str = Field(..., description="Full name of the avatar (e.g., 'Historical Fiction Expert')")
    short_name: str = Field(..., description="Short identifier (e.g., 'history_master')")
    emoji: str = Field(default="🤖", description="Unicode emoji for visual representation")
    specialty: str = Field(..., description="What this avatar specializes in")
    backstory: str = Field(..., description="Avatar's background and expertise")
    creative_board_catchphrase: str = Field(..., description="Phrase used in Creative Board discussions")
    personality_traits: List[str] = Field(default_factory=list, description="List of personality traits")
    knowledge_base_text: Optional[str] = Field(None, description="Optional knowledge base content")


class ForkAvatarRequest(BaseModel):
    """Request to fork a built-in avatar"""
    user_id: str = Field(..., description="ID of the user forking the avatar")
    builtin_avatar_id: str = Field(..., description="ID of built-in avatar to fork")
    custom_name: Optional[str] = Field(None, description="Override name (defaults to 'My {original_name}')")
    custom_short_name: Optional[str] = Field(None, description="Override short name")
    custom_emoji: Optional[str] = Field(None, description="Override emoji")
    modifications: Optional[Dict[str, Any]] = Field(None, description="Fields to modify after forking")


class UpdateCustomAvatarRequest(BaseModel):
    """Request to update an existing custom avatar"""
    user_id: str = Field(..., description="ID of the user (must match avatar owner)")
    name: Optional[str] = None
    emoji: Optional[str] = None
    specialty: Optional[str] = None
    backstory: Optional[str] = None
    creative_board_catchphrase: Optional[str] = None
    personality_traits: Optional[List[str]] = None


class CustomAvatarResponse(BaseModel):
    """Response with custom avatar details"""
    avatar_id: str
    user_id: str
    name: str
    short_name: str
    emoji: str
    specialty: str
    backstory: str
    creative_board_catchphrase: str
    personality_traits: List[str]
    forked_from: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ==================== Router ====================

router = APIRouter(prefix="/api/avatars/custom", tags=["custom-avatars"])


# ==================== Endpoints ====================

@router.post("/create")
async def create_custom_avatar_endpoint(
    request: CreateCustomAvatarRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> CustomAvatarResponse:
    """
    Create a new custom avatar from scratch.
    
    **Limits:** Maximum {MAX_CUSTOM_AVATARS_PER_USER} custom avatars per user.
    
    **Example:**
    ```json
    {
        "user_id": "alana",
        "name": "Historical Fiction Expert",
        "short_name": "history_master",
        "emoji": "📜",
        "specialty": "Medieval and Renaissance historical accuracy",
        "backstory": "PhD in Medieval History with 20 years researching...",
        "creative_board_catchphrase": "History speaks through accuracy...",
        "personality_traits": ["detail-oriented", "scholarly", "passionate"]
    }
    ```
    """
    try:
        custom_avatar = await create_custom_avatar(
            db=db,
            user_id=request.user_id,
            name=request.name,
            short_name=request.short_name,
            emoji=request.emoji,
            specialty=request.specialty,
            backstory=request.backstory,
            creative_board_catchphrase=request.creative_board_catchphrase,
            personality_traits=request.personality_traits,
            knowledge_base_text=request.knowledge_base_text
        )
        
        avatar_dict = custom_avatar.to_dict()
        
        return CustomAvatarResponse(
            avatar_id=avatar_dict["avatar_id"],
            user_id=avatar_dict["user_id"],
            name=avatar_dict["name"],
            short_name=avatar_dict["short_name"],
            emoji=avatar_dict["emoji"],
            specialty=avatar_dict["specialty"],
            backstory=avatar_dict["backstory"],
            creative_board_catchphrase=avatar_dict["creative_board_catchphrase"],
            personality_traits=avatar_dict["personality_traits"],
            forked_from=avatar_dict.get("forked_from"),
            created_at=avatar_dict["created_at"],
            updated_at=avatar_dict["updated_at"]
        )
        
    except ValueError as e:
        # Handle avatar limit exceeded
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create custom avatar: {str(e)}")


@router.post("/fork")
async def fork_avatar_endpoint(
    request: ForkAvatarRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> CustomAvatarResponse:
    """
    Fork a built-in avatar to create an editable custom version.
    
    **Example Use Cases:**
    - Fork "research_assistant" to specialize in historical research
    - Fork "romance_expert" to add sweet romance subgenre expertise
    - Fork "plot_architect" to focus on mystery plot structures
    
    **Example:**
    ```json
    {
        "user_id": "alana",
        "builtin_avatar_id": "research_assistant",
        "custom_name": "My Historical Research Assistant",
        "custom_emoji": "📜",
        "modifications": {
            "specialty": "Medieval and Renaissance historical research",
            "personality_traits": ["scholarly", "detail-oriented", "medieval-focused"]
        }
    }
    ```
    """
    try:
        custom_avatar = await fork_builtin_avatar(
            db=db,
            user_id=request.user_id,
            builtin_avatar_id=request.builtin_avatar_id,
            custom_name=request.custom_name,
            custom_short_name=request.custom_short_name,
            custom_emoji=request.custom_emoji,
            modifications=request.modifications
        )
        
        avatar_dict = custom_avatar.to_dict()
        
        return CustomAvatarResponse(
            avatar_id=avatar_dict["avatar_id"],
            user_id=avatar_dict["user_id"],
            name=avatar_dict["name"],
            short_name=avatar_dict["short_name"],
            emoji=avatar_dict["emoji"],
            specialty=avatar_dict["specialty"],
            backstory=avatar_dict["backstory"],
            creative_board_catchphrase=avatar_dict["creative_board_catchphrase"],
            personality_traits=avatar_dict["personality_traits"],
            forked_from=avatar_dict.get("forked_from"),
            created_at=avatar_dict["created_at"],
            updated_at=avatar_dict["updated_at"]
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fork avatar: {str(e)}")


@router.get("/list")
async def list_custom_avatars(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    List all custom avatars for a user.
    
    **Returns:** List of custom avatars owned by the user.
    """
    try:
        custom_avatars = await list_user_avatars(db, user_id)
        
        avatars_data = []
        for avatar in custom_avatars:
            avatar_dict = avatar.to_dict()
            avatars_data.append({
                "avatar_id": avatar_dict["avatar_id"],
                "name": avatar_dict["name"],
                "short_name": avatar_dict["short_name"],
                "emoji": avatar_dict["emoji"],
                "specialty": avatar_dict["specialty"],
                "forked_from": avatar_dict.get("forked_from"),
                "created_at": avatar_dict["created_at"],
                "updated_at": avatar_dict["updated_at"]
            })
        
        return {
            "avatars": avatars_data,
            "count": len(avatars_data),
            "limit": MAX_CUSTOM_AVATARS_PER_USER,
            "remaining": max(0, MAX_CUSTOM_AVATARS_PER_USER - len(avatars_data))
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list custom avatars: {str(e)}")


@router.get("/{avatar_id}")
async def get_custom_avatar(
    avatar_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> CustomAvatarResponse:
    """
    Get detailed information about a specific custom avatar.
    
    **Requires:** user_id must match avatar owner
    """
    try:
        custom_avatar = await load_custom_avatar(db, avatar_id, user_id)
        
        if not custom_avatar:
            raise HTTPException(status_code=404, detail="Custom avatar not found or access denied")
        
        avatar_dict = custom_avatar.to_dict()
        
        return CustomAvatarResponse(
            avatar_id=avatar_dict["avatar_id"],
            user_id=avatar_dict["user_id"],
            name=avatar_dict["name"],
            short_name=avatar_dict["short_name"],
            emoji=avatar_dict["emoji"],
            specialty=avatar_dict["specialty"],
            backstory=avatar_dict["backstory"],
            creative_board_catchphrase=avatar_dict["creative_board_catchphrase"],
            personality_traits=avatar_dict["personality_traits"],
            forked_from=avatar_dict.get("forked_from"),
            created_at=avatar_dict["created_at"],
            updated_at=avatar_dict["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get custom avatar: {str(e)}")


@router.put("/{avatar_id}")
async def update_custom_avatar_endpoint(
    avatar_id: str,
    request: UpdateCustomAvatarRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> CustomAvatarResponse:
    """
    Update an existing custom avatar.
    
    **Requires:** user_id must match avatar owner
    
    **Note:** Only custom avatars can be edited. Built-in avatars are read-only.
    """
    try:
        # Build updates dict from non-None fields
        updates = {}
        if request.name is not None:
            updates["name"] = request.name
        if request.emoji is not None:
            updates["emoji"] = request.emoji
        if request.specialty is not None:
            updates["specialty"] = request.specialty
        if request.backstory is not None:
            updates["backstory"] = request.backstory
        if request.creative_board_catchphrase is not None:
            updates["creative_board_catchphrase"] = request.creative_board_catchphrase
        if request.personality_traits is not None:
            updates["personality_traits"] = request.personality_traits
        
        if not updates:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        custom_avatar = await update_custom_avatar(
            db=db,
            avatar_id=avatar_id,
            user_id=request.user_id,
            updates=updates
        )
        
        if not custom_avatar:
            raise HTTPException(status_code=404, detail="Custom avatar not found or access denied")
        
        avatar_dict = custom_avatar.to_dict()
        
        return CustomAvatarResponse(
            avatar_id=avatar_dict["avatar_id"],
            user_id=avatar_dict["user_id"],
            name=avatar_dict["name"],
            short_name=avatar_dict["short_name"],
            emoji=avatar_dict["emoji"],
            specialty=avatar_dict["specialty"],
            backstory=avatar_dict["backstory"],
            creative_board_catchphrase=avatar_dict["creative_board_catchphrase"],
            personality_traits=avatar_dict["personality_traits"],
            forked_from=avatar_dict.get("forked_from"),
            created_at=avatar_dict["created_at"],
            updated_at=avatar_dict["updated_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update custom avatar: {str(e)}")


@router.delete("/{avatar_id}")
async def delete_custom_avatar_endpoint(
    avatar_id: str,
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, str]:
    """
    Delete a custom avatar.
    
    **Requires:** user_id must match avatar owner
    
    **Warning:** This action cannot be undone. All avatar data will be permanently deleted.
    """
    try:
        success = await delete_custom_avatar(db, avatar_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Custom avatar not found or access denied")
        
        return {
            "status": "success",
            "message": f"Custom avatar {avatar_id} deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete custom avatar: {str(e)}")


@router.post("/{avatar_id}/knowledge")
async def upload_knowledge_base(
    avatar_id: str,
    user_id: str,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
) -> Dict[str, Any]:
    """
    Upload a knowledge base document for a custom avatar.
    
    **Supported formats:** .txt, .md, .pdf
    
    **Future Feature:** This endpoint is a placeholder for file upload functionality.
    """
    # TODO: Implement file upload and processing
    # 1. Validate file type (txt, md, pdf)
    # 2. Extract text content (use PyPDF2 for PDFs)
    # 3. Store in avatar_brains collection
    # 4. Update avatar's knowledge_base_docs array
    
    raise HTTPException(
        status_code=501,
        detail="Knowledge base upload feature not yet implemented. Coming soon!"
    )

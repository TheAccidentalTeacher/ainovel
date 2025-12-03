"""
Custom Avatar System - User-Created Avatars

Allows users to create, edit, and manage their own specialist avatars.
Custom avatars can:
- Have unique personalities and system prompts
- Upload custom knowledge bases (manuscripts, research)
- Participate in Creative Board consultations
- Be forked from built-in avatars

Architecture:
- Built-in avatars (like Research Assistant) are templates - read-only
- User avatars are stored in MongoDB and fully editable
- Both types use the same Avatar base class
- Both can participate in Creative Board
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase
from services.avatar_base import Avatar, AvatarRole
import anthropic
from config.settings import get_settings

settings = get_settings()


class CustomAvatar(Avatar):
    """
    User-created custom avatar.
    
    Extends base Avatar class with:
    - Database-backed configuration
    - User-editable system prompts
    - Custom knowledge base support
    - Fork from built-in avatars
    """
    
    def __init__(
        self,
        avatar_id: str,
        name: str,
        user_id: str,
        db: AsyncIOMotorDatabase,
        role: AvatarRole = AvatarRole.CUSTOM,
        short_name: Optional[str] = None,
        personality_description: Optional[str] = None,
        creative_board_catchphrase: Optional[str] = None,
        emoji: str = "✨",
        system_prompt: Optional[str] = None,
        expertise: Optional[List[str]] = None,
        is_forked: bool = False,
        forked_from: Optional[str] = None
    ):
        """
        Initialize custom avatar.
        
        Args:
            avatar_id: Unique identifier (stored in DB)
            name: Display name
            user_id: Owner user ID
            db: MongoDB database
            role: AvatarRole (default CUSTOM)
            short_name: Abbreviated name (defaults to first word of name)
            personality_description: One-line personality
            creative_board_catchphrase: Signature phrase
            emoji: Visual representation
            system_prompt: Custom AI system prompt (overrides default)
            expertise: List of expertise domains
            is_forked: Whether this was forked from a built-in avatar
            forked_from: ID of built-in avatar this was forked from
        """
        super().__init__(
            avatar_id=avatar_id,
            name=name,
            role=role,
            short_name=short_name or name.split()[0],
            personality_description=personality_description or "Custom specialist avatar",
            creative_board_catchphrase=creative_board_catchphrase or "From my perspective...",
            emoji=emoji,
            db=db,
            user_id=user_id
        )
        
        self._custom_system_prompt = system_prompt
        self._custom_expertise = expertise or []
        self.is_forked = is_forked
        self.forked_from = forked_from
    
    def get_system_prompt(self) -> str:
        """
        Return custom system prompt or generate default.
        
        If user provided custom prompt, use it.
        Otherwise, generate from personality description.
        """
        if self._custom_system_prompt:
            return self._custom_system_prompt
        
        # Generate default prompt from personality
        return f"""You are {self.name}, a specialist avatar assisting with creative writing.

PERSONALITY:
{self.personality_description}

EXPERTISE:
You specialize in: {', '.join(self._custom_expertise) if self._custom_expertise else 'general writing assistance'}

CREATIVE BOARD MODE:
When participating in Creative Board consultations with other avatars:
- Provide your unique perspective based on your expertise
- Use your catchphrase: "{self.creative_board_catchphrase}"
- Vote on proposals (support/oppose/abstain) based on your specialty
- Collaborate constructively with other avatars

RESPONSE STYLE:
- Be helpful, specific, and actionable
- Draw from your areas of expertise
- Maintain your personality consistently
- Provide examples when helpful
- Admit when something is outside your expertise

Remember: You are a creative partner, not just an information source. Engage thoughtfully with the writer's needs."""
    
    def get_expertise_domains(self) -> List[str]:
        """Return custom expertise domains"""
        return self._custom_expertise
    
    def to_dict(self) -> Dict[str, Any]:
        """Serialize custom avatar with additional fields"""
        base_dict = super().to_dict()
        base_dict.update({
            "is_custom": True,
            "is_forked": self.is_forked,
            "forked_from": self.forked_from,
            "custom_system_prompt": self._custom_system_prompt,
            "editable": True  # UI can show edit button
        })
        return base_dict


# Configuration
MAX_CUSTOM_AVATARS_PER_USER = 25  # Reasonable limit for most users


async def create_custom_avatar(
    db: AsyncIOMotorDatabase,
    user_id: str,
    name: str,
    personality_description: Optional[str] = None,
    system_prompt: Optional[str] = None,
    expertise: Optional[List[str]] = None,
    emoji: str = "✨",
    creative_board_catchphrase: Optional[str] = None
) -> CustomAvatar:
    """
    Create a new custom avatar and save to database.
    
    Limits: Users can create up to MAX_CUSTOM_AVATARS_PER_USER avatars.
    
    Args:
        db: MongoDB database
        user_id: Owner user ID
        name: Avatar name
        personality_description: One-line personality
        system_prompt: Custom AI system prompt
        expertise: List of expertise tags
        emoji: Visual emoji representation
        creative_board_catchphrase: Signature phrase for Creative Board
    
    Returns:
        CustomAvatar instance
    
    Raises:
        ValueError: If user has reached avatar limit
    """
    from uuid import uuid4
    
    # Check user's avatar count
    user_avatar_count = await db.custom_avatars.count_documents({"user_id": user_id})
    if user_avatar_count >= MAX_CUSTOM_AVATARS_PER_USER:
        raise ValueError(
            f"Avatar limit reached. Users can create up to {MAX_CUSTOM_AVATARS_PER_USER} custom avatars. "
            f"Delete unused avatars to create new ones."
        )
    
    # Generate unique ID
    avatar_id = f"custom_{user_id}_{str(uuid4())[:8]}"
    
    # Save to database
    avatar_doc = {
        "avatar_id": avatar_id,
        "user_id": user_id,
        "name": name,
        "personality_description": personality_description,
        "system_prompt": system_prompt,
        "expertise": expertise or [],
        "emoji": emoji,
        "creative_board_catchphrase": creative_board_catchphrase,
        "is_forked": False,
        "forked_from": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.custom_avatars.insert_one(avatar_doc)
    
    # Create and return avatar instance
    return CustomAvatar(
        avatar_id=avatar_id,
        name=name,
        user_id=user_id,
        db=db,
        personality_description=personality_description,
        system_prompt=system_prompt,
        expertise=expertise,
        emoji=emoji,
        creative_board_catchphrase=creative_board_catchphrase
    )


async def fork_builtin_avatar(
    db: AsyncIOMotorDatabase,
    user_id: str,
    builtin_avatar: Avatar,
    custom_name: Optional[str] = None,
    custom_prompt_additions: Optional[str] = None
) -> CustomAvatar:
    """
    Fork a built-in avatar to create a customizable copy.
    
    User gets all the expertise and personality of the built-in avatar,
    but can customize the system prompt, add additional expertise, etc.
    
    Args:
        db: MongoDB database
        user_id: User forking the avatar
        builtin_avatar: Built-in avatar to fork
        custom_name: New name (defaults to "My {original_name}")
        custom_prompt_additions: Additional instructions to append
    
    Returns:
        CustomAvatar instance (forked)
    """
    from uuid import uuid4
    
    # Generate ID for fork
    avatar_id = f"fork_{user_id}_{builtin_avatar.avatar_id}_{str(uuid4())[:8]}"
    
    # Build custom system prompt (original + additions)
    original_prompt = builtin_avatar.get_system_prompt()
    if custom_prompt_additions:
        custom_prompt = f"{original_prompt}\n\n# CUSTOM INSTRUCTIONS:\n{custom_prompt_additions}"
    else:
        custom_prompt = original_prompt
    
    # Save to database
    avatar_doc = {
        "avatar_id": avatar_id,
        "user_id": user_id,
        "name": custom_name or f"My {builtin_avatar.name}",
        "personality_description": builtin_avatar.personality_description,
        "system_prompt": custom_prompt,
        "expertise": builtin_avatar.get_expertise_domains(),
        "emoji": builtin_avatar.emoji,
        "creative_board_catchphrase": builtin_avatar.creative_board_catchphrase,
        "is_forked": True,
        "forked_from": builtin_avatar.avatar_id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db.custom_avatars.insert_one(avatar_doc)
    
    # Create and return forked avatar
    return CustomAvatar(
        avatar_id=avatar_id,
        name=custom_name or f"My {builtin_avatar.name}",
        user_id=user_id,
        db=db,
        personality_description=builtin_avatar.personality_description,
        system_prompt=custom_prompt,
        expertise=builtin_avatar.get_expertise_domains(),
        emoji=builtin_avatar.emoji,
        creative_board_catchphrase=builtin_avatar.creative_board_catchphrase,
        is_forked=True,
        forked_from=builtin_avatar.avatar_id
    )


async def update_custom_avatar(
    db: AsyncIOMotorDatabase,
    avatar_id: str,
    user_id: str,
    **updates
) -> bool:
    """
    Update custom avatar fields.
    
    Args:
        db: MongoDB database
        avatar_id: Avatar ID to update
        user_id: Owner user ID (for security)
        **updates: Fields to update (name, personality_description, system_prompt, etc.)
    
    Returns:
        True if updated, False if not found or not owned by user
    """
    # Verify ownership
    avatar_doc = await db.custom_avatars.find_one({
        "avatar_id": avatar_id,
        "user_id": user_id
    })
    
    if not avatar_doc:
        return False
    
    # Update fields
    updates["updated_at"] = datetime.utcnow()
    
    result = await db.custom_avatars.update_one(
        {"avatar_id": avatar_id, "user_id": user_id},
        {"$set": updates}
    )
    
    return result.modified_count > 0


async def delete_custom_avatar(
    db: AsyncIOMotorDatabase,
    avatar_id: str,
    user_id: str
) -> bool:
    """
    Delete custom avatar.
    
    Args:
        db: MongoDB database
        avatar_id: Avatar ID to delete
        user_id: Owner user ID (for security)
    
    Returns:
        True if deleted, False if not found or not owned by user
    """
    result = await db.custom_avatars.delete_one({
        "avatar_id": avatar_id,
        "user_id": user_id
    })
    
    return result.deleted_count > 0


async def load_custom_avatar(
    db: AsyncIOMotorDatabase,
    avatar_id: str,
    user_id: str
) -> Optional[CustomAvatar]:
    """
    Load custom avatar from database.
    
    Args:
        db: MongoDB database
        avatar_id: Avatar ID to load
        user_id: Owner user ID
    
    Returns:
        CustomAvatar instance or None if not found
    """
    avatar_doc = await db.custom_avatars.find_one({
        "avatar_id": avatar_id,
        "user_id": user_id
    })
    
    if not avatar_doc:
        return None
    
    return CustomAvatar(
        avatar_id=avatar_doc["avatar_id"],
        name=avatar_doc["name"],
        user_id=user_id,
        db=db,
        personality_description=avatar_doc.get("personality_description"),
        system_prompt=avatar_doc.get("system_prompt"),
        expertise=avatar_doc.get("expertise", []),
        emoji=avatar_doc.get("emoji", "✨"),
        creative_board_catchphrase=avatar_doc.get("creative_board_catchphrase"),
        is_forked=avatar_doc.get("is_forked", False),
        forked_from=avatar_doc.get("forked_from")
    )


async def list_user_avatars(
    db: AsyncIOMotorDatabase,
    user_id: str
) -> List[CustomAvatar]:
    """
    List all custom avatars for a user.
    
    Args:
        db: MongoDB database
        user_id: User ID
    
    Returns:
        List of CustomAvatar instances
    """
    cursor = db.custom_avatars.find({"user_id": user_id})
    avatars = []
    
    async for doc in cursor:
        avatar = CustomAvatar(
            avatar_id=doc["avatar_id"],
            name=doc["name"],
            user_id=user_id,
            db=db,
            personality_description=doc.get("personality_description"),
            system_prompt=doc.get("system_prompt"),
            expertise=doc.get("expertise", []),
            emoji=doc.get("emoji", "✨"),
            creative_board_catchphrase=doc.get("creative_board_catchphrase"),
            is_forked=doc.get("is_forked", False),
            forked_from=doc.get("forked_from")
        )
        avatars.append(avatar)
    
    return avatars

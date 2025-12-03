# Custom Avatar System: Complete Guide

## Overview

The AI Novel Generator now supports **Custom Avatars** - user-created writing specialists that work seamlessly alongside the built-in avatars in the Creative Board system.

## System Architecture

### Two Types of Avatars

1. **Built-in Avatars** (Read-Only, Code-Based)
   - Stored in code: `backend/services/*_avatar.py`
   - Global and available to all users
   - Cannot be modified by users
   - Examples: Research Assistant 🔬, Plot Architect 📐, Character Developer 🎭

2. **Custom Avatars** (User-Editable, Database-Backed)
   - Stored in MongoDB: `custom_avatars` collection
   - User-owned and isolated per user
   - Fully customizable
   - Can be created from scratch or forked from built-ins

### Avatar Registry System

The `get_avatar_registry()` function dynamically loads avatars:

```python
async def get_avatar_registry(
    db: AsyncIOMotorDatabase,
    user_id: Optional[str] = None
) -> Dict[str, Avatar]:
    """
    Load both built-in and custom avatars
    
    Returns:
        Dict mapping avatar_id to Avatar instances
    """
    # 1. Load built-in avatars (cached globally)
    registry = dict(_avatar_registry)  # 7 built-in avatars
    
    # 2. Load custom avatars for this user
    if user_id:
        custom_avatars = await list_user_avatars(db, user_id)
        for custom_avatar in custom_avatars:
            registry[custom_avatar.avatar_id] = custom_avatar
    
    # 3. Return combined registry
    return registry
```

## Auto-Registration in Creative Board

**Question:** "How do we make sure custom avatars are added to the council of avatars?"

**Answer:** They're **automatically included** - no manual registration needed!

### How It Works

1. **User selects avatars for Creative Board consultation**
2. **System calls** `get_avatar_registry(db, user_id="alana")`
3. **Registry returns:**
   - 7 built-in avatars (global)
   - N custom avatars (for user "alana")
4. **All avatars available** for Creative Board discussion

### Example Flow

```
User: "Let's discuss my mystery plot"

Frontend:
  → GET /api/avatars/list?user_id=alana

Backend:
  → registry = get_avatar_registry(db, user_id="alana")
  → Returns: [
      {id: "research_assistant", name: "Research Assistant", emoji: "🔬", is_custom: false},
      {id: "plot_architect", name: "Plot Architect", emoji: "📐", is_custom: false},
      ...
      {id: "custom_mystery_expert_alana_123", name: "My Mystery Expert", emoji: "🔎", is_custom: true}
    ]

User selects avatars → Creates Creative Board consultation
  → System loads selected avatars from registry
  → Both built-in and custom avatars participate equally
```

## User Limits

### Avatar Limit: 25 per User

```python
MAX_CUSTOM_AVATARS_PER_USER = 25
```

**Why 25?**
- Enough for multiple genre specialists
- Room for project-specific avatars
- Allows experimentation
- Prevents database bloat from abandoned accounts

**What happens at limit?**
```python
if user_avatar_count >= MAX_CUSTOM_AVATARS_PER_USER:
    raise ValueError(
        f"Avatar limit reached ({MAX_CUSTOM_AVATARS_PER_USER} max). "
        f"Please delete unused avatars before creating new ones."
    )
```

**Error Response:**
```json
{
  "status": 400,
  "detail": "Avatar limit reached (25 max). Please delete unused avatars before creating new ones."
}
```

## API Endpoints

### 1. Create Custom Avatar

**POST** `/api/avatars/custom/create`

Create a brand new avatar from scratch.

```json
{
  "user_id": "alana",
  "name": "Historical Fiction Expert",
  "short_name": "history_master",
  "emoji": "📜",
  "specialty": "Medieval and Renaissance historical accuracy",
  "backstory": "PhD in Medieval History with 20 years researching court dynamics, warfare, and daily life. Specializes in ensuring historical novels feel authentic without overwhelming readers with pedantic details.",
  "creative_board_catchphrase": "History speaks through accuracy, but fiction breathes through story.",
  "personality_traits": ["detail-oriented", "scholarly", "storyteller"]
}
```

**Response:**
```json
{
  "avatar_id": "custom_history_master_alana_1234567890",
  "user_id": "alana",
  "name": "Historical Fiction Expert",
  "emoji": "📜",
  "specialty": "Medieval and Renaissance historical accuracy",
  "forked_from": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 2. Fork Built-in Avatar

**POST** `/api/avatars/custom/fork`

Create an editable copy of a built-in avatar.

```json
{
  "user_id": "alana",
  "builtin_avatar_id": "romance_expert",
  "custom_name": "Sweet Romance Specialist",
  "custom_emoji": "💝",
  "modifications": {
    "specialty": "Sweet romance (clean, fade-to-black intimate scenes)",
    "personality_traits": ["wholesome", "optimistic", "relationship-focused"]
  }
}
```

**Response:**
```json
{
  "avatar_id": "custom_sweet_romance_alana_1234567891",
  "user_id": "alana",
  "name": "Sweet Romance Specialist",
  "emoji": "💝",
  "specialty": "Sweet romance (clean, fade-to-black intimate scenes)",
  "forked_from": "romance_expert",
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### 3. List User's Custom Avatars

**GET** `/api/avatars/custom/list?user_id=alana`

Get all custom avatars for a user.

**Response:**
```json
{
  "avatars": [
    {
      "avatar_id": "custom_history_master_alana_1234567890",
      "name": "Historical Fiction Expert",
      "short_name": "history_master",
      "emoji": "📜",
      "specialty": "Medieval and Renaissance historical accuracy",
      "forked_from": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    },
    {
      "avatar_id": "custom_sweet_romance_alana_1234567891",
      "name": "Sweet Romance Specialist",
      "short_name": "sweet_romance",
      "emoji": "💝",
      "specialty": "Sweet romance (clean, fade-to-black intimate scenes)",
      "forked_from": "romance_expert",
      "created_at": "2024-01-15T10:35:00Z",
      "updated_at": "2024-01-15T10:35:00Z"
    }
  ],
  "count": 2,
  "limit": 25,
  "remaining": 23
}
```

### 4. Get Single Custom Avatar

**GET** `/api/avatars/custom/{avatar_id}?user_id=alana`

Get detailed information about a custom avatar.

### 5. Update Custom Avatar

**PUT** `/api/avatars/custom/{avatar_id}`

Update an existing custom avatar.

```json
{
  "user_id": "alana",
  "name": "Historical Romance Expert",
  "specialty": "Medieval romance with historical accuracy",
  "personality_traits": ["romantic", "scholarly", "passionate"]
}
```

### 6. Delete Custom Avatar

**DELETE** `/api/avatars/custom/{avatar_id}?user_id=alana`

Permanently delete a custom avatar.

**Response:**
```json
{
  "status": "success",
  "message": "Custom avatar custom_history_master_alana_1234567890 deleted successfully"
}
```

## Creative Board Integration

### List All Avatars (Built-in + Custom)

**GET** `/api/avatars/list?user_id=alana`

Returns both built-in and custom avatars with type indicators.

**Response:**
```json
{
  "avatars": [
    {
      "avatar_id": "research_assistant",
      "name": "Research Assistant",
      "emoji": "🔬",
      "specialty": "Research, fact-checking, world-building consistency",
      "is_custom": false
    },
    {
      "avatar_id": "plot_architect",
      "name": "Plot Architect",
      "emoji": "📐",
      "specialty": "Plot structure, pacing, story beats",
      "is_custom": false
    },
    ...
    {
      "avatar_id": "custom_history_master_alana_1234567890",
      "name": "Historical Fiction Expert",
      "emoji": "📜",
      "specialty": "Medieval and Renaissance historical accuracy",
      "is_custom": true,
      "forked_from": null
    }
  ],
  "count": 9,
  "built_in_count": 7,
  "custom_count": 2
}
```

### Creative Board Consultation

**POST** `/api/avatars/creative-board`

Start a Creative Board discussion with selected avatars.

```json
{
  "debate_topic": "Should my protagonist reveal her secret identity in Chapter 15?",
  "participating_agents": [
    "plot_architect",
    "character_developer",
    "custom_history_master_alana_1234567890"
  ],
  "context": {
    "project_id": "medieval_mystery_001",
    "genre": "Historical Mystery"
  },
  "rounds": 2
}
```

**System Behavior:**
1. Loads registry with `get_avatar_registry(db, user_id="alana")`
2. Finds avatars by ID (works for both built-in and custom)
3. Conducts Creative Board discussion
4. All avatars contribute equally regardless of type

## Safety & Isolation

### Built-in Avatar Protection

- Built-in avatars stored in code (immutable)
- Cannot be edited via API
- Forking creates a copy (doesn't modify original)
- Global across all users

### Custom Avatar Isolation

- Each custom avatar has `user_id` field
- All operations validate ownership:
  ```python
  if custom_avatar["user_id"] != user_id:
      raise ValueError("Access denied")
  ```
- Users cannot see/edit each other's custom avatars
- Deletion requires ownership validation

### Database Schema

**Collection:** `custom_avatars`

```javascript
{
  _id: ObjectId("..."),
  avatar_id: "custom_history_master_alana_1234567890",
  user_id: "alana",
  name: "Historical Fiction Expert",
  short_name: "history_master",
  emoji: "📜",
  specialty: "Medieval and Renaissance historical accuracy",
  backstory: "PhD in Medieval History...",
  creative_board_catchphrase: "History speaks through accuracy...",
  personality_traits: ["detail-oriented", "scholarly", "storyteller"],
  knowledge_base_docs: [],  // Array of document IDs
  forked_from: null,  // Or "research_assistant" if forked
  created_at: ISODate("2024-01-15T10:30:00Z"),
  updated_at: ISODate("2024-01-15T10:30:00Z")
}
```

**Indexes:**
```javascript
db.custom_avatars.createIndex({ user_id: 1 })
db.custom_avatars.createIndex({ avatar_id: 1, user_id: 1 })
```

## Use Cases

### Use Case 1: Multi-Genre Author

**Alana writes both historical fiction and contemporary romance.**

1. **Fork Romance Expert** → "Sweet Romance Specialist" (💝)
   - Modify: Focus on clean romance, fade-to-black scenes
   - Use for: Contemporary romance novels

2. **Create Historical Expert** → "Historical Fiction Expert" (📜)
   - Specialty: Medieval and Renaissance accuracy
   - Use for: Historical fiction novels

3. **Creative Board Consultation:**
   - Historical novel: `[Plot Architect, Historical Expert, Character Developer]`
   - Romance novel: `[Sweet Romance Specialist, Dialogue Coach, Editor Supreme]`

### Use Case 2: Specialized Project

**Alana is writing a Victorian mystery series.**

1. **Fork Mystery Master** → "Victorian Mystery Specialist" (🎩)
   - Add: Victorian-era social conventions, technology constraints
   - Knowledge base: Upload Victorian etiquette guide

2. **Fork Research Assistant** → "Victorian Research Assistant" (🔬📚)
   - Add: Focus on 1880s London geography, fashion, language

3. **Creative Board:**
   - Use specialized avatars for Victorian-specific questions
   - Use general avatars (Plot Architect, Editor) for universal writing issues

### Use Case 3: Experimentation

**Alana tests different writing philosophies.**

1. **Create "Minimalist Editor"** (✂️)
   - Extreme brevity advocate
   - "Cut everything that doesn't serve plot or character"

2. **Create "Maximalist Editor"** (🌈)
   - Rich description advocate
   - "Paint the world with sensory details"

3. **Creative Board:**
   - Run same scene through both editors
   - Compare feedback and choose preferred approach

## Frontend Implementation (Upcoming)

### Avatar Management UI

**Component:** `CustomAvatarManager.tsx`

**Features:**
- List custom avatars with edit/delete buttons
- "Create New Avatar" form
- "Fork Built-in Avatar" selector
- Visual indicators (emoji, forked badge)
- Usage count (25/25 limit display)

### Creative Board Avatar Selector

**Enhancement:** `ChatWidget.tsx` Creative Board modal

**Changes:**
- Separate sections: "Built-in Avatars" and "My Custom Avatars"
- Checkboxes for avatar selection
- Visual differentiation (custom badge, different background)
- Both types work identically in consultations

## Summary

### Key Points

✅ **Auto-Registration**: Custom avatars automatically appear in Creative Board via `get_avatar_registry(user_id)`

✅ **User Limit**: 25 custom avatars per user (configurable via `MAX_CUSTOM_AVATARS_PER_USER`)

✅ **Safety**: Built-in avatars protected (read-only), custom avatars isolated (ownership validation)

✅ **Seamless Integration**: Both avatar types work identically in Creative Board consultations

✅ **No Manual Steps**: System handles avatar loading and registration dynamically

### Questions Answered

**Q: How many custom avatars can be created?**
A: 25 per user (configurable constant)

**Q: How do we make sure they are added to the council of avatars?**
A: Automatic - `get_avatar_registry(user_id)` loads both built-in and custom avatars dynamically. No manual registration needed.

**Q: Can users break the system by creating bad avatars?**
A: No - custom avatars are isolated, ownership-validated, and don't affect built-in avatars or other users.

**Q: Do custom avatars work the same as built-in avatars?**
A: Yes - identical behavior in Creative Board consultations. The only difference is editability and ownership.

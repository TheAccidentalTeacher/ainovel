# Custom Avatar System - Architecture & User Guide

## Overview

**YES - Users can safely add and edit avatars without breaking the system!**

The system supports two types of avatars:

### 1. Built-in Avatars (Read-Only Templates)
- Research Assistant 🔬
- Plot Architect 📐
- Character Developer 🎭
- Dialogue Coach 💬
- Editor Supreme ✍️
- Romance Expert 💕
- Mystery Master 🔍

**Characteristics:**
- Professional, battle-tested personalities
- Extensive system prompts with genre expertise
- Reference comprehensive research documents
- **Read-only** - users cannot edit these
- Available to all users
- Can be **forked** to create customizable copies

### 2. Custom Avatars (User-Created & Editable)
- Created by users from scratch OR forked from built-ins
- Fully editable (name, personality, system prompt, expertise)
- Can upload custom knowledge bases (manuscripts, research docs)
- Participate in Creative Board consultations
- Private to creating user
- Can be deleted by owner

## Why This Won't Break the System

### Safety Mechanisms:

1. **Isolation**: Custom avatars are stored separately in MongoDB (`custom_avatars` collection)
2. **Ownership**: Users can only edit/delete their own avatars
3. **Built-in Protection**: Built-in avatars are code-based, not DB-based - cannot be modified
4. **Validation**: All avatar operations validate user ownership
5. **Registry Pattern**: System loads built-in avatars once, then adds custom avatars per-user

### Technical Architecture:

```
Avatar Base Class
├── ResearchAssistantAvatar (built-in, read-only)
├── PlotArchitectAvatar (built-in, read-only)
├── ...other built-ins...
└── CustomAvatar (user-created, editable)
    ├── From scratch
    └── Forked from built-in
```

## User Workflows

### Workflow 1: Create Custom Avatar from Scratch

```
User: "Create a new avatar"
System: Shows creation form
User fills in:
- Name: "Romance Specialist for Historical Fiction"
- Emoji: 💝
- Personality: "Expert in Regency-era romance with focus on authenticity"
- Expertise: ["historical_romance", "regency_era", "social_customs"]
- System Prompt: (optional custom instructions)

System saves to DB → Avatar appears in user's list
```

### Workflow 2: Fork Built-in Avatar

```
User: "I want to customize Research Assistant"
System: Creates fork
- Name: "My Research Assistant"
- Copies all expertise and system prompt from built-in
- User can now edit:
  - Add custom instructions: "Focus on Victorian London"
  - Upload custom research docs
  - Modify catchphrase
  
Original built-in remains unchanged
User's fork is editable and private
```

### Workflow 3: Upload Knowledge Base

```
User selects custom avatar
User uploads: "victorian_london_research.pdf"
System:
- Extracts text
- Stores in avatar_brains collection
- Avatar now references this in responses
- Can cite specific sections
```

### Workflow 4: Use in Creative Board

```
User asks Creative Board: "Should my protagonist own property?"
System consults:
- Built-in: Research Assistant (genre conventions)
- Built-in: Plot Architect (narrative impact)
- Custom: User's "Historical Accuracy Expert" (uploaded Victorian research)

All three provide perspectives
User gets multi-angle analysis
```

## API Endpoints

### Custom Avatar Management

```python
# Create custom avatar
POST /api/avatars/custom
{
  "name": "Historical Romance Expert",
  "personality_description": "Specialist in Regency-era romance",
  "expertise": ["historical_romance", "regency_era"],
  "emoji": "💝",
  "system_prompt": "Optional custom instructions..."
}

# Fork built-in avatar
POST /api/avatars/fork/{builtin_avatar_id}
{
  "custom_name": "My Research Assistant",
  "custom_prompt_additions": "Focus on Victorian London..."
}

# Update custom avatar
PUT /api/avatars/custom/{avatar_id}
{
  "personality_description": "Updated personality...",
  "system_prompt": "New instructions..."
}

# Delete custom avatar
DELETE /api/avatars/custom/{avatar_id}

# List user's avatars (built-in + custom)
GET /api/avatars/list?user_id=alana
{
  "avatars": [
    {
      "avatar_id": "research_assistant_001",
      "name": "Research Assistant",
      "is_custom": false,
      "editable": false,
      "forkable": true
    },
    {
      "avatar_id": "custom_alana_abc123",
      "name": "My Historical Expert",
      "is_custom": true,
      "editable": true,
      "is_forked": false
    }
  ]
}
```

### Knowledge Base Management

```python
# Upload knowledge document
POST /api/avatars/custom/{avatar_id}/brain
{
  "content_type": "research_document",
  "filename": "victorian_london.pdf",
  "text_content": "Extracted text..."
}

# List avatar's knowledge base
GET /api/avatars/custom/{avatar_id}/brain

# Delete knowledge document
DELETE /api/avatars/custom/{avatar_id}/brain/{doc_id}
```

## Database Schema

### custom_avatars Collection
```json
{
  "avatar_id": "custom_alana_abc123",
  "user_id": "alana",
  "name": "Historical Romance Expert",
  "personality_description": "Specialist in Regency-era romance",
  "system_prompt": "Optional custom instructions...",
  "expertise": ["historical_romance", "regency_era"],
  "emoji": "💝",
  "creative_board_catchphrase": "Based on historical records...",
  "is_forked": false,
  "forked_from": null,
  "created_at": "2025-12-01T...",
  "updated_at": "2025-12-01T..."
}
```

### avatar_brains Collection
```json
{
  "id": "brain_xyz789",
  "avatar_id": "custom_alana_abc123",
  "content_type": "research_document",
  "filename": "victorian_london.pdf",
  "text_content": "Full extracted text...",
  "token_count": 15000,
  "uploaded_at": "2025-12-01T..."
}
```

## UI/UX Considerations

### Avatar List Display

```
┌─ Built-in Avatars (Read-Only) ─────────────┐
│ 🔬 Research Assistant                      │
│    [Fork] [Learn More]                     │
│                                            │
│ 📐 Plot Architect                          │
│    [Fork] [Learn More]                     │
└────────────────────────────────────────────┘

┌─ My Custom Avatars ────────────────────────┐
│ 💝 Historical Romance Expert               │
│    [Edit] [Delete] [Upload Docs]           │
│    Forked from: None                       │
│                                            │
│ 🔬 My Research Assistant                   │
│    [Edit] [Delete] [Upload Docs]           │
│    Forked from: Research Assistant         │
└────────────────────────────────────────────┘

[+ Create New Avatar]
```

### Creative Board Selection

```
Select Avatars for Creative Board:
☑ 🔬 Research Assistant (built-in)
☑ 💝 Historical Romance Expert (yours)
☐ 📐 Plot Architect (built-in)
☐ 🔬 My Research Assistant (yours, forked)

Note: You can use both built-in and custom avatars together!
```

## Security & Safety

1. **Ownership Validation**: All operations check user_id matches
2. **Built-in Protection**: Built-in avatars cannot be edited/deleted
3. **Isolation**: Custom avatars don't affect other users
4. **Backup**: Fork built-ins before customizing (preserves original)
5. **Rollback**: Delete custom avatar doesn't affect built-ins

## Benefits for Users

### For Writers:
- Create genre-specific specialists (YA Expert, Cozy Mystery Coach)
- Upload their own research documents
- Build personal knowledge bases
- Maintain multiple personas for different projects

### For Power Users:
- Fine-tune system prompts for their writing style
- Create collaborative specialist teams
- Build domain expertise (e.g., Medical Thriller Expert with real medical research)

### For Teams:
- Share forked avatars with custom project knowledge
- Maintain consistent "house style" avatars
- Build institutional knowledge bases

## Example Use Cases

### Use Case 1: Historical Fiction Writer
```
Forks Research Assistant → "Victorian England Expert"
Uploads:
- victorian_london_street_guide.pdf
- regency_etiquette_manual.pdf
- 1800s_technology_timeline.pdf

Custom prompt addition:
"When discussing historical accuracy, cite specific documents 
from my knowledge base with page numbers."

Result: Avatar gives responses like:
"According to victorian_london_street_guide.pdf (page 47), 
gas street lamps were first installed in 1807..."
```

### Use Case 2: Romance Writer
```
Creates from scratch → "Trope Specialist"
Expertise: ["enemies_to_lovers", "second_chance", "slow_burn"]
Personality: "Enthusiastic about classic romance tropes"

System prompt:
"You specialize in romance tropes. For each scene, identify 
which classic trope is being used and suggest ways to add 
fresh twists while honoring reader expectations."

Creative Board catchphrase: "This is a classic [trope], let's make it fresh!"
```

### Use Case 3: Multi-Genre Writer
```
Has multiple custom avatars:
- "My YA Expert" (forked from Character Developer)
- "My Mystery Plotter" (forked from Plot Architect)  
- "My Romance Coach" (forked from Romance Expert)

Each customized for specific project needs
Each with genre-specific uploaded research
All can participate in Creative Board together
```

## Technical Implementation Status

✅ **Implemented:**
- CustomAvatar class (extends Avatar base)
- Database schema (custom_avatars, avatar_brains)
- Create/fork/update/delete operations
- Load user avatars
- Ownership validation
- Knowledge base structure

⏳ **TODO:**
- API endpoints (POST/PUT/DELETE routes)
- Frontend UI components
- File upload handling
- Search within knowledge base
- Avatar sharing (future: team features)

## Conclusion

**This system is designed to be safe, extensible, and user-friendly.**

Built-in avatars remain stable professional templates.
Custom avatars give users full creative control.
Both types work seamlessly in Creative Board.
No risk of breaking the system or affecting other users.

Users can experiment freely with custom avatars - they're sandboxed, owned, and fully reversible (just delete and recreate).

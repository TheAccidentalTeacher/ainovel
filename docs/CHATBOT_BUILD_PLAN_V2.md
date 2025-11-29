# 🤖 AI NOVEL GENERATOR - CHATBOT BUILD PLAN V2

> **Philosophy**: Build the system first. Alana customizes it herself as she uses it.  
> **No Setup Required**: Alana logs in, starts chatting. That's it.  
> **Progressive Enhancement**: Phase 1 = amazing chatbot. Phase 2 = bot creation framework (she fleshes it out).

---

## 🎯 THE STRATEGY

### **Old Approach** ❌
- Plan everything upfront
- Ask Alana 7 critical questions
- Build custom solution to her specs
- She tests when it's done

### **New Approach** ✅
- Build production-ready chatbot system (Phase 1)
- Alana logs in, starts using it immediately
- She discovers what she needs through actual use
- Phase 2 gives her tools to build custom bots herself (in-app)
- No context switching to gpt.com or claude.ai

---

## 📦 PHASE 1: CORE CHATBOT (Days 1-8)

**Goal**: Alana has a really good, long-context, auto-saving chatbot in the app. She can stay in the AI Novel Generator instead of flipping to external AI sites.

### **What Alana Gets (Day 8)**:
✅ Persistent chat widget on every page  
✅ Claude Sonnet 4.5 (200k token context)  
✅ Every message auto-saved to database  
✅ Full conversation history accessible anytime  
✅ Conversation sidebar (list all chats, rename, search, delete)  
✅ Long context management (never hits token limits)  
✅ Keyboard shortcut to open chat instantly  

### **Technical Implementation**:

#### **1. Database Schemas (Day 1)**
```python
# backend/models/schemas.py additions

class Conversation(BaseModel):
    id: str
    user_id: str  # "alana" or "scott"
    project_id: Optional[str]  # link to novel project (optional)
    title: str  # auto-generated or user-renamed
    created_at: datetime
    updated_at: datetime
    message_count: int
    bot_id: Optional[str]  # Phase 2: which bot was used

class Message(BaseModel):
    id: str
    conversation_id: str
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime
    token_count: int
    model: str  # "claude-sonnet-4.5", etc.
```

**MongoDB Collections**:
- `conversations` - Conversation metadata
- `messages` - Individual messages (indexed by conversation_id)

#### **2. AI Service Update (Day 2)**
Extend `backend/services/ai_service.py`:

```python
class AIService:
    async def chat_stream(
        self,
        messages: List[Dict[str, str]],
        model: str = "claude-sonnet-4.5",
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Stream chat responses with SSE"""
        # Use existing Anthropic client
        # Yield chunks for frontend streaming
        pass
    
    def count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken"""
        pass
```

#### **3. Chat API Endpoints (Day 3)**
`backend/api/chat.py`:

```python
@router.post("/conversations")
async def create_conversation(user_id: str, title: str = "New Chat"):
    """Create new conversation"""
    pass

@router.get("/conversations")
async def list_conversations(user_id: str, project_id: Optional[str] = None):
    """List all conversations for user (optionally filtered by project)"""
    pass

@router.post("/conversations/{conversation_id}/messages")
async def send_message(conversation_id: str, content: str):
    """Send message, get SSE stream response, save both to DB"""
    # StreamingResponse with text/event-stream
    pass

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get full conversation history"""
    pass

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete conversation and all messages"""
    pass

@router.patch("/conversations/{conversation_id}")
async def rename_conversation(conversation_id: str, title: str):
    """Rename conversation"""
    pass
```

#### **4. Frontend Chat Widget (Days 4-5)**
`frontend/src/components/ChatWidget.tsx`:

**Features**:
- Floating button (bottom-right corner, all pages)
- Expandable panel (400px wide, 600px tall)
- Message list (auto-scroll to bottom)
- Input textarea (auto-resize, Enter to send, Shift+Enter for newline)
- Streaming response display (typewriter effect)
- Loading states (dots animation while waiting)
- Error handling (retry button if API fails)
- Close button (minimizes to floating button)

**State Management**:
- TanStack Query for conversation list
- React state for current conversation messages
- localStorage backup (persist current chat even if DB fails)

#### **5. Conversation Sidebar (Day 6)**
`frontend/src/components/ConversationSidebar.tsx`:

**Features**:
- Slide-in from left (keyboard shortcut: Ctrl+Shift+H for History)
- List all conversations (newest first)
- Timestamps (relative: "2 hours ago", "Yesterday", etc.)
- Search box (filter by title or content)
- Rename button (inline edit)
- Delete button (with confirmation)
- "New Chat" button at top
- Optional: Group by project (collapsible sections)

#### **6. Long Context Management (Day 7)**
`backend/services/chat_service.py`:

**Features**:
- Count tokens before sending to Claude (tiktoken library)
- If conversation > 150k tokens (75% of 200k limit):
  - Summarize first half of conversation
  - Keep recent messages (last 50k tokens) as-is
  - Prepend summary: "Previous conversation summary: [...]"
- Store summaries in `conversation_summaries` collection
- Chain summaries if needed (summary of summaries for very long chats)

#### **7. Polish & Integration (Day 8)**
- Keyboard shortcuts:
  - `Ctrl+K`: Toggle chat widget
  - `Ctrl+Shift+H`: Toggle conversation history sidebar
- Add chat widget to all pages (wrap in `App.tsx` layout)
- Link to project context (if on project detail page, auto-set project_id)
- Error boundaries (graceful failures)
- Loading skeletons
- Empty states ("Start a new conversation")
- Success notifications ("Conversation renamed")

### **Exit Criteria (Phase 1 Complete)**:
✅ Alana logs in, clicks chat button, starts conversation  
✅ She can switch to a different page, chat widget persists  
✅ She refreshes browser, conversation history loads  
✅ She can have 10+ hour conversation without hitting token limits  
✅ She can find any past conversation in sidebar  
✅ No need to visit gpt.com or claude.ai anymore  

---

## 🧠 PHASE 2: BOT FRAMEWORK (Days 9-15)

**Goal**: Give Alana tools to build her own custom bots. She designs personalities, uploads knowledge, creates her Board of Directors - all in-app.

### **What Alana Gets (Day 15)**:
✅ Bot creation wizard (name, personality, expertise)  
✅ Bot switcher in chat (dropdown to pick which bot to talk to)  
✅ Bot brain system (upload manuscripts, character sheets, research docs)  
✅ Board of Directors mode (ask one question, get 3-5 specialist responses)  
✅ Bot management page (list all her bots, edit, delete, duplicate)  

### **Technical Implementation**:

#### **1. Bot Database Schema (Day 9)**
```python
class Bot(BaseModel):
    id: str
    user_id: str  # "alana" or "scott"
    name: str  # "Dialogue Coach", "Romance Expert", etc.
    personality: str  # Long-form text describing personality
    system_prompt: str  # System prompt for AI
    expertise: List[str]  # ["dialogue", "romance", "character-development"]
    avatar_url: Optional[str]  # AI-generated avatar (Phase 3)
    created_at: datetime
    is_default: bool  # Default bot for new chats

class BotBrain(BaseModel):
    id: str
    bot_id: str
    content_type: str  # "manuscript", "character_sheet", "research", "world_building"
    filename: str
    text_content: str  # Extracted text from uploaded file
    token_count: int
    uploaded_at: datetime
```

**MongoDB Collections**:
- `bots` - Bot definitions
- `bot_brains` - Uploaded knowledge files linked to bots

#### **2. Bot CRUD API (Day 10)**
`backend/api/bots.py`:

```python
@router.post("/bots")
async def create_bot(user_id: str, name: str, personality: str, expertise: List[str]):
    """Create custom bot"""
    pass

@router.get("/bots")
async def list_bots(user_id: str):
    """List all user's bots"""
    pass

@router.patch("/bots/{bot_id}")
async def update_bot(bot_id: str, name: str, personality: str):
    """Update bot"""
    pass

@router.delete("/bots/{bot_id}")
async def delete_bot(bot_id: str):
    """Delete bot"""
    pass

@router.post("/bots/{bot_id}/brain")
async def upload_brain_file(bot_id: str, file: UploadFile):
    """Upload knowledge file (docx, txt, md)"""
    # Extract text, save to bot_brains collection
    pass

@router.get("/bots/{bot_id}/brain")
async def get_bot_brain(bot_id: str):
    """Get all knowledge files for bot"""
    pass
```

#### **3. Bot Creation Wizard UI (Day 11)**
`frontend/src/pages/BotCreator.tsx`:

**Steps**:
1. **Name Your Bot**: Text input
2. **Define Personality**: Large textarea with examples:
   - "Professional but encouraging writing coach"
   - "Witty dialogue expert with sarcastic sense of humor"
   - "Empathetic character psychologist focused on emotional depth"
3. **Set Expertise** (multi-select tags): Dialogue, Plot, Character, Romance, Humor, Research, Editing, World-Building
4. **Write System Prompt** (advanced, optional): Full control over bot instructions
5. **Preview**: Test conversation before saving

**Submit → Bot saved to DB**

#### **4. Bot Switcher in Chat (Day 12)**
Update `ChatWidget.tsx`:

**Add**:
- Dropdown at top of chat panel
- Shows all Alana's bots (default + custom)
- Click bot → switches context, clears current input
- Badge shows current bot name
- Different bot → different conversation (linked by bot_id)

#### **5. Bot Brain Upload System (Day 13)**
`frontend/src/pages/BotManager.tsx`:

**Features**:
- List all bots (cards with name, personality, expertise)
- Click bot → detail view
- **Brain Tab**: 
  - Upload files (.docx, .txt, .md)
  - Show uploaded files (filename, size, upload date)
  - Delete files
  - Tag files by type (manuscript, character, research)
- Bot references uploaded content in conversations (injected into system prompt or context)

#### **6. Board of Directors Mode (Days 14-15)**
`frontend/src/components/BoardMode.tsx`:

**UI**:
- Button in chat widget: "Consult Board of Directors"
- Modal opens → multi-select bots (pick 2-5)
- Enter question once
- Submit → get responses from all selected bots
- Display in columns or tabs (clear attribution per bot)

**API**:
```python
@router.post("/board/consult")
async def board_consult(
    conversation_id: str,
    bot_ids: List[str],
    question: str,
    mode: str = "parallel"  # parallel, sequential, debate
):
    """Get responses from multiple bots"""
    # Call AI service for each bot
    # Return all responses
    pass
```

**Modes**:
- **Parallel** (Phase 2): All bots respond independently
- **Sequential** (Phase 3): Bots see previous responses, build on them
- **Debate** (Phase 3): Bots challenge each other's ideas

### **Exit Criteria (Phase 2 Complete)**:
✅ Alana creates her first custom bot (e.g., "Sassy Dialogue Coach")  
✅ She switches between default bot and custom bot in chat  
✅ She uploads a character sheet to a bot's brain  
✅ Bot references uploaded content accurately  
✅ She asks Board of Directors a question, gets 3 specialist responses  
✅ She uses custom bots for her actual novel writing workflow  

---

## 🗓️ IMPLEMENTATION SCHEDULE

### **Week 1: Phase 1 Foundation**
- **Day 1**: Database schemas (conversations, messages)
- **Day 2**: AI service update (Claude streaming, token counting)
- **Day 3**: Chat API endpoints (CRUD + SSE)
- **Day 4-5**: Chat widget UI (floating button, panel, streaming)
- **Day 6**: Conversation sidebar (history, search, rename)
- **Day 7**: Long context management (auto-summarization)
- **Day 8**: Polish, keyboard shortcuts, integration

**Milestone**: Alana can chat without leaving the app

### **Week 2: Phase 2 Bot Framework**
- **Day 9**: Bot schemas (bots, bot_brains)
- **Day 10**: Bot CRUD API
- **Day 11**: Bot creation wizard UI
- **Day 12**: Bot switcher in chat
- **Day 13**: Bot brain upload system
- **Day 14-15**: Board of Directors consultation mode

**Milestone**: Alana builds custom bots, consults her Board

### **Week 3+: Phase 3 Enhancements** (Future)
- AI-generated bot avatars
- Sequential/debate Board modes
- Proactive suggestions ("Need help with this scene?")
- Bot marketplace (share bots with other users)
- Voice input/output
- Mobile responsive design

---

## 🎯 KEY DESIGN PRINCIPLES

### **1. No Setup Required**
- Default bot ready on Day 1
- Alana just clicks and starts chatting
- Advanced features (custom bots) are optional enhancements

### **2. Progressive Disclosure**
- Phase 1: Just a really good chatbot
- Phase 2: Discover you can build custom bots
- Phase 3: Discover Board of Directors feature
- No overwhelming feature wall on first use

### **3. In-App Discovery**
- Alana answers questions through actual use, not upfront planning
- "Should this bot be encouraging or direct?" → She tests both, picks one
- "Do I need a Romance Expert bot?" → She discovers this need organically

### **4. Self-Service**
- No waiting for Scott to implement personality changes
- Alana edits bot personality in-app, changes take effect immediately
- She builds her own Board of Directors lineup

### **5. Context Awareness**
- Chat widget knows which project page you're on
- Auto-links conversation to current novel project
- Bot can reference project outline, characters, chapters automatically

---

## 🔧 TECHNICAL STACK

### **Backend**:
- FastAPI (existing)
- MongoDB (existing - add collections)
- Anthropic API (Claude Sonnet 4.5)
- python-docx (file parsing)
- tiktoken (token counting)
- SSE streaming (Server-Sent Events)

### **Frontend**:
- React + TypeScript (existing)
- TanStack Query (existing)
- New components:
  - `ChatWidget.tsx`
  - `ConversationSidebar.tsx`
  - `BotCreator.tsx`
  - `BotManager.tsx`
  - `BoardMode.tsx`

### **New Dependencies**:
```bash
# Backend
pip install tiktoken

# Frontend
npm install react-textarea-autosize
npm install date-fns  # for timestamp formatting
```

---

## ✅ SUCCESS METRICS

### **Phase 1 Success**:
- ✅ Alana uses in-app chat instead of gpt.com for 1 week straight
- ✅ She says: "I love not having to switch tabs anymore"
- ✅ She has at least one 5+ hour conversation with no issues

### **Phase 2 Success**:
- ✅ Alana creates 3+ custom bots
- ✅ She uses Board of Directors at least 3 times for actual writing problems
- ✅ She says: "This bot brain feature is really helpful" (references uploaded docs)

---

## 🚀 NEXT STEPS (IMMEDIATE)

### **Scott**:
1. **Create database schemas** (Day 1 - today)
2. **Update AI service** with Claude streaming (Day 2)
3. **Build chat API endpoints** (Day 3)
4. **Start frontend widget** (Day 4)

### **Alana**:
1. **Wait for Phase 1 (Day 8)** → Start using in-app chat
2. **Provide feedback** during Week 1 (personality, UI tweaks)
3. **Week 2**: Start building custom bots as needs emerge
4. **Week 3**: Use Board of Directors for real writing challenges

---

## 📋 DIFFERENCES FROM V1 PLAN

| V1 (Old) | V2 (New) |
|----------|----------|
| Plan everything upfront | Build core, iterate based on use |
| Ask Alana 7 questions before coding | Alana discovers needs through use |
| Custom solution to specs | Flexible framework she customizes |
| Big bang release (6 weeks) | Incremental (usable in 8 days) |
| Scott builds all bots | Alana builds her own bots |
| External planning doc | In-app bot creation |
| 25-day timeline | 15-day timeline (2 phases) |

---

**STATUS**: 📝 Plan complete. Ready to start Day 1 (database schemas).

**NEXT FILE**: Start coding - no more planning docs needed!

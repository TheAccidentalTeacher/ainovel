# AI Chatbot Assistant Feature - Implementation Plan

**Date:** November 28, 2025  
**Purpose:** Persistent AI assistant system with custom bot creation and multi-model support  
**Target User:** Alana (primary) + all users

---

## Table of Contents
- [Executive Summary](#executive-summary)
- [Core Features](#core-features)
- [Technical Architecture](#technical-architecture)
- [Context Window Management - Detailed](#context-window-management---detailed)
- [UI/UX Considerations](#uiux-considerations)
- [Security & Privacy](#security--privacy)
- [Implementation Phases](#implementation-phases)
- [Phase-by-Phase Execution Blueprint](#phase-by-phase-execution-blueprint)
- [Step-by-Step Milestone Checklist](#step-by-step-milestone-checklist)
- [Success Metrics](#success-metrics)
- [Future Enhancements](#future-enhancements)
- [Technical Decisions](#technical-decisions)
- [Next Steps](#next-steps)
- [Updated Requirements (Nov 28, 2025)](#updated-requirements-nov-28-2025)
- [Deep Dive Questions](#deep-dive-questions)
- [Immediate Clarifications Needed](#immediate-clarifications-needed)

## Related Documents & Index
- `docs/AGENT_SYSTEM_ARCHITECTURE_DISCUSSION.md` – Macro-level architecture trade studies, licensing strategy, and marketplace planning (read this first for context).
- `docs/phase-plan.md` – Global program roadmap; this chatbot initiative now occupies Phase 4B (Agentic Assistants) in that document.
- `README.md` – Repository-wide index; see the “Agentic Chatbot Initiative” section for live status tracking and quick links.
- `docs/system-overview.md` – Reference for current backend/frontend surfaces that the chatbot will integrate with.

## Executive Summary

Create a **persistent AI chatbot system** that:
1. Appears on **all pages** of the application (premise builder, chapters, outlines, etc.)
2. Supports **multiple AI models** (Claude, GPT, Grok, Llama, etc.)
3. Allows users to **create custom bots** with specific personalities and expertise
4. Implements **"Board of Directors"** concept - multiple expert bots for consultation
5. Maintains **persistent conversations** across sessions with intelligent context management
6. Auto-summarizes when approaching context limits (like GitHub Copilot conversation behavior)

---

## Core Features

### 1. Multi-Model AI Provider Support

**Supported Models:**
- **Anthropic:** Claude Sonnet 4.5, Claude Opus, Claude Haiku
- **OpenAI:** GPT-4, GPT-4-turbo, GPT-3.5-turbo
- **Grok:** (X.AI API integration)
- **Llama:** Via OpenRouter or local deployment
- **Future:** Gemini, Mistral, etc.

**Provider Service Architecture:**
```python
class AIProvider(Enum):
    ANTHROPIC = "anthropic"
    OPENAI = "openai"
    GROK = "grok"
    LLAMA = "llama"

class UnifiedAIService:
    """Unified interface for all AI providers"""
    
    async def chat_completion(
        self,
        provider: AIProvider,
        model: str,
        messages: List[Message],
        stream: bool = True
    ) -> AsyncIterator[str]:
        """Route to appropriate provider, handle streaming uniformly"""
        
    async def get_context_limit(self, provider: AIProvider, model: str) -> int:
        """Return token limits for each model"""
        
    async def count_tokens(self, provider: AIProvider, text: str) -> int:
        """Provider-specific tokenization"""
```

---

### 2. Custom Bot Creation System

**Bot Definition Schema:**
```typescript
interface CustomBot {
  id: string;
  user_id: string;
  name: string;
  description: string;
  
  // AI Configuration
  provider: "anthropic" | "openai" | "grok" | "llama";
  model: string;
  
  // Personality & Instructions
  system_prompt: string;
  personality_traits: string[];
  expertise_areas: string[];
  tone: "professional" | "casual" | "humorous" | "academic" | "encouraging";
  
  // Behavior Settings
  creativity_level: number; // 0.0 - 1.0 (temperature)
  max_response_length: number; // tokens
  
  // Visual
  avatar_url?: string;
  color_theme: string;
  
  created_at: Date;
  updated_at: Date;
}
```

**Pre-Built Templates:**
```typescript
const BOT_TEMPLATES = {
  EDITOR: {
    name: "Editorial Assistant",
    expertise: ["grammar", "style", "pacing", "structure"],
    system_prompt: "You are a professional editor specializing in fiction...",
    tone: "professional"
  },
  
  CHARACTER_EXPERT: {
    name: "Character Development Coach",
    expertise: ["character arcs", "motivation", "voice", "relationships"],
    system_prompt: "You are a character development specialist...",
    tone: "encouraging"
  },
  
  PLOT_CONSULTANT: {
    name: "Plot Strategist",
    expertise: ["story structure", "pacing", "tension", "plot holes"],
    system_prompt: "You are a plot consultant who helps authors...",
    tone: "analytical"
  },
  
  GENRE_SPECIALIST: {
    name: "Romance Expert",
    expertise: ["romantic tension", "tropes", "heat levels", "HEA"],
    system_prompt: "You are a romance genre specialist...",
    tone: "enthusiastic"
  },
  
  RESEARCH_ASSISTANT: {
    name: "Research Helper",
    expertise: ["historical accuracy", "world-building", "research"],
    system_prompt: "You help authors research settings, time periods...",
    tone: "academic"
  }
};
```

---

### 3. Board of Directors System

**Concept:** User creates a "board" of 3-7 expert bots to consult simultaneously

**Board Schema:**
```typescript
interface Board {
  id: string;
  user_id: string;
  name: string; // "My Editorial Board"
  description: string;
  bot_ids: string[]; // References to CustomBot IDs
  created_at: Date;
}
```

**Usage Flow:**
1. User creates custom bots OR uses templates
2. User assembles a "board" from their bots
3. User asks a question (e.g., "Does this chapter's pacing work?")
4. System sends question to all bots in parallel
5. Display responses in organized grid/tabs
6. User can continue conversation with specific bot or all bots

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│ Board: Editorial Team                    [⚙️]   │
├─────────────────────────────────────────────────┤
│ Your Question:                                  │
│ "Does the dialogue in Chapter 3 feel natural?" │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│ │ 📝 Editor   │ │ 💬 Dialogue │ │ 🎭 Character│ │
│ │ Assistant   │ │ Coach       │ │ Expert      │ │
│ ├─────────────┤ ├─────────────┤ ├────────────┤ │
│ │ The dialogue│ │ Great subtext│ │ Jane's voice│ │
│ │ feels       │ │ but Darcy's │ │ is distinct,│ │
│ │ natural but │ │ formality   │ │ but Maxwell │ │
│ │ watch for...│ │ could be... │ │ needs more..│ │
│ └─────────────┘ └─────────────┘ └────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### 4. Conversation Persistence & Context Management

**Conversation Schema:**
```typescript
interface Conversation {
  id: string;
  user_id: string;
  bot_id: string;
  title: string; // Auto-generated from first message
  
  messages: Message[];
  summaries: Summary[]; // Historical summaries when context was condensed
  
  total_tokens_used: number;
  current_context_tokens: number;
  
  created_at: Date;
  updated_at: Date;
  last_message_at: Date;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number;
  timestamp: Date;
}

interface Summary {
  id: string;
  messages_covered: string[]; // Message IDs that were summarized
  summary_text: string;
  tokens: number;
  created_at: Date;
}
```

**Context Management Strategy:**

**Similar to GitHub Copilot's behavior:**

1. **Track Token Usage:**
   - Count tokens for each message
   - Monitor cumulative context size
   - Set threshold at 75% of model's context limit

2. **Auto-Summarization Trigger:**
   ```
   if current_context_tokens >= (context_limit * 0.75):
       trigger_summarization()
   ```

3. **Summarization Process:**
   ```python
   async def summarize_conversation(conversation_id: str):
       # Get messages except last 5 (keep recent context)
       old_messages = get_messages_except_recent(conversation_id, keep_last=5)
       
       # Generate summary using AI
       summary_prompt = f"""
       Summarize this conversation between user and assistant.
       Preserve key decisions, important context, and user preferences.
       Be concise but don't lose critical information.
       
       Conversation:
       {format_messages(old_messages)}
       """
       
       summary = await ai_service.generate_summary(summary_prompt)
       
       # Store summary
       save_summary(conversation_id, summary, old_messages)
       
       # Remove old messages from active context (keep in DB for history)
       archive_messages(old_messages)
       
       return summary
   ```

4. **Continuation with Summary:**
   - Next message includes summary as context
   - Format: `[Previous Conversation Summary: {summary}]`
   - Recent 5-10 messages included as-is
   - User can view full history anytime

**Example Flow:**
```
Message 50: [Context approaching limit]
→ System summarizes Messages 1-45
→ Summary stored: "User is writing romance novel, established character Jane..."

Message 51: User asks new question
→ Context sent to AI:
   [Summary of earlier conversation: ...]
   [Message 46-50: recent context]
   [Message 51: current question]
```

---

### 5. Persistent UI Integration

**Requirements:**
- Appears on **every page** of the application
- Doesn't interfere with existing functionality
- Can be minimized/maximized
- Maintains state across page navigation
- Keyboard accessible (Esc to close, Ctrl+/ to open)

**UI Components:**

**A. Floating Chat Button:**
```
Fixed position: bottom-right
Displays unread count badge
Icon: 💬 or bot avatar
Pulsates when bot is "thinking"
```

**B. Chat Panel (Expanded):**
```
┌─────────────────────────────────────────┐
│ 💬 AI Assistants              [−][×]    │
├─────────────────────────────────────────┤
│ Active Bot: Editorial Assistant    [⚙️] │
│ Switch Bot ▼ | Board of Directors       │
├─────────────────────────────────────────┤
│                                         │
│  💬 You: How do I improve this chapter?│
│                                         │
│  🤖 Assistant: Let me analyze the...   │
│     [Typing indicator...]               │
│                                         │
├─────────────────────────────────────────┤
│ [Type your message...]           [Send] │
└─────────────────────────────────────────┘
```

**C. Bot Switcher Dropdown:**
```
┌─────────────────────────────┐
│ 🤖 My Bots                  │
├─────────────────────────────┤
│ ✓ Editorial Assistant       │
│   Character Expert          │
│   Plot Consultant           │
│   Romance Specialist        │
├─────────────────────────────┤
│ 👥 Boards                   │
├─────────────────────────────┤
│   Editorial Team (3 bots)   │
│   Genre Experts (4 bots)    │
├─────────────────────────────┤
│ ➕ Create New Bot           │
│ ⚙️  Manage Bots             │
└─────────────────────────────┘
```

**D. Context-Aware Suggestions:**

When user is on specific pages, bot offers relevant help:

- **Premise Builder:** "Need help developing your premise?"
- **Chapter Editor:** "Want me to review this chapter's dialogue?"
- **Outline View:** "Should I analyze your story structure?"
- **Character Builder:** "Let's develop this character's arc!"

---

### 6. Bot Creation Wizard

**Step-by-Step Flow:**

**Step 1: Choose Starting Point**
```
┌─────────────────────────────────────────┐
│ Create Your AI Assistant                │
├─────────────────────────────────────────┤
│                                         │
│  ○ Start from Template                 │
│     Choose a pre-configured expert bot │
│                                         │
│  ○ Build from Scratch                  │
│     Customize everything yourself      │
│                                         │
│             [Continue →]                │
└─────────────────────────────────────────┘
```

**Step 2: Basic Information**
```
┌─────────────────────────────────────────┐
│ Bot Basics                              │
├─────────────────────────────────────────┤
│ Name: [_____________________]           │
│                                         │
│ Description (optional):                 │
│ [________________________________]      │
│ [________________________________]      │
│                                         │
│ Choose an avatar:                       │
│  [📝] [💬] [🎭] [🔍] [✨] [Custom...]  │
│                                         │
│           [← Back] [Continue →]         │
└─────────────────────────────────────────┘
```

**Step 3: AI Model Selection**
```
┌─────────────────────────────────────────┐
│ Choose AI Model                         │
├─────────────────────────────────────────┤
│ ○ Claude Sonnet 4.5 (Recommended)      │
│   Best for: Creative writing, nuance   │
│   Speed: Fast | Cost: $$               │
│                                         │
│ ○ GPT-4 Turbo                          │
│   Best for: Analysis, research         │
│   Speed: Fast | Cost: $$               │
│                                         │
│ ○ Claude Opus                          │
│   Best for: Complex reasoning          │
│   Speed: Medium | Cost: $$$            │
│                                         │
│ ○ GPT-3.5 Turbo (Budget)              │
│   Best for: Quick questions            │
│   Speed: Very Fast | Cost: $           │
│                                         │
│           [← Back] [Continue →]         │
└─────────────────────────────────────────┘
```

**Step 4: Personality & Expertise**
```
┌─────────────────────────────────────────┐
│ Define Personality                      │
├─────────────────────────────────────────┤
│ Expertise Areas (select multiple):      │
│ ☑ Character Development                │
│ ☑ Dialogue                             │
│ ☐ Plot Structure                       │
│ ☐ World Building                       │
│ ☐ Grammar & Style                      │
│ [+ Add Custom...]                       │
│                                         │
│ Tone:                                   │
│ ○ Professional & Direct                │
│ ● Encouraging & Supportive             │
│ ○ Analytical & Detailed                │
│ ○ Casual & Friendly                    │
│                                         │
│ Creativity Level:                       │
│ [────────●──────] 70%                  │
│ More focused ←→ More creative           │
│                                         │
│           [← Back] [Continue →]         │
└─────────────────────────────────────────┘
```

**Step 5: Custom Instructions (Advanced)**
```
┌─────────────────────────────────────────┐
│ Custom Instructions (Optional)          │
├─────────────────────────────────────────┤
│ System Prompt:                          │
│ [You are a character development       │
│  expert specializing in romance        │
│  novels. You provide specific,         │
│  actionable feedback on character      │
│  arcs, motivation, and voice...]       │
│                                         │
│ Special Behaviors:                      │
│ ☑ Ask clarifying questions             │
│ ☑ Provide examples                     │
│ ☐ Reference craft books                │
│ ☐ Compare to published works           │
│                                         │
│           [← Back] [Create Bot]         │
└─────────────────────────────────────────┘
```

**Step 6: Test Your Bot**
```
┌─────────────────────────────────────────┐
│ 🎉 Bot Created!                         │
├─────────────────────────────────────────┤
│ Your "Character Coach" is ready!        │
│                                         │
│ Test it out:                            │
│ ┌─────────────────────────────────┐    │
│ │ 💬 You: Help me develop...      │    │
│ │ 🤖 Bot: I'd be happy to help... │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Start Chatting] [Create Another Bot]  │
│              [Done]                     │
└─────────────────────────────────────────┘
```

---

## Technical Architecture

### Backend API Structure

```
backend/
├── api/
│   └── chatbots.py          # New chatbot endpoints
├── models/
│   └── chatbot.py           # Bot & conversation schemas
├── services/
│   ├── unified_ai_service.py   # Multi-provider AI service
│   ├── chatbot_service.py      # Bot management logic
│   ├── conversation_service.py # Chat & context management
│   └── summarization_service.py # Auto-summarization
```

### API Endpoints

**Bot Management:**
```python
# Create custom bot
POST /api/chatbots
Body: {
  "name": "Character Coach",
  "provider": "anthropic",
  "model": "claude-sonnet-4.5",
  "system_prompt": "...",
  "expertise_areas": ["character", "dialogue"],
  "tone": "encouraging"
}

# List user's bots
GET /api/chatbots?user_id={user_id}

# Get specific bot
GET /api/chatbots/{bot_id}

# Update bot
PUT /api/chatbots/{bot_id}

# Delete bot
DELETE /api/chatbots/{bot_id}

# Get bot templates
GET /api/chatbots/templates
```

**Conversations:**
```python
# Create new conversation
POST /api/conversations
Body: {
  "bot_id": "bot_123",
  "initial_message": "Help me with character development"
}

# Get conversation history
GET /api/conversations/{conversation_id}

# List user's conversations
GET /api/conversations?user_id={user_id}&bot_id={bot_id}

# Send message (with streaming)
POST /api/conversations/{conversation_id}/messages
Body: {
  "content": "What makes a good character arc?"
}
Response: Server-Sent Events (SSE) stream

# Get context status
GET /api/conversations/{conversation_id}/context-status
Response: {
  "current_tokens": 15420,
  "limit": 20000,
  "percentage": 77.1,
  "needs_summarization": true
}

# Manual summarization (if user wants to condense)
POST /api/conversations/{conversation_id}/summarize
```

**Board of Directors:**
```python
# Create board
POST /api/boards
Body: {
  "name": "Editorial Team",
  "bot_ids": ["bot_1", "bot_2", "bot_3"]
}

# Get boards
GET /api/boards?user_id={user_id}

# Ask board (parallel queries)
POST /api/boards/{board_id}/consult
Body: {
  "question": "Does this chapter work?"
}
Response: {
  "responses": [
    {"bot_id": "bot_1", "bot_name": "Editor", "response": "..."},
    {"bot_id": "bot_2", "bot_name": "Plot Expert", "response": "..."}
  ]
}
```

### Frontend Components

```
frontend/src/
├── components/
│   └── chatbot/
│       ├── ChatWidget.tsx           # Floating button + panel
│       ├── ChatPanel.tsx            # Main chat interface
│       ├── MessageList.tsx          # Conversation display
│       ├── MessageInput.tsx         # Input with send button
│       ├── BotSwitcher.tsx          # Dropdown to switch bots
│       ├── BotCreationWizard.tsx    # Multi-step bot builder
│       ├── BoardView.tsx            # Multi-bot consultation
│       └── ContextIndicator.tsx     # Shows token usage
├── hooks/
│   ├── useChatbot.ts               # Chat logic & state
│   ├── useStreamingResponse.ts     # Handle SSE streams
│   └── useContextManagement.ts     # Track token usage
└── stores/
    └── chatbotStore.ts             # Global chatbot state
```

---

## Context Window Management - Detailed

### Token Tracking

```python
class ContextManager:
    """Manages conversation context and auto-summarization"""
    
    MODEL_LIMITS = {
        "claude-sonnet-4.5": 200000,
        "claude-opus": 200000,
        "gpt-4-turbo": 128000,
        "gpt-3.5-turbo": 16000,
    }
    
    SUMMARIZATION_THRESHOLD = 0.75  # Trigger at 75% capacity
    KEEP_RECENT_MESSAGES = 5        # Keep last N messages unsummarized
    
    async def should_summarize(
        self, 
        conversation_id: str
    ) -> bool:
        """Check if conversation needs summarization"""
        conv = await self.get_conversation(conversation_id)
        bot = await self.get_bot(conv.bot_id)
        
        limit = self.MODEL_LIMITS.get(bot.model, 100000)
        threshold = limit * self.SUMMARIZATION_THRESHOLD
        
        return conv.current_context_tokens >= threshold
    
    async def summarize_and_continue(
        self,
        conversation_id: str
    ) -> Summary:
        """Condense old messages, preserve recent context"""
        conv = await self.get_conversation(conversation_id)
        
        # Split messages
        messages = conv.messages
        old_messages = messages[:-self.KEEP_RECENT_MESSAGES]
        recent_messages = messages[-self.KEEP_RECENT_MESSAGES:]
        
        # Generate summary
        summary_prompt = self._build_summary_prompt(old_messages)
        summary_text = await self.ai_service.generate(
            provider=conv.bot.provider,
            model=conv.bot.model,
            prompt=summary_prompt
        )
        
        # Create summary object
        summary = Summary(
            id=generate_id(),
            messages_covered=[m.id for m in old_messages],
            summary_text=summary_text,
            tokens=await self.count_tokens(summary_text),
            created_at=datetime.now()
        )
        
        # Update conversation
        conv.summaries.append(summary)
        conv.messages = recent_messages  # Keep only recent
        conv.current_context_tokens = (
            summary.tokens + 
            sum(m.tokens for m in recent_messages)
        )
        
        await self.save_conversation(conv)
        
        return summary
    
    def _build_summary_prompt(self, messages: List[Message]) -> str:
        """Create prompt for summarization"""
        formatted = "\n\n".join([
            f"{m.role.upper()}: {m.content}" 
            for m in messages
        ])
        
        return f"""
        Summarize this conversation between a user and their AI writing assistant.
        
        CRITICAL: Preserve all important information including:
        - Key decisions made
        - Character names and traits discussed
        - Plot points mentioned
        - User's writing goals and preferences
        - Any instructions the user gave to the assistant
        
        Be thorough but concise. The user should be able to continue the 
        conversation naturally using this summary.
        
        CONVERSATION:
        {formatted}
        
        SUMMARY:
        """
    
    async def build_context_for_message(
        self,
        conversation_id: str,
        new_message: str
    ) -> List[Message]:
        """Build full context including summaries"""
        conv = await self.get_conversation(conversation_id)
        
        context_messages = []
        
        # Add summaries as system messages
        for summary in conv.summaries:
            context_messages.append(Message(
                role="system",
                content=f"[Previous Conversation Summary: {summary.summary_text}]"
            ))
        
        # Add recent messages
        context_messages.extend(conv.messages)
        
        # Add new user message
        context_messages.append(Message(
            role="user",
            content=new_message
        ))
        
        return context_messages
```

---

## UI/UX Considerations

### 1. Non-Intrusive Design
- Chatbot should **not** block main content
- Floating button in bottom-right (standard position)
- Panel slides in from right side
- Semi-transparent overlay when expanded (optional)
- Keyboard shortcut to toggle: `Ctrl+/` or `Cmd+/`

### 2. Context Awareness
- Bot knows what page user is on
- Offers relevant suggestions:
  - On chapter page: "Want me to review this chapter?"
  - On outline page: "Need help structuring your story?"
  - On character page: "Let's develop this character!"

### 3. Visual Feedback
- Typing indicator while bot generates response
- Token usage indicator (progress bar showing context capacity)
- Warning when approaching context limit: "💡 I'll summarize our conversation soon to keep things flowing"
- Smooth animations for message appearance

### 4. Mobile Responsiveness
- Full-screen on mobile devices
- Swipe to close
- Touch-friendly message bubbles
- Bottom input bar fixed position

---

## Security & Privacy

### 1. User Data Protection
- All conversations encrypted at rest
- User can delete conversations permanently
- Option to export conversation history
- Bots are private to creating user (no sharing by default)

### 2. API Key Management
- Store provider API keys securely in environment variables
- Rate limiting per user (prevent abuse)
- Cost tracking per conversation (monitor usage)

### 3. Content Filtering
- Optional content warnings for sensitive topics
- User can set content boundaries per bot
- System detects and prevents prompt injection attacks

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- ✅ Database schemas (bots, conversations, messages)
- ✅ Basic unified AI service (Anthropic + OpenAI)
- ✅ Simple bot CRUD endpoints
- ✅ Basic conversation endpoints (send message, get history)

### Phase 2: Core Chat (Week 2)
- ✅ Frontend chat widget (floating button + panel)
- ✅ Message streaming (SSE)
- ✅ Bot switcher dropdown
- ✅ Conversation persistence across sessions

### Phase 3: Bot Creation (Week 3)
- ✅ Bot creation wizard UI
- ✅ Template system
- ✅ Bot management page
- ✅ Avatar/theme customization

### Phase 4: Context Management (Week 4)
- ✅ Token tracking system
- ✅ Auto-summarization logic
- ✅ Context indicator UI
- ✅ Conversation continuation with summaries

### Phase 5: Board of Directors (Week 5)
- ✅ Board creation/management
- ✅ Parallel bot consultation
- ✅ Multi-response display UI
- ✅ Board conversation threading

### Phase 6: Polish & Deploy (Week 6)
- ✅ Additional AI providers (Grok, Llama)
- ✅ Context-aware suggestions
- ✅ Keyboard shortcuts
- ✅ Mobile optimization
- ✅ Railway deployment with all API keys

---

## Phase-by-Phase Execution Blueprint

| Phase | Timeframe | Objective | Key Deliverables | Exit Criteria |
| --- | --- | --- | --- | --- |
| **Phase 0 – Research & Alignment** | Week 0 | Lock requirements and architectural direction | ✅ Sign-off on `docs/AGENT_SYSTEM_ARCHITECTURE_DISCUSSION.md` <br> ✅ Confirm provider list & API quota <br> ✅ Define Scott/Alana bot separation rules | - Open questions in “Immediate Clarifications” section resolved <br> - Risks logged in phase-plan.md |
| **Phase 1 – Data & Service Foundation** | Week 1 | Persist everything needed for bots & conversations | ✅ Mongo schemas (`bot`, `bot_brain`, `conversation`, `summary`, `board`) <br> ✅ Migration scripts & indexes <br> ✅ Unified AI service skeleton | - Create/List/Update/Delete works for bots & conversations via Postman <br> - Unit tests cover schemas and services |
| **Phase 2 – Core Chat Surfaces** | Week 2 | Deliver single-bot chat with streaming | ✅ SSE endpoint + handler <br> ✅ React chat widget + panel <br> ✅ Bot switcher MVP <br> ✅ Local storage of chat state | - 15-minute smoke test transcript stored & retrievable <br> - No blocking UI regressions on existing routes |
| **Phase 3 – Bot Creation & Brains** | Week 3 | Empower users to craft assistants | ✅ Wizard with templates + scratch mode <br> ✅ Brain storage CRUD (core + learned) <br> ✅ Document ingestion pipeline (metadata only) | - Alana can create 3 bots, upload dossier PDFs, and see them referenced |
| **Phase 4 – Context Mastery** | Week 4 | Guarantee long-context resilience | ✅ Token accounting service <br> ✅ Auto-summarization pipeline + manual override <br> ✅ Context indicator UI <br> ✅ Brain visualization prototype | - 200k-token stress test succeeds without manual pruning <br> - Summaries are attached to conversations and referenced automatically |
| **Phase 5 – Board of Directors** | Week 5 | Multi-bot orchestration & discussion | ✅ Board CRUD + consultation API <br> ✅ Parallel + hybrid response modes <br> ✅ Discussion transcript view <br> ✅ Mode switcher in UI | - Board session handles >5 bots without latency spikes <br> - User can escalate from parallel answers to moderated discussion |
| **Phase 6 – Production Hardening** | Week 6 | Ship desktop-first persistent assistant | ✅ Desktop notification system <br> ✅ Proactive suggestions engine (toggleable) <br> ✅ Multi-model fallbacks <br> ✅ Railway deployment guide updates | - Alana uses widget daily without needing command line <br> - Documentation + README indices updated |
| **Phase 7 – Commercial Readiness** | Weeks 7-8 | Prep for select-author licensing (optional now) | ✅ Multi-tenant isolation guardrails <br> ✅ Usage metering & billing hooks <br> ✅ Bot marketplace schema + admin tools | - First beta author onboard plan documented <br> - Security review artifacts stored in `docs/security/`

Each phase feeds artifacts back into `docs/phase-plan.md` and the main README to keep high-level AI agents synchronized.

---

## Step-by-Step Milestone Checklist
1. **Confirm Architecture (Phase 0)** – Translate every “Immediate Clarifications Needed” item into resolved decisions; update both this doc and the agent discussion file.
2. **Schema Migration (Phase 1)** – Add new Pydantic models, Motor collections, and Mongo indexes; backfill sample data for Scott/Alana test bots.
3. **Unified AI Service (Phase 1)** – Implement provider adapters with feature parity (streaming, token counting, context limit lookup) and smoke test with Anthropic + OpenAI keys.
4. **Conversation Engine (Phase 2)** – Wire SSE endpoint, ensure reconnect/resume on network blips, and add transcript retrieval API.
5. **Frontend Widget (Phase 2)** – Build floating entrypoint, command palette shortcuts, and store per-user UI preferences in localStorage.
6. **Bot Creation Wizard (Phase 3)** – Implement validation, preview, and immediate test chat inside wizard before persistence.
7. **Brain Storage & Visualization (Phase 3-4)** – Create GraphQL-style query for brain inspection, embed force-directed graph or hierarchical tree for knowledge view.
8. **Document Pipeline (Phase 3-4)** – Chunk uploads (10k token segments), generate embeddings, and index in Pinecone/Atlas Vector Search for semantic retrieval.
9. **Context Manager (Phase 4)** – Automate summary generation, create manual “Summarize now” button, and log all condensation events for audit.
10. **Board Modes (Phase 5)** – Implement parallel + hybrid + sequential flows, including “promote to discussion” button that spins up LangGraph orchestration (Phase 5 integration point).
11. **Proactive Engine (Phase 6)** – Detect inactivity and major project events, gate notifications behind quiet hours + DND toggle, and write tests for scheduler accuracy.
12. **Deployment & Indexing (Phase 6-7)** – Update README, phase-plan, and operations docs; publish new runbooks for chatbot services; ensure Railway env vars templated.

All steps above map back to the numbered Implementation Phases to maintain traceability for future AI agents reviewing progress.

---

## Success Metrics

**User Engagement:**
- % of users who create at least one custom bot
- Average conversations per user per week
- Average message length (indicates depth of interaction)

**Bot Utility:**
- Most popular bot templates
- Average conversation length before summarization
- User retention after first bot interaction

**Board Feature:**
- % of users who create boards
- Average board size (number of bots)
- Frequency of board consultations vs single-bot chats

---

## Future Enhancements

**Phase 7+:**
- 🔮 **Bot Sharing:** Users can share bot templates with community
- 🔮 **Voice Input:** Speak to bots instead of typing
- 🔮 **Document Upload:** Share chapters/outlines with bot for analysis
- 🔮 **Scheduled Check-ins:** Bot proactively asks "How's your writing going?"
- 🔮 **Bot Analytics:** Show user insights (most helpful bot, common questions)
- 🔮 **Integration with Writing Tools:** Bot can suggest edits directly in chapter editor
- 🔮 **Multi-User Boards:** Authors can invite collaborators to shared boards

---

## Technical Decisions

### Why Multiple AI Providers?
- **Diversity:** Different models excel at different tasks
- **Redundancy:** If one provider has issues, others available
- **Cost Optimization:** Use cheaper models for simple queries
- **User Preference:** Some users prefer specific models

### Why Server-Sent Events (SSE) for Streaming?
- Simpler than WebSockets for one-way communication
- Built-in browser support
- Easy to implement with FastAPI
- Automatic reconnection handling

### Why MongoDB for Conversations?
- Flexible schema for different message types
- Good at storing large conversation histories
- Easy to query recent messages
- Scales well for many users

---

## Next Steps

1. **Approve this plan** - Review and provide feedback
2. **Set up AI provider accounts** - Get API keys for Grok, ensure OpenAI/Anthropic keys ready
3. **Begin Phase 1 implementation** - Start with database schemas and basic endpoints
4. **Weekly demos** - Show Alana progress and get feedback

---

## UPDATED REQUIREMENTS (Nov 28, 2025)

### User Context: Personal Desktop Application
- **Users:** Only 2 - Scott & Alana (husband/wife author team)
- **Deployment:** Private desktop application (no scaling concerns)
- **Context Limits:** WIDE OPEN - no token budget restrictions
- **Storage:** Unlimited bots, indefinite conversation history (user-delete only)
- **Focus:** Desktop-first (not mobile)

### Sintra Brain Model
Inspired by **Sintra.ai** architecture:
- Each bot has its own **"Brain"** - expandable knowledge base/dossier
- Bots learn and retain context about the business (writing projects, characters, plots)
- Long-term memory across sessions
- Document upload capability (manuscripts, research, notes)
- User can expand bot's brain manually OR let bot expand it through conversation

### Key Feature Updates

**1. Unlimited Bots per User**
- Scott gets his own bot collection
- Alana gets "Board of Directors" (multiple expert consultants)
- No artificial limits
- Each bot maintains separate identity and brain

**2. Expandable Bot "Brain" / Dossier System**
```typescript
interface BotBrain {
  bot_id: string;
  
  // Core Knowledge (editable by user)
  core_knowledge: {
    expertise_domains: string[];
    reference_materials: Document[];
    key_facts: KeyValuePair[];
    writing_style_preferences: string;
  };
  
  // Learned Knowledge (accumulated through conversations)
  learned_context: {
    character_profiles: Map<string, CharacterInfo>;
    plot_threads: PlotThread[];
    user_preferences: Preference[];
    writing_patterns: Pattern[];
    common_questions: FrequentQuery[];
  };
  
  // Long Context Documents
  uploaded_documents: {
    manuscripts: Document[];
    research_papers: Document[];
    story_bibles: Document[];
    character_sheets: Document[];
    world_building_notes: Document[];
  };
  
  // Conversation Memory
  conversation_summaries: Summary[]; // Never deleted
  key_decisions: Decision[];
  important_moments: Milestone[];
}
```

**3. Document Upload & Processing**
- Upload full manuscripts (100k+ words)
- Upload research documents
- Upload story bibles, character sheets
- Bot indexes and references these in conversations
- Vector embeddings for semantic search through documents

**4. Indefinite Conversation History**
- All conversations stored permanently
- User must manually delete (never auto-delete)
- Smart summarization for context management
- Full conversation search/retrieval

**5. Scott's Bots vs. Alana's Board**
- **User separation:** Each user has their own bot collection
- **Scott's Use Case:** General high-level long context chat, research assistant, brainstorming
- **Alana's Use Case:** Editorial board of expert consultants for novel writing

---

## Deep Dive Questions

### 1. Bot Brain Architecture

**Q: How should the "Brain" expand?**
- Should bots automatically extract and save key information from conversations?
- Should there be a "Save to Brain" button users click?
- Should bots proactively ask "Should I remember this for future reference?"

**Q: Brain Organization**
- Should brains be organized like folders/categories (Characters, Plot, Research, Style)?
- Should it be a searchable knowledge graph?
- Should users see a visual "map" of what the bot knows?

**Q: Brain Sharing**
- Can Scott and Alana share bot brains? (e.g., character expert bot knows all characters)
- Should some bots be "personal" and others "shared"?

### 2. Document Processing Strategy

**Q: Document Integration**
When user uploads a manuscript:
- Should bot automatically analyze and extract characters, plot points, themes?
- Should bot wait for user to ask questions about the document?
- Should bot create a summary/index on upload?

**Q: Document Interaction**
How should bots reference uploaded documents?
- Direct quotes: "In Chapter 3, you wrote: '[quote]'"
- Conceptual references: "Based on your manuscript, the protagonist's arc shows..."
- Page/chapter citations?

**Q: Document Updates**
When user updates a manuscript:
- Should bot track changes? ("I see you changed Jane's motivation in Chapter 5")
- Should bot offer to re-analyze?
- Should bot maintain version history?

### 3. Board of Directors Workflow

**Q: Board Composition**
For Alana's editorial board:
- Fixed board (e.g., Editor, Character Expert, Plot Consultant always present)?
- Dynamic board (choose which bots to consult per question)?
- Hierarchical board (Lead Editor + specialist consultants)?

**Q: Board Interaction Modes**

**Option A: Parallel Consultation**
- User asks one question
- All board members respond independently
- User reviews all perspectives

**Option B: Sequential Discussion**
- User asks question
- Bots discuss among themselves
- User sees the "meeting transcript"
- Bots reach consensus or present options

**Option C: Hybrid**
- User asks question
- All bots respond
- User can then direct follow-up to specific bot(s)
- Or trigger a "board discussion" on the topic

Which approach fits Alana's workflow?

**Q: Board Memory**
- Should the board share collective memory of consultations?
- Should each bot only remember their own conversations with user?
- Should board members be aware of each other's expertise?

### 4. Long Context Strategy

**Q: Context Window Management**
With unlimited budget and wide-open context:
- Use maximum available context (200k tokens for Claude Sonnet 4.5)?
- Load entire conversation history every time (no summarization)?
- Or still use summarization but keep summaries more detailed?

**Q: Context Priority**
When context gets very large, what loads first?
1. Bot's core brain/dossier
2. Recent conversation history
3. Relevant uploaded documents
4. Historical conversation summaries

**Q: Context Visualization**
Should user see what's "loaded" in current context?
- Token usage meter
- "Active memory" panel showing what bot is referencing
- Document snippets being used

### 5. Conversation Organization

**Q: Conversation Threading**
- Should conversations be organized by project? (Novel A, Novel B, etc.)
- By topic? (Character Development, Plot Issues, Research)
- By date? (chronological)
- All mixed in one timeline per bot?

**Q: Conversation Search**
What should users be able to search for?
- Keywords in messages
- Decisions made
- Documents referenced
- Date ranges
- Specific bot responses

**Q: Conversation Export**
Should users be able to:
- Export full conversation transcripts (PDF, Markdown)?
- Export just bot responses (advice compilation)?
- Export decisions/key moments only?

### 6. Bot Personality & Voice

**Q: Bot Consistency**
- Should bots maintain consistent personality across all conversations?
- Should personality evolve as bot learns more about user?
- Should user be able to adjust personality mid-conversation?

**Q: Bot Proactivity**
Should bots:
- Check in unprompted? ("Hey, how's Chapter 8 coming?")
- Offer suggestions? ("I noticed you haven't worked on character X in a while...")
- Send reminders? ("You wanted to research 1920s fashion for Chapter 12")
- Or only respond when spoken to?

**Q: Bot Specialization Level**
For Alana's board:
- **Hyper-specialized:** "Romantic Tension Expert for Contemporary Romance"
- **Moderately specialized:** "Character Development Coach"
- **Generalist with depth:** "Editorial Assistant with character expertise"

What level of specialization is most useful?

### 7. Scott's Use Case

**Q: Scott's Bot Needs**
You mentioned "general high-level long context chat" - what specific tasks?
- Brainstorming story ideas with Alana?
- Technical development planning (like this conversation)?
- Research assistant for background information?
- Project management (tracking writing milestones)?
- All of the above?

**Q: Scott's Bot vs. Alana's Bots**
- Do you want cross-access? (Scott can consult Alana's Character Expert if needed?)
- Or strict separation?
- Should some bots be "system bots" both can use?

### 8. Integration with Existing App

**Q: Context Awareness**
When chatbot appears on a page, should it:
- **Chapter page:** Auto-load current chapter into context for analysis?
- **Character page:** Auto-load character profile into bot's awareness?
- **Outline page:** Auto-load story structure for consultation?
- **Premise Builder:** Auto-load premise for feedback?

**Q: Direct Actions**
Should bots be able to:
- Make edits directly in the app? ("I've updated Darcy's character sheet")
- Create new content? ("I've drafted a character profile for Maxwell")
- Or just provide advice (user makes all edits)?

**Q: Work Triggers**
Should bots notice when:
- User completes a chapter? ("Congrats on Chapter 10! Want me to review it?")
- User makes major edits? ("I see you restructured Act 2. Want to discuss?")
- User gets stuck? (no activity for X minutes: "Need some help?")

### 9. User Experience

**Q: Bot Switching**
When Alana has 5-10 bots in her board:
- Dropdown menu to switch?
- Tabs across top of chat?
- Sidebar with bot icons?
- Search/command palette? (type `/editor` to switch to Editor bot)

**Q: Visual Identity**
Should each bot have:
- Custom avatar (user can upload image)?
- Color scheme (user assigns colors)?
- Voice/tone indicator (formal, casual, encouraging)?
- Specialty badges (Character Expert 🎭, Plot Pro 📖)?

**Q: Notification Strategy**
Desktop app notifications:
- When bot finishes long response?
- When board finishes multi-bot consultation?
- Never (user actively watches)?

### 10. Technical Constraints & Preferences

**Q: AI Model Selection**
For each bot, should user choose:
- **Model:** Claude Sonnet 4.5, GPT-4, etc.
- **Temperature:** How creative vs. focused
- **Max tokens:** How long responses can be
- Or use smart defaults based on bot type?

**Q: Response Style**
Should bots:
- Always stream responses (word-by-word like ChatGPT)?
- Show full response at once (faster but less engaging)?
- User preference toggle?

**Q: Offline Capability**
- Should conversations be cached locally?
- Should bot brain be stored locally + synced to database?
- Or always cloud-based?

---

## Immediate Clarifications Needed

Before I start Phase 1 implementation, please answer:

### CRITICAL:
1. **Brain Expansion:** Auto-learn from conversations, manual "Save to Brain" button, or proactive bot asking?
2. **Document Processing:** Auto-analyze on upload, or wait for user questions?
3. **Board Mode:** Parallel responses, sequential discussion, or hybrid?
4. **Context Strategy:** Use full 200k token context, or still summarize intelligently?
5. **Scott vs. Alana Bots:** Completely separate, or shared access to some bots?

### HIGH PRIORITY:
6. **Conversation Organization:** By project, topic, date, or mixed timeline?
7. **Bot Proactivity:** Should bots check in unprompted, or only respond when addressed?
8. **Integration with App:** Should bots auto-load context from current page?
9. **Direct Actions:** Can bots edit/create content in app, or advice-only?

### MEDIUM PRIORITY:
10. **Bot Specialization:** Hyper-specialized experts or moderate generalists?
11. **Visual Identity:** Custom avatars, color schemes, badges?
12. **Notification Strategy:** Desktop notifications or silent?

Once you answer these, I'll refine the technical architecture and start building! 🚀

# 🎭 ALANA'S CUSTOM CHATBOT: MASTER PLAN

> **Purpose**: Create the most amazing, personalized AI writing companion for Alana  
> **Target User**: 1 (Alana only - Scott has separate instance)  
> **Philosophy**: Desktop-first, creativity-focused, infinitely patient, deeply personalized  
> **Context Strategy**: Heavily chunked implementation to preserve context across sessions  

---

## 📑 DOCUMENT INDEX (Chunked Structure)

This master plan references multiple focused documents to avoid context limits:

| Document | Purpose | Status |
|----------|---------|--------|
| `ALANA_CHATBOT_MASTER_PLAN.md` | **THIS FILE** - Overview & index | 📝 Active |
| `ALANA_PERSONA_DESIGN.md` | Chatbot personality, voice, humor calibration | 🔜 Next |
| `ALANA_WORKFLOW_INTEGRATION.md` | How bot fits her creative process | 🔜 Pending |
| `ALANA_BOARD_SPECIALISTS.md` | Board of Directors specialist bot designs | 🔜 Pending |
| `ALANA_BRAIN_ARCHITECTURE.md` | Knowledge base structure & expansion | 🔜 Pending |
| `ALANA_UX_SPECIFICATIONS.md` | Interface design, shortcuts, preferences | 🔜 Pending |
| `ALANA_STARTER_BOTS.md` | Pre-built bot templates for Day 1 | 🔜 Pending |
| `ALANA_ITERATION_LOG.md` | Daily implementation progress tracker | 🔜 Pending |
| `ALANA_TESTING_PROTOCOL.md` | Feedback loop & acceptance criteria | 🔜 Pending |

**Why Chunked?**: Each document = 1 focused concern. Prevents context overflow. Cross-referenced for navigation.

---

## 🎯 VISION STATEMENT

**THE GOAL**: Create Alana's perfect creative partner - an AI writing companion that:

1. **Understands Her Voice**: Learns her writing style, genre preferences, character archetypes, dialogue patterns
2. **Anticipates Her Needs**: Proactive suggestions during brainstorming, gentle nudges when stuck, celebrates progress
3. **Grows With Her**: Expandable "brain" absorbs her manuscripts, character sheets, research, world-building notes
4. **Consults Specialists**: Board of Directors with expert bots (Dialogue Coach, Plot Architect, Romance Specialist, etc.)
5. **Respects Her Flow**: Non-intrusive UI, keyboard-first navigation, conversation history organized by project/chapter
6. **Never Forgets**: Unlimited context retention, auto-summarization at 75% capacity, full conversation archives
7. **Always Available**: Persistent chat widget on every page, instant access to any bot, seamless project context switching

---

## 🧠 CORE CONCEPT: ALANA'S AI WRITING STUDIO

Think of this as Alana's **private AI writing studio** with multiple expert consultants on call 24/7:

### **Main Chatbot (Primary Companion)**
- Default conversational partner
- General writing assistance
- Project management support
- Router to specialist bots when needed
- Emotional support during creative blocks

### **Board of Directors (Specialist Bots)**
- **Dialogue Coach**: Voice differentiation, natural speech patterns, subtext mastery
- **Plot Architect**: Story structure, pacing, scene sequencing, narrative arc
- **Character Psychologist**: Character depth, motivations, arc consistency, relationships
- **Romance Expert**: Emotional beats, tension building, relationship progression (for Romance novels)
- **Humor/Comedy Specialist**: Comedic timing, wit, banter optimization (for Humor-Comedy novels)
- **Genre Master**: Trope adherence, reader expectations, market conventions
- **Research Assistant**: Historical accuracy, technical details, setting authenticity
- **Editor Bot**: Line editing, grammar, style consistency, AI-tell detection

### **The Brain System**
Each bot has a **core brain** (personality + expertise) plus **learned context**:
- Alana's manuscripts (uploaded .docx files)
- Character sheets & world-building documents
- Conversation history (every chat indexed)
- Project-specific notes (linked to novel projects)
- Genre research & tropes (dynamically added)

---

## 🗂️ ALANA'S WORKFLOW INTEGRATION POINTS

Where does the chatbot fit in her creative process?

### **Phase 1: Brainstorming & Planning**
- **Bot Role**: Premise builder assistant, genre guidance, character brainstorming
- **Example Use**: "Help me develop a small-town romance premise with a grumpy/sunshine dynamic"
- **Board Consult**: Plot Architect + Romance Expert + Character Psychologist

### **Phase 2: Outlining & Structure**
- **Bot Role**: Chapter sequencing, act structure, pacing analysis
- **Example Use**: "Does this 3-act structure have enough rising action in Act 2?"
- **Board Consult**: Plot Architect + Genre Master

### **Phase 3: First Draft Writing**
- **Bot Role**: On-demand scene brainstorming, dialogue suggestions, writer's block support
- **Example Use**: "I'm stuck on this confrontation scene between Sarah and her ex"
- **Board Consult**: Dialogue Coach + Character Psychologist

### **Phase 4: Revision & Editing**
- **Bot Role**: Dialogue refinement, AI-tell detection, consistency checking
- **Example Use**: "Review this chapter for AI tells and voice consistency"
- **Board Consult**: Editor Bot + Dialogue Coach

### **Phase 5: Final Polish**
- **Bot Role**: Line editing, emotional beats validation, market positioning
- **Example Use**: "Does this chapter hit the right emotional notes for Romance readers?"
- **Board Consult**: Romance Expert + Genre Master + Editor Bot

---

## 🎭 PERSONALITY CALIBRATION (CRITICAL)

**Question for Alana**: What personality should her main chatbot have?

### **Option A: Professional Writing Coach**
- Tone: Encouraging but direct
- Style: Clear feedback, constructive criticism
- Humor: Minimal, focused on craft
- Example: "This dialogue feels stilted. Let's add contractions and interruptions to make it more natural."

### **Option B: Enthusiastic Creative Partner**
- Tone: Warm, supportive, celebratory
- Style: Lots of encouragement, gentle suggestions
- Humor: Moderate, lighthearted
- Example: "Ooh, I love where this is going! What if Sarah responds with sarcasm here instead of anger?"

### **Option C: Witty Peer Editor**
- Tone: Playful, sarcastic (in a friendly way)
- Style: Honest feedback with personality
- Humor: High, banter-focused
- Example: "Okay, so you've used 'her eyes sparkled' three times in two pages. Let's find some new sparkle metaphors, shall we?"

### **Option D: Hybrid/Custom**
- Let Alana define her ideal personality mix
- Adjustable per bot (e.g., Dialogue Coach = witty, Plot Architect = professional)

**CRITICAL**: This choice affects every interaction. Must nail this first.

---

## 🏗️ TECHNICAL ARCHITECTURE (HIGH-LEVEL)

### **Backend (Python FastAPI)**
- `bots` collection: Bot definitions (persona, system prompt, expertise, brain_id)
- `bot_brains` collection: Knowledge bases (manuscripts, characters, research, conversation summaries)
- `conversations` collection: Chat histories (linked to user_id, project_id, bot_id)
- `messages` collection: Individual messages (role, content, timestamp, conversation_id)
- `boards` collection: Board of Directors configurations (bot list, consultation mode)
- Unified AI service: Claude Sonnet 4.5 (primary), GPT-4, Grok, Llama (fallback/testing)

### **Frontend (React + TypeScript)**
- Persistent chat widget (floating button, expandable panel)
- Bot switcher dropdown (quick access to any bot)
- Board of Directors modal (select specialists for multi-bot consult)
- Conversation sidebar (organized by project, searchable)
- Brain manager (upload docs, view learned context)
- Keyboard shortcuts (Cmd/Ctrl+K = open chat, Cmd/Ctrl+B = Board mode, etc.)

### **Context Management**
- Auto-summarization at 75% of Claude's 200k token limit (150k tokens)
- Full conversation history retained in DB (never deleted unless user requests)
- Summaries chained for infinite context (summary of summaries)
- Project context switching: bot loads relevant manuscripts/characters automatically

---

## 📋 IMPLEMENTATION CHUNKS (MICRO-PHASES)

**Philosophy**: Break work into 1-2 day increments. Test after each chunk. Iterate based on Alana's feedback.

### **Chunk 1: Foundation (Days 1-2)**
- ✅ Create `bots`, `bot_brains`, `conversations`, `messages` MongoDB schemas
- ✅ Build unified AI service (Claude Sonnet 4.5 integration)
- ✅ Implement bot CRUD endpoints
- ✅ Write unit tests
- **Exit Criteria**: Postman can create/list/update/delete a bot

### **Chunk 2: Basic Chat (Days 3-4)**
- ✅ Build SSE streaming endpoint
- ✅ Create React chat widget (floating button + panel)
- ✅ Implement bot switcher dropdown
- ✅ Add conversation persistence (localStorage + DB)
- **Exit Criteria**: Alana can chat with 1 bot, switch to another bot, refresh page and see history

### **Chunk 3: Main Chatbot Persona (Day 5)**
- ✅ Finalize Alana's main bot personality (based on her feedback)
- ✅ Write system prompt with personality, tone, humor level
- ✅ Create default bot in DB with persona
- ✅ Test conversation quality with Alana
- **Exit Criteria**: Alana approves personality in 10-minute test chat

### **Chunk 4: Project Context (Days 6-7)**
- ✅ Add `project_id` field to conversations
- ✅ Build project selector in UI (link chat to novel project)
- ✅ Auto-load project metadata when conversation starts
- ✅ Test context switching (chat about Project A, switch to Project B, context updates)
- **Exit Criteria**: Bot "knows" which project Alana is discussing

### **Chunk 5: Document Upload (Days 8-9)**
- ✅ Build file upload endpoint (.docx, .txt, .md)
- ✅ Extract text content (python-docx library)
- ✅ Store in `bot_brains` collection linked to bot_id
- ✅ Add brain content to bot system prompt (or user message context)
- **Exit Criteria**: Alana uploads a manuscript, bot references it in conversation

### **Chunk 6: Conversation Organization (Day 10)**
- ✅ Add conversation sidebar (list all chats)
- ✅ Organize by project (collapsible sections)
- ✅ Add search functionality
- ✅ Rename conversations (user-editable titles)
- **Exit Criteria**: Alana can find any past conversation in <10 seconds

### **Chunk 7: Context Summarization (Days 11-12)**
- ✅ Implement token counting (tiktoken library)
- ✅ Auto-summarize at 75% capacity (150k tokens for Claude)
- ✅ Store summaries in `summaries` collection
- ✅ Prepend summary to new messages (chained context)
- **Exit Criteria**: 10-hour conversation doesn't hit token limit

### **Chunk 8: Starter Bot Templates (Days 13-14)**
- ✅ Create 6 pre-built bots with personalities & expertise:
  1. **General Writing Assistant** (default, balanced personality)
  2. **Dialogue Coach** (witty, focused on speech patterns)
  3. **Character Developer** (empathetic, psychology-focused)
  4. **Plot Troubleshooter** (analytical, structure-focused)
  5. **Romance Expert** (warm, emotional beats specialist)
  6. **Humor/Comedy Specialist** (playful, timing-focused)
- ✅ Write system prompts for each
- ✅ Add to DB via migration script
- **Exit Criteria**: Alana tests each bot, confirms distinct personalities

### **Chunk 9: Board of Directors (Days 15-17)**
- ✅ Build Board UI (select 2-5 bots for consultation)
- ✅ Implement parallel consultation mode (all bots respond simultaneously)
- ✅ Implement sequential mode (bots respond in order, see previous responses)
- ✅ Implement debate mode (bots challenge each other's suggestions)
- ✅ Display multi-bot responses clearly in UI
- **Exit Criteria**: Alana asks 1 question, gets 3 specialist responses, finds it useful

### **Chunk 10: Brain Expansion (Days 18-19)**
- ✅ Build brain manager UI (view learned content)
- ✅ Add character sheet uploader (linked to specific bot brain)
- ✅ Add world-building notes uploader
- ✅ Add research document uploader
- ✅ Tag content by type (manuscript, character, world, research)
- **Exit Criteria**: Bot references specific character trait from uploaded character sheet

### **Chunk 11: Keyboard Shortcuts (Day 20)**
- ✅ Implement hotkeys:
  - `Ctrl+K`: Toggle chat widget
  - `Ctrl+B`: Open Board of Directors
  - `Ctrl+Shift+N`: New conversation
  - `Ctrl+Shift+S`: Search conversations
  - `Ctrl+1-6`: Quick switch to bots 1-6
- ✅ Add help modal (list all shortcuts)
- **Exit Criteria**: Alana navigates without touching mouse

### **Chunk 12: Proactive Suggestions (Days 21-22)**
- ✅ Add "nudge" system: bot offers help when Alana is stuck
- ✅ Detect idle time on chapter page (5+ minutes)
- ✅ Trigger gentle suggestion: "Need help brainstorming this scene?"
- ✅ User can dismiss or accept
- **Exit Criteria**: Alana reports nudge felt helpful, not annoying

### **Chunk 13: Polish & Testing (Days 23-25)**
- ✅ UI refinements based on Alana's feedback
- ✅ Performance optimization (lazy loading, caching)
- ✅ End-to-end testing (full workflow from brainstorm → draft → revision)
- ✅ Bug fixes
- **Exit Criteria**: Alana uses it for 1 week with no blockers

---

## 🔍 CRITICAL QUESTIONS FOR ALANA (Answer Before Starting)

### **1. PERSONALITY (MUST ANSWER FIRST)**
- What personality should your main chatbot have? (Professional Coach / Enthusiastic Partner / Witty Peer / Custom)
- How much humor? (None / Light / Moderate / Heavy)
- How much encouragement vs. direct criticism? (Slider: 100% supportive ← → 100% blunt)
- Example personality you love from a book/movie/friend?

### **2. WORKFLOW PRIORITIES**
- Which creative phase needs the MOST bot help? (Brainstorming / Outlining / Drafting / Revising / All equally)
- Do you want proactive nudges when stuck, or only respond when you ask?
- Should the bot celebrate your progress (e.g., "You wrote 2,000 words today! 🎉") or stay quiet?

### **3. BOARD OF DIRECTORS**
- Which specialist bots do you want in your starter set? (Rank top 3-6 from list above)
- Do you prefer parallel responses (see all opinions at once) or sequential (one at a time)?
- Should bots debate each other, or just give independent opinions?

### **4. DOCUMENT UPLOADS**
- What types of documents will you upload? (Manuscripts / Character sheets / Research / World-building / All)
- Should the bot auto-analyze uploads and offer insights, or wait for you to ask?
- Max file size you'd typically upload? (Estimate: 50 pages? 500 pages?)

### **5. CONVERSATION ORGANIZATION**
- Organize chats by: Project (novel-based) / Date / Topic / Custom tags / All of the above?
- Should old conversations auto-archive after X days, or keep everything accessible forever?

### **6. VISUAL PREFERENCES**
- Chat widget position: Bottom-right (standard) / Bottom-left / Sidebar / Custom?
- Color scheme: Match existing app / Custom (pick a vibe: professional, playful, minimal, etc.)
- Avatar for bots: AI-generated faces / Icons / Initials / None?

### **7. TESTING APPROACH**
- Prefer daily micro-tests (10 minutes per feature) or weekly milestone tests (1 hour)?
- Want to test on live novel projects or dummy test content first?
- How much feedback detail do you want to provide? (Quick thumbs-up/down / Written notes / Video walkthrough)

---

## 🚀 GETTING STARTED (IMMEDIATE ACTIONS)

### **Scott's Next Steps** (Before Writing Code):
1. **Read this document** with Alana
2. **Schedule 30-minute planning session** to answer 7 critical questions above
3. **Create persona design document** (`ALANA_PERSONA_DESIGN.md`) based on her answers
4. **Finalize Chunk 1-3 scope** (Foundation + Basic Chat + Persona)
5. **Kick off Chunk 1** (database schemas)

### **Alana's Next Steps**:
1. **Answer 7 critical questions** (personality, workflow, board, uploads, organization, visual, testing)
2. **Think about ideal bot personality** - write a few example interactions you'd love to have
3. **List your top 3 "stuck" moments** when writing where a bot could help most
4. **Gather 1-2 sample documents** (character sheet, manuscript chapter) to test uploads in Chunk 5

---

## 📊 SUCCESS METRICS (How We Know It's Amazing)

### **Week 1 Success** (After Chunk 1-3):
- ✅ Alana chats with bot for 15+ minutes
- ✅ She says: "This personality feels right"
- ✅ No technical blockers

### **Week 2 Success** (After Chunk 4-6):
- ✅ Bot references her novel project correctly
- ✅ She uploads a manuscript and bot discusses it accurately
- ✅ She finds past conversations easily

### **Week 3 Success** (After Chunk 7-9):
- ✅ Alana has 5+ hour conversation with no token limit issues
- ✅ She tests Board of Directors and gets valuable multi-bot insights
- ✅ She uses chatbot daily

### **Week 4 Success** (After Chunk 10-12):
- ✅ Bot references specific character details from uploaded sheets
- ✅ Alana uses keyboard shortcuts regularly
- ✅ Proactive nudges help her when stuck (at least 1 successful nudge)

### **Week 5 Success** (Final Testing):
- ✅ Alana prefers this over any other AI tool for writing
- ✅ She says: "This is the most amazing chatbot I've ever used"
- ✅ She uses it throughout her entire novel workflow

---

## 🔗 CROSS-REFERENCES

- **Technical Foundation**: See `docs/CHATBOT_FEATURE_PLAN.md` for full technical specs
- **Architecture Strategy**: See `docs/AGENT_SYSTEM_ARCHITECTURE_DISCUSSION.md` for framework decisions
- **Repository Index**: See `README.md` for project status and document index
- **Implementation Phases**: This document replaces Phase 1-6 with Alana-focused micro-chunks

---

## 📝 NEXT DOCUMENT TO CREATE

**`docs/ALANA_PERSONA_DESIGN.md`** - Once Alana answers personality questions, create detailed persona specification including:
- Voice characteristics (tone, humor, formality)
- Example conversations (10+ dialogue samples)
- System prompt templates
- Personality variations for specialist bots
- Edge case handling (when Alana is frustrated, blocked, celebrating, etc.)

---

**STATUS**: 📝 Master plan complete. Awaiting Alana's answers to 7 critical questions before proceeding to Chunk 1.

**OPERATORS**: Scott (architecture/implementation) + Alana (requirements/testing/personality design)

**ESTIMATED TIMELINE**: 25 days (5 weeks) assuming daily 2-3 hour work sessions + Alana feedback loops

**CONTEXT MANAGEMENT**: This master plan stays under 5k tokens. Each subsequent document = 1 focused concern. Cross-references prevent duplication.

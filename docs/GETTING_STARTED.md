# WriteMind Studios - Getting Started Guide

**For**: New Users, Authors, First-Time Setup  
**Time to Complete**: 15-20 minutes  
**Last Updated**: November 29, 2025  
**🦸 Code Master**: "By the power of clean code! Let's get you set up!" ⚔️⚡

---

## 🦸 Meet Your Coding Assistant First!

**Thunder, Thunder, ThunderCats!** Before diving into setup, meet **Code Master** - your 80's hero coding assistant who'll help you through any issues:

- 🐛 **Having setup problems?** → Ask Code Master in the chat widget (bottom-right after setup)
- 🏗️ **Need architecture help?** → Code Master provides tactical breakdowns (Duke mode)
- 📚 **Want to learn the codebase?** → Code Master teaches with patience (Lion-O mode)
- 🚨 **Production emergency?** → Code Master goes silent ninja (Snake Eyes mode)

**Quick Links**: [5-Minute Quick Start](CODE_MASTER_QUICK_START.md) | [Full Specification](80S_HERO_CODING_ASSISTANT_DOSSIER.md)

---

## Quick Start (5 Minutes)

### 1. Prerequisites Check
- [x] Python 3.12+ installed
- [x] Node 20+ installed
- [x] MongoDB (Atlas account or local instance)
- [x] API Keys:
  - Anthropic API key (for Claude Sonnet 4.5)
  - OpenAI API key (for GPT-4o and DALL-E 3)
  - Tavily API key (for web search, optional)

### 2. Clone & Install
```powershell
# Clone repository
git clone https://github.com/yourusername/ai-novel-generator.git
cd ai-novel-generator

# Backend setup
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### 3. Configure Environment
```powershell
# Copy example .env file
Copy-Item .env.example .env

# Edit .env with your keys
notepad .env
```

**Required Variables**:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai_novel_generator
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...  # Optional for chat
```

### 4. Start Services
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Open Application
Open browser: `http://localhost:5173`

**✅ You're ready to write your first novel!**

---

## Your First Novel (10 Minutes)

### Step 1: Create a New Project

1. Click **"New Project"** button
2. Choose workflow:
   - **Quick Start**: Manual premise entry
   - **Guided Builder**: 8-step AI-assisted wizard (recommended)

### Step 2: Use Guided Premise Builder (Recommended)

**8-Step Wizard**:

1. **Genre Selection**
   - Choose primary genre (22 options: Mystery, Romance, Sci-Fi, etc.)
   - Select subgenre (10 options per genre)
   - AI analyzes conventions

2. **Tone & Atmosphere**
   - Describe desired tone (dark, hopeful, suspenseful, etc.)
   - AI suggests tone examples from similar works

3. **Character Introduction**
   - Describe protagonist (name, role, goals)
   - AI asks clarifying questions
   - Add antagonist and supporting characters

4. **Setting & World**
   - Describe primary location(s)
   - Time period (contemporary, historical, future)
   - AI expands world-building details

5. **Plot Concept**
   - Core story idea (1-2 sentences)
   - Central conflict
   - AI suggests plot complications

6. **Story Structure**
   - Opening scene vision
   - Key turning points
   - Climax concept
   - AI maps 3-act structure

7. **Writing Constraints**
   - POV preference (1st, 3rd limited, 3rd omniscient)
   - Themes to explore
   - Content boundaries

8. **Premise Synthesis**
   - **Baseline** (GPT-4o): Quick 500-word premise
   - **Premium** (Claude Sonnet 4.5): Rich 1500-2000 word premise
   - Choose which to use for your project

**Result**: Comprehensive premise ready for Story Bible generation

### Step 3: Generate Story Bible

1. Click **"Generate Story Bible"** on project page
2. Wait 30-60 seconds (Claude generates 3500-4500 words)
3. Review generated content:
   - **Characters**: Physical descriptions, personalities, backstories, arcs
   - **Settings**: Locations, atmosphere, cultural significance
   - **Plot Structure**: Main arc, subplots, turning points
   - **Themes**: Central themes, motifs, emotional tones
   - **Tone & Style**: Genre conventions, narrative voice

4. **Edit if needed** (click any field to modify)

**What's Generated**:
- Main character profiles: 150-250 words per field
- Supporting characters: Key details only
- 2-4 major settings: 150-200 words each
- Complete plot arc: 300-400 words
- Genre guidelines: 150-200 words

### Step 4: Generate Outline

1. Click **"Generate Outline"**
2. Wait 45-90 seconds (Claude creates structured outline)
3. Review **9-field outline** for each chapter:
   - Opening scene
   - Characters present
   - Locations used
   - Plot beats (bullet points)
   - Character development
   - Subplot progress
   - Closing scene
   - Tone tags
   - 300-word chapter summary

4. **Edit chapters** (change plot beats, adjust pacing)
5. **Set target word counts** (default: 2500-3000 words per chapter)

### Step 5: Generate Chapters

**Option A: Individual Chapter**
1. Click **"Generate Chapter X"**
2. Watch real-time streaming (SSE)
3. Word count updates live
4. Click **"Stop"** to halt generation
5. Review, copy to clipboard, or export

**Option B: Bulk Generation (Recommended)**
1. Click **"Generate All Chapters"**
2. Modal shows progress (Chapter 1/25... 2/25...)
3. Automatic context assembly:
   - Story Bible (always included)
   - Last 3-4 chapters (full text)
   - Older chapters (300-word summaries)
4. Wait 15-30 minutes (25 chapters × 2500 words)

**Anti-AI-Tell Rules Active**:
- Sentence variety (no robotic patterns)
- Metaphor rationing (1 per 500 words)
- Physical cue variation (no clichés)
- Ellipses discipline (max 3 per chapter)
- "Completely" surgical removal
- 13 total rules → **A- quality prose**

### Step 6: Review & Iterate

1. Read generated chapters
2. Check quality metrics:
   - Ellipses count (target: <3 per chapter)
   - Intensifier usage (minimal)
   - Physical cue clichés (banned)
3. **Manually edit** chapters if needed
4. **Regenerate** specific chapters (uses updated context)

### Step 7: Export Manuscript

**Current** (Manual):
1. Copy each chapter to Word/Google Docs
2. Format as needed

**Future** (Phase 4):
- One-click DOCX export
- Professional manuscript formatting
- Chapter auto-numbering

---

## Key Features Overview

### 1. Premise Builder
- **What**: 8-step guided wizard with AI assistance
- **Models**: GPT-4o (baseline), Claude Sonnet 4.5 (premium)
- **Output**: Rich 1500-2000 word premise
- **Docs**: `PREMISE_BUILDER_COMPLETE.md`

### 2. Story Bible
- **What**: AI-extracted character/setting/plot reference
- **Model**: Claude Sonnet 4.5 (8K output tokens)
- **Output**: 3500-4500 words
- **Features**: JSON repair for truncation, smart depth allocation
- **Docs**: `docs/STORY_BIBLE_FEATURE.md`

### 3. Outline Generation
- **What**: Structured 9-field outline per chapter
- **Model**: Claude Sonnet 4.5 (64K context)
- **Output**: Complete plot roadmap
- **Editable**: All fields user-editable
- **Docs**: `docs/NARRATIVE_CONSISTENCY_STRATEGY.md`

### 4. Chapter Generation
- **What**: Real-time streaming chapter writing
- **Model**: Claude Sonnet 4.5 (200K context)
- **Output**: 2500-3000 words per chapter (default)
- **Quality**: A- grade (anti-AI-tell rules enforced)
- **Docs**: `config/anti_ai_tell_rules.md`

### 5. Chat Assistant (Alana)
- **What**: Persistent AI companion for brainstorming
- **Model**: Claude Sonnet 4.5 (200K context)
- **Features**:
  - Project context awareness (knows your novel)
  - Web search (Tavily - 5 search types)
  - Conversation history (persistent)
  - Context management (mental modes)
- **Docs**: `docs/CHATBOT_PHASE1_COMPLETE.md`

### 6. Book Cover Generator
- **What**: AI-powered cover design workflow
- **Models**: Claude Sonnet 4.5 (design brief), DALL-E 3 (image)
- **Steps**: Story analysis → Design brief → Image generation → Typography → Export
- **Output**: Multi-format (ebook, print, social)
- **Docs**: `docs/BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md`

---

## Common Workflows

### Workflow 1: Quick Novel (30 Minutes)

1. **Guided Premise Builder** (5 min) → Premium synthesis
2. **Generate Story Bible** (1 min) → Review characters
3. **Generate Outline** (2 min) → Tweak plot beats
4. **Bulk Generate 25 Chapters** (20 min) → Coffee break
5. **Review & Export** (2 min) → First draft complete!

**Result**: 60,000-75,000 word manuscript

### Workflow 2: Iterative Quality (2 Hours)

1. **Guided Premise Builder** (10 min) → Rich world-building
2. **Generate Story Bible** (5 min) → Deep character editing
3. **Generate Outline** (10 min) → Detailed plot restructuring
4. **Generate Chapter 1** (3 min) → Read carefully
5. **Regenerate Chapter 1** (3 min) → Compare versions
6. **Generate Chapters 2-5** (15 min) → Check consistency
7. **Review AI-tell metrics** (10 min) → Verify quality
8. **Bulk Generate Remaining** (60 min) → Full manuscript

**Result**: Publication-ready A- quality manuscript

### Workflow 3: Series Planning (1 Hour)

1. **Guided Premise Builder** (15 min) → Book 1 premise
2. **Generate Story Bible** (5 min) → Export characters
3. **Clone Story Bible** → Start Book 2 premise
4. **Modify Story Bible** → Character evolution
5. **Generate Book 1 Outline** (5 min)
6. **Generate Book 2 Outline** (5 min)
7. **Compare arcs** (10 min) → Ensure continuity
8. **Generate Book 1 Chapters** (20 min)

**Result**: Series-consistent multi-book planning

---

## Tips & Best Practices

### Premise Building
- ✅ **Be specific**: "Detective with PTSD" better than "detective"
- ✅ **Show conflict**: "Must solve murder despite boss's interference"
- ✅ **Use Premium synthesis**: Claude Sonnet 4.5 adds rich detail
- ❌ Avoid vague: "Someone does something interesting"

### Story Bible Editing
- ✅ **Review character arcs**: Ensure beginning → end transformation
- ✅ **Check setting consistency**: Geography, culture, climate
- ✅ **Validate plot structure**: Beginning/middle/end clear
- ❌ Don't skip review: Story Bible is your consistency anchor

### Outline Refinement
- ✅ **Edit plot beats**: Add/remove bullet points freely
- ✅ **Adjust pacing**: Slow chapters (1500 words), fast chapters (3500 words)
- ✅ **Check subplot progression**: Each chapter advances subplots
- ❌ Don't over-plan: Leave room for AI creativity

### Chapter Generation
- ✅ **Use bulk generation**: Faster + better context management
- ✅ **Monitor quality metrics**: Check ellipses, intensifiers
- ✅ **Regenerate if needed**: Context improves with each chapter
- ❌ Don't generate out of order: Sequential generation maintains consistency

### Chat Assistant
- ✅ **Link projects**: Give Alana context about your novel
- ✅ **Use web search**: "Search for Victorian era customs"
- ✅ **Create contexts**: "Character development mode", "Plot brainstorming"
- ❌ Don't use generic prompts: Specific questions get better answers

---

## Troubleshooting

### "Story Bible generation failed"
**Solution**: Check Anthropic API key in `.env`, verify credits remaining

### "Chapter generation stops mid-sentence"
**Solution**: Normal for SSE timeout (Railway/free tier), use bulk generation for reliability

### "Characters inconsistent across chapters"
**Solution**: Regenerate Story Bible with more detail, ensure outline references character arcs

### "Prose sounds robotic"
**Solution**: Check anti-AI-tell rules in `config/anti_ai_tell_rules.md`, regenerate with rules enforced

### "MongoDB connection error"
**Solution**: Verify `MONGODB_URI` in `.env`, check MongoDB Atlas whitelist

### "Frontend won't start"
**Solution**: `npm install` again, delete `node_modules` and reinstall, check Node version (20+)

---

## Next Steps

### Learn More
1. **Documentation Index**: [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) - 50+ guides
2. **Anti-AI-Tell Rules**: [config/anti_ai_tell_rules.md](../config/anti_ai_tell_rules.md) - Writing quality
3. **Architecture**: [README.md - Architecture Snapshot](../README.md#architecture-snapshot)
4. **API Reference**: [README.md - Backend Surface Area](../README.md#backend-surface-area)

### Advanced Features
- **Custom Bots** (Phase 2): Create specialized AI assistants
- **Board of Directors** (Phase 2): Multi-bot consultation
- **A/B Testing** (Phase 3): Compare generation strategies
- **Analytics Dashboard** (Phase 4): Track writing metrics

### Join Community
- GitHub Issues: Bug reports and feature requests
- Discussions: Share workflows and tips
- Contributing: See `docs/phase-plan.md` for roadmap

---

## Quick Reference Card

**Premise Builder**: 8 steps → Premium synthesis (Claude Sonnet 4.5)  
**Story Bible**: 3500-4500 words, 30-60 seconds  
**Outline**: 9 fields per chapter, 45-90 seconds  
**Chapter Generation**: 2500-3000 words, 2-3 minutes  
**Bulk Generation**: 25 chapters, 15-30 minutes  
**Quality**: A- grade (94% publication quality)

**Models Used**:
- Claude Sonnet 4.5: Story Bible, Outline, Chapters, Chat, Book covers
- GPT-4o: Premise synthesis (baseline)
- DALL-E 3: Book cover images

**API Keys Required**: Anthropic, OpenAI (required), Tavily (optional for chat)

---

**Questions?** Check [DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md) or search docs/ folder.

**Ready to write?** Open `http://localhost:5173` and create your first project!

---

*Last Updated: November 29, 2025*  
*Maintained By: Development Team*  
*Version: 2.0*

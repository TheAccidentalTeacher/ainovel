# 🚀 Quick Start: Chat Persistence & Web Search

## What's New?

**Persistent Chats**: Your conversations now save automatically and load when you return.

**Web Search**: Enable internet search to give the AI real-world context for better responses.

## Setup (5 minutes)

### 1. Backend Configuration

**Add Tavily API Key** (Optional - enables web search)

Edit `backend/.env`:
```bash
# Get free key at https://tavily.com (1000 searches/month)
TAVILY_API_KEY=tvly-your-key-here
```

**Install Dependencies** (if not already installed)
```bash
cd backend
pip install tavily-python
```

### 2. Restart Servers

**Backend**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm run dev
```

## Usage

### Access Previous Conversations

1. Open chat widget (blue button bottom-right)
2. Your last conversation loads automatically
3. Click **☰ (List icon)** to see all conversations
4. Click any conversation to load it

### Start New Conversation

1. Click **+ (Plus icon)** in header
2. Previous chat is saved, new one begins
3. Your conversation list grows over time

### Use Web Search

1. Check **"Enable web search for additional context"**
2. Ask questions that need current information:
   - "What are current trends in YA fantasy?"
   - "Describe 1950s American diner culture"
   - "How do modern forensic teams work?"
3. AI searches 5 web sources automatically
4. Response includes web research + creative insights

### Choose AI Model

**Claude Sonnet 4.5** - Best for creative writing, dialogue, character depth
**GPT-5.1** - Best for complex plots, reasoning, analytical feedback
**GPT-4o** - Balanced, fast, general writing assistance
**GPT-4 Turbo** - Quick drafting, outlining, brainstorming
**GPT-4** - Precision edits, focused scene work

## Tips

✅ **Web search is best for**: Research, fact-checking, finding examples
✅ **Regular chat is best for**: Creative writing, editing, brainstorming
✅ **Conversations persist**: Safe to close and reopen anytime
✅ **History is searchable**: (Coming soon - manual search within chats)

## Troubleshooting

**Conversations not loading?**
- Check MongoDB connection in backend terminal
- Clear browser localStorage: F12 → Console → `localStorage.clear()`

**Web search not working?**
- Verify `TAVILY_API_KEY` in `backend/.env`
- Restart backend server
- Check "Enable web search" checkbox is checked

**Chat seems slow?**
- Web search adds 2-5 seconds (searches 5 websites)
- Disable web search for faster responses
- Use GPT-4 Turbo for speed

## Examples

### Example 1: Research Historical Setting
```
✅ Enable web search
💬 "What was daily life like for coal miners in 1900s Wales?"
🤖 AI searches web → Finds historical articles → Creative response
```

### Example 2: Continue Writing Session
```
💬 Day 1: Discuss plot outline
💬 Day 2: Reopen chat widget → Last conversation loads
💬 Continue: "Let's develop the antagonist's motivation"
```

### Example 3: Switch Between Projects
```
💬 Book 1 chat: Fantasy world-building
☰ Click List → See all conversations
💬 Book 2 chat: Mystery novel plotting
```

## Documentation

📖 **Full Guide**: `docs/CHAT_PERSISTENCE_AND_WEB_SEARCH.md`
📋 **Summary**: `docs/CHAT_PERSISTENCE_SUMMARY.md`

---

**Questions?** Check the full documentation or backend logs for detailed errors.

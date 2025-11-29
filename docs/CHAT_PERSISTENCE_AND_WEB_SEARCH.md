# Chat Persistence and Web Search Feature Documentation

## Overview

The chatbot now supports **persistent conversations** and **web search capabilities** to enhance the writing assistant experience.

## Features

### 1. Persistent Conversations

#### How It Works
- Conversations are automatically saved to MongoDB with every message
- The last active conversation is stored in browser localStorage
- When reopening the chat widget, the last conversation automatically loads
- Users can view conversation history and switch between chats

#### UI Components

**Conversation History List**
- Click the **List icon** (☰) in the header to view all conversations
- Shows conversation title, date, and message count
- Click any conversation to load it
- Current conversation is highlighted

**New Chat Button**
- Click the **Plus icon** (+) in the header to start a new conversation
- Clears current messages and creates fresh conversation on next message

**Persistence Mechanism**
```typescript
// localStorage key format
`chat_conversation_${userId}`

// Stored value: conversation ID (UUID)
```

#### Backend Endpoints Used
- `GET /api/chat/conversations` - List user's conversations
- `GET /api/chat/conversations/{id}` - Load specific conversation with full message history
- `POST /api/chat/conversations` - Create new conversation

### 2. Web Search Integration

#### Purpose
Allows the AI to search the internet for additional context before responding. Useful for:
- **Research**: Facts, historical events, technical details
- **Current Information**: Recent developments, news, trends
- **Examples**: Finding real-world examples for writing inspiration
- **Fact-Checking**: Verifying details in manuscripts

#### How to Use

**Toggle Web Search**
- Checkbox in chat header: "Enable web search for additional context"
- When enabled, AI searches the web before responding to your question
- Search results are included in AI's context automatically

#### How It Works

**Backend Flow**
1. User sends message with web search enabled
2. Backend extracts last user message as search query
3. Calls Tavily API to search the web (5 results, basic depth)
4. Formats search results as context prepended to conversation
5. AI model receives: search results + conversation history + user question
6. Streams response back to frontend

**Search Service** (`backend/services/search_service.py`)
```python
search_results = await search_service.search(
    query="user's question",
    max_results=5,
    search_depth="basic"  # or "advanced"
)
```

**Response Format**
```python
{
    "success": True,
    "query": "search query",
    "answer": "Quick answer if available",
    "results": [
        {
            "title": "Article Title",
            "url": "https://...",
            "content": "Relevant excerpt...",
            "score": 0.95
        }
    ]
}
```

#### Tavily API Setup

**1. Get API Key**
- Visit https://tavily.com
- Sign up for free account
- Copy your API key

**2. Add to Environment**
```bash
# backend/.env
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx
```

**3. Restart Backend**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

#### API Integration

**Frontend Request**
```typescript
const response = await fetch(
  `http://localhost:8000/api/chat/conversations/${conversationId}/messages?model=${selectedModel}&web_search=${webSearchEnabled}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: userMessage }),
  }
);
```

**Backend Endpoint**
```python
@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str, 
    request: SendMessageRequest,
    model: str = Query("claude-sonnet-4-20250514"),
    web_search: bool = Query(False)  # New parameter
)
```

### 3. Model Selection Enhancement

**Available Models**
- **Claude Sonnet 4.5** (200k context) - Creative writing, dialogue, character development
- **GPT-5.1** (200k context) - Advanced reasoning, complex plots, analytical feedback
- **GPT-4o** (128k context) - Balanced all-rounder, fast responses
- **GPT-4 Turbo** (128k context) - Fast drafting, outlining
- **GPT-4** (8k context) - Precision edits, focused tasks

**Model Descriptions**
Each model now includes detailed descriptions explaining:
- Strengths and use cases
- Context window size
- Best applications for novel writing

## Technical Architecture

### Frontend Changes

**ChatWidget.tsx**
```typescript
// State additions
const [webSearchEnabled, setWebSearchEnabled] = useState(false);
const [showConversationList, setShowConversationList] = useState(false);
const [conversationId, setConversationId] = useState<string | null>(() => {
  return localStorage.getItem(`chat_conversation_${userId}`) || null;
});

// New query: List conversations
const { data: conversationsListData } = useQuery({
  queryKey: ['conversations', userId, projectId],
  queryFn: () => chatApi.listConversations(userId, projectId, 50, 0),
});
```

### Backend Changes

**search_service.py** (NEW)
- `SearchService` class with Tavily integration
- `search(query, max_results, search_depth)` - Perform web search
- `format_context(search_results)` - Format results for AI context
- Error handling for missing API key, timeouts, HTTP errors

**chat_service.py**
```python
async def stream_response(
    self,
    conversation_id: str,
    project_id: Optional[str] = None,
    model: str = "claude-sonnet-4-20250514",
    web_search_enabled: bool = False  # New parameter
) -> AsyncGenerator[str, None]:
```

**Context Building**
```python
async def _build_context(
    self,
    conversation_id: str,
    messages: List[Message],
    search_context: str = ""  # New parameter
) -> List[Dict[str, str]]:
```

Search context is prepended to last user message:
```
=== WEB SEARCH RESULTS ===
Quick Answer: ...

Sources:
1. Article Title
   URL: https://...
   Excerpt...

=== END SEARCH RESULTS ===

User Question: [original question]
```

## Database Schema

### Conversations Collection
```javascript
{
  "id": "uuid-v4",
  "user_id": "alana",
  "project_id": "optional-project-id",
  "bot_id": null,  // For future custom bots
  "title": "Generated from first message",
  "message_count": 15,
  "total_tokens": 12500,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T01:30:00Z",
  "last_message_at": "2025-01-01T01:30:00Z"
}
```

### Messages Collection
```javascript
{
  "id": "uuid-v4",
  "conversation_id": "parent-conversation-id",
  "role": "user" | "assistant",
  "content": "message text",
  "timestamp": "2025-01-01T00:00:00Z",
  "token_count": 125,
  "model": "claude-sonnet-4-20250514"
}
```

## User Workflow Examples

### Example 1: Resume Previous Conversation
1. User opens chat widget
2. Last conversation automatically loads from localStorage
3. User continues where they left off
4. All previous context is maintained

### Example 2: Research Historical Setting
1. User enables "Web search" checkbox
2. User asks: "What was daily life like in 1920s Paris for artists?"
3. AI searches web for articles about 1920s Parisian art scene
4. AI responds with context from search results + creative insights
5. User gets factually accurate + creatively enhanced response

### Example 3: Switch Between Projects
1. User has multiple book projects
2. Each project has separate conversation threads
3. User views conversation list (List icon)
4. Clicks conversation for specific project
5. Loads that project's context and history

### Example 4: Start Fresh Research
1. User clicks "New Chat" (+ icon)
2. Previous conversation is saved but cleared from view
3. User starts new research topic with clean slate
4. Can return to previous conversations via List button

## Configuration

### Environment Variables

**Required (Existing)**
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MONGODB_URI=mongodb+srv://...
```

**Optional (New)**
```bash
# Web search API key (free tier available)
TAVILY_API_KEY=tvly-...
```

### Feature Flags

Web search works without API key but returns error message:
```json
{
  "success": false,
  "error": "Web search is not configured. Set TAVILY_API_KEY environment variable.",
  "results": []
}
```

## Performance Considerations

### Web Search
- **Timeout**: 10 seconds per search
- **Rate Limits**: Tavily free tier - 1000 searches/month
- **Response Time**: Adds 2-5 seconds to initial response
- **Context Size**: ~500-1500 tokens per search (5 results)

### Conversation Loading
- **First Load**: 50 conversations fetched
- **Pagination**: Not yet implemented (roadmap item)
- **Message History**: Full history loaded per conversation
- **Cache**: TanStack Query caches results (5min default)

## Error Handling

### Missing API Key
```
User enables web search → Backend returns error message
→ AI responds without web context but shows warning
```

### Search Timeout
```
Search request takes >10s → Timeout error
→ AI responds with conversation context only
```

### Network Errors
```
Tavily API unreachable → Error logged
→ AI continues with local context
```

## Future Enhancements (Roadmap)

### Conversation Management
- [ ] Rename conversations
- [ ] Delete conversations
- [ ] Search within conversations
- [ ] Export conversation to document
- [ ] Pagination for conversation list (50+ convos)

### Web Search
- [ ] Display search results in UI (collapsible cards)
- [ ] Manual search trigger (slash command: `/search query`)
- [ ] Advanced search depth toggle
- [ ] Search history
- [ ] Source citations in AI response

### Multi-Bot Support
- [ ] Custom bots with different personalities
- [ ] Bot-specific conversation threads
- [ ] Bot avatar and descriptions

## Testing

### Manual Testing Checklist

**Persistence**
- [x] Last conversation loads on page refresh
- [x] New chat creates fresh conversation
- [x] Switching conversations updates messages
- [x] localStorage syncs with active conversation

**Web Search**
- [x] Checkbox enables/disables search
- [x] Search results enhance AI responses
- [x] Works with all model selections
- [x] Graceful degradation without API key

**UI/UX**
- [x] List button shows conversation history
- [x] Plus button starts new chat
- [x] Conversation list scrollable
- [x] Current conversation highlighted

## Troubleshooting

### Conversations Not Loading
1. Check MongoDB connection in backend logs
2. Verify `MONGODB_URI` in `.env`
3. Check browser console for API errors
4. Clear localStorage: `localStorage.clear()`

### Web Search Not Working
1. Verify `TAVILY_API_KEY` in `.env`
2. Check backend logs for search errors
3. Test API key: `curl -X POST https://api.tavily.com/search -d '{"api_key":"tvly-...","query":"test"}'`
4. Ensure backend restarted after adding key

### Empty Conversation List
1. Conversations only appear after first message sent
2. Check `user_id` matches between sessions
3. Verify MongoDB collection `conversations` exists
4. Check query parameters in browser network tab

## API Reference

### List Conversations
```http
GET /api/chat/conversations?user_id=alana&limit=50&offset=0
```

### Get Conversation
```http
GET /api/chat/conversations/{conversation_id}
```

### Send Message with Web Search
```http
POST /api/chat/conversations/{conversation_id}/messages?model=gpt-5.1&web_search=true
Content-Type: application/json

{
  "content": "What was the impact of WWI on modernist literature?"
}
```

### Get Available Models
```http
GET /api/chat/models
```

## Dependencies

### Backend (requirements.txt)
```
tavily-python>=0.3.0  # NEW
httpx>=0.25.2
anthropic>=0.7.7
openai>=1.3.7
```

### Frontend (package.json)
```json
{
  "lucide-react": "^0.263.1",  // Added List, Plus icons
  "@tanstack/react-query": "^5.90.0"
}
```

## Security Notes

- **API Keys**: Never commit `.env` file to Git
- **User ID**: Hardcoded as "alana" - implement proper auth later
- **Search Results**: Tavily filters unsafe content automatically
- **Rate Limiting**: Not yet implemented - production TODO

## Support

For issues or questions:
1. Check backend logs: `backend/logs/` (if configured)
2. Check browser console: F12 → Console tab
3. Verify environment variables: `.env` file
4. Test API endpoints: Postman or curl

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
**Status**: Production-ready for local development

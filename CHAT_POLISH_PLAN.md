# Chat Polish Implementation Plan

## Changes Needed:

### 1. Frontend State (ChatWidget.tsx)
- ✅ Add Edit2, Trash2, Check, XCircle icons (DONE)
- ✅ Add renamingConversationId state (DONE - but duplicated, needs cleanup)
- ✅ Add renameTitle state (DONE - but duplicated, needs cleanup)
- ✅ Add searchType state (DONE - but duplicated, needs cleanup)
- ⚠️ Remove duplicate state declarations
- ⚠️ Add rename and delete mutations after conversation list query

### 2. Conversation List UI
- Add inline rename (click edit → inline input → save/cancel)
- Add delete button with confirmation
- Show hover actions (edit/delete icons)

### 3. Search Results Enhancement
- Display images inline (not just links)
- Add search type badges to messages
- Show which search method was used

### 4. Message Display
- Add "Searched: News" / "Searched: Images" / "Searched: Research" badges
- Display inline images from search results

## Implementation Order:

1. Fix duplicate state variables
2. Add rename/delete mutations  
3. Update conversation list UI with actions
4. Add search type tracking
5. Display images in search results
6. Add search type badges to messages

## Files to Modify:
- frontend/src/components/ChatWidget.tsx (primary changes)
- backend/services/chat_service.py (track search type in SSE)

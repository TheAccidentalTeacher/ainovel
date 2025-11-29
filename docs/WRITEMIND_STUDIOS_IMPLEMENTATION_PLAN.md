# WriteMind Studios - Complete Implementation Plan

**Brand Selected**: WriteMind Studios  
**Tagline**: "Extend Your Creative Mind"  
**Date**: November 29, 2025  
**Status**: Planning Phase

---

## 🎯 Brand Identity Summary

### Core Philosophy
WriteMind Studios extends the writer's creative mind through intelligent tools—not replacing creativity, but amplifying it through:
- **Memory Extension**: AI remembers entire story universes
- **Context Awareness**: Different projects, different contexts, different needs
- **Cognitive Partnership**: Think together, not think for you
- **Studio Professionalism**: High-quality tools for serious authors

### Visual Identity
- **Primary Colors**: 
  - Purple `#7C3AED` (violet-600) - Creativity, wisdom, intelligence
  - Studio White `#FFFFFF` - Clean, professional workspace
  - Idea Yellow `#FCD34D` (amber-300) - Inspiration, highlights
- **Secondary Colors**:
  - Deep Purple `#5B21B6` (violet-700) - Depth, seriousness
  - Light Purple `#C4B5FD` (violet-300) - Softness, accessibility
  - Charcoal `#1F2937` (gray-800) - Text, grounding
- **Typography**:
  - Headers: Inter (modern, intelligent, accessible)
  - Body: System fonts (performance, native feel)
  - Code/Technical: Fira Code (when needed)

---

## 📐 Phase 1.5: Layout Transformation (Weeks 1-2)

### Objective
Transform floating chat widget into full-screen application with persistent sidebar and navigation header.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [WriteMind] Studio  [Novel Studio] [Covers] [Bots] [Research] [Profile] │ ← Navigation Header (64px)
├────────────┬────────────────────────────────────────────────────────────┤
│            │                                                             │
│ CONTEXTS   │  Main Content Area (Chat / Novel Studio / etc.)           │
│ ─────────  │                                                             │
│ 📖 Romance │  Full-height, responsive                                   │
│ 🚀 Sci-Fi  │  Component rendered based on route                         │
│ 🔪 Thriller│                                                             │
│ + New      │  [Route-specific content here]                             │
│            │                                                             │
│ PROJECTS   │                                                             │
│ ─────────  │                                                             │
│ Leviathan  │                                                             │
│ Dark Manor │  ← Info Panel (collapsible, draggable width)              │
│            │  ┌─────────────────────────────────┐                      │
│ CONVOS     │  │ Active: Leviathan Rising        │                      │
│ ─────────  │  │ Chapters: 12 │ Words: 45,231   │                      │
│ Nov 29     │  │ [Open in Novel Studio]          │                      │
│ Nov 28     │  └─────────────────────────────────┘                      │
│ Nov 27     │                                                             │
└────────────┴────────────────────────────────────────────────────────────┘
  Sidebar          Main + Info Panel (with drag handle)
  (280px fixed)    (Flexible: 60/40 split default, user-resizable)
```

### Component Architecture

```typescript
src/
├── layouts/
│   └── AppLayout.tsx              // Main layout wrapper (header + sidebar + content)
│
├── components/
│   ├── navigation/
│   │   ├── NavigationHeader.tsx   // Top nav bar
│   │   └── UserMenu.tsx           // Profile dropdown
│   │
│   ├── sidebar/
│   │   ├── Sidebar.tsx            // Container (280px fixed)
│   │   ├── ContextSection.tsx     // Context list + create
│   │   ├── ProjectSection.tsx     // Project list
│   │   └── ConversationSection.tsx // Conversation history
│   │
│   ├── info-panel/
│   │   ├── InfoPanel.tsx          // Collapsible right panel
│   │   ├── DragHandle.tsx         // Resize handle component
│   │   ├── ProjectCard.tsx        // Project details display
│   │   └── QuickActions.tsx       // Action buttons
│   │
│   └── chat/
│       ├── ChatInterface.tsx      // Refactored from ChatWidget
│       ├── MessageList.tsx        // Message display
│       ├── MessageInput.tsx       // Input + attachments
│       ├── SearchResults.tsx      // Web search display
│       └── ContextChips.tsx       // Active context badges
│
├── pages/
│   ├── ChatPage.tsx               // Route: / (new home)
│   ├── StudioPage.tsx             // Route: /studio (current novel gen)
│   ├── CoversPage.tsx             // Route: /covers (future)
│   └── BotsPage.tsx               // Route: /bots (Phase 2)
│
└── hooks/
    ├── useResizablePanel.ts       // Drag-to-resize logic
    ├── useContexts.ts             // Context CRUD
    └── useProjectLink.ts          // Project integration
```

---

## 🗄️ Database Schema Updates

### New Collection: `contexts`

```javascript
{
  _id: ObjectId("..."),
  user_id: "user_123",              // Owner
  name: "Science Fiction Projects", // User-defined name
  icon: "🚀",                        // Optional emoji
  color: "#3B82F6",                  // Hex color for visual distinction
  system_prompt: "You are helping with science fiction writing. Focus on worldbuilding, scientific plausibility, and speculative concepts.", // Context-specific AI behavior
  created_at: ISODate("2025-11-29T10:00:00Z"),
  updated_at: ISODate("2025-11-29T10:00:00Z"),
  conversation_count: 5,             // Denormalized for quick display
  last_used: ISODate("2025-11-29T10:00:00Z") // For sorting
}
```

**Indexes**:
- `{ user_id: 1, last_used: -1 }` - User's contexts sorted by recent use
- `{ user_id: 1, name: 1 }` - Alphabetical sorting

### Updated Collection: `conversations`

```javascript
{
  _id: ObjectId("..."),
  user_id: "user_123",
  context_id: "ctx_scifi_001",      // NEW: Link to context
  project_id: "proj_leviathan",     // EXISTING: Optional novel project
  bot_id: null,                      // NEW: For Phase 2 (custom bots)
  title: "Character Development",
  message_count: 24,
  created_at: ISODate("2025-11-29T10:00:00Z"),
  updated_at: ISODate("2025-11-29T10:00:00Z")
}
```

**Indexes**:
- Add: `{ context_id: 1, updated_at: -1 }` - Context's conversations by recency
- Existing: `{ user_id: 1, updated_at: -1 }` remains

### Updated Collection: `projects`

```javascript
{
  _id: ObjectId("..."),
  user_id: "user_123",
  title: "Leviathan Rising",
  genre: "science-fiction",
  // ... existing fields ...
  
  // NEW: Chat summary for context loading
  chat_summary: {
    outline_summary: "Climate-changed future, ocean colonization, corporate warfare...",
    character_summaries: [
      "Captain Sarah Chen (38, former Navy, pragmatic leader)",
      "Dr. Marcus Wei (45, marine biologist, ethical conflicts)"
    ],
    plot_summary: "Corporation discovers sentient marine life, conflict over exploitation vs. preservation",
    themes: ["environmental ethics", "corporate power", "human evolution"],
    chapter_count: 12,
    word_count: 45231,
    last_chapter: "Chapter 12: The Deep",
    generated_at: ISODate("2025-11-29T10:00:00Z")
  }
}
```

**Background Job**: Regenerate `chat_summary` when project updated (outline changes, characters added, etc.)

### New Collection: `bots` (Phase 2)

```javascript
{
  _id: ObjectId("..."),
  user_id: "user_123",
  name: "Editor Bot",
  icon: "✏️",
  color: "#10B981",                  // Green for editing
  expertise: ["editing", "grammar", "style", "pacing"],
  system_prompt: "You are an expert fiction editor. Focus on...",
  knowledge_files: [                 // Uploaded references
    {
      file_id: "file_001",
      filename: "elements_of_style.txt",
      uploaded_at: ISODate("...")
    }
  ],
  created_at: ISODate("..."),
  usage_count: 47
}
```

---

## 🔌 Backend API Endpoints

### Context Management (`/api/contexts`)

```python
POST   /api/contexts              # Create new context
GET    /api/contexts              # List user's contexts (sorted by last_used)
GET    /api/contexts/:id          # Get single context details
PATCH  /api/contexts/:id          # Update (name, color, system_prompt)
DELETE /api/contexts/:id          # Delete + unlink conversations
GET    /api/contexts/:id/conversations  # Conversations in this context
```

**Request/Response Examples**:

```json
// POST /api/contexts
{
  "name": "Romance Novels",
  "icon": "💕",
  "color": "#EC4899",
  "system_prompt": "You are helping write romance fiction. Focus on emotional beats, character chemistry, and satisfying HEA endings."
}

// Response
{
  "id": "ctx_romance_001",
  "user_id": "user_123",
  "name": "Romance Novels",
  "icon": "💕",
  "color": "#EC4899",
  "system_prompt": "You are helping write romance fiction...",
  "conversation_count": 0,
  "created_at": "2025-11-29T10:00:00Z",
  "last_used": "2025-11-29T10:00:00Z"
}
```

### Project Summaries (`/api/projects/:id/summary`)

```python
GET    /api/projects/:id/summary  # Get chat-friendly project summary
POST   /api/projects/:id/summary  # Regenerate summary (admin/background job)
```

**Response Example**:

```json
{
  "project_id": "proj_leviathan",
  "title": "Leviathan Rising",
  "genre": "science-fiction",
  "summary": {
    "outline": "Climate-changed future where ocean colonization...",
    "characters": [
      {
        "name": "Captain Sarah Chen",
        "age": 38,
        "role": "Protagonist",
        "description": "Former Navy officer, pragmatic leader, haunted by past decisions",
        "arc": "From duty-bound soldier to questioning corporate authority"
      }
    ],
    "themes": ["environmental ethics", "corporate power", "human adaptation"],
    "stats": {
      "chapters": 12,
      "words": 45231,
      "last_chapter": "Chapter 12: The Deep"
    }
  },
  "generated_at": "2025-11-29T10:00:00Z"
}
```

### Updated Chat Endpoint

```python
POST   /api/chat/conversations/:id/messages
```

**New Request Body**:

```json
{
  "content": "Help me develop the antagonist's motivation",
  "context_id": "ctx_scifi_001",     // Load context system prompt
  "project_id": "proj_leviathan",    // Load project summary
  "web_search_enabled": true,
  "attached_files": []                // Future: file uploads
}
```

**Backend Processing**:
1. Load context system prompt → prepend to messages
2. If project_id: Load project summary → inject as system message
3. Construct full prompt: `[Context Prompt] + [Project Summary] + [Conversation History] + [User Message]`
4. Stream response via SSE

---

## 🎨 Frontend Implementation Details

### 1. Navigation Header Component

**File**: `src/components/navigation/NavigationHeader.tsx`

```tsx
interface NavigationHeaderProps {
  currentRoute: string;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({ currentRoute }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Logo + Brand */}
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-violet-600" />
        <span className="text-xl font-semibold text-gray-900">
          WriteMind <span className="text-violet-600">Studios</span>
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex items-center gap-6">
        <NavLink to="/" active={currentRoute === '/'}>
          <MessageCircle className="w-5 h-5" />
          Chat
        </NavLink>
        <NavLink to="/studio" active={currentRoute === '/studio'}>
          <BookOpen className="w-5 h-5" />
          Novel Studio
        </NavLink>
        <NavLink to="/covers" active={currentRoute === '/covers'}>
          <Image className="w-5 h-5" />
          Covers
        </NavLink>
        <NavLink to="/bots" active={currentRoute === '/bots'}>
          <Bot className="w-5 h-5" />
          Bots
        </NavLink>
      </nav>

      {/* User Menu */}
      <UserMenu />
    </header>
  );
};
```

**Styling**: Fixed height 64px, white background, subtle border, flex layout

---

### 2. Sidebar Component

**File**: `src/components/sidebar/Sidebar.tsx`

```tsx
export const Sidebar: React.FC = () => {
  const { contexts, createContext } = useContexts();
  const { projects } = useProjects();
  const { conversations } = useConversations();

  return (
    <aside className="w-[280px] bg-gray-50 border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Contexts Section */}
      <ContextSection contexts={contexts} onCreate={createContext} />

      {/* Projects Section */}
      <ProjectSection projects={projects} />

      {/* Conversations Section */}
      <ConversationSection conversations={conversations} />
    </aside>
  );
};
```

**Layout**:
- Fixed width: 280px
- Full height: `h-full`
- Overflow: Each section scrolls independently
- Background: Light gray (`bg-gray-50`)

**Sections**:
1. **Contexts** (top): Create new, switch active, color-coded
2. **Projects** (middle): Recent projects, quick open
3. **Conversations** (bottom, scrollable): Grouped by date

---

### 3. Resizable Info Panel

**File**: `src/components/info-panel/InfoPanel.tsx`

```tsx
interface InfoPanelProps {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  initialWidth = 400,
  minWidth = 300,
  maxWidth = 600
}) => {
  const [width, setWidth] = useState(initialWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDragStart = () => setIsDragging(true);
  
  const handleDrag = (e: MouseEvent) => {
    if (!isDragging) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', () => setIsDragging(false));
      return () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', () => setIsDragging(false));
      };
    }
  }, [isDragging]);

  if (isCollapsed) {
    return (
      <button 
        onClick={() => setIsCollapsed(false)}
        className="w-8 bg-gray-100 border-l border-gray-200 flex items-center justify-center"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600" />
      </button>
    );
  }

  return (
    <div 
      className="bg-white border-l border-gray-200 flex flex-col relative"
      style={{ width: `${width}px` }}
    >
      {/* Drag Handle */}
      <div
        onMouseDown={handleDragStart}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500 bg-gray-300 transition-colors"
      />

      {/* Collapse Button */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
      >
        <ChevronRight className="w-4 h-4 text-gray-600" />
      </button>

      {/* Content */}
      <div className="p-4 overflow-y-auto">
        {/* Project details, quick actions, etc. */}
      </div>
    </div>
  );
};
```

**Features**:
- **Draggable**: Left edge drag handle (1px wide, expands to 4px on hover)
- **Collapsible**: Chevron button collapses to thin strip (8px)
- **Constraints**: Min 300px, max 600px width
- **Visual Feedback**: Handle changes color on hover (violet-500)
- **Persistence**: Save width to localStorage

---

### 4. Context Chips (Active Context Display)

**File**: `src/components/chat/ContextChips.tsx`

```tsx
interface ContextChipsProps {
  activeContext?: Context;
  activeProject?: Project;
  activeBot?: Bot;
  onRemoveContext: () => void;
  onRemoveProject: () => void;
  onRemoveBot: () => void;
}

export const ContextChips: React.FC<ContextChipsProps> = ({
  activeContext,
  activeProject,
  activeBot,
  onRemoveContext,
  onRemoveProject,
  onRemoveBot
}) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 border-b border-violet-200">
      {/* Context Chip */}
      {activeContext && (
        <div 
          className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
          style={{ backgroundColor: activeContext.color + '20', color: activeContext.color }}
        >
          <span>{activeContext.icon}</span>
          <span>{activeContext.name}</span>
          <button onClick={onRemoveContext} className="hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Project Chip */}
      {activeProject && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
          <BookOpen className="w-3 h-3" />
          <span>{activeProject.title}</span>
          <button onClick={onRemoveProject} className="hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Bot Chip (Phase 2) */}
      {activeBot && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium">
          <Bot className="w-3 h-3" />
          <span>{activeBot.name}</span>
          <button onClick={onRemoveBot} className="hover:opacity-70">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
```

**Display**: Below header, above chat messages, colored by context

---

### 5. Routing Structure

**File**: `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { ChatPage } from './pages/ChatPage';
import { StudioPage } from './pages/StudioPage';
import { CoversPage } from './pages/CoversPage';
import { BotsPage } from './pages/BotsPage';

function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/covers" element={<CoversPage />} />
          <Route path="/bots" element={<BotsPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
```

**AppLayout** wraps all routes, providing:
- Navigation header (always visible)
- Sidebar (always visible, collapses on mobile)
- Info panel (route-dependent visibility)

---

## 🎭 Phase 2: Bot Framework (Weeks 3-4)

### Bot Creation Flow

**Route**: `/bots`

**UI**: Bot management dashboard

```
┌─────────────────────────────────────────────────┐
│ My Bots                          [+ Create Bot] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │ ✏️ Editor  │  │ 📊 Plot    │  │ 👤 Character││
│  │ Bot        │  │ Doctor     │  │ Developer  ││
│  │            │  │            │  │            ││
│  │ 47 uses    │  │ 23 uses    │  │ 31 uses    ││
│  └────────────┘  └────────────┘  └────────────┘│
│                                                 │
└─────────────────────────────────────────────────┘
```

**Create Bot Modal**:
1. Name + Icon picker
2. Color selection
3. Expertise tags (multi-select)
4. System prompt textarea (with templates)
5. Knowledge upload (optional)
6. Save → bot available in chat sidebar

### Bot Switcher in Chat

**Sidebar Addition**:

```
BOTS
─────────
✏️ Editor Bot
📊 Plot Doctor
👤 Character Dev
+ Create New
```

**Click bot** → Active in chat → Context chips show bot active

---

## 🎨 Visual Design System

### Tailwind Configuration

**File**: `tailwind.config.cjs`

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F5F3FF',   // Lightest purple
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',  // Light purple
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',  // Primary purple
          700: '#6D28D9',
          800: '#5B21B6',  // Deep purple
          900: '#4C1D95',
        },
        idea: {
          300: '#FCD34D',  // Idea yellow
          400: '#FBBF24',
          500: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
};
```

### Component Styling Patterns

**Buttons**:
```tsx
// Primary action
className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"

// Secondary action
className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg font-medium transition-colors"

// Context-colored action
style={{ backgroundColor: context.color }} className="text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
```

**Cards**:
```tsx
className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
```

**Sidebar Sections**:
```tsx
className="px-4 py-3 border-b border-gray-200"
```

---

## 📱 Responsive Design

### Breakpoints

- **Mobile** (< 768px): Sidebar collapses to hamburger menu, info panel hidden
- **Tablet** (768px - 1024px): Sidebar 240px, info panel as bottom sheet
- **Desktop** (> 1024px): Full layout (280px sidebar, resizable info panel)

### Mobile Adjustments

```tsx
// Sidebar (mobile)
<aside className="fixed inset-0 z-50 bg-gray-900 bg-opacity-50 md:hidden">
  <div className="w-64 h-full bg-white shadow-xl">
    {/* Sidebar content */}
  </div>
</aside>

// Hamburger Menu
<button className="md:hidden p-2" onClick={toggleSidebar}>
  <Menu className="w-6 h-6" />
</button>
```

---

## 🧪 Testing Strategy

### Unit Tests
- Context CRUD operations
- Drag-to-resize logic
- Context chip rendering
- Project summary formatting

### Integration Tests
- Context switching updates conversation list
- Project linking loads summary into chat
- Bot activation changes system prompt
- Drag handle respects min/max width

### E2E Tests (Playwright)
- Create context → start conversation → verify context in message
- Link project → verify summary in chat → generate chapter
- Create bot → activate in chat → verify specialized response
- Resize info panel → refresh page → verify width persists

---

## 📦 Deployment Checklist

### Environment Variables

```bash
# Backend .env
DATABASE_URL=mongodb://localhost:27017/writemind_studios
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
JWT_SECRET=...

# Frontend .env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=WriteMind Studios
```

### Database Migrations

1. Create `contexts` collection + indexes
2. Add `context_id` field to `conversations` collection
3. Add `bot_id` field to `conversations` collection
4. Add `chat_summary` to `projects` collection
5. Create `bots` collection + indexes (Phase 2)

**Migration Script**: `backend/migrations/001_add_contexts.py`

```python
async def migrate():
    db = get_database()
    
    # Create contexts collection
    await db.create_collection('contexts')
    await db.contexts.create_index([('user_id', 1), ('last_used', -1)])
    await db.contexts.create_index([('user_id', 1), ('name', 1)])
    
    # Update conversations schema
    await db.conversations.update_many(
        {},
        {'$set': {'context_id': None, 'bot_id': None}}
    )
    await db.conversations.create_index([('context_id', 1), ('updated_at', -1)])
    
    print("✅ Migration complete")
```

### Build Process

```bash
# Frontend build
cd frontend
npm run build

# Backend (no build needed, Python)
cd backend
# Verify dependencies
pip list
```

### Docker Compose Updates

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - DATABASE_URL=mongodb://mongo:27017/writemind_studios
    ports:
      - "8000:8000"
  
  frontend:
    build: ./frontend
    environment:
      - VITE_API_URL=http://localhost:8000
      - VITE_APP_NAME=WriteMind Studios
    ports:
      - "5173:5173"
  
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## 🗓️ Implementation Timeline

### Week 1: Core Layout
- **Day 1-2**: NavigationHeader + AppLayout structure
- **Day 3-4**: Sidebar component (contexts, projects, conversations)
- **Day 5**: Routing setup + basic ChatPage

### Week 2: Advanced Features
- **Day 1-2**: Resizable InfoPanel with drag handle
- **Day 3**: Context CRUD (backend + frontend)
- **Day 4**: Project linking + summary generation
- **Day 5**: Testing + bug fixes

### Week 3: Bot Framework (Phase 2)
- **Day 1-2**: Bot database schema + API endpoints
- **Day 3-4**: Bot creation UI + management dashboard
- **Day 5**: Bot switcher in chat

### Week 4: Polish & Launch
- **Day 1-2**: Knowledge upload for bots
- **Day 3**: Board of Directors mode (multi-bot)
- **Day 4**: Performance optimization
- **Day 5**: Final testing + deployment

---

## 🚀 Success Metrics

### Phase 1.5 Complete When:
- ✅ Full-screen layout with persistent sidebar
- ✅ Navigation header with route switching
- ✅ Context system CRUD operations working
- ✅ Project linking loads summaries into chat
- ✅ Info panel draggable and collapsible
- ✅ Mobile responsive (sidebar collapses)
- ✅ All existing chat features preserved

### Phase 2 Complete When:
- ✅ Bot creation wizard functional
- ✅ Bot switcher in sidebar working
- ✅ Knowledge upload for bots operational
- ✅ Board of Directors multi-bot mode MVP
- ✅ Custom bots provide specialized feedback

---

## 📚 Documentation Updates Needed

### User-Facing
- Welcome tour for new layout
- Context system guide
- Bot creation tutorial
- Project linking how-to

### Developer
- Component API documentation
- Database schema reference
- API endpoint documentation
- Deployment guide updates

---

## 🔒 Security Considerations

### Context Isolation
- Ensure user A cannot access user B's contexts
- Validate context_id belongs to user on all API calls

### Bot Security
- Sanitize uploaded knowledge files
- Limit bot knowledge file size (10MB per file, 50MB total)
- Scan for malicious content before processing

### Project Summaries
- Regenerate summaries in background job (not user-blocking)
- Cache summaries, invalidate on project updates

---

## 💡 Future Enhancements (Post-Launch)

1. **Context Templates**: Pre-built contexts for common genres
2. **Context Sharing**: Export/import contexts between users
3. **Bot Marketplace**: Share custom bots with community
4. **Collaboration**: Multi-user conversations in same context
5. **Voice Input**: Dictate messages, bot responds via audio
6. **Mobile Apps**: Native iOS/Android apps
7. **Integrations**: Export to Scrivener, Google Docs, Word
8. **Analytics**: Writing stats per context (words/day, chapters completed)

---

## ✅ Next Steps

1. **Review this plan** with stakeholders (you + Alana)
2. **Create GitHub Issues** for each major component
3. **Set up project board** (Kanban: To Do / In Progress / Done)
4. **Begin Week 1 implementation** (NavigationHeader + AppLayout)
5. **Schedule daily standups** to track progress

**Ready to start building?** Let's transform the floating widget into WriteMind Studios! 🧠✨

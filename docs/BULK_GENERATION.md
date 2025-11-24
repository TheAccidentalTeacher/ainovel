# Bulk Generation Feature

## Overview
The bulk generation feature allows sequential generation of all chapters in a project with real-time progress tracking, automatic context management, and summary creation.

## Architecture

### Backend: Sequential Chapter Orchestration
**File**: `backend/api/bulk_generation.py`

**Endpoint**: `GET /api/projects/bulk/{project_id}/generate-all`

**Process Flow**:
1. **Validation**: Checks project has premise, outline, and (optionally) Story Bible
2. **Sequential Loop**: Iterates through all outline chapters in order
3. **Context Assembly**: For each chapter, fetches:
   - Previous chapters (full text)
   - Previous summaries (300-400 words each)
   - Story Bible (if available)
4. **Chapter Generation**: Uses `generate_chapter_from_outline()` with full context
5. **Auto-Summary**: After each chapter (except last), generates summary for future context
6. **Progress Streaming**: Emits SSE events at each step

**SSE Event Types**:
```typescript
// Chapter lifecycle
chapter_started: { chapter_index: number, title: string }
chapter_complete: { chapter_index: number, word_count: number, chapter_id: string }
chapter_skipped: { chapter_index: number, reason: 'already_exists' }

// Summary lifecycle
summary_complete: { chapter_index: number, summary_id: string }
summary_error: { chapter_index: number, error: string }

// Error handling
error: { chapter_index: number, error: string }
fatal_error: { error: string }

// Completion
complete: { total_chapters: number, total_words: number }
```

**Context Management**:
- Uses `context_builder.py` to assemble optimal context for each chapter
- Story Bible provides canonical character/setting/theme reference
- Recent chapters (last 2) included as full text for style/voice matching
- Older chapters included as summaries (300-400 words) to track plot without token bloat
- Summaries auto-generated after each chapter completion

**Rate Limiting**:
- 1-second delay between chapters to prevent API rate limits
- Graceful error handling continues to next chapter on failure

### Frontend: Real-Time Progress UI
**Hook**: `frontend/src/hooks/useBulkGeneration.ts`

**State Management**:
```typescript
interface BulkGenerationState {
  isGenerating: boolean;
  currentChapter: number | null;
  currentTitle: string | null;
  completedChapters: number;
  totalChapters: number;
  totalWords: number;
  errors: Array<{ chapter: number; message: string }>;
  skippedChapters: number[];
}
```

**EventSource Integration**:
- Connects to SSE endpoint via browser native `EventSource`
- Parses JSON events and updates state
- Auto-closes connection on completion or error
- Manual stop via `stopBulkGeneration()`

**Page**: `frontend/src/pages/ProjectDetailPage.tsx`

**UI Components**:

1. **"Generate All Chapters" Button**
   - Only visible when chapters remain to generate
   - Disabled during bulk generation or single-chapter streaming
   - Located in Chapters section header

2. **Progress Modal** (Active)
   - Real-time progress bar showing completion percentage
   - Current chapter display with title and status
   - Stats cards: Completed, Total Words, Skipped
   - Error list if any chapters fail
   - "Stop Generation" button with confirmation

3. **Completion Modal**
   - Success message with celebration emoji
   - Total chapters generated count
   - Total words generated (formatted with commas)
   - Error summary if any failed
   - "Done" button to close

**Auto-Refresh**:
- `useEffect` monitors `bulkGeneration.completedChapters`
- Invalidates chapters query on each new completion
- Chapter list updates in real-time as generation progresses

## Usage Flow

### User Workflow
1. User navigates to project detail page
2. User generates premise → Story Bible → Outline (if not already done)
3. User clicks **"Generate All Chapters"** button
4. Progress modal opens showing:
   - "Chapter 1: [Title]" generating...
   - Progress bar updates to 4% (1/25)
   - Word count increases
5. After ~60-90 seconds, Chapter 1 completes:
   - Progress bar jumps to 8% (2/25)
   - "Chapter 2: [Title]" starts generating
6. Process continues for all 25 chapters
7. Completion modal appears with final stats
8. Chapter list shows all 25 chapters with ✓ Generated

### Error Scenarios

**Single Chapter Failure**:
- Error logged in progress modal
- Generation continues to next chapter
- Failed chapter can be regenerated individually later

**Fatal Error** (e.g., network failure):
- All progress saved up to that point
- Modal shows error state
- User can restart from where it stopped (already-generated chapters skipped)

**User Cancellation**:
- User clicks "Stop Generation"
- Confirmation dialog prevents accidental stops
- Connection closed gracefully
- All completed chapters saved

## Context System Integration

The bulk generation feature is the primary consumer of the narrative consistency system:

### Story Bible as Anchor
- **Always included** in every chapter prompt
- Prevents character drift (e.g., Jed always has three legs)
- Maintains setting consistency (Paradise Valley always described correctly)
- Tracks theme threads throughout novel

### Recent Chapters for Voice
- **Last 2 chapters** included as full text
- Ensures writing style remains consistent
- Maintains narrative flow and transitions
- Preserves dialogue patterns and pacing

### Summaries for Plot Tracking
- **Chapters 3+ older** than recent ones included as summaries
- Tracks major plot events without token overhead
- Prevents dropped storylines (e.g., Esther's telepathy thread)
- Ensures character arcs progress logically

### Example Context Evolution
```
Chapter 1:  [Story Bible only - 16K tokens]
Chapter 2:  [Story Bible + Chapter 1 full text - 18-20K tokens]
Chapter 3:  [Story Bible + Chapters 1-2 full text - 20-24K tokens]
Chapter 5:  [Story Bible + Chapters 3-4 full + Summary(1-2) - 20-22K tokens]
Chapter 15: [Story Bible + Chapters 13-14 full + Summary(1-12) - 22-25K tokens]
Chapter 25: [Story Bible + Chapters 23-24 full + Summary(1-22) - 24-26K tokens]
```

## Performance Characteristics

**Generation Time**:
- Chapter 1: ~60-90 seconds (no context)
- Chapter 5: ~90-120 seconds (moderate context)
- Chapter 25: ~120-150 seconds (full context)
- **Total for 25 chapters**: ~40-60 minutes

**Token Usage** (per chapter):
- Prompt context: 16-26K tokens (Story Bible + context)
- Response output: 3-5K tokens (2000-3000 words)
- **Total per chapter**: ~20-30K tokens
- **Total for novel**: ~500-750K tokens

**Cost Estimate** (Claude Sonnet 4.5):
- Input: ~$3.00 per million tokens
- Output: ~$15.00 per million tokens
- **Full 25-chapter novel**: ~$5-10 USD

**Database Operations**:
- 25 chapter documents inserted
- 24 summary documents inserted
- 49 queries for context fetching
- **Total writes**: 49 documents

## Testing Recommendations

### Unit Tests
- [ ] Test `useBulkGeneration` hook state management
- [ ] Test EventSource connection handling
- [ ] Test error event parsing

### Integration Tests
- [ ] Generate 3-chapter outline, test bulk generation completes all
- [ ] Verify summaries auto-generate after each chapter
- [ ] Test stopping mid-generation and resuming
- [ ] Verify already-generated chapters are skipped

### End-to-End Test
1. Create test project: "Test Novel" (5 chapters, 10K words)
2. Generate premise, Story Bible, outline
3. Click "Generate All Chapters"
4. Verify:
   - Progress modal shows accurate chapter/progress
   - Each chapter references previous chapter events
   - Summaries created for chapters 1-4
   - No summaries for chapter 5 (last chapter)
   - Completion modal shows correct totals
   - All 5 chapters visible in chapter list

### Consistency Validation
1. Generate full 25-chapter novel
2. Read Chapter 1 and note key details:
   - Character traits (e.g., Jed's three legs)
   - Setting details (e.g., Paradise Valley description)
   - Plot setup (e.g., Esther discovers telepathy)
3. Read Chapter 25 and verify:
   - Character traits remain consistent
   - Setting descriptions match Chapter 1
   - Plot threads resolved (no dropped storylines)
4. Check summaries collection:
   - 24 summaries exist (chapters 1-24)
   - Each summary 300-400 words
   - Summaries track major plot events

## Known Limitations

1. **No Parallel Generation**: Chapters must generate sequentially (context dependency)
2. **No Resume on Fatal Error**: Must restart from beginning (skips completed chapters)
3. **No Progress Persistence**: Refresh page loses progress modal (chapters still saved)
4. **No Estimated Time**: Progress modal doesn't show ETA
5. **Fixed Context Window**: Last 2 chapters hard-coded (not configurable)

## Future Enhancements

### Short-Term
- [ ] Persist progress state to localStorage for page refresh recovery
- [ ] Add ETA calculation based on average chapter generation time
- [ ] Show word count increasing in real-time (not just final count)
- [ ] Add "Pause" option (resume later)

### Medium-Term
- [ ] Configurable context window (e.g., user sets N recent chapters)
- [ ] Batch summary generation (generate summaries in parallel after bulk complete)
- [ ] Export progress report (chapters generated, errors, total time)
- [ ] "Generate Missing" button (only generate gaps, not all)

### Long-Term
- [ ] Smart context selection (include specific chapters based on relevance)
- [ ] Cost estimator before starting (show token/cost projection)
- [ ] Resume from fatal error (persist state to database)
- [ ] Parallel generation of independent chapters (e.g., anthology collections)

## Related Documentation
- [Narrative Consistency Strategy](./NARRATIVE_CONSISTENCY_STRATEGY.md) - Multi-layer context system
- [Context Implementation Status](./CONTEXT_IMPLEMENTATION_STATUS.md) - Summary service, context builder
- [API Documentation](./API_REFERENCE.md) - Bulk generation endpoint reference

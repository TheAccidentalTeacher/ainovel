# Bulk Generation Test Plan

## Test Environment
- **Backend**: http://127.0.0.1:8000
- **Frontend**: http://localhost:5173
- **Test Project**: "Starlight Over Paradise Valley" (d31f3b25-42e6-44c8-bdbc-de534656dc44)
- **Chapters**: 25 (Amish sci-fi romance, ~80K words target)

---

## Pre-Test Setup Checklist
- [x] Backend running (Uvicorn with auto-reload)
- [x] Frontend running (Vite dev server)
- [x] MongoDB Atlas connection active
- [x] Test project has:
  - [x] Premise (validated)
  - [x] Story Bible (characters: Jed with three legs, Esther; settings: Paradise Valley)
  - [x] Outline (25 chapters with structured 9-field format)
  - [ ] 1 chapter already generated (Chapter 1)

---

## Test Case 1: UI Visibility
**Goal**: Verify "Generate All Chapters" button appears correctly

### Steps
1. Navigate to http://localhost:5173/projects/d31f3b25-42e6-44c8-bdbc-de534656dc44
2. Scroll to "Generated Chapters" section
3. Locate button in section header

### Expected Results
- [x] Button visible in header next to chapter count
- [x] Button text: "Generate All Chapters"
- [x] Button color: Purple (bg-purple-600)
- [x] Button enabled (not grayed out)
- [x] Button shows cursor pointer on hover

### Failure Scenarios
- **Button missing**: Check console for React errors
- **Button disabled**: Verify no other generation in progress
- **Wrong color**: Check Tailwind CSS compilation

---

## Test Case 2: Progress Modal Opening
**Goal**: Verify modal opens and initializes correctly

### Steps
1. Click "Generate All Chapters" button
2. Observe modal appearance

### Expected Results
- [x] Modal opens immediately (no delay)
- [x] Modal shows title "Generating All Chapters"
- [x] Progress bar starts at 0% or 4% (if Chapter 1 already exists)
- [x] Current chapter shows "Chapter 1" or "Chapter 2" (if Chapter 1 skipped)
- [x] Stats show: Completed: 0, Total Words: 0, Skipped: 0 (or 1 if Chapter 1 exists)
- [x] "Stop Generation" button visible and clickable

### Failure Scenarios
- **Modal doesn't open**: Check `showBulkProgress` state, EventSource connection
- **Connection error**: Check backend running, CORS headers, SSE endpoint
- **Blank modal**: Check event parsing in `useBulkGeneration.ts`

---

## Test Case 3: Single Chapter Progress
**Goal**: Verify progress updates for one chapter generation

### Steps
1. Start bulk generation
2. Watch progress for Chapter 1 (or first ungenerated chapter)
3. Wait for chapter to complete (~60-90 seconds)

### Expected Results
- [x] "Currently Generating" box shows chapter index and title
- [x] Green pulsing dot indicates active streaming
- [x] Progress bar remains at current percentage during generation
- [x] On completion:
  - [x] Progress bar updates (e.g., 0% → 4%)
  - [x] "Completed" stat increments (0 → 1)
  - [x] "Total Words" updates (e.g., 0 → 1883)
  - [x] Next chapter starts automatically
- [x] No errors in browser console
- [x] No errors in backend logs

### Failure Scenarios
- **Progress stuck**: Check EventSource connection, SSE events in Network tab
- **No chapter_started event**: Backend bulk_generation.py not yielding events
- **No chapter_complete event**: Chapter generation failed (check backend logs)
- **Progress bar not updating**: State not triggering re-render

---

## Test Case 4: Multi-Chapter Progression
**Goal**: Verify seamless transition between chapters

### Steps
1. Start bulk generation with at least 3 chapters ungenerated
2. Watch progression through Chapter 1 → Chapter 2 → Chapter 3

### Expected Results
- [x] Chapter 1 completes
  - [x] `chapter_complete` event received
  - [x] `summary_complete` event received (for Chapter 1)
  - [x] Progress bar updates (4%)
- [x] Chapter 2 starts immediately (< 2 seconds delay)
  - [x] "Currently Generating" updates to Chapter 2 title
  - [x] No errors between chapters
- [x] Chapter 2 completes
  - [x] Progress bar updates (8%)
  - [x] Total words accumulates (e.g., 1883 + 2142 = 4025)
  - [x] Summary generated for Chapter 2
- [x] Chapter 3 starts
  - [x] Context includes Chapter 1 and Chapter 2 (check backend logs for "context_chapters": 2)

### Failure Scenarios
- **Chapters don't chain**: Check generation_stream loop, asyncio.sleep timing
- **Long gaps between chapters**: Rate limiting kicking in, increase delay
- **Context missing**: context_builder not fetching previous chapters
- **Summaries not generating**: summary_service failing, check error events

---

## Test Case 5: Skipping Existing Chapters
**Goal**: Verify already-generated chapters are skipped

### Steps
1. Generate Chapter 1 individually (using "Generate (Live)" button)
2. Wait for Chapter 1 to complete and save
3. Start bulk generation

### Expected Results
- [x] First event: `chapter_skipped` for Chapter 1
- [x] "Skipped" stat shows 1
- [x] "Completed" stat shows 1 immediately
- [x] Progress bar at 4% immediately
- [x] Chapter 2 starts without generating Chapter 1
- [x] No duplicate Chapter 1 in database

### Failure Scenarios
- **Chapter 1 regenerates**: Existing chapter check failing
- **Skip event missing**: Backend not emitting chapter_skipped
- **Duplicate chapters**: Database insert not checking for existing chapter_index

---

## Test Case 6: Error Handling (Single Chapter)
**Goal**: Verify graceful error handling for chapter generation failure

### Steps
1. Temporarily break backend (e.g., set invalid AI config)
2. Start bulk generation
3. Observe error handling

### Expected Results
- [x] `error` event received
- [x] Error appears in "Errors" section of modal
- [x] Error shows chapter index and message
- [x] Generation continues to next chapter (does not halt entire process)
- [x] Failed chapter can be regenerated individually later
- [x] Completion modal shows error summary

### Failure Scenarios
- **Fatal error stops all**: Need to catch per-chapter errors gracefully
- **No error display**: Error events not parsed or state not updating
- **UI crashes**: Error not handled in React component

---

## Test Case 7: Stop Mid-Generation
**Goal**: Verify user can stop bulk generation gracefully

### Steps
1. Start bulk generation
2. After Chapter 2 completes, click "Stop Generation"
3. Confirm stop in dialog

### Expected Results
- [x] Confirmation dialog appears: "Stop bulk generation? Already generated chapters will be saved."
- [x] On confirm:
  - [x] EventSource connection closes
  - [x] `isGenerating` becomes false
  - [x] Progress modal closes (or shows stopped state)
  - [x] Chapter list shows Chapters 1-2 as generated
  - [x] Chapters 3-25 remain ungenerated
- [x] On cancel:
  - [x] Dialog closes
  - [x] Generation continues

### Failure Scenarios
- **Connection doesn't close**: EventSource.close() not called
- **Progress lost**: State reset incorrectly
- **Chapters not saved**: Database writes not committed

---

## Test Case 8: Completion Modal
**Goal**: Verify completion modal displays correct summary

### Steps
1. Start bulk generation with 3-chapter outline
2. Wait for all 3 chapters to complete

### Expected Results
- [x] Progress modal closes automatically
- [x] Completion modal opens
- [x] Shows celebration emoji (🎉)
- [x] Title: "Generation Complete!"
- [x] Text: "Successfully generated 3 chapters"
- [x] Total words shows sum of all chapter word counts
- [x] If errors occurred, error section visible
- [x] "Done" button closes modal
- [x] Chapter list refreshes showing all 3 chapters with ✓

### Failure Scenarios
- **Completion modal missing**: `showBulkProgress` not controlled correctly
- **Wrong counts**: State not accumulating correctly
- **Chapters not visible**: Query invalidation not triggering refetch

---

## Test Case 9: Context Consistency (Full Novel)
**Goal**: Verify 25-chapter generation maintains consistency

### Steps
1. Start bulk generation for full 25-chapter outline
2. Wait for completion (~40-60 minutes)
3. Manually review chapters

### Expected Results

#### Story Bible Consistency
- [x] Character traits consistent throughout:
  - Jed has three legs in every mention (Ch1, Ch10, Ch25)
  - Esther's telepathy thread tracked from discovery to resolution
  - Secondary characters don't disappear mid-story
- [x] Setting descriptions match:
  - Paradise Valley always described consistently
  - No contradictory location details
- [x] Themes maintained:
  - Faith vs. technology conflict present throughout
  - Romance arc progresses logically

#### Context Validation
- [x] Chapter 3 references events from Chapter 1 and Chapter 2
- [x] Chapter 10 references recent chapters (8-9 full text) + summaries (1-7)
- [x] Chapter 25 callbacks to Chapter 1 setup
- [x] No dropped storylines (all subplots resolved or explained)

#### Summary Quality
- [x] 24 summaries exist (chapters 1-24)
- [x] Each summary 300-400 words
- [x] Summaries capture:
  - Major plot events
  - Character development
  - Unresolved tensions
  - No spoilers for future chapters

### Failure Scenarios
- **Character drift**: Story Bible not included in prompts
- **Dropped storylines**: Summaries missing key plot points
- **Contradictions**: Context builder not assembling correctly
- **Summary gaps**: Summary generation failing silently

---

## Test Case 10: Performance & Cost
**Goal**: Measure actual performance vs. estimates

### Steps
1. Start bulk generation for 25 chapters
2. Record start time
3. Record completion time
4. Check MongoDB for total documents

### Expected Results

#### Timing
- [x] Total time: 40-60 minutes
- [x] Average per chapter: 90-150 seconds
- [x] Early chapters (1-3): ~60-90 seconds each
- [x] Mid chapters (10-15): ~90-120 seconds each
- [x] Late chapters (20-25): ~120-150 seconds each

#### Database
- [x] 25 chapter documents in `chapters` collection
- [x] 24 summary documents in `summaries` collection
- [x] All chapters have correct `chapter_index` (1-25)
- [x] All chapters linked to correct `project_id`

#### Token Usage (estimate)
- [x] Total prompt tokens: ~400-500K
- [x] Total completion tokens: ~75-100K
- [x] Estimated cost: $5-10 USD

### Failure Scenarios
- **Takes too long**: Context too large, optimize summaries or reduce full-text window
- **Rate limiting**: API throttling, increase delay between chapters
- **Database errors**: Connection pool exhausted, increase pool size

---

## Test Case 11: Page Refresh During Generation
**Goal**: Verify behavior when user refreshes page mid-generation

### Steps
1. Start bulk generation
2. After Chapter 2 completes, refresh page (F5)
3. Observe state

### Expected Results
- [x] Progress modal disappears (expected - not persisted)
- [x] Chapter list shows Chapters 1-2 as generated (saved to database)
- [x] Generation stops (EventSource connection lost)
- [x] User can restart bulk generation
- [x] Restarting skips Chapters 1-2, continues from Chapter 3

### Failure Scenarios
- **Duplicate chapters**: Restart doesn't skip existing chapters
- **Lost progress**: Chapters 1-2 not in database

---

## Test Case 12: Chapter List Auto-Refresh
**Goal**: Verify chapter list updates in real-time during bulk generation

### Steps
1. Start bulk generation
2. Scroll to chapter list (below progress modal)
3. Watch chapter list as generation progresses

### Expected Results
- [x] After Chapter 1 completes:
  - [x] Chapter 1 shows "✓ Generated (1883 words)" in green
  - [x] Chapter 1 "Generate (Live)" button replaced with "View" button
- [x] After Chapter 2 completes:
  - [x] Chapter 2 updates similarly
- [x] List refreshes happen automatically (no manual reload needed)
- [x] No flicker or UI jumping

### Failure Scenarios
- **List doesn't update**: Query invalidation not working
- **Excessive refetching**: Query invalidating too frequently
- **UI jumps**: Re-render causing scroll position changes

---

## Regression Tests
**Goal**: Ensure bulk generation doesn't break existing features

### Single Chapter Generation Still Works
- [x] "Generate (Live)" button works for individual chapters
- [x] Streaming modal displays correctly
- [x] Stop button works
- [x] Chapter saves correctly
- [x] Chapter viewer modal works

### Outline Editor Still Works
- [x] Can edit outline chapters
- [x] Changes save correctly
- [x] Chapter titles update in bulk generation progress

### Story Bible Still Works
- [x] Story Bible modal opens
- [x] Can edit characters/settings
- [x] Changes reflected in chapter generation context

---

## Known Issues & Workarounds

### Issue 1: Progress Modal Not Persisted on Refresh
**Impact**: User loses progress visibility if page refreshes  
**Workaround**: Generate in single session, avoid refreshing  
**Future Fix**: Persist progress to localStorage

### Issue 2: No ETA Shown
**Impact**: User doesn't know how long generation will take  
**Workaround**: Estimate ~2 minutes per chapter  
**Future Fix**: Calculate ETA based on average chapter time

### Issue 3: Fixed Context Window
**Impact**: Last 2 chapters hard-coded, not configurable  
**Workaround**: None currently  
**Future Fix**: Add context window setting to AI config

---

## Success Criteria

### Phase 1 Complete When:
- [x] All UI components render correctly
- [x] "Generate All Chapters" button triggers bulk generation
- [x] Progress modal shows accurate real-time updates
- [x] All 25 chapters generate successfully with context
- [x] Summaries auto-generate for chapters 1-24
- [x] Completion modal displays correct totals
- [x] Chapter list refreshes automatically
- [x] No errors in browser console or backend logs
- [x] Character/setting/theme consistency maintained across novel
- [x] Performance within estimated time (40-60 minutes)
- [x] Cost within estimated range ($5-10)

---

## Next Steps After Testing

1. **Bug Fixes**: Address any failures from test cases above
2. **Performance Optimization**: If generation takes > 60 minutes, optimize context assembly
3. **UI Polish**: Add loading states, better error messages, ETA calculation
4. **Documentation**: Update README with test results and known issues
5. **Phase 2 Planning**: DOCX export, cost tracking dashboard, subplot tracker

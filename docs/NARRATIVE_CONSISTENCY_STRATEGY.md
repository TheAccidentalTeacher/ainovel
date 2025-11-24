# Narrative Consistency Strategy

## Problem Statement
When generating 25 chapters sequentially, we need to ensure:
1. **Zero character drift** - Characters maintain personality, voice, quirks
2. **Zero plot holes** - All storylines resolve, no dead ends
3. **Consistent world-building** - Settings, rules, and details stay constant
4. **Subplot tracking** - All B/C stories progress and conclude
5. **Tone maintenance** - Writing style and humor level stay consistent

## Our Solution: Multi-Layer Context System

### Layer 1: Story Bible (Always Included)
**Purpose:** Canonical reference for immutable facts

**Contains:**
- All character profiles (personality, goals, arcs, quirks)
- All settings (descriptions, atmosphere, rules)
- Core themes and tone guidelines
- Main plot arc and all subplots
- Genre guidelines

**Token Cost:** ~2-3K tokens
**Why Always Include:** This is your "bible" - the source of truth that never changes

### Layer 2: Chapter Outline (Current Chapter)
**Purpose:** Specific instructions for this chapter

**Contains:**
- Opening scene description
- Characters present
- Locations used
- Plot events (ordered list)
- Character development beats
- Subplots advanced
- Closing scene/hook
- Tone notes
- Narrative summary

**Token Cost:** ~500 tokens
**Why Include:** Provides structure and ensures all plot points are hit

### Layer 3: Recent Chapters (Full Text)
**Purpose:** Immediate context and narrative momentum

**Strategy:**
- Last **2 chapters** included as full text
- Provides dialogue style, pacing, recent events
- Ensures smooth transitions

**Token Cost:** ~6K-8K tokens (for 3K word chapters)
**Why Include:** AI can match voice, reference recent events, maintain continuity

### Layer 4: Historical Chapters (Summaries)
**Purpose:** Long-term plot tracking without token overload

**Strategy:**
- Chapters 3+ steps back: **Auto-generated summaries**
- Each summary: 300-400 words covering:
  - Major plot events and consequences
  - Character development moments
  - Relationship changes
  - Information revealed
  - Unresolved tensions

**Token Cost:** ~500 tokens per 5-chapter batch
**Why Include:** Tracks subplot progression, prevents contradictions

## Context Evolution Example

**Generating Chapter 1:**
```
Context:
- Story Bible (2.5K tokens)
- Premise (1K tokens)
- Chapter 1 Outline (500 tokens)
Total: 4K tokens input
```

**Generating Chapter 5:**
```
Context:
- Story Bible (2.5K tokens)
- Premise (1K tokens)
- Chapter 5 Outline (500 tokens)
- Chapter 4 (full text, 3K tokens)
- Chapter 3 (full text, 3K tokens)
- Chapters 1-2 Summary (800 tokens)
Total: 11.3K tokens input
```

**Generating Chapter 15:**
```
Context:
- Story Bible (2.5K tokens)
- Premise (1K tokens)
- Chapter 15 Outline (500 tokens)
- Chapter 14 (full text, 3K tokens)
- Chapter 13 (full text, 3K tokens)
- Chapters 11-12 Summary (800 tokens)
- Chapters 6-10 Summary (1K tokens)
- Chapters 1-5 Summary (1K tokens)
Total: 13.3K tokens input
```

**Generating Chapter 25:**
```
Context:
- Story Bible (2.5K tokens)
- Premise (1K tokens)
- Chapter 25 Outline (500 tokens)
- Chapter 24 (full text, 3K tokens)
- Chapter 23 (full text, 3K tokens)
- Chapters 21-22 Summary (800 tokens)
- Chapters 16-20 Summary (1K tokens)
- Chapters 11-15 Summary (1K tokens)
- Chapters 6-10 Summary (1K tokens)
- Chapters 1-5 Summary (1K tokens)
Total: 15.3K tokens input
```

## Advantages Over Original Plan

**Original Approach:**
- Premise → Ch1 → Ch2 (with Ch1) → Ch3 (with Ch1-2) → etc.
- **Problem:** No character/setting reference after initial prompt
- **Result:** Character drift, forgotten details, inconsistent tone

**Current Approach with Story Bible:**
- Story Bible is **always present** - constant reference
- Characters, settings, themes never drift
- Summaries track plot without full text
- Recent chapters provide voice/style matching

## Quality Safeguards

### 1. Story Bible Generation (Phase 0)
- Extract ALL characters from premise (not just protagonists)
- Document ALL settings with specific details
- List ALL subplots explicitly
- Define tone and humor style clearly

**Result:** Comprehensive reference that prevents omissions

### 2. Structured Outlines (Phase 1)
- 9 fields per chapter ensure nothing is missed
- `subplots_advanced` field explicitly tracks B/C stories
- `character_development` ensures arc progression
- `closing_scene` creates natural chapter hooks

**Result:** Every chapter has clear, trackable goals

### 3. Auto-Summary After Each Chapter (Phase 2)
- AI summarizes what just happened (factual, specific)
- Captures unresolved tensions
- Notes character/relationship changes
- Documents information revealed

**Result:** Perfect "memory" of story progress

### 4. Context Builder Intelligence (Phase 3)
- Dynamically assembles optimal context
- Balances detail vs token limits
- Warns if summaries are missing

**Result:** Each generation has maximum relevant context

## Missing Storyline Detection (Future Enhancement)

### Subplot Tracker Schema
```python
class SubplotTracker(BaseModel):
    subplot_id: str
    description: str
    introduced_chapter: int
    last_mentioned_chapter: int
    status: str  # "open", "resolved", "abandoned"
    expected_resolution: Optional[int]  # Chapter it should resolve
```

### Dead-End Detection
After generating each chapter, AI could:
1. Check: "Which subplots were mentioned?"
2. Update tracker with last_mentioned_chapter
3. Alert if subplot hasn't appeared in 5+ chapters
4. Suggest reintroduction in upcoming chapters

## Token Budget Management

**Maximum Context:** ~20K tokens (to stay under Claude's limits with room for output)

**Current Strategy:**
- Story Bible: 2.5K
- Premise: 1K
- Current Outline: 0.5K
- Recent chapters (2x): 6K
- Summaries (batches): ~5K
- **Total:** ~15K tokens

**Leaves:** 5K tokens buffer + up to 64K for generation

## Implementation Status

✅ **Completed:**
- Story Bible generation and storage
- Structured outline generation (9 fields)
- Chapter generation with Story Bible context
- Summary schema (ChapterSummary model)

🚧 **In Progress:**
- Context builder service (created, needs integration)
- Auto-summary generation (created, needs API endpoints)
- Sequential generation orchestration

⏳ **Next Steps:**
1. Add summary generation API endpoint
2. Update chapter generation to use context builder
3. Create "Generate All" endpoint with sequential orchestration
4. Add subplot tracking (future enhancement)

## Usage for Sequential Generation

```python
# For each chapter in sequence:
async def generate_chapter_with_context(chapter_index: int):
    # 1. Fetch all prior chapters
    prior_chapters = await get_chapters(project_id, max_index=chapter_index - 1)
    
    # 2. Check for existing summaries, generate if missing
    summaries = await get_or_generate_summaries(project_id, prior_chapters)
    
    # 3. Build optimal context
    context = await build_chapter_context(
        chapter_index=chapter_index,
        premise=premise,
        story_bible=story_bible,
        current_outline=outlines[chapter_index],
        all_chapters=prior_chapters,
        all_summaries=summaries,
    )
    
    # 4. Generate chapter with full context
    chapter = await generate_chapter_from_context(context)
    
    # 5. Auto-generate summary for this chapter
    summary = await generate_chapter_summary(chapter, project_id)
    
    # 6. Save both
    await save_chapter(chapter)
    await save_summary(summary)
```

## Expected Quality Improvements

1. **Character Consistency:** Story Bible always present → personalities never drift
2. **Plot Continuity:** Summaries track all events → no forgotten storylines
3. **Detail Accuracy:** Recent chapters provide immediate context → smooth transitions
4. **Subplot Resolution:** Explicit tracking in outlines → no abandoned threads
5. **Tone Maintenance:** Story Bible tone notes + recent chapter examples → consistent voice

## Comparison to Published Novels

**Traditional Writing:**
- Author maintains "series bible" manually
- Rereads recent chapters before writing
- Keeps notes on subplot status
- Edits for consistency in revision

**Our System:**
- Story Bible = series bible (auto-generated, always referenced)
- Recent chapters = author's recent reading (last 2 chapters full text)
- Summaries = author's plot notes (auto-generated, factual)
- Structured outlines = author's chapter plans (9 structured fields)

**Result:** Mimics professional novel-writing workflow at AI speed.

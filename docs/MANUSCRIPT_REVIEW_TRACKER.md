# Manuscript Review Tracker
**Purpose**: Track iterative improvements to AI-generated manuscripts

---

## Current Manuscript Status

| Property | Value |
|----------|-------|
| **File** | `docs/Untitled Project.docx` (source) / `docs/Untitled Project.txt` (extracted) |
| **Title** | Untitled Project |
| **Genre** | Christian / Romance |
| **Word Count** | 15,857 words |
| **Chapters** | 20 |
| **Generated Date** | 2025-11-25 |
| **Last Analysis** | 2025-11-24 |
| **AI Model** | Claude Sonnet 4.5 (0.9 temp, 8000 max_tokens) |

---

## Review History

### Review #1 - Initial AI Tell Analysis (2025-11-24)
**Analyzer**: Claude Sonnet 4.5  
**Focus**: Identify universal AI-generated writing patterns

**Findings**:
- 10 major AI tells identified (see `docs/AI_TELL_ANALYSIS_RESULTS.md`)
- Most severe: Metaphor overload (50+ in 16K words), character tic spam, chapter ending formula
- Created `config/anti_ai_tell_rules.md` with genre-agnostic prevention logic
- Updated `config/prompt_templates/default_chapter.yaml` with embedded rules

**Actions Taken**:
- [x] Complete manuscript read-through (596 lines)
- [x] Pattern identification with exact quotes
- [x] Frequency counting for each tell
- [x] Anti-AI-tell rules created
- [x] Chapter prompt template updated
- [x] README.md updated with system documentation

**Status**: ✅ Complete - Rules deployed to production template

---

## Next Review Checklist

### Before Next Analysis Session:
1. **Generate Test Chapter**:
   - Use updated `default_chapter.yaml` template with anti-AI-tell rules
   - Pick a simple premise to isolate rule effectiveness
   - Target 2,000-3,000 words for easier analysis

2. **Run Automated Checks**:
   ```powershell
   # Extract if needed
   & "backend\venv\Scripts\python.exe" tools\docx_to_text.py "docs\[New Manuscript].docx" --out "docs\[New Manuscript].txt"
   
   # Search for banned phrases
   Select-String -Path "docs\[New Manuscript].txt" -Pattern "stomach dropped|stomach tightened|heat crept|hands trembled"
   ```

3. **Manual Audit Points**:
   - [ ] Count similes/metaphors (should be <5 per chapter)
   - [ ] Check dialogue tags (80% should be "said" or action beats)
   - [ ] Examine chapter endings (rotate: dialogue/action/decision/image)
   - [ ] Scan for character tic frequency (max 1-2 per chapter)
   - [ ] Look for sentence opening repetition patterns

4. **Compare to Baseline**:
   - Original manuscript: 50+ metaphors in 16K words (1 per 320 words)
   - Target: <20 metaphors in 16K words (1 per 800+ words)
   - Original: Character tics every scene (12+ Bernard bead-clicking instances)
   - Target: Character tics 2-3 times total across manuscript

---

## Iteration Workflow

### Step 1: Extract New Manuscript
```powershell
cd "c:\Users\scoso\WEBSITES\AI Novel Generator"
& "backend\venv\Scripts\python.exe" tools\docx_to_text.py "docs\[Manuscript Name].docx" --out "docs\[Manuscript Name].txt"
```

### Step 2: Start New Chat Session
In GitHub Copilot Chat, reference:
- **README.md** - Section: "📎 DOCX → AI Review Workflow"
- **This tracker** - `docs/MANUSCRIPT_REVIEW_TRACKER.md`
- **Previous findings** - `docs/AI_TELL_ANALYSIS_RESULTS.md`
- **Current rules** - `config/anti_ai_tell_rules.md`

Say: *"Review `docs/[Manuscript Name].txt` against our anti-AI-tell rules. Compare to baseline (Untitled Project) and identify if rules are working or need refinement."*

### Step 3: Claude Analyzes New Manuscript
- Read full text
- Check for presence/absence of 10 identified tells
- Count specific patterns (metaphors, physical cues, etc.)
- Note any NEW patterns that emerged
- Compare frequencies to original manuscript

### Step 4: Update Rules If Needed
- If tells persist: Strengthen existing rules in `config/anti_ai_tell_rules.md`
- If new patterns emerge: Add new rules with examples
- Update `config/prompt_templates/default_chapter.yaml` system prompt
- Document changes in this tracker

### Step 5: Document Review
Add new section to **Review History** above with:
- Date, analyzer, focus
- Findings summary
- Rule changes made
- Comparison metrics (before/after frequencies)
- Status

---

## Quick Reference: Files in Review Workflow

| File | Purpose | Update Frequency |
|------|---------|------------------|
| `docs/[Manuscript].docx` | Source manuscript | Each new generation |
| `docs/[Manuscript].txt` | Extracted plain text | Run script each time |
| `docs/MANUSCRIPT_REVIEW_TRACKER.md` | **THIS FILE** - iteration log | After each review |
| `docs/AI_TELL_ANALYSIS_RESULTS.md` | Baseline analysis report | Reference only |
| `config/anti_ai_tell_rules.md` | Master rulebook | When rules need refinement |
| `config/prompt_templates/default_chapter.yaml` | AI prompt with embedded rules | When rules change |
| `tools/docx_to_text.py` | Extraction script | Stable, rarely changes |

---

## Success Metrics

Track these across iterations to measure improvement:

| Metric | Baseline (Untitled Project) | Target | Current |
|--------|---------------------------|--------|---------|
| **Metaphor Density** | 1 per 320 words (50 total) | 1 per 800+ words (<20 total) | TBD |
| **Banned Physical Cues** | 14 instances | 0 instances | TBD |
| **"Said" Ratio** | ~30% | 80%+ | TBD |
| **Predictable Endings** | 15/20 chapters (75%) | <25% | TBD |
| **Character Tic Frequency** | 12+ per character | 2-3 per character | TBD |
| **Sentence Opening Variety** | 30+ similar patterns | <10 similar patterns | TBD |
| **Elegant Variation Issues** | 20+ awkward synonyms | <5 instances | TBD |

---

## Notes for Future Sessions

### Common Pitfalls to Watch:
- **Rule Overcompensation**: If AI tries too hard to avoid tells, prose may become sterile
- **New Pattern Emergence**: Fixing one tell may cause AI to develop different patterns
- **Genre Sensitivity**: Ensure rules remain genre-agnostic during refinement
- **Context Window**: Very long manuscripts may cause Claude to "forget" rules mid-generation

### Optimization Ideas:
- [ ] Create automated testing script that counts tells programmatically
- [ ] Build "before/after" comparison tool showing side-by-side improvements
- [ ] Develop genre-specific rule variations (e.g., thriller might allow more tension-building metaphors)
- [ ] Test with different AI models (GPT-4, Claude Opus, etc.) to see if tells are model-specific

---

## Archive of Refined Rules

When rules change significantly, document the evolution here:

### Version 1.0 (2025-11-24)
- Initial 10-rule system based on "Untitled Project" analysis
- Embedded in `default_chapter.yaml` system prompt
- Focus: Structural patterns (sentence variety, metaphor rationing, dialogue tags)
- Status: **ACTIVE** - Awaiting first test generation

---

## Contact Context for New Chat Sessions

**Quick Start Prompt Template**:
```
I'm continuing iterative manuscript improvement. Please:

1. Read `docs/MANUSCRIPT_REVIEW_TRACKER.md` for context
2. Review `docs/[New Manuscript].txt` (latest generation)
3. Compare against baseline in `docs/AI_TELL_ANALYSIS_RESULTS.md`
4. Check if our 10 anti-AI-tell rules (in `config/anti_ai_tell_rules.md`) are working
5. Identify any new patterns or persistent tells
6. Suggest rule refinements if needed
7. Update tracker with findings

Current focus: [describe what you want analyzed - e.g., "checking if metaphor density improved" or "looking for new patterns that emerged"]
```

---

**Last Updated**: 2025-11-24  
**Next Review**: TBD (after first test chapter generation with new rules)

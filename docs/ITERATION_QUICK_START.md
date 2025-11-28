# Iterative Manuscript Improvement - Quick Start Guide
**For New Chat Sessions**

---

## 🎯 Copy-Paste Prompt for New Sessions

```
I'm continuing iterative manuscript improvement for the AI Novel Generator.

CONTEXT FILES TO READ:
1. docs/MANUSCRIPT_REVIEW_TRACKER.md - Review history and current status
2. docs/AI_TELL_ANALYSIS_RESULTS.md - Baseline analysis (original "Untitled Project")
3. config/anti_ai_tell_rules.md - Current rulebook (10 universal rules)

NEW MANUSCRIPT TO ANALYZE:
- docs/[FILENAME].txt

TASKS:
1. Read the new manuscript completely
2. Check for the 10 AI tells we identified:
   - Sentence opening repetition
   - Metaphor overload
   - Physical response over-signaling (stomach/heat/hands)
   - Sensory detail exhaustion
   - Dialogue tag anxiety
   - Chapter ending formula
   - Unnecessary numeric specificity
   - Weather = emotion mirror
   - Character tic overuse
   - Elegant variation syndrome

3. Compare frequencies to baseline:
   - Metaphors: Original had 50 in 16K words (1 per 320w), target <20 (1 per 800w)
   - Physical cues: Original had 14 instances, target 0
   - "Said" ratio: Original ~30%, target 80%+
   - Character tics: Original 12+ per character, target 2-3 total

4. Identify any NEW patterns that emerged

5. Recommend rule refinements if needed

6. Update docs/MANUSCRIPT_REVIEW_TRACKER.md with findings

FOCUS: [Tell me what specific aspect you want me to focus on - e.g., "metaphor density improvement" or "checking if new patterns emerged"]
```

---

## 🔄 Standard Iteration Workflow

### 1. Generate New Manuscript
- Use system with current anti-AI-tell rules
- Chapter template: `config/prompt_templates/default_chapter.yaml`
- Rules are embedded in system prompt automatically

### 2. Extract to Plain Text
```powershell
cd "c:\Users\scoso\WEBSITES\AI Novel Generator"
& "backend\venv\Scripts\python.exe" tools\docx_to_text.py "docs\[Manuscript].docx" --out "docs\[Manuscript].txt"
```

### 3. Quick Automated Check
```powershell
# Search for banned phrases (should find nothing)
Select-String -Path "docs\[Manuscript].txt" -Pattern "stomach dropped|stomach tightened|heat crept|hands trembled"

# Count word frequency for "said" vs alternatives
(Select-String -Path "docs\[Manuscript].txt" -Pattern '\bsaid\b' -AllMatches).Matches.Count
```

### 4. Start New Chat Session
- Use copy-paste prompt above
- Replace `[FILENAME]` with actual manuscript name
- Specify focus area in the prompt

### 5. After Analysis
- Update `docs/MANUSCRIPT_REVIEW_TRACKER.md` with new review entry
- If rules need refinement:
  - Update `config/anti_ai_tell_rules.md`
  - Update `config/prompt_templates/default_chapter.yaml`
- Commit changes to Git

---

## 📊 Key Metrics to Track

| Metric | Baseline | Target | Current |
|--------|----------|--------|---------|
| Metaphor Density | 1/320w (50 total) | 1/800w+ (<20) | ? |
| Banned Physical Cues | 14 | 0 | ? |
| "Said" Usage | ~30% | 80%+ | ? |
| Predictable Endings | 75% (15/20) | <25% | ? |
| Character Tic Freq | 12+ per char | 2-3 per char | ? |

---

## 🎨 What Makes Good vs Bad Writing?

### ❌ AI Tells (What We're Fixing):
- Metaphors for mundane actions: "The ladder groaned like a confessor bearing heinous sins"
- Repeated physical cues: "His stomach dropped... heat crept up his neck... hands trembled"
- Overwritten sensory catalogs: "Cinnamon and cardamom and leather and wool..."
- Predictable chapter endings: Always philosophical one-liner
- Character tics every scene: Bernard clicks beads constantly

### ✅ Human Writing (What We're Targeting):
- Occasional strong metaphor: Save for important moments
- Action shows emotion: Character does something nervous vs. feeling nervousness described
- One dominant sense per scene: Pick sight OR smell, not both exhaustively
- Varied chapter endings: Dialogue, action, decision, abrupt image
- Character traits shown sparingly: Establish once or twice, trust reader remembers

---

## 🔧 Common Rule Refinements

Based on what analysis might reveal:

### If Tells Persist:
- **Metaphor still high?** → Lower quota from "1 per 500 words" to "1 per 1000 words"
- **Physical cues sneak in?** → Expand banned phrase list
- **Dialogue tags still varied?** → Strengthen "said" mandate to 90%

### If New Patterns Emerge:
- Document in `AI_TELL_ANALYSIS_RESULTS.md` as "Review #X findings"
- Create new rule in `anti_ai_tell_rules.md`
- Add to chapter template system prompt
- Update success metrics in tracker

### If Prose Becomes Too Sterile:
- Rules may be overcompensating
- Selectively relax constraints (e.g., allow 2 metaphors per 500 words instead of 1)
- Add note about when rules can be broken for effect

---

## 📁 File Reference Map

```
AI Novel Generator/
├── docs/
│   ├── MANUSCRIPT_REVIEW_TRACKER.md ← Review history, metrics, iteration log
│   ├── AI_TELL_ANALYSIS_RESULTS.md ← Original baseline analysis
│   ├── ITERATION_QUICK_START.md ← THIS FILE (quick reference)
│   ├── [Manuscript].txt ← Extracted manuscripts for review
│   └── [Manuscript].docx ← Source files
├── config/
│   ├── anti_ai_tell_rules.md ← Master rulebook (10 rules)
│   └── prompt_templates/
│       └── default_chapter.yaml ← Production template (rules embedded here)
└── tools/
    └── docx_to_text.py ← Extraction utility
```

---

## 💡 Tips for Effective Reviews

1. **Read Full Manuscript**: Don't spot-check—patterns appear across full text
2. **Count Objectively**: Use exact frequencies, not impressions
3. **Compare to Baseline**: Always reference original "Untitled Project" metrics
4. **Look for Substitutions**: AI might replace one tell with another (e.g., stop using "stomach" but start using "chest tightened")
5. **Test Across Genres**: Ensure rules work for Christian romance, thriller, sci-fi, etc.
6. **Document Everything**: Future sessions need clear history to build on

---

## 🚀 Next Steps After This Session

1. ✅ Files created for iteration tracking
2. ⏳ **Next**: Generate test chapter with new rules
3. ⏳ Run first comparison analysis
4. ⏳ Refine rules based on results
5. ⏳ Iterate until prose consistently passes human-sounding tests

---

**Last Updated**: 2025-11-24  
**Status**: Workflow established, awaiting first test generation

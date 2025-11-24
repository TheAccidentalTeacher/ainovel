# Premise Builder Implementation Summary

**Date**: November 22, 2025  
**Status**: Backend Complete ✅ | Frontend Pending 🚧

## What Was Built

### 1. Data Models (`backend/models/premise_builder.py`)
- **Core Models**:
  - `PremiseBuilderSession` - Main session container tracking all wizard steps
  - Step-specific profiles: `ProjectStub`, `GenreProfile`, `ToneThemeProfile`, `CharacterSeeds`, `PlotIntent`, `StructureTargets`, `ConstraintsProfile`
  - `PremiseArtifact` - Generated premise with metadata (baseline or premium)
  - Enums for `BuilderSessionStatus`, `HeatLevel`, `POVStyle`, `TenseStyle`, `PacingPreference`

- **API Request/Response Models**:
  - `CreateBuilderSessionRequest`, `UpdateBuilderStepRequest`, `AIAssistRequest`
  - `GenerateBaselinePremiseRequest`, `GeneratePremiumPremiseRequest`
  - `CompleteBuilderSessionRequest`, `BuilderSessionResponse`
  - `BuilderProgressSummary`, `AIAssistResponse`

### 2. API Endpoints (`backend/api/premise_builder.py`)
```
POST   /api/premise-builder/sessions                    # Create new session
GET    /api/premise-builder/sessions/{id}               # Retrieve session
PATCH  /api/premise-builder/sessions/{id}               # Update step data
POST   /api/premise-builder/sessions/{id}/ai            # Invoke AI assistant
POST   /api/premise-builder/sessions/{id}/baseline      # Generate baseline premise
POST   /api/premise-builder/sessions/{id}/premium       # Generate premium premise
POST   /api/premise-builder/sessions/{id}/complete      # Finalize and persist
GET    /api/premise-builder/sessions/{id}/summary       # Progress summary
DELETE /api/premise-builder/sessions/{id}               # Abandon session
```

### 3. Business Logic (`backend/services/premise_builder_service.py`)
- **Session Management**:
  - `create_session()` - Initialize new builder session
  - `get_session()` - Retrieve session by ID
  - `update_step()` - Validate and persist step data with schema enforcement
  - `abandon_session()` - Mark session as abandoned

- **AI Integration**:
  - `invoke_ai_assistant()` - Lightweight GPT-4o/Haiku assistance for step-specific help
  - `generate_baseline_premise()` - Synthesize 500-700 word premise from collected data (GPT-4o)
  - `generate_premium_premise()` - Generate 700-1000 word long-form premise with metadata (Claude Sonnet 4.5)
  - Context-aware prompt builders for each action type

- **Completion Flow**:
  - `complete_session()` - Persist final premise to project, create/update project record
  - Handles both new project creation and existing project updates
  - Stores premise with `builder_origin` flag for analytics

### 4. Integration
- Registered routes in `backend/main.py`
- Leverages existing `AIService` for model calls
- Uses existing `get_db()` dependency for MongoDB access
- Stores sessions in new `premise_builder_sessions` collection
- Integrates with existing `projects` and `premises` collections

## AI Assistant Actions Supported

The `invoke_ai_assistant()` method supports these actions:
- `expand_character` - Enrich character seed descriptions
- `suggest_themes` - Generate thematic elements for genre
- `suggest_tropes` - List genre-appropriate tropes
- `check_conflicts` - Identify contradictions in constraints/themes
- `suggest_complications` - Propose plot twists
- `calculate_structure` - Provide structural advice

## Wizard Flow (8 Steps)

| Step | Name | Data Collected | AI Assists Available |
|------|------|----------------|---------------------|
| 0 | Project Scaffold | Title, logline | Title suggestions |
| 1 | Genre Selection | Primary/secondary genre, subgenres | Genre trope recommendations |
| 2 | Tone & Themes | Tone sliders, themes, comps, heat level | Theme suggestions |
| 3 | Characters | Protagonist, antagonist, supporting cast | Character expansion |
| 4 | Plot Expectations | Conflict, stakes, beats, ending | Complication suggestions |
| 5 | Structure Targets | Word count, chapters, POV, tense, pacing | Structure calculations |
| 6 | Constraints | Tropes, content warnings, must-haves | Conflict checking |
| 7 | Baseline Synthesis | AI-generated 500-700 word premise | Refinement iterations |
| 8 | Premium Premise | AI-generated 700-1000 word premium premise | Final refinements |

## Testing

Created `test_premise_builder.py` that:
- Creates session with title
- Populates all 6 data-collection steps (0-6)
- Uses "Starlight Over Paradise Valley" test data
- Validates step progression and data persistence
- Outputs session ID for manual API testing

**Run test**:
```bash
cd "c:\Users\scoso\WEBSITES\AI Novel Generator"
.\backend\venv\Scripts\Activate.ps1
python test_premise_builder.py
```

## Documentation

- **`docs/GUIDED_PREMISE_BUILDER.md`** - Complete feature spec with user journey, data models, API surface, prompt strategy, frontend UX, telemetry, rollout plan, and open questions
- Updated `README.md` to highlight new feature in Feature Snapshot and Narrative Pipeline Overview
- Updated docs index to reference new spec

## What's Next (Frontend)

### Required Components:
1. **Wizard Shell** - Multi-step form with progress indicator, autosave
2. **Step Forms** - Individual forms for each data collection step with validation
3. **AI Assistant Panel** - Right sidebar showing suggestions, acceptance UI
4. **Baseline/Premium Preview** - Premise display with regeneration options
5. **Navigation** - "Start Guided Builder" entry point from project creation

### Integration Points:
- Use React Query for session state management
- Implement autosave on blur/change with debouncing
- Show real-time token cost estimates for premium generation
- Add "Skip AI" toggle for users who prefer manual input
- Provide "Resume Session" capability for returning users

### Suggested File Structure:
```
frontend/src/
  pages/
    PremiseBuilder.tsx          # Main wizard container
  components/
    premise-builder/
      WizardProgress.tsx        # Step indicator
      Step0ProjectForm.tsx      # Step components
      Step1GenreForm.tsx
      Step2ToneForm.tsx
      Step3CharacterForm.tsx
      Step4PlotForm.tsx
      Step5StructureForm.tsx
      Step6ConstraintsForm.tsx
      Step7BaselinePreview.tsx
      Step8PremiumPreview.tsx
      AIAssistantPanel.tsx      # Right sidebar
  hooks/
    usePremiseBuilder.ts        # Session API calls
    useAIAssist.ts              # AI helper integration
```

## Success Criteria

Backend implementation satisfies all requirements from `docs/GUIDED_PREMISE_BUILDER.md`:
- ✅ Session lifecycle management with autosave
- ✅ Step-by-step data collection with validation
- ✅ Lightweight AI assistance (GPT-4o)
- ✅ Baseline synthesis from collected data
- ✅ Premium premise generation (Claude Sonnet 4.5)
- ✅ Completion flow creating/updating projects
- ✅ Refinement iteration support
- ✅ Metadata extraction and storage
- ✅ Optimistic locking with version tracking

## Known Limitations

1. **Frontend Not Built** - Requires React implementation of wizard flow
2. **No Session Cleanup** - Abandoned sessions remain in DB (add TTL index or cleanup job)
3. **No Collaborative Editing** - Single-user sessions only
4. **Limited Metadata Parsing** - Basic JSON extraction; could enhance with structured schema
5. **No A/B Testing** - Multiple premise variants not yet supported
6. **No Cost Estimation** - Token costs not pre-calculated/displayed
7. **No Rate Limiting** - Premium calls not throttled per-user

## Cost Estimates

**Per Session (with AI assistance)**:
- Steps 1-6 AI assists: ~6 calls × 300 tokens = 1,800 tokens (GPT-4o: ~$0.01)
- Baseline synthesis: ~2,000 tokens input + 1,000 output = 3,000 tokens (GPT-4o: ~$0.02)
- Premium synthesis: ~3,000 tokens input + 2,000 output = 5,000 tokens (Claude Sonnet: ~$0.08)

**Total per completed session**: ~$0.11 (assuming moderate AI assist usage)

With refinements, add ~$0.03-0.08 per iteration.

## Future Enhancements

From `docs/GUIDED_PREMISE_BUILDER.md` open questions:
1. Multiple premise variants per session (A/B testing)
2. Session retention policy and cleanup strategy
3. Collaborative multi-user editing with conflict resolution
4. Credit/token budgeting system with user limits
5. More sophisticated metadata extraction (JSON schema validation)
6. Pre-generation cost preview and approval gate
7. Session templates/presets for common genres
8. Import premise from external sources (text files, URLs)

## Deployment Notes

- New MongoDB collection: `premise_builder_sessions` (auto-created)
- No environment variable changes required
- No new dependencies added (uses existing `openai`, `anthropic`, `motor`)
- API routes auto-registered via `main.py` router inclusion
- Backward compatible - existing premise flow unchanged

## Migration Path

To migrate existing projects to use builder:
1. No automatic migration needed
2. New projects can choose "Guided Builder" or "Manual Premise"
3. Existing projects continue with manual premise flow
4. Consider adding `builder_origin` field to existing premises (default: `"manual"`)

---

**Ready for frontend implementation! 🚀**

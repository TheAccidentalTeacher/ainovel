# Guided Premise Builder

> **Audience**: Product + engineering teams (backend, frontend, prompt engineers, QA) and downstream AI agents that will automate implementation. Written for large-context LLM consumption.

## 1. Problem Statement
- The current premise intake accepts free-form text and defaults to legacy "test" content that hardcodes 25 chapters / ~80K words.
- Writers cannot easily articulate goals (length, tone, POV, pacing) or receive structured AI help before outline generation.
- Result: downstream outline/chapter generation inherits bad defaults, mismatched expectations, and requires manual fixes.

## 2. Objectives & Success Criteria
| Objective | Success Signals |
| --- | --- |
| Collect structured intent before outline generation | >90% of newly created projects capture target word count, chapter count, genre, subgenre, core themes, protagonist info |
| Provide guided, iterative AI assistance | Users accept at least one AI suggestion in 60% of sessions; manual overrides always possible |
| Generate a premium-quality final premise | Final premise stored as `premium_premise` with metadata indicating model + version; outline engine uses this artifact |
| Prevent legacy defaults | No project created via builder persists the legacy 25-chapter premise unless explicitly chosen |
| Reduce friction | Median time-to-premise < 5 minutes from wizard start (tracked via telemetry) |

## 3. User Journey Overview
1. **Entry**: User chooses "Start Guided Builder" from project creation flow.
2. **Wizard Steps** (progress indicator, autosave after each step):
   - Step 0: Project scaffolding (title, logline seed, desired format) — optional skip if project already exists.
   - Step 1: Genre & Subgenre selection (multi-select support, favorites pinned).
   - Step 2: Tone, themes, and comparables (choose adjectives, provide comps, pick heat level for romance, etc.).
   - Step 3: Characters (protagonist, antagonist, supporting cast prompts with AI fill suggestions).
   - Step 4: Plot expectations (major conflicts, stakes, twists, ending vibe).
   - Step 5: Structural targets (word count, chapter count or arcs, POV, tense, pacing preferences).
   - Step 6: Constraints & must-haves (content warnings, tropes to include/avoid, faith elements).
   - Step 7: AI synthesis review (baseline premise preview, editable, request refinements).
   - Step 8: Premium premise generation (Claude Sonnet 4.5 or GPT-5 premium call) producing final long-form premise + key metadata; user acceptance gate.
3. **Exit**: Persist final artifact, route to outline review screen, allow download of summary PDF or copy to clipboard.

## 4. Step-by-Step Flow & AI Interactions

### 4.1 Session Lifecycle
- Builder sessions stored in new `premise_builder_sessions` collection keyed by `project_id` (or `session_id` for prospective projects).
- Autosave after each step with optimistic locking (`version`, `updated_at`).
- Allow resume / discard.

### 4.2 Step Details
| Step | Inputs Collected | AI Assistance | Output Saved |
| --- | --- | --- | --- |
| 0. Project Scaffold | Title, optional elevator pitch | AI suggests titles based on genre keywords | `project_stub` embedded doc |
| 1. Genre Selection | Primary + secondary genre, audience rating | Smart defaults per user history; explains genre tropes | `genre_profile` |
| 2. Tone & Themes | Tone sliders (dark ↔ hopeful), themes list, comps | AI recommends theme combos, surfaces common comps | `tone_theme_profile` |
| 3. Characters | Protagonist bio, goal, flaw; antagonist; supporting cast seeds | AI expands bullet points into richer descriptions on request | `character_seeds` |
| 4. Plot Expectations | Primary conflict, stakes, three-act beats | AI prompts clarifying questions; user can accept auto-suggested stakes | `plot_intent` |
| 5. Structure Targets | Target words, chapter count, POV, tense, pacing, heat level | AI calculates chapter length ranges, warns on inconsistencies | `structure_targets` |
| 6. Constraints & Must-Haves | Tropes to include/avoid, content warnings, faith/values | AI cross-checks for contradictions (e.g., "no violence" vs "dark revenge") | `constraints_profile` |
| 7. Baseline Synthesis | Aggregates prior inputs into coherent premise draft | Lightweight model (GPT-4o) creates synopsis; user can iterate prompt | `baseline_premise` |
| 8. Premium Premise | Final validated request to premium model with structured context sections | Claude Sonnet 4.5 / GPT-5 Codex generates ~700-1000 word premise + metadata JSON | `premium_premise` + `premise_metadata` |

### 4.3 Iteration Loop
- Steps 3-6 support "Regenerate with tweaks" buttons that pass user deltas to AI assistant.
- Step 7 includes quick actions: "Sharpen conflict", "Deepen protagonist arc", "Add subplot" — each triggers targeted refinement prompts.
- Step 8 offers modification requests like "Make it dual POV" or "Increase suspense" prior to acceptance; tracked via `refinement_history` array.

## 5. Data Model Additions
```python
class PremiseBuilderSession(BaseModel):
    id: UUID
    project_id: UUID | None
    status: Literal["in_progress", "completed", "abandoned"]
    current_step: int
    genre_profile: GenreProfile | None
    tone_theme_profile: ToneThemeProfile | None
    character_seeds: CharacterSeeds | None
    plot_intent: PlotIntent | None
    structure_targets: StructureTargets | None
    constraints_profile: ConstraintsProfile | None
    baseline_premise: PremiseArtifact | None
    premium_premise: PremiseArtifact | None
    refinement_history: list[PremiseRefinement]
    created_at: datetime
    updated_at: datetime
    version: int
```
- `premium_premise` stored both in `premise_builder_sessions` and persisted to the canonical `premises` collection as the active premise for the project.
- Add `builder_origin` field to `premises` (`guided`, `manual`, `imported`) for analytics.
- Maintain raw prompts/responses in `prompt_audit_log` referencing `session_id`.

## 6. API Surface (Draft)
| Endpoint | Method | Purpose | Auth |
| --- | --- | --- | --- |
| `/api/premise-builder/sessions` | POST | Create session (optionally attach `project_id`) | Authenticated user |
| `/api/premise-builder/sessions/{id}` | GET | Fetch session snapshot, including progress | Authenticated user |
| `/api/premise-builder/sessions/{id}` | PATCH | Update step payload; server validates step ordering | Authenticated user |
| `/api/premise-builder/sessions/{id}/ai` | POST | Invoke assistant action (lightweight model) for current step | Authenticated user |
| `/api/premise-builder/sessions/{id}/baseline` | POST | Trigger baseline synthesis (GPT-4o) | Authenticated user |
| `/api/premise-builder/sessions/{id}/premium` | POST | Trigger premium premise generation (Claude Sonnet 4.5 / GPT-5) | Authenticated user |
| `/api/premise-builder/sessions/{id}/complete` | POST | Mark as completed, persist to `premises` | Authenticated user |

- All endpoints enforce schema validation via Pydantic models; partial updates allowed only for current step.
- Rate limiting per user to avoid accidental spamming of premium models.

## 7. Prompt & Model Strategy
- **Lightweight Interactions (Steps 1-7)**: Use GPT-4o or Anthropic Haiku; responses capped at 300 tokens; temperature tuned per step (e.g., lower for tone warnings, higher for ideation).
- **Premium Synthesis (Step 8)**: Claude Sonnet 4.5 (primary) with fallback to GPT-5-Codex (Preview). Prompt structure:
  1. System message outlining role (award-winning novelist coach, respect constraints).
  2. User message containing structured JSON context with sections: `genre_profile`, `tone_theme_profile`, `character_seeds`, etc.
  3. Output spec requiring Markdown with summary sections + JSON metadata block (`target_word_count`, `chapter_count`, `key_conflicts`, `promise_of_premise`).
- Maintain token budget (<8K tokens input) by summarizing earlier steps if user added verbose notes; builder enforces per-field limits (e.g., 300 words for protagonist description).

## 8. Frontend Experience
- React wizard using shared `Stepper` component (persist state to Redux or React Query cache).
- Offline/refresh resilience: session id stored in URL + localStorage; upon reload, fetch latest server snapshot.
- Accessibility: keyboard navigation, screen reader-friendly labels, inline validation copy.
- Visual design: two-column layout (form left, AI assistant panel right). Assistant panel shows recent messages, suggested prompts.
- Provide "Skip AI suggestions" toggle for users who prefer manual input.

## 9. Telemetry & Analytics
- Track events via `analytics.track` (Mixpanel/Segment): `premise_builder_started`, `step_completed`, `ai_suggestion_accepted`, `premium_premise_generated`.
- Capture duration per step (`started_at`, `completed_at`). Highlight drop-off points in dashboards.
- Log token usage per model call for cost attribution.

## 10. Error Handling & Recovery
- Graceful degradation: if lightweight AI fails, show error banner with retry; allow manual progression.
- Premium failure fallback: display queue message, automatically retry up to 2 times with exponential backoff; optionally offer to downgrade to lightweight model with warning about quality.
- Manual override: user can paste external premise at Step 8 and mark session complete; flagged in metadata.

## 11. QA & Testing Notes
- Unit tests for step validators, step transitions, and schema merges.
- Integration tests simulating full wizard flow (mock AI responses) to ensure persistence and resume logic.
- Frontend Cypress/Playwright tests covering navigation, autosave, and assistant acceptance.
- Load testing to simulate concurrent premium generations; ensure rate limiting and queue behavior hold.

## 12. Rollout Plan
- **Phase A (Internal Alpha)**: Enable for admin accounts only; collect feedback, tweak prompts.
- **Phase B (Beta)**: Allow opt-in flag per project; track conversion vs manual premise form.
- **Phase C (Default)**: Make guided builder the default path, keep manual form accessible via secondary link.
- Add feature toggle in config service so backend can enforce availability.

## 13. Open Questions
- Should we allow multiple premium premise variants per session (e.g., A/B for different tones)?
- What is the retention policy for `premise_builder_sessions` once completed? Keep for analytics or purge after export?
- Do we need collaborative editing (multiple users in same session)? If so, conflict resolution strategy must be defined.
- How should we price or token-budget premium calls (deduct credits, show cost estimate)?

## 14. Next Steps
1. Review with stakeholders; confirm step taxonomy and required fields.
2. Finalize Pydantic schemas + migrations for new collections/fields.
3. Draft prompt templates and guardrails for each AI action.
4. Implement lightweight model helper service, then integrate front/back wizard endpoints.
5. Update README / docs index to reference this spec once implementation begins.

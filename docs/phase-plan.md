# AI Novel Generator  Phase Plan

> **Audience**: GPT-5 / Claude Sonnet 4.5 assistant engineers. Context window is assumed to be huge, so each section is intentionally verbose, explicit, and implementation-ready.

## 0. Global Assumptions
- **Stack**: Python 3.12, FastAPI, Pydantic v2, Uvicorn, Celery 5, Redis 7, MongoDB Atlas, React 18 + Vite + TypeScript.
- **Deployment Target**: Railway (web service + worker + Redis + MongoDB connection string managed via Railway environment variables).
- **AI Providers**: OpenAI (GPT-4.1, GPT-4o, GPT-5 when public), Anthropic (Claude 3.5 Sonnet). Preference order: Claude Sonnet > GPT-4o > GPT-4.1 > fallback (pluggable).
- **Token Budgeting**: Hard-coded defaults favor quality; budgets configurable per project. Summaries reduce prompt size but will never replace storing full text.
- **Documentation Style**: Everything in this repo must be self-descriptive for downstream agent consumption (long-form comments, structured metadata, JSON schemas).

## 1. Cross-Cutting Concerns
1. **Config Management**: Use `pydantic-settings` to map env vars; expose typed config objects to both API and worker. Provide UI-managed project-level overrides that write to MongoDB.
2. **Prompt Templates**: Store canonical templates in `config/prompt_templates/*.yaml`. Each template defines slots (`{premise}`, `{outline}`, `{recent_chapters}`) and metadata (intended model, max tokens, temperature). UI edits push revisions into MongoDB with audit trails.
3. **Observability**: Structured JSON logging via `structlog`. Include trace IDs per project + per chapter generation. Hook Railway log drains (Logtail/Sentry) early.
4. **Queue & Workflows**: Celery tasks are idempotent; pass `project_id`, `chapter_index`, `config_version`. Use a lightweight state machine persisted in Mongo to resume jobs.
5. **Testing**: Unit tests (pytest) for services, contract tests for API, integration tests for Celery workflows using `pytest-asyncio + fakeredis`.

---

## 2. Phase Breakdown

### Phase 0: Foundations & Scaffolding
**Goal**: Bootstrapped repo with CI, shared libraries, and deployable hello-world services.

| Area | Deliverables |
| --- | --- |
| Repository | `.editorconfig`, pre-commit hooks, MIT license, contribution guide. |
| Backend | FastAPI skeleton with health endpoint, Mongo connection manager, basic Pydantic models. |
| Frontend | Vite + React + TypeScript + Tailwind (or CSS modules) with routing and layout shell. |
| Infrastructure | `docker-compose.dev.yml` running API, frontend, Redis, Mongo for local dev. Railway project definition doc (manual steps). |
| CI/CD | GitHub Actions: lint, test, type-check (mypy), build front/back. |
| Secrets | `.env.example`, Railway variable naming convention doc. |

**Acceptance Criteria**
- `make dev` spins up entire stack locally.
- Railway deploys API + worker + frontend placeholders.
- Lint/test pipelines pass with sample tests.

### Phase 1: Premise Intake & Outline Engine
**Goal**: End-to-end flow from genre selection through outline persistence.

1. **Domain Modeling**
   - Collections: `projects`, `premises`, `outlines`. Each project references a single active premise + outline, plus revision history arrays.
   - Schema fields: word limits enforced at API layer (tokenizer-based word count using spaCy or custom regex tokenizer).
2. **Genre/Subgenre Catalog**
   - Store canonical list in JSON; expose via API; allow admin overrides later.
   - UI: dual dropdown with search + favorites; Christian and Romance pinned to top.
3. **Premise Form**
   - Fields: genre, subgenre, target word count, chapter count, premise text (textarea with live word counter and warning thresholds at 80%, 100%, 110%).
   - Validation: block submission past 5,000 words (server authoritative). Provide helpful error copy.
4. **Outline Generation Service**
   - Service method `generate_outline(project_id, premise_id, config)` orchestrates call to selected model.
   - Prompt template includes: premise, genre metadata, structural instructions (e.g., "Return JSON with `chapters` array; each chapter has `title`, `summary`, `target_word_count`).
   - Store raw prompt + response for audit.
5. **Review UI**
   - Outline viewer/editor (editable chapter titles, summaries). Use tiptap or textarea for quick edits.
   - Save increments version number; track diffs for future revert.

**Acceptance Criteria**
- User can create project, enter premise, receive outline, edit, and persist edits.
- API enforces word limit and schema validation.
- Outline generation logs include token usage, latency, selected model.

### Phase 2: Chapter Generation Workflow
**Goal**: Convert outline to manuscript via Celery-driven sequential generation with auto summaries.

1. **State Machine**
   - Project states: `draft`, `outline_ready`, `generating`, `paused`, `completed`, `error`.
   - Each chapter doc holds: `status`, `content`, `summary`, `tokens_used`, `config_snapshot`.
2. **Task Orchestration**
   - Kickoff endpoint schedules Celery chain: `generate_chapter(i)` for each chapter.
   - Each task fetches latest context: premise, outline, previous chapter texts, summaries.
   - After chapter 5, call `summarize_chapters(1..i-5)` to maintain context window; store summary history for potential regen.
3. **Prompt Strategy**
   - `chapter_prompt.yaml` references: `{premise}`, `{outline}`, `{chapter_outline}`, `{recent_chapters}`, `{chapter_summaries}`.
   - Provide heuristics for chunking (e.g., last 4 full chapters + aggregated summary string, trimmed to token budget).
4. **Failure Handling**
   - Retries with exponential backoff on API errors.
   - Manual "regenerate chapter" button requeues single chapter while maintaining sequence integrity.
5. **Progress UX**
   - Frontend polls status endpoint or subscribes via SSE/WebSocket (nice-to-have) to display chapter card statuses.

**Acceptance Criteria**
- Full manuscript generation completes for sample outline (mock models in tests, real models in staging).
- Summaries auto-update when threshold reached.
- User can pause/resume workflow.
- Logs show per-chapter metrics and aggregated totals.

### Phase 3: Configurability, Tooltips, A/B Testing
**Goal**: Make AI behavior transparent and tunable without code changes.

1. **Config Surfaces**
   - UI settings grouped into cards: Model, Creativity (temperature/top_p), Length (max tokens), Style Modifiers (system prompts), Safety rails.
   - Tooltips explain impact in plain language + examples.
2. **Prompt Template Editor**
   - Syntax-highlighted editor with variable insertion helpers.
   - Version history, preview rendering with sample data, validation to avoid missing placeholders.
3. **Experimentation**
   - Allow cloning config as "Variant B", run outline or chapter gen with both, show diff/comparison view.
   - Store metrics per variant: token count, latency, qualitative rating (manual input for now).
4. **Audit Trail**
   - Every generation stores `config_version` and `template_version`. Provide admin view to trace outputs back to inputs.

**Acceptance Criteria**
- Settings changes propagate to subsequent generations without redeploy.
- Users can run A/B outline tests and compare outputs side-by-side.
- Prompt template edits validated and versioned.

### Phase 4: Polish, Export, Analytics
**Goal**: Production-grade experience ready for onboarding heavy users.

1. **DOCX Export**
   - Use `python-docx` to build chapter-structured documents with metadata page (genre, config summary, timestamps).
   - Include both full text and appended summaries for downstream tools.
2. **Usage Analytics**
   - Track per-project token usage, time to completion, failure rates. Optional Mixpanel/Amplitude integration for UI events.
3. **Security & Compliance**
   - Role-based access control (if multi-user). Rate limiting per IP/token.
   - Automated backups of Mongo collections.
4. **Performance Tuning**
   - Batch summarization requests, parallelize where safe, add caching for static data (genre lists, template metadata).
5. **Documentation Hardening**
   - Generate architectural decision records (ADRs) for key choices.
   - Update onboarding docs, runbooks, and troubleshooting guides.

**Acceptance Criteria**
- User can export DOCX anytime with consistent formatting.
- Observability dashboards highlight token spend trends.
- Incident playbook exists for stuck Celery queues or model downtime.

---

## 3. Milestone Timeline (Aggressive Target)
| Phase | Duration | Dependencies |
| --- | --- | --- |
| Phase 0 | 1 week | None |
| Phase 1 | 2 weeks | Phase 0 |
| Phase 2 | 3 weeks | Phase 1 |
| Phase 3 | 2 weeks | Phases 1-2 |
| Phase 4 | 2 weeks | Phases 1-3 |

Parallelization notes: Config UI groundwork (Phase 3) can start once Phase 1 schemas exist. DOCX export (Phase 4) can overlap with late Phase 2.

## 4. Risk Register
| Risk | Mitigation |
| --- | --- |
| Premium model latency or availability issues | Implement fallback model chain + automatic retries, log metrics for manual review. |
| Context window overflows for very long books | Enforce summarization policies, add sliding window heuristics, optionally chunk chapters into parts. |
| Mongo write contention during rapid revisions | Use optimistic locking (version numbers) and granular collections per artifact. |
| User confusion over AI settings | Detailed tooltips, preset configs ("Balanced", "Creative", "Fast") with documentation links. |
| Cost overruns | Daily alert when tokens exceed threshold; admin dashboard for spend monitoring. |

## 5. Testing & QA Strategy
- **Unit**: Prompt renderers, validators, summarization reducers.
- **Integration**: API + Mongo + Redis via docker-compose in CI.
- **E2E**: Playwright tests covering premise submission, outline approval, chapter progress UI.
- **Load**: Simulate parallel generations to ensure Celery + Redis hold up; measure throughput on Railway.

## 6. Handoff Notes
- Keep README index updated when new docs are added.
- Treat this phase plan as living; append dated changelog entries for significant deviations.
- When delegating to another agent, provide `project_id`, `config_version`, and desired phase context to minimize prompt size.

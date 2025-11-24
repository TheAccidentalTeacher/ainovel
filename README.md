# AI Novel Generator

> **Status (2025-11-22)**: Phase 1 complete. Story Bible extraction, structured outline generation, chapter streaming, and bulk generation all live. Comprehensive narrative consistency system with multi-layer context (Story Bible + recent chapters + summaries) ensures 25-chapter coherence.

---

## Repository Index
| Artifact | Purpose |
| --- | --- |
| `README.md` (this file) | Status, architecture, and operator guidance. |
| `docs/system-overview.md` | Deep dive into data flow, domain models, AI prompts, and component wiring. |
| `docs/phase-plan.md` | Five-phase roadmap with acceptance criteria. |
| `docs/GUIDED_PREMISE_BUILDER.md` | **NEW: Complete spec for 8-step wizard with AI assistance and premium premise generation.** |
| `docs/NARRATIVE_CONSISTENCY_STRATEGY.md` | Multi-layer context system design (Story Bible + chapters + summaries). |
| `docs/phase-0-complete.md` | Historical completion report for Phase 0. |
| `docs/phase-1-progress.md` | Rolling changelog for current work (updated 2025-11-22). |
| `docs/railway-deployment.md` | Deployment/runbook targeting Railway. |
| `config/genres.json` | Canonical ordering of 22 genres × 10 subgenres. |
| `config/prompt_templates/` | YAML prompt packs for outline, chapter, and summary flows. |

---

## Feature Snapshot
| Domain | Delivered | Notes |
| --- | --- | --- |
| Premise Intake | ✅ | FastAPI enforces 5k-word limit; frontend shows live counter and genre ordering. |
| **Guided Premise Builder** | 🚧 **In Progress** | **8-step wizard with AI assistance at each stage. Baseline synthesis (GPT-4o) → Premium premise (Claude Sonnet 4.5). Backend models, API, and service complete.** |
| Story Bible | ✅ | Claude Sonnet 4.5 generates character/setting dossiers (16K tokens). Modal allows review/edit. |
| Structured Outline | ✅ | Outline prompt mandates nine fields (opening scene, characters, locations, plot beats, character development, subplot progress, closing scene, tone tags, 300-word summary). Frontend renders/edits all fields. |
| Outline Versioning | ✅ | PUT increments version & target words; DELETE resets project status. |
| Chapter Generation | ✅ | SSE streaming endpoint with real-time word count, stop button, chapter viewer with copy-to-clipboard. |
| Narrative Consistency | ✅ | Multi-layer context system: Story Bible (always) + recent chapters (full text) + older chapters (summaries). Auto-generated 300-400 word summaries track plot. |
| Bulk Generation | ✅ | "Generate All Chapters" button with progress modal, sequential orchestration, automatic context assembly, real-time progress tracking. |
| Workers / Redis | ⏳ Future | Settings placeholders exist; generation currently synchronous (SSE streams for UX). |

---

## Narrative Pipeline Overview
1. **Guided Premise Builder (NEW)** – `POST /api/premise-builder/sessions` starts 8-step wizard collecting genre, tone, characters, plot, structure, constraints with AI assists at each step. Step 7 generates baseline premise (GPT-4o), Step 8 generates premium long-form premise (Claude Sonnet 4.5). Session completion persists final premise to project.
2. **Project Creation** – `POST /api/projects` persists title, genre, AI config override (optional), and validated premise (spaCy word count). Can be used standalone or integrated with premise builder.
3. **Story Bible Extraction** – `POST /api/projects/{id}/generate-story-bible` calls `story_bible_service` (max_tokens=16k) to capture characters, settings, tone, themes; versions stored in `story_bibles` collection.
4. **Outline Generation** – `POST /api/projects/{id}/generate-outline` merges premise + Story Bible context, enforces JSON schema, and writes to `outlines` collection (`ProjectStatus` flips to `outline_ready`).
5. **Outline Editing** – `/projects/:id/outline` page lets users edit every structured field and target word count; saves go through `PUT /api/projects/{id}/outlines/{outline_id}`.
6. **Chapter Generation** – `GET /api/projects/chapters/{project_id}/{chapter_index}/stream` provides SSE streaming with real-time text display and word counter. Context automatically assembled from Story Bible + previous chapters + summaries.
7. **Bulk Generation** – `GET /api/projects/bulk/{project_id}/generate-all` sequentially generates all chapters with automatic context management, summary creation, and progress streaming.
8. **Summary Auto-Generation** – After each chapter (except last), `summary_service` generates 300-400 word summaries capturing plot events, character development, and unresolved tensions for future context.

Full diagrams and schema definitions live in `docs/system-overview.md`.

---

## Architecture Snapshot
```
React 19 + Vite + Tailwind (localhost:5173)
    └── TanStack Query API client (Axios, 10 min timeouts)
          └── FastAPI 0.121 (localhost:8000/api)
                ├── Story Bible service (Anthropic Claude Sonnet 4.5, 16K tokens)
                ├── Outline service (Claude Sonnet 4.5, up to 64K tokens)
                └── Chapter service (implemented, not routed yet)
                      └── MongoDB Atlas via Motor (projects, premises, story_bibles, outlines, chapters, summaries)
```

---

## Backend Surface Area
| Router | Endpoints (prefixed with `/api`) | Highlights |
| --- | --- | --- |
| `health.py` | `GET /health`, `GET /ready` | Health & readiness probes (Mongo heartbeat cached). |
| `genres.py` | `GET /genres` | 22 genres × 10 subgenres sorted with Christian/Romance first. |
| `projects.py` | `POST /projects`, `GET /projects`, `GET /projects/{id}`, `DELETE /projects/{id}` | Detail view eagerly loads premise, Story Bible, outline. |
| `story_bible.py` | `POST/GET/PUT/DELETE /projects/{id}/story-bible` | Versioned Story Bible management with AI + manual edits. |
| `outlines.py` | `POST /projects/{id}/generate-outline`, `PUT /projects/{id}/outlines/{outline_id}`, `DELETE /projects/{id}/outlines/{outline_id}` | Structured outline enforcement, version bumping, project status updates. |
| `chapters.py` | `GET /projects/chapters/{project_id}/{chapter_index}/stream`, `POST /projects/chapters`, `GET /projects/chapters/{project_id}`, `DELETE /projects/chapters/{project_id}/{chapter_id}` | SSE streaming generation, chapter CRUD, automatic context fetching. |
| `summaries.py` | `POST /summaries/{project_id}/chapters/{chapter_index}`, `POST /summaries/{project_id}/chapters/batch`, `GET /summaries/{project_id}`, `DELETE /summaries/{project_id}/summaries/{summary_id}` | Auto-generate 300-400 word chapter summaries for context. |
| `bulk_generation.py` | `GET /bulk/{project_id}/generate-all` | Sequential all-chapters generation with SSE progress (chapter_started, chapter_complete, summary_complete, complete events). |

Collections: `projects`, `premises`, `story_bibles`, `outlines`, `chapters`, `summaries`. Index creation logic lives in `backend/models/database.py`.

---

## Frontend Surface Area
| Route | Component | Functionality |
| --- | --- | --- |
| `/projects` | `pages/HomePage.tsx` | Paginated project list, status badges, empty states. |
| `/projects/new` | `pages/NewProjectPage.tsx` | Genre/subgenre selectors, live premise word counter, submits `POST /projects`. |
| `/projects/:id` | `pages/ProjectDetailPage.tsx` | Premise viewer, Story Bible cards + modal, outline renderer with action buttons. |
| `/projects/:id/outline` | `pages/OutlineEditorPage.tsx` | Full-form editor for all nine outline fields + target word count. |
| Modal | `components/StoryBibleModal.tsx` | Detailed Story Bible viewer/editor (dark theme, scrollable). |

TanStack Query drives data fetching; keys mirror REST resources (`['project', id]`, etc.) for predictable cache invalidation.

---

## Local Development
### Prerequisites
- Python 3.12+
- Node 20+
- MongoDB (local Docker or Atlas). Redis remains optional until Celery lands.
- Anthropic/OpenAI API keys stored in `backend/.env`.

### Backend
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download en_core_web_sm
Copy-Item .env.example .env   # populate Mongo + API keys
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

### Smoke Test
1. Visit `http://localhost:5173`.
2. Create a project via "New Project".
3. Generate a Story Bible, then an outline.
4. Open "Edit Outline" and confirm structured fields persist after saving.

---

## Observability & Logging
- **Backend**: structlog emits JSON with `event` fields (`outline_generation_started`, `story_bible_generation_failed`, etc.). Monitor Uvicorn console locally or Railway log drains in prod.
- **Frontend**: `[APIClient]` console logs trace Axios lifecycle; TanStack Query surfaces errors in UI banners.

---

## Known Gaps / TODOs
1. **Chapter Endpoint/UI** – `chapter_service.generate_chapter_from_outline` is unused until we add REST endpoints and ProjectDetail UI buttons.
2. **ProjectStatus Regression** – `outlines.delete_outline` references `ProjectStatus.STORY_BIBLE_READY`, which does not exist. Deleting an outline currently raises `AttributeError`; update the enum or adjust the fallback logic.
3. **Workers** – Redis/Celery settings exist but no worker module is running. Current AI calls are synchronous on the API process.
4. **Deployment Doc Drift** – Railway guide still references worker service; see guide notes when deploying API-only builds.
5. **Exports/Analytics** – DOCX export, cost tracking, and telemetry dashboards remain future work.

Keep `docs/system-overview.md` synchronized with structural changes so downstream AI agents remain aligned with the live stack.

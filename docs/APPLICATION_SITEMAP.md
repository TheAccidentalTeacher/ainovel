# Application System Map

**Last Updated:** December 1, 2025  \
**Maintainer:** WriteMind Studios Core Team

This document is the high-level atlas for the AI Novel Generator codebase. It shows where each major capability lives, which documentation explains it in depth, and how to move between frontend, backend, and operational layers without hunting.

---

## 1. Top-Level Directory Guide

| Path | Purpose | Key References |
| --- | --- | --- |
| `backend/` | FastAPI application, AI services, MongoDB models, and background utilities. | [`system-overview.md`](system-overview.md), [`README.md`](../README.md#backend-surface-area) |
| `frontend/` | React 19 + Vite client: Novel Studio UI, Book Cover Designer, Chat/Bot widget. | [`README.md`](../README.md#frontend-surface-area), [`PHASE_1.5_WRITEMIND_LAYOUT.md`](PHASE_1.5_WRITEMIND_LAYOUT.md) |
| `docs/` | Knowledge base (50+ guides). Use [`DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md) for full listing. | This file, Documentation Index |
| `config/` | Global rule sets, genre taxonomy, AI prompt templates. | [`config/anti_ai_tell_rules.md`](../config/anti_ai_tell_rules.md), [`config/prompt_templates/`](../config/prompt_templates) |
| `tools/` | Command‑line helpers (e.g., DOCX → text converter). | [`tools/docx_to_text.py`](../tools/docx_to_text.py) |
| `docs/book_covers/` | Design briefs, typography, and export research. | [`BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md`](BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md) |

### Backend Highlights
- `backend/api/` – REST routers (projects, story bibles, outlines, chapters, summaries, chat, agents, book covers).
- `backend/services/` – Business logic (chapter generation, premise builder, multi-agent system, Tavily search integration).
- `backend/models/` – Pydantic schemas and MongoDB accessors.
- `backend/config/settings.py` – Environment configuration (API keys, ports, CORS, feature flags).

### Frontend Highlights
- `frontend/src/pages/` – Route-level screens (Novel Studio, Book Cover Designer, Bots, Chat).
- `frontend/src/components/` – Reusable UI pieces (ChatWidget, Outline editors, etc.).
- `frontend/src/services/` – Axios clients (projects, chat, agents, book covers) with TanStack Query hooks.

---

## 2. Feature Map

### A. Writing Pipeline (Premise → Story Bible → Outline → Chapters)
| Layer | Source | Docs |
| --- | --- | --- |
| Premise Builder | `backend/services/premise_builder_service.py`, `frontend/src/pages/PremiseBuilderPage.tsx` | [`GUIDED_PREMISE_BUILDER.md`](GUIDED_PREMISE_BUILDER.md), [`PREMISE_BUILDER_API_QUICKSTART.md`](PREMISE_BUILDER_API_QUICKSTART.md) |
| Story Bible | `backend/services/story_bible_service.py`, `frontend/src/components/StoryBiblePanel.tsx` | [`STORY_BIBLE_FEATURE.md`](STORY_BIBLE_FEATURE.md) |
| Outline | `backend/api/outlines.py`, `frontend/src/pages/OutlineEditorPage.tsx` | [`ITERATION_QUICK_START.md`](ITERATION_QUICK_START.md) |
| Chapter Generation | `backend/services/chapter_service.py`, `frontend/src/pages/ChapterWorkspace.tsx` | [`config/anti_ai_tell_rules.md`](../config/anti_ai_tell_rules.md), [`NARRATIVE_CONSISTENCY_STRATEGY.md`](NARRATIVE_CONSISTENCY_STRATEGY.md) |
| Bulk Generation | `backend/api/bulk_generation.py`, `frontend/src/pages/BulkGenerationModal.tsx` | [`BULK_GENERATION.md`](BULK_GENERATION.md), [`BULK_GENERATION_TEST_PLAN.md`](BULK_GENERATION_TEST_PLAN.md) |

### B. Chat, Bots, and Agent System
| Capability | Code | Docs |
| --- | --- | --- |
| Global Chat Widget | `frontend/src/components/ChatWidget.tsx`, `frontend/src/pages/ChatPage.tsx`, `backend/api/chat.py` | [`CHATBOT_PHASE1_COMPLETE.md`](CHATBOT_PHASE1_COMPLETE.md), [`CHAT_QUICKSTART.md`](CHAT_QUICKSTART.md) |
| Tavily Search | `backend/services/tavily_service.py`, `frontend/src/components/SearchFeatureTour.tsx` | [`TAVILY_ADVANCED_GUIDE.md`](TAVILY_ADVANCED_GUIDE.md) |
| Agent Registry + Debate | `backend/api/agents.py`, `backend/services/*_agent.py`, `frontend/src/services/agentService.ts` | [`BOT_SYSTEM_ARCHITECTURE.md`](BOT_SYSTEM_ARCHITECTURE.md), [`ALANA_BOT_CONFIGURATION.md`](ALANA_BOT_CONFIGURATION.md) |
| Bot UX (Agent/Debate modes) | `frontend/src/components/ChatWidget.tsx` | [`CHATBOT_BUILD_PLAN_V2.md`](CHATBOT_BUILD_PLAN_V2.md) |

### C. Book Cover Designer
| Layer | Code | Docs |
| --- | --- | --- |
| Story Analysis & Brief | `backend/book_covers/routes.py`, `frontend/src/pages/BookCoverDesigner.tsx` | [`BOOK_COVER_FEATURE_IMPLEMENTATION_PLAN.md`](BOOK_COVER_FEATURE_IMPLEMENTATION_PLAN.md) |
| Image Generation | `backend/book_covers/services/models.py`, `frontend/src/components/CoverVariations.tsx` | [`BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md`](BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md) |
| Typography & Export | (Phase 3 assets) | [`BOOK_COVER_PROMPT_GUIDE.md`](BOOK_COVER_PROMPT_GUIDE.md) |

### D. Manuscript Analysis & QA
| Focus | Code / Docs | Notes |
| --- | --- | --- |
| Anti-AI-Tell Rules | `config/anti_ai_tell_rules.md`, `backend/services/chapter_service.py` | 13 universal rules, V3 validated (A- grade) |
| Manuscript Audit Trail | `MANUSCRIPT_REVIEW_TRACKER.md`, `AI_TELL_ANALYSIS_RESULTS.md` | Track iterations V1→V3 |
| Quantitative Scorecards | `PRODUCTION_GENERATION_V1/2/3_ANALYSIS.md` | Use for regression testing |

---

## 3. Backend ↔ Frontend Cross-Reference

| API Route | Frontend Entry | Description |
| --- | --- | --- |
| `/api/projects` | `frontend/src/pages/HomePage.tsx` | Project CRUD, status badges |
| `/api/projects/{id}/story-bible` | `StoryBiblePanel`, modals | Story Bible versioning & edits |
| `/api/projects/{id}/generate-outline` | Outline editor | Structured outlines with nine required fields |
| `/api/projects/chapters/.../stream` | Chapter workspace, chat widget context | SSE streaming chapter generation |
| `/api/bulk/{project_id}/generate-all` | Bulk Generation modal | Sequential chapter orchestration |
| `/api/book-covers/...` | Book Cover Designer wizard | Story analysis → brief → image generation |
| `/api/chat/*` | Chat widget & fullscreen chat | Claude Sonnet 4.5 streaming chat, Tavily search |
| `/api/agents/*` | Chat widget bot selector | Agent list, single-agent chat, debates |

---

## 4. Documentation Jump List

| Need | Go To |
| --- | --- |
| Full documentation catalog | [`DOCUMENTATION_INDEX.md`](../DOCUMENTATION_INDEX.md) |
| Project status & roadmap | [`PROJECT_STATUS_REPORT.md`](PROJECT_STATUS_REPORT.md), [`phase-plan.md`](phase-plan.md) |
| Writing quality rules | [`config/anti_ai_tell_rules.md`](../config/anti_ai_tell_rules.md) |
| Chatbot + Bot initiative | [`CHATBOT_PHASE1_COMPLETE.md`](CHATBOT_PHASE1_COMPLETE.md), [`BOT_SYSTEM_ARCHITECTURE.md`](BOT_SYSTEM_ARCHITECTURE.md) |
| Book cover workflow | [`BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md`](BOOK_COVER_DESIGN_COMPREHENSIVE_GUIDE.md) |
| Deployment help | [`railway-deployment.md`](railway-deployment.md), [`DEPLOYMENT_TROUBLESHOOTING.md`](DEPLOYMENT_TROUBLESHOOTING.md) |

---

## 5. Keeping This Map Current
- Update the **Last Updated** date whenever directories or routing change.
- Add new rows for any major feature folder, data store, or API surface area.
- Cross-link new docs and specs so they are reachable in ≤2 clicks from this index.
- When archiving a feature, mark its entry as **Historical** and point to replacement docs.

This system map should be the first stop after `README.md` for anyone trying to orient themselves in the repo.

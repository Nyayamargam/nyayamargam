# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**NavyaSathi** — a legal companion PWA for Indian citizens navigating government procedures. Phase 1 is complete: a Vehicle/Traffic intake loop using Gemini 2.0 Flash as the LLM, Sarvam AI for STT/TTS, and Supabase (Postgres) as the case store.

## Commands

### Backend (FastAPI, Python 3.11+)

```bash
cd backend
source .venv/bin/activate          # activate venv
uvicorn app.main:app --reload      # dev server → http://localhost:8000
```

No test suite yet. Manual smoke tests:
```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/case -H "Content-Type: application/json" -d '{"language":"en"}'
```

Swagger UI: `http://localhost:8000/docs`

The backend reads `.env` from the **current working directory** (i.e., `backend/`). Copy the root `.env` into `backend/` before running:
```bash
cp ../.env .env
```

### Frontend (React + Vite PWA)

```bash
cd frontend
npm install
npm run dev       # → http://localhost:5173
npm run build     # tsc + vite build
npm run preview   # preview prod build
```

Vite proxies `/api/*` → `http://localhost:8000` in dev (no CORS issues).

## Architecture

```
Cloudflare Pages (PWA)          Supabase (Postgres)
       ↕                                ↕
   Render (FastAPI)  ←→  Gemini 2.0 Flash API
                     ←→  Sarvam AI (STT/TTS)
```

### Backend structure (`backend/app/`)

- `main.py` — FastAPI app, CORS middleware, router registration
- `config.py` — `Settings` (pydantic-settings, reads `.env`), accessed via `get_settings()` with `@lru_cache`
- `db/supabase.py` — `get_supabase()` returns a cached `supabase.Client` using `SUPABASE_SERVICE_ROLE_KEY`
- `routes/cases.py` — `POST /case`, `GET /case/{code}`, `POST /case/{code}/message`
- `routes/speech.py` — `POST /speech/stt` proxies audio to Sarvam AI (`saarika:v2` model)
- `services/orchestration.py` — core LLM logic: builds the system prompt with filled slots + knowledge context, calls `gemini-2.0-flash` via `google-genai` SDK, parses structured JSON response, merges slot updates
- `services/knowledge.py` — returns static Vehicle/Traffic procedural knowledge for the system prompt
- `models/case.py` — Pydantic request/response models and `CaseStatus` enum

### Frontend structure (`frontend/src/`)

- `App.tsx` — React Router routes: `/` → Home, `/intake/:code` → Intake, `/case/:code` → CaseWorkspace
- `services/api.ts` — typed fetch wrappers for all backend endpoints; base URL from `VITE_API_BASE_URL`
- `services/sarvam.ts` — browser-side audio recording + upload to `/api/speech/stt`
- `pages/Intake.tsx` — conversational intake UI (one question per turn)
- `pages/CaseWorkspace.tsx` — post-intake case summary view

### Data model

Cases are stored in a single `cases` table with JSON columns:
- `slots` — named intake fields (see orchestration system prompt for the 9 slots)
- `messages` — full conversation history as `[{role, content, timestamp}]`
- `status` — `intake` → `pending_docs` (on intake completion)

Schema lives in `backend/app/db/migrations/001_init.sql`. Run it manually in the Supabase SQL editor; there is no migration runner.

### LLM integration

`orchestration.py` uses **Gemini 2.0 Flash** via the `google-genai` SDK (not the older `google-generativeai`). The SDK is `genai.Client(api_key=...)`, async calls via `client.aio.chats`. The model is prompted to return **only valid JSON** with a fixed schema (`reply`, `slots`, `intake_complete`). Slot merging is additive — only non-null/non-empty values overwrite existing slots.

## Environment variables

Copy `.env.example` to `.env` (and to `backend/.env` for local dev). Key variables:

| Variable | Used by |
|---|---|
| `GEMINI_API_KEY` | LLM + (future) vision OCR |
| `SARVAM_API_KEY` | STT proxy in `/speech/stt` |
| `SUPABASE_URL` | Both backend and keep-alive Action |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only (never expose to client) |
| `VITE_API_BASE_URL` | Frontend build (Cloudflare Pages env var) |

## Deployment

- **Backend** → Render free tier (root: `backend/`). Cold starts ~30–50s; warm with `curl .../health` before demos.
- **Frontend** → Cloudflare Pages (root: `frontend/`, framework: Vite).
- **DB** → Supabase; pauses after 7 days idle — GitHub Action at `.github/workflows/supabase-keepalive.yml` pings every 3 days.

## Phase roadmap

Phase 1 (complete): Vehicle/Traffic intake loop. Phases 2–8 add document intelligence (Gemini vision), pgvector RAG, domain expansion, Case Watch scheduler, PDF drafts, and full Hindi/Telugu localization. See `plan_nyayamargam.md` for the detailed phase plan.

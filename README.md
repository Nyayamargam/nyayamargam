# NavyaSathi

A legal companion PWA for Indian citizens navigating government procedures — built on free tiers.

**Phase 1 scope:** Vehicle/Traffic intake loop with Claude LLM + Sarvam STT/TTS, backed by Supabase.

---

## Prerequisites

- Python 3.11+
- Node 20+
- A Supabase project (free tier)
- API keys: Anthropic (Claude), Gemini, Sarvam AI

---

## 1. Clone and configure secrets

```bash
cp .env.example .env
# Fill in all REPLACE_ME values in .env
```

---

## 2. Supabase setup

1. Create a project at supabase.com
2. Go to **Dashboard → SQL Editor → New query**
3. Paste and run the contents of `backend/app/db/migrations/001_init.sql`
4. Copy your **Project URL** and **service_role key** into `.env`
5. Copy the **anon key** into `.env` as `SUPABASE_ANON_KEY` (used only by the keep-alive Action)

---

## 3. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy the .env file into the backend directory (uvicorn loads from CWD)
cp ../.env .env

uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

Quick sanity check:
```bash
curl http://localhost:8000/health
# {"status":"ok"}

curl -X POST http://localhost:8000/case \
  -H "Content-Type: application/json" \
  -d '{"language":"en"}'
```

---

## 4. Frontend (React + Vite PWA)

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` → `http://localhost:8000` so no CORS issues locally.

---

## 5. Deploy

### Backend → Render

1. Push to GitHub
2. New Web Service → connect repo, set **Root Directory** to `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add all env vars from `.env.example` (except `VITE_*` and `SUPABASE_ANON_KEY`) in the Render dashboard
6. Note the deployed URL (e.g. `https://navyasathi-api.onrender.com`)

### Frontend → Cloudflare Pages

1. New Pages project → connect repo, set **Root Directory** to `frontend`
2. Framework preset: **Vite**
3. Add env var: `VITE_API_BASE_URL=https://navyasathi-api.onrender.com`
4. Deploy

### Supabase keep-alive (prevents 7-day idle pause)

1. Add two GitHub repo secrets: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
2. The workflow in `.github/workflows/supabase-keepalive.yml` runs automatically every 3 days

---

## Architecture

```
Cloudflare Pages (PWA)          Supabase (Postgres + pgvector)
       ↕                                  ↕
   Render (FastAPI)  ←→  Anthropic Claude API
                     ←→  Sarvam AI (STT/TTS)
                     ←→  Gemini API (fallback + Phase 2 OCR)
```

---

## Warming the backend before a demo

The Render free tier spins down after ~15 minutes idle. Before presenting, hit the health endpoint once:

```bash
curl https://navyasathi-api.onrender.com/health
```

Wait for the response (up to 50 seconds), then you're ready.

---

## Phase roadmap

| Phase | What's built |
|---|---|
| **1 (this)** | Core intake loop — Vehicle/Traffic domain, Claude LLM, Sarvam STT |
| 2 | Document Intelligence — Gemini vision OCR, expiry checks |
| 3 | Transparent Reasoning — "Why I'm asking" chip |
| 4 | Domain expansion — Pension/Welfare, Utility/Consumer, pgvector RAG |
| 5 | Case Watch — 24h scheduler, Web Push alerts |
| 6 | PDF draft generation, rejection-slip explainer |
| 7 | Full Hindi + Telugu parity, accessibility audit |
| 8 | Demo hardening |

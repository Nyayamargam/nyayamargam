# NavyaSathi — Free Stack & Build Plan

> Companion to PRD v3.0. Goal: build the full product on genuinely free tiers, good enough to develop and win a demo, with a clear line for where paid usage begins.

---

## 0. The one honest caveat

Everything in the PRD can run on free tiers **except AI inference** — the LLM, vision/OCR, and speech. Those have generous free signup credits that cover the entire build plus a hackathon demo, but they meter per-token / per-minute / per-character at real user scale. This plan keeps every *infrastructure* cost at ₹0 and treats the AI providers' free credits as the budget for the demo.

Nothing here requires a credit card except (optionally) Sarvam if you exhaust the signup credits.

---

## 1. Recommended free stack

| Layer | Choice | Free-tier reality (2026) | Notes / caveats |
|---|---|---|---|
| **Frontend PWA** | React + Vite → **Cloudflare Pages** | Fully free, global CDN, no cold starts | Best free host for a PWA shell. Alternatives: Netlify, Vercel (both fine). |
| **Backend API** | **FastAPI** → **Render free web service** | Permanent free tier; spins down after ~15 min idle, 30–50s cold start | Only major platform with a *real* permanent free tier now. Railway & Fly.io removed theirs. Warm it before the demo. |
| **Primary DB + Vector store** | **Supabase** (Postgres + `pgvector`) | 500 MB DB, 1 GB storage, `pgvector` free on all plans; **pauses after 7 days idle** | One service = case data **and** the RAG vector store. Add a keep-alive ping (GitHub Action or UptimeRobot) so it never pauses mid-demo. |
| **LLM (reasoning + grounded phrasing)** | **Claude API** (per PRD) | Anthropic: signup credits, then pay-as-you-go | Best for source-constrained, no-hallucination phrasing. |
| **LLM zero-cost fallback** | **Google Gemini API** (AI Studio free tier) | Real free tier, multimodal | Swap-in if you want literally ₹0. Also handles vision/OCR with the same key. |
| **OCR / Vision** (Features 4 & 9) | **Gemini free-tier vision** | Free tier covers a demo | Reads Aadhaar/RC/insurance/rejection slips well enough. Fallback: Tesseract (free, self-host, weaker on Indic). |
| **Speech STT/TTS** (Features 2, 8, 10) | **Sarvam AI** | ₹1000 signup credits; then ~₹1.5/min STT, ~₹30/10K chars TTS | **The critical India-specific pick.** Purpose-built for Telugu/Hindi–English code-switching your personas require. |
| **Speech free fallback** | **Whisper** (self-host) + **AI4Bharat IndicConformer/Indic-TTS** | Fully free, open weights | No per-minute cost, but heavier to run and weaker code-switch than Sarvam. |
| **PDF generation** (Feature 7) | **WeasyPrint** or **ReportLab** inside FastAPI | Free, self-hosted | HTML→PDF matches PRD's plan. No external service. |
| **Push notifications** (Feature 8) | **Web Push API** + VAPID keys | Free, browser-native | Matches the PWA architecture. |
| **Scheduler** (Case Watch, Feature 8) | **GitHub Actions cron** or Render Cron | Free | Triggers the 24h re-evaluation job. |
| **Source control / CI** | **GitHub** | Free (public repo) | Public repo also gives free Actions minutes for keep-alive + cron. |

### Why these specifically
- **Render over Railway/Fly.io** — as of 2026 Railway only gives a 30-day trial and Fly.io a 2-hour trial; Render is the only one with a permanent $0 web-service tier. Accept the cold start; warm the service before pitching.
- **Supabase over separate Postgres + Pinecone** — `pgvector` lives free alongside your case data, so the RAG layer and case store are one instance. No vector-DB sync complexity, no Pinecone bill.
- **Sarvam over Web Speech API** — Lakshmi (Telugu, no English) and Ravi (Telugu-English code-switch) are the core users. Generic browser STT and English-first models break exactly on the code-switching the PRD calls a P0 requirement. Sarvam is trained on Indian speech and handles this natively.
- **Cloudflare Pages over the backend serving the frontend** — keeps the PWA fast and always-on even while the free backend is cold.

---

## 2. Architecture mapping (PRD service → free component)

| PRD service | Runs on |
|---|---|
| API Gateway (Case-Code sessions, rate limiting) | FastAPI router on Render |
| Orchestration Service | FastAPI module → Claude/Gemini API |
| Domain Knowledge Service (RAG) | Supabase `pgvector` + metadata table |
| Document Intelligence Service (OCR + validity) | FastAPI module → Gemini vision + Python rules engine |
| Case Watch Scheduler | GitHub Actions cron → FastAPI `/internal/rescan` |
| Notification Service | Web Push (VAPID) from FastAPI |
| PDF Generation Service | WeasyPrint in FastAPI |
| Primary DB (cases) | Supabase Postgres (JSON columns per PRD) |

Keep the Document Intelligence path isolated as the PRD requires: raw images go to the vision call and are discarded; **only extracted structured fields** enter the orchestrator's LLM context.

---

## 3. Environment / secrets

Store server-side only (never in client code, per PRD security):

```
ANTHROPIC_API_KEY=          # Claude
GEMINI_API_KEY=             # fallback LLM + vision/OCR
SARVAM_API_KEY=             # STT + TTS
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=  # server-side only
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

On Render: set these as environment variables in the dashboard. On Cloudflare Pages: only the VAPID **public** key and API base URL are exposed to the client.

---

## 4. Build plan (phased, mapped to PRD Milestones 1–8)

### Phase 1 — Core Intake Loop (PRD Milestone 1)
- Scaffold FastAPI + Supabase schema (`Case`, `DocumentRecord`, etc. from PRD Database Design).
- Implement `POST /case`, `GET /case/{code}`, `POST /case/{code}/message`.
- Wire Claude (or Gemini) for intent classification + slot-filling, **one question per turn**.
- Frontend: Home screen + intake flow (one input per screen), Sarvam STT/TTS wired with the confirmation-first pattern.
- One domain end-to-end: **Vehicle/Traffic**, through to a generated Case Workspace.
- **Free-tier check:** confirm Supabase keep-alive is running; confirm Sarvam credits are live.

### Phase 2 — Document Intelligence (Milestone 2)
- `POST /case/{code}/document` → Gemini vision extraction → editable review card.
- Rules-based validity engine (expiry / renewal / recency) cross-referenced to domain requirements.
- Expiry-catch remediation flow (halt + plain-language fix) — this is a demo centerpiece.
- Client-side image compression before upload (≤10 MB, per PRD).

### Phase 3 — Transparent Reasoning (Milestone 3)
- "Why I'm asking" chip: per-question justification generation, collapsed by default.
- Suppress confidence scores / technical labels from the UI (PRD Feature 3).

### Phase 4 — Domain Expansion (Milestone 4)
- Build the `pgvector` knowledge base: scrape + human-review procedure sources for **Pension/Welfare** and **Utility/Consumer**.
- Store source URL + last-verified date per entry (internal only).
- Enforce the hard grounding rule: no procedural fact without a retrieved passage → else the "we're not fully certain" fallback.

### Phase 5 — Case Watch (Milestone 5)
- GitHub Actions cron → `/internal/rescan` re-evaluates active cases vs current date + KB.
- In-app alert cards + opt-in Web Push.
- "Mark Resolved" stops monitoring.

### Phase 6 — Rejection Explainer & Draft Generation (Milestone 6)
- Feature 7: template-constrained draft → WeasyPrint PDF at `GET /case/{code}/draft.pdf`.
- Feature 9: rejection-slip OCR → RAG-grounded explanation → revised action plan.

### Phase 7 — Accessibility & Localization (Milestone 7)
- Full Hindi + Telugu parity for UI strings, AI output, and TTS.
- Human-reviewed glossary for government/legal terms (prevent mistranslation of document names).
- Screen-reader labels, 48×48px targets, ≥4.5:1 contrast, 200% text scaling — audit every card.

### Phase 8 — Demo Hardening (Milestone 8)
- Rehearse all 5 demo beats against the real build.
- **Warm the Render backend** right before the demo (hit it once to kill the cold start).
- Record fallback videos for every live dependency (network, Sarvam, Gemini) per PRD.
- Pre-load a prop expired document for the expiry-catch beat.

### Phase 9 — Domain Expansion without Hallucination

**The core tension:** expanding to new domains risks re-introducing exactly the hallucination failure mode the product exists to eliminate. The goal is not to let the LLM answer freely — it is to expand what is *grounded* so more domains are covered without guessing.

#### Three trust tiers

| Tier | Name | Source | UI treatment |
|---|---|---|---|
| 🟢 Green | Verified | Hand-curated `pgvector` KB, human-reviewed | Full confident workspace — unchanged from today |
| 🟡 Amber | Best-effort | Live Gemini grounded retrieval, official-source allowlist only | Cautious card: "This isn't one of our verified areas yet. Here's what we found on [source] — please confirm the exact step with the office before you travel." No full workspace generated. |
| 🔴 Red | Unknown | Allowlist retrieval found nothing relevant | Today's behaviour: uncertainty statement + helpline. |

**The key invariant:** Amber is grounded-and-cited or it does not answer. A citation to a non-allowlisted source (blog, forum, news) is treated as no citation → Red. The LLM never invents procedure at any tier.

#### Official-source allowlist

Post-filter Gemini's `groundingChunks` to keep only:
- `*.gov.in`, `*.nic.in`
- `india.gov.in`, `services.india.gov.in`, UMANG portal
- State government portals (`*.maharashtra.gov.in`, etc.)
- Sector regulators (IRDAI, SEBI, TRAI, CEA, NHAI, etc.)
- `nsap.nic.in`, `parivahan.gov.in`, `sarathi.parivahan.gov.in`, `pmjay.gov.in`, etc.

Store the allowlist in a DB table (`allowed_sources`), not inline code, so adding a new official portal is a data operation, not a deploy.

#### Routing logic

```
query → classify intent
  ├─ matches a Green domain → pgvector RAG (unchanged)
  └─ no Green match
        ├─ Amber: Gemini grounded retrieval, post-filter to allowlist
        │     ├─ ≥1 allowlisted citation found → answer strictly from it,
        │     │     cite it, label Amber visually + in TTS voice,
        │     │     log query for promotion review
        │     └─ no allowlisted citation → Red: helpline fallback, log query
```

#### Schema-driven domain agent (prerequisite refactor)

`orchestration.py` currently hardcodes `DOMAIN_CONFIG` as a Python dict. Before Amber is live, refactor to a `domains` DB table so a new domain is a data record, not a code change:

```sql
-- domains table (new)
id          uuid primary key
code        text unique          -- e.g. 'birth_certificate'
display     text                 -- shown to user
context     text                 -- system prompt fragment
slots       jsonb                -- slot schema
empty_slots jsonb                -- default null values
tier        text default 'green' -- 'green' | 'amber'
```

`orchestration.py` loads domain config from the DB at startup (cached). Adding "scholarships" becomes an `INSERT`, not a PR.

#### Demand-driven promotion (Green ← Amber)

- Every out-of-domain query is logged to an `unmatched_queries` table (query text, timestamp, amber_result: yes/no).
- High-frequency unmatched patterns (birth certificates, ration cards, caste certificates will appear fast) are flagged for human KB curation.
- Once a curated `pgvector` knowledge base exists for a domain, flip `tier = 'green'` — it is permanently promoted.
- Users implicitly tell you what to build next.

#### Persona protection (Lakshmi / Ravi)

Low-literacy users may not register a text disclaimer. Amber must be **visually and aurally distinct**:
- Different background colour (amber/yellow vs brand colour).
- TTS reads: "I'm less certain about this one, please check with the office before you travel."
- Amber does **not** generate a full Case Workspace or PDF draft — only a cited lead card.
- The confident "you're ready to go" flow is Green only.

#### Sequencing (do not rush)

1. **Now (post-demo):** `domains` table + schema-driven `orchestration.py` refactor. No new behaviour — just makes adding a domain a data task.
2. **Sprint after:** Amber tier — Gemini grounded retrieval + allowlist filter + cautious UI card.
3. **Ongoing:** `unmatched_queries` logging + human promotion pipeline. Amber degrades into Green over time.

> For the hackathon demo: depth in three solid Green domains demos better than shaky Amber breadth. Build Phase 9 *after* Phases 1–8 are airtight.

**Free-tier fit:** Gemini grounded search is 5,000 prompts/month free on Gemini 2.x models, then $14/1,000. At demo scale this stays at ₹0.

---

## 5. Deployment

- **Frontend:** push to GitHub → Cloudflare Pages auto-builds the Vite PWA → CDN.
- **Backend:** push to GitHub → Render auto-deploys FastAPI (Docker or native Python).
- **DB/Vector:** Supabase managed instance + keep-alive ping (GitHub Action every 3 days).
- **Cron:** GitHub Actions scheduled workflow for Case Watch rescans.
- **Staging:** use Supabase's 2nd free project as staging to validate new KB entries before promoting (matches PRD's staging-before-production KB rule).

---

## 6. Cost reality — when free ends

| Trigger | What happens | Fix |
|---|---|---|
| Backend needs 24/7 no-cold-start | Render free spins down | Render Starter ~$7/mo, or accept cold start for demo |
| DB idle > 7 days | Supabase pauses project | Keep-alive ping (free) or Pro $25/mo |
| Speech credits exhausted | Sarvam meters per min/char | Top up, or switch to self-hosted Whisper/AI4Bharat (₹0 but heavier) |
| LLM credits exhausted | Anthropic/Gemini meter per token | Use Gemini free tier as primary, or budget credits |
| >500 MB case data | Supabase DB cap | Prune per 90-day purge policy (already in PRD) → stays under cap for a long time |

For **build + demo**, expected out-of-pocket: **₹0** (signup credits cover the AI calls).

---

## 7. Free-tier risks specific to this stack

| Risk | Mitigation |
|---|---|
| Render cold start ruins the live demo | Warm the service seconds before; keep a fallback recording |
| Supabase pauses over a quiet week | Keep-alive GitHub Action from day one |
| Sarvam free credits run out mid-build | Do speech-heavy testing late; keep Whisper fallback wired |
| Gemini/Claude free credits run out | Cache LLM responses during dev; don't re-run intake loops needlessly |
| Vision OCR misreads Indic-script docs | Mandatory human-confirmation card (already a PRD requirement) absorbs errors |

---

## 8. Quick-start order (first week)

1. Create GitHub repo (public → free Actions).
2. Supabase project → run schema → enable `pgvector` → add keep-alive Action.
3. FastAPI skeleton → deploy to Render → confirm live URL + Swagger.
4. Vite React PWA → deploy to Cloudflare Pages → confirm it calls the Render API.
5. Get Sarvam + Gemini (and/or Anthropic) keys → wire one STT round-trip and one LLM round-trip.
6. Build Vehicle/Traffic intake end-to-end (Phase 1) before touching any other domain.

> Rule of thumb from the PRD, applied here: **finish one domain fully and get the demo beats working before expanding.** The free tiers are more than enough — the constraint is your time, not the infrastructure.

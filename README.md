# Internal Knowledge Base

A **self-hosted** internal knowledge base for customer-success and revenue-operations teams. It turns the raw stream of support tickets into reusable, human-approved knowledge — and keeps every piece of collected, processed, and generated data on **your own infrastructure**.

> Runs entirely on your local machine or company server. Your tickets, uploaded files, and AI-generated articles never leave your environment except for the AI provider call you explicitly configure.

---

## Why this exists

Support teams answer the same questions over and over. The knowledge to resolve them is scattered across closed tickets, people's heads, PDFs, and RFP responses. This app:

1. **Pulls tickets from your CRM** (HubSpot) so you work from real support history.
2. **Clusters recurring issues** into patterns with a root cause and frequency.
3. **Drafts a KB article** for a pattern using the AI provider *you* choose.
4. Lets a permitted teammate **approve** it, turning it into trusted, searchable knowledge.
5. Reuses that knowledge to **answer RFP questions** and ground future AI answers.
6. Lets the company **upload its own documents** (PDF / DOCX / MD / TXT) as additional source material.

## Features

| Capability | Status |
|---|---|
| De-branded, role-based UI (RFP search, ticket patterns, KB articles, tickets, activity, countries) | ✅ Ported from prototype |
| **Self-hosted data** — Postgres + local file storage, nothing sent to third parties | ✅ |
| **HubSpot CRM integration** — pull support tickets (with mock fallback) | ✅ (live + mock) |
| **File upload & ingestion** — PDF, DOCX, MD, TXT with text extraction | ✅ |
| **Bring-your-own-AI** — Claude, OpenAI, **and** Gemini behind one server-side proxy | ✅ |
| Server-side API keys (never exposed to the browser) | ✅ |
| Persist clusters / articles / documents to DB | 🚧 UI still uses seed state; API + schema ready |

## Architecture

```
Next.js (App Router) ── one self-hostable app
├── src/app/                 UI + API routes
│   ├── page.tsx             renders the Knowledge Base client app
│   └── api/
│       ├── ai/generate      → provider-agnostic AI proxy (keys stay server-side)
│       ├── hubspot/tickets  → CRM ticket pull (live or mock)
│       ├── documents        → upload + text extraction
│       └── health           → config/status probe
├── src/lib/
│   ├── llm/                 Claude / OpenAI / Gemini abstraction
│   ├── hubspot.ts           CRM client + mock tickets
│   ├── documents.ts         local storage + PDF/DOCX/MD parsing
│   └── db.ts                Prisma client
├── src/components/          the ported, de-branded UI
├── prisma/schema.prisma     Postgres data model
├── scripts/seed.ts          demo data
├── uploads/                 your files, on your disk (git-ignored)
└── docker-compose.yml       local Postgres
```

**Privacy model:** uploaded files live under `UPLOAD_DIR` on your disk; only extracted text is stored in Postgres. The only outbound network call is to the AI provider you configure — swap providers or self-host a model to keep even that internal.

## Quick start

Prerequisites: Node 20+, Docker (for Postgres).

```bash
# 1. install
npm install

# 2. configure
cp .env.example .env      # fill in DB + provider keys (or leave HUBSPOT_USE_MOCK=true)

# 3. database
docker compose up -d      # starts Postgres
npm run db:push           # create tables
npm run db:seed           # demo users, tickets, RFP entries

# 4. run
npm run dev               # http://localhost:3000
```

Check configuration any time: `GET http://localhost:3000/api/health`.

## Configuration

All settings live in `.env` (see [`.env.example`](.env.example)):

- **AI providers** — set any of `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`. `AI_DEFAULT_PROVIDER` picks the default; the UI can override per request. Only providers with a key configured are offered.
- **HubSpot** — set `HUBSPOT_ACCESS_TOKEN` (Private App with `tickets` read scope) and `HUBSPOT_USE_MOCK=false` to go live. Leave mock on to run without a CRM.
- **Storage** — `UPLOAD_DIR` and `MAX_UPLOAD_MB` control local file handling.

## API reference

| Method | Route | Purpose |
|---|---|---|
| `GET/POST` | `/api/ai/generate` | List configured providers / generate text via chosen provider |
| `GET` | `/api/hubspot/tickets` | Fetch tickets from HubSpot (or mock) |
| `GET/POST` | `/api/documents` | List / upload documents |
| `GET` | `/api/health` | Config + status |

## Status

**Stage:** Prototype / scaffold · **As of:** 15 Nov 2026 · **Last commit:** 14 Aug 2026

The self-hosted app, HubSpot pull, file ingestion and the three-provider AI proxy work. The UI
still runs on seed state; wiring it to the database-backed APIs is the next step (see Roadmap).

## Roadmap

- Wire the UI tabs to the DB-backed APIs (replace in-memory seed state).
- AI answers grounded in uploaded documents + approved KB articles (retrieval).
- Real authentication (replace mock users) and per-role enforcement server-side.
- Scheduled HubSpot sync.

## License

[MIT](LICENSE).

# CLAUDE.md - VoiceDNA

This file is the working memory for Claude Code when building VoiceDNA.
Read this before writing any code. Follow every convention here strictly.

---

## Project Overview

VoiceDNA is a LinkedIn AI writing tool that learns a user's voice fingerprint
from their existing posts and generates new content that scores against that
fingerprint before the user sees it. Two modes: Quick Capture (mobile, voice)
and Post Creation (desktop, text). See PRD v1.1 for full context.

**What this product does NOT do:**
- Generate ideas from scratch
- Schedule or publish posts
- Provide LinkedIn analytics
- Support multiple platforms
- Auto-comment or automate LinkedIn actions

---

## Tech Stack

| Layer | Technology | Version / Notes |
|---|---|---|
| Frontend | Next.js | 14+ (App Router) |
| Frontend language | TypeScript | Strict mode on |
| Styling | Tailwind CSS | No CSS modules |
| Auth | Clerk | Use Clerk hooks only, no custom auth |
| Payments | Stripe | Webhooks must be idempotent |
| Backend API | Python FastAPI | Separate service, port 8000 |
| Background jobs | FastAPI BackgroundTasks | No Celery for MVP |
| Database | PostgreSQL 16 | Via Supabase or Railway |
| Vector DB | pgvector extension | Already on PostgreSQL, no separate DB |
| ORM | SQLAlchemy 2.0 (async) | Use async sessions everywhere |
| Migrations | Alembic | One migration per schema change |
| LLM primary | claude-sonnet-4-6 | Via Anthropic SDK |
| LLM fallback | gpt-4o / gpt-4o-mini | Via OpenAI SDK |
| Embeddings | text-embedding-3-small | OpenAI only, no alternatives |
| Voice transcription | whisper-1 | OpenAI Whisper API |
| Audio storage | Cloudflare R2 | Delete after transcription |
| Package manager (JS) | pnpm | Not npm, not yarn |
| Package manager (Python) | uv | Not pip directly |
| Linting (JS) | ESLint + Prettier | Config in repo root |
| Linting (Python) | ruff | Config in pyproject.toml |

---

## Directory Structure

```
voicedna/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/                # App Router pages
│   │   │   ├── (auth)/         # Clerk auth routes
│   │   │   ├── (dashboard)/    # Protected dashboard routes
│   │   │   ├── capture/        # Mobile Quick Capture page
│   │   │   └── api/            # Next.js API routes (thin proxy to FastAPI)
│   │   ├── components/
│   │   │   ├── ui/             # Shadcn/ui components
│   │   │   ├── voice-dna/      # VoiceDNA-specific components
│   │   │   ├── generator/      # Post generator components
│   │   │   ├── capture/        # Quick Capture components
│   │   │   └── dashboard/      # Dashboard components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities, API client, types
│   │   └── public/
│   └── api/                    # Python FastAPI backend
│       ├── routers/
│       │   ├── voice_profile.py
│       │   ├── generation.py
│       │   ├── capture.py
│       │   ├── usage.py
│       │   └── webhooks.py     # Stripe webhooks
│       ├── services/
│       │   ├── voice_dna/
│       │   │   ├── extractor.py      # Dimension extraction
│       │   │   ├── embedder.py       # Post embedding
│       │   │   └── scorer.py         # Voice match scoring
│       │   ├── generation/
│       │   │   ├── generator.py      # Post generation
│       │   │   ├── few_shot.py       # pgvector similarity retrieval
│       │   │   └── prompt_builder.py # System prompt assembly
│       │   ├── capture/
│       │   │   ├── transcriber.py    # Whisper transcription
│       │   │   ├── titler.py         # Auto-title generation
│       │   │   └── storage.py        # R2 audio upload/delete
│       │   └── llm/
│       │       ├── router.py         # Multi-provider routing
│       │       └── circuit_breaker.py
│       ├── models/             # SQLAlchemy models (mirror DB schema exactly)
│       ├── schemas/            # Pydantic schemas (request/response)
│       ├── db/
│       │   ├── session.py      # Async DB session
│       │   └── migrations/     # Alembic migrations
│       ├── config.py           # Settings via pydantic-settings
│       └── main.py
```

---

## Environment Variables

**Never hardcode secrets. Never commit .env files.**

```bash
# apps/api/.env
DATABASE_URL=postgresql+asyncpg://...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=voicedna-audio
CLERK_SECRET_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# apps/web/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Access config in Python via `config.py` using `pydantic-settings`. Never use `os.getenv` directly in service code - always go through the settings object.

---

## Running Locally

```bash
# Database
docker compose up -d postgres    # PostgreSQL + pgvector

# Backend
cd apps/api
uv sync
uv run alembic upgrade head
uv run uvicorn main:app --reload --port 8000

# Frontend
cd apps/web
pnpm install
pnpm dev
```

---

## Core Architectural Patterns

### 1. LLM Multi-Provider Routing

All LLM calls go through `services/llm/router.py`. Never call Anthropic or OpenAI SDKs directly from a service file.

```python
# CORRECT
from services.llm.router import llm_call

response = await llm_call(
    task="generation",          # determines primary/fallback model
    messages=[...],
    max_tokens=500,
    json_mode=False
)

# WRONG - do not do this
import anthropic
client = anthropic.Anthropic()
response = client.messages.create(...)
```

**Task-to-model mapping** (defined in `router.py`, not scattered across files):

| Task | Primary | Fallback |
|---|---|---|
| `generation` | claude-sonnet-4-6 | gpt-4o |
| `scoring` | gpt-4o-mini | claude-haiku-4-5 |
| `extraction` | claude-sonnet-4-6 | gpt-4o-mini |
| `titling` | gpt-4o-mini | claude-haiku-4-5 |
| `repurpose` | claude-sonnet-4-6 | gpt-4o |

**Circuit breaker:** If primary fails 3 times in 60 seconds, route to fallback for 5 minutes. Reset after. Log every fallback activation. This pattern is already implemented in Mitra AI - port it directly.

### 2. pgvector Similarity Queries

Always use async SQLAlchemy. Use the `<=>` operator for cosine distance.

```python
# Few-shot retrieval: 3 posts most similar to input idea
async def get_similar_posts(
    user_id: UUID,
    input_embedding: list[float],
    limit: int = 3,
    session: AsyncSession = ...
) -> list[UserPost]:
    result = await session.execute(
        select(UserPost)
        .where(UserPost.user_id == user_id)
        .order_by(UserPost.content_embedding.cosine_distance(input_embedding))
        .limit(limit)
    )
    return result.scalars().all()
```

Never do embedding similarity in Python - always push it to the database.

### 3. Background Processing

For long-running tasks (Voice DNA build, batch embedding), use FastAPI `BackgroundTasks` for MVP. Do not add a job queue (Redis, Celery) until it is actually needed.

```python
@router.post("/voice-profile/build")
async def build_voice_profile(
    request: BuildProfileRequest,
    background_tasks: BackgroundTasks,
    user_id: UUID = Depends(get_current_user),
    session: AsyncSession = Depends(get_session)
):
    # Return immediately, process in background
    background_tasks.add_task(
        process_voice_profile,
        user_id=user_id,
        posts=request.posts,
        session=session
    )
    return {"status": "processing", "message": "Voice DNA build started"}
```

Frontend polls `/api/voice-profile/status` every 3 seconds while processing. Simple polling, no WebSockets for MVP.

### 4. Database Migrations

One Alembic migration per logical change. Name migrations descriptively.

```bash
# Create a new migration
uv run alembic revision --autogenerate -m "add_spoken_samples_to_voice_profiles"

# Apply all pending
uv run alembic upgrade head

# Roll back one
uv run alembic downgrade -1
```

Never modify existing migrations. Always create a new one.

### 5. API Route Structure

All routes in Next.js `app/api/` are thin proxies to FastAPI. No business logic in Next.js API routes.

```typescript
// apps/web/app/api/generate/route.ts
export async function POST(req: Request) {
  const body = await req.json()
  const token = await getAuthToken() // Clerk server-side

  const response = await fetch(`${process.env.API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  })

  return Response.json(await response.json())
}
```

FastAPI validates the JWT from Clerk on every authenticated request using a middleware. See `main.py`.

---

## Database Conventions

- All primary keys: `UUID` using `gen_random_uuid()`
- All timestamps: `TIMESTAMPTZ` (never `TIMESTAMP`)
- Soft deletes: Use `status` field or `deleted_at` column. Never hard delete user data.
- Migrations: Alembic autogenerate, then review before committing. Never trust autogenerate blindly.
- Indexes: Add index for every foreign key. Add compound index for common filter patterns.
- JSONB fields: Always have a comment above describing the expected structure.
- The `spoken_samples` field on `voice_profiles`: Leave `NULL` at MVP. Do not populate it. Do not build logic for it. It exists to avoid a future migration.

---

## Python Conventions

- All service functions are `async`
- All database access uses `AsyncSession`
- Pydantic v2 for all schemas
- Return type hints on all functions
- No print statements - use `logging` module
- `ruff` for linting - run before every commit: `uv run ruff check . --fix`
- Error handling: raise specific `HTTPException` with clear status codes, never let unhandled exceptions reach the client
- No bare `except:` clauses - always catch specific exceptions

```python
# CORRECT error handling
try:
    result = await llm_call(task="generation", messages=messages)
except LLMProviderError as e:
    logger.error(f"Generation failed for user {user_id}: {e}")
    raise HTTPException(status_code=503, detail="Generation temporarily unavailable")

# WRONG
try:
    result = await llm_call(...)
except:
    pass
```

---

## TypeScript / Next.js Conventions

- Strict TypeScript - `"strict": true` in tsconfig
- No `any` types - use `unknown` and narrow
- All API responses have typed interfaces in `lib/types.ts`
- Tailwind only - no inline styles, no CSS modules
- Server components by default - use `"use client"` only when needed
- Loading states: every async action has a loading state in UI
- Error states: every async action has an error state in UI
- No `useEffect` for data fetching - use React Server Components or SWR

---

## Prompt Engineering Conventions

- All system prompts live in `services/generation/prompt_builder.py` - never inline in a route or service function
- Prompts are assembled from components, not hardcoded strings
- Always include negative examples ("never do X") in generation prompts
- Log every prompt in development mode (controlled by `settings.LOG_PROMPTS`)
- Token count every prompt before sending - log a warning if over 3,000 tokens
- Never send raw user content directly into a prompt without sanitization

---

## Voice Match Score

The score is calculated server-side, never client-side. The algorithm in `services/voice_dna/scorer.py` is the single source of truth. Frontend displays what the API returns. No score calculation in the frontend.

The score is calculated after generation completes, as a second LLM call. It adds ~1 second to generation time. This is acceptable. Do not try to calculate it during generation to save a call.

---

## Quick Capture (V1)

The capture page lives at `/capture` and is designed for mobile. Keep it under 10KB of JS. No complex state management on this page. One action: hold to record, release to save.

Audio recording uses the browser `MediaRecorder` API. Target format: `audio/webm;codecs=opus`. Always check MIME type support before recording:

```typescript
const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/mp4'   // iOS Safari fallback
```

IndexedDB sync for offline: use the `idb` library, not raw IndexedDB API. Keep the sync logic in `hooks/useCapture.ts`.

Audio files uploaded to R2 must be deleted within 60 seconds of successful transcription. This is non-negotiable. The `storage.py` service handles this - do not delete from any other location.

---

## Stripe Webhooks

All Stripe event handlers in `routers/webhooks.py` must be idempotent. Before processing any event, check if it has already been processed:

```python
# Check for duplicate processing
existing = await session.execute(
    select(ProcessedWebhook).where(ProcessedWebhook.stripe_event_id == event.id)
)
if existing.scalar():
    return {"status": "already_processed"}
```

Events to handle:
- `checkout.session.completed` → activate subscription
- `customer.subscription.updated` → update plan
- `customer.subscription.deleted` → downgrade to free
- `invoice.payment_failed` → flag account, send email

---

## Usage Tracking

Every LLM call logs a row in the `usage` table. This is how per-plan limits are enforced and how costs are monitored. Do not skip this.

```python
await log_usage(
    user_id=user_id,
    action="generate",
    tokens_used=response.usage.input_tokens + response.usage.output_tokens,
    cost_usd=calculate_cost(response.usage, model="claude-sonnet-4-6"),
    session=session
)
```

Cost calculation constants live in `config.py`. Update them if model pricing changes.

---

## Rate Limiting

Enforce in FastAPI middleware using a Redis-backed rate limiter. For MVP without Redis, use in-memory rate limiting (acceptable for single-instance deployment).

| Endpoint | Limit |
|---|---|
| POST /generate | 30 per hour per user |
| POST /voice-profile/build | 1 per 10 minutes per user |
| POST /capture/upload | 20 per hour per user |
| POST /repurpose | 10 per hour per user |

Return `429 Too Many Requests` with a `Retry-After` header. Frontend must display a user-facing message, not a raw error.

---

## What NOT to Do

These are common mistakes. Avoid all of them.

- Do not add LinkedIn API calls anywhere. If you find yourself reaching for the LinkedIn API, stop.
- Do not build a post scheduler. It is in the non-goals. If asked, note it is out of scope.
- Do not call LLM SDKs directly - always go through `services/llm/router.py`
- Do not store audio files permanently - delete after transcription
- Do not put business logic in Next.js API routes - they are thin proxies
- Do not use synchronous SQLAlchemy - async only
- Do not generate ideas for users - only re-perform their own ideas
- Do not build multi-platform support - LinkedIn only
- Do not hardcode model names outside of `router.py`
- Do not add `console.log` or `print` statements in production code
- Do not skip the few-shot retrieval step in generation - it is the primary quality driver
- Do not build the spoken-to-written translation model - the `spoken_samples` field exists for future use only

---

## Common Claude Code Commands

```bash
# Run linting
cd apps/api && uv run ruff check . --fix
cd apps/web && pnpm lint

# Create migration
cd apps/api && uv run alembic revision --autogenerate -m "description"

# Apply migrations
cd apps/api && uv run alembic upgrade head

# Check types (Python)
cd apps/api && uv run mypy .

# Check types (TypeScript)
cd apps/web && pnpm type-check
```

---

## Reference Documents

- **PRD v1.1:** Full product requirements - source of truth for what to build
- **architecture.md:** System design, data flows, API specification
- **sprint.md:** Task backlog with priority and acceptance criteria

When in doubt about what to build, check the PRD first. If the PRD does not cover it, ask before building.
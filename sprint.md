# VoiceDNA - Sprint & Task Backlog
**Version:** 1.0  
**Last Updated:** June 2026  
**Aligned with:** PRD v1.1, Architecture v1.0

---

## How to Use This Document

Tasks are grouped by sprint. Each task has:
- **ID:** Unique identifier (format: S[sprint]-T[number])
- **Priority:** P0 = blocks everything, P1 = blocks the sprint goal, P2 = important but not blocking
- **Est:** Estimated hours for a solo developer with the existing stack context
- **Deps:** Task IDs that must complete first

A sprint is complete when all P0 and P1 tasks pass their acceptance criteria.
P2 tasks can roll into the next sprint.

**Definition of Done (for every task):**
- Code is committed and pushed
- Linting passes (`ruff check`, `pnpm lint`)
- Type checking passes (`mypy`, `pnpm type-check`)
- Relevant test written and passing
- No `console.log` or `print` left in production code

---

## Sprint 0 - Project Setup
**Goal:** Working dev environment. Database running. Auth working. Both services talking to each other.  
**Duration:** 2 days  
**Success:** You can sign up, log in, and see a placeholder dashboard.

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| S0-T1 | Monorepo setup | Init `voicedna/` monorepo with `apps/web` (Next.js 14) and `apps/api` (FastAPI). Configure pnpm workspaces. Add `.gitignore`, `README.md`. | `pnpm dev` starts Next.js. `uv run uvicorn main:app` starts FastAPI. No errors on cold start. | 2h | - | P0 |
| S0-T2 | PostgreSQL + pgvector | Spin up PostgreSQL with pgvector via Docker Compose. Confirm `CREATE EXTENSION vector` runs without error. Configure `DATABASE_URL` in `.env`. | `SELECT * FROM pg_extension WHERE extname = 'vector'` returns one row. | 1h | S0-T1 | P0 |
| S0-T3 | SQLAlchemy async setup | Configure async SQLAlchemy session in `apps/api/db/session.py`. Add `get_session` dependency. Write a smoke test that opens and closes a session. | Test passes. Session is async. No sync SQLAlchemy anywhere. | 2h | S0-T2 | P0 |
| S0-T4 | Alembic setup | Init Alembic. Configure `env.py` to use async SQLAlchemy. Create and apply the initial migration with all tables from the schema (users, voice_profiles, user_posts, idea_queue, audio_uploads, generations, usage, processed_webhooks). | `alembic upgrade head` applies cleanly. All tables exist. pgvector indexes created. | 3h | S0-T3 | P0 |
| S0-T5 | Clerk auth (backend) | Add Clerk JWT verification middleware to FastAPI. Create `get_current_user` dependency that resolves Clerk user ID to `users` table row (create user on first auth). | Unauthenticated request to any protected route returns 401. Authenticated request resolves user. | 3h | S0-T4 | P0 |
| S0-T6 | Clerk auth (frontend) | Install and configure Clerk in Next.js. Add `ClerkProvider`. Create sign-up and sign-in pages. Add middleware to protect `/dashboard` and `/onboarding` routes. | Unauthenticated visit to `/dashboard` redirects to `/login`. Sign up creates a user. | 2h | S0-T1 | P0 |
| S0-T7 | Next.js → FastAPI proxy | Create `apps/web/lib/api-client.ts`. All calls to FastAPI go through this client, which attaches the Clerk JWT. Create a single Next.js API route `/api/health` that proxies to FastAPI `/health`. | `/api/health` returns 200. JWT is forwarded. | 1h | S0-T5, S0-T6 | P0 |
| S0-T8 | Environment config | Set up `pydantic-settings` in FastAPI. All env vars accessed via `config.settings` object. Add `.env.example` with all required vars and no real values. | FastAPI fails to start if a required env var is missing, with a clear error message. | 1h | S0-T1 | P1 |
| S0-T9 | Error monitoring | Add Sentry to both Next.js and FastAPI. Configure source maps. Test that an unhandled exception in FastAPI shows in Sentry. | Sentry receives a test error from both services. | 1h | S0-T7 | P2 |

**Sprint 0 checkpoint:** Sign up, log in, see `/dashboard` (empty). API health check returns 200.

---

## Sprint 1 - Voice DNA Pipeline
**Goal:** A user can paste their LinkedIn posts and get a voice fingerprint back.  
**Duration:** 3 days  
**Success:** 50 posts in → voice profile displayed within 45 seconds.

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| S1-T1 | LLM router | Build `services/llm/router.py`. Implement task-to-model mapping. Implement circuit breaker (3 failures in 60s → fallback for 5 min). Log every call with model, tokens, cost. | Unit tests: primary fails 3x → fallback used. Fallback resets after timeout. All calls logged in `usage` table. | 4h | S0-T5 | P0 |
| S1-T2 | Post parser | Build `services/voice_dna/parser.py`. Accepts raw text blob. Detects post boundaries (blank line or `---` separator). Strips HTML. Rejects posts under 30 words. Returns `list[str]`. | Unit tests: 50-post paste → 50 parsed posts. Junk posts (<30 words) excluded. HTML stripped. | 2h | S0-T3 | P0 |
| S1-T3 | Batch embedder | Build `services/voice_dna/embedder.py`. Embeds posts in batches of 20 using `text-embedding-3-small`. Stores per-post vectors in `user_posts`. Computes mean vector for profile. | Unit test (mocked OpenAI): 50 posts → 50 rows in `user_posts` with embeddings. Mean vector computed correctly. | 3h | S1-T1 | P0 |
| S1-T4 | Dimension extractor | Build `services/voice_dna/extractor.py`. Six extraction functions (hook, structure, vocabulary, rhythm, paragraph, CTA, tone). Each takes a list of post strings, runs a structured LLM call, returns a distribution dict. | Unit tests (mocked LLM): each function returns valid JSON distribution. Invalid LLM response handled gracefully. | 5h | S1-T1 | P0 |
| S1-T5 | Profile builder | Build `services/voice_dna/builder.py`. Orchestrates parser → embedder → extractor (6 calls in parallel via asyncio.gather) → upsert `voice_profiles` row. Computes SHA256 hash of raw corpus. Sets status = 'ready' on completion, 'failed' on error. | Integration test (mocked LLM + real DB): 15-post input → voice_profiles row created with all 7 dimensions populated. | 3h | S1-T2, S1-T3, S1-T4 | P0 |
| S1-T6 | Build endpoint | `POST /voice-profile/build`. Validates: ≥15 posts after parsing, user doesn't already have a 'building' profile. Starts background task. Returns `{"status": "processing"}` immediately. | Endpoint returns 200 in <500ms. Background task starts. Rate limit: 1 build per 10 min per user (return 429 if exceeded). | 2h | S1-T5 | P0 |
| S1-T7 | Status endpoint | `GET /voice-profile/status`. Returns current status, confidence_level, post_count, last_built_at. Frontend polls this every 3 seconds during build. | Returns correct status at each stage. 'building' while in progress, 'ready' when done, 'failed' with error message if failed. | 1h | S1-T6 | P0 |
| S1-T8 | Profile view endpoint | `GET /voice-profile`. Returns full voice profile with all dimension distributions formatted for display. Returns 404 if no profile exists. | Returns all 7 dimensions. Confidence label computed server-side (not client). | 1h | S1-T6 | P0 |
| S1-T9 | Voice DNA build UI | Build `/onboarding/build-profile` page. Large textarea for post paste. Live counter: "X posts detected" as user types (debounced, client-side). Confidence meter updates with count. Submit button disabled below 15 posts. After submit: polling UI with progress bar. | Paste 50 posts → counter shows "50 posts". Submit → progress bar shows. Polling stops when status = 'ready'. Redirects to `/onboarding/your-dna`. | 4h | S1-T7 | P0 |
| S1-T10 | Voice DNA display UI | Build `/onboarding/your-dna` and `/dashboard/voice-dna`. Display all 7 dimensions with bar charts or visual indicators. Human-readable labels, not raw JSON. | All 7 dimensions visible. Confidence badge shown. "Continue" button navigates to first generation. | 3h | S1-T8 | P0 |
| S1-T11 | HNSW index | Add pgvector HNSW index on `user_posts.content_embedding`. Confirm query performance on 200-post corpus. | Query time for top-3 similar posts < 50ms on 200-post corpus. | 1h | S0-T4 | P1 |
| S1-T12 | Post corpus update | `PUT /voice-profile/add-posts`. Accepts new posts, embeds them, appends to `user_posts`, triggers incremental rebuild if post count changed by ≥10. | New posts added without wiping existing corpus. Hash updated. Status transitions correctly. | 2h | S1-T6 | P2 |

**Sprint 1 checkpoint:** Onboarding step 3 fully functional. A user can paste 50 posts, see a progress bar, and arrive at their voice fingerprint page.

---

## Sprint 2 - Generation Pipeline
**Goal:** A user with a built voice profile can generate 3 LinkedIn posts with Voice Match Scores.  
**Duration:** 3 days  
**Success:** Idea in → 3 posts with scores in under 10 seconds.

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| S2-T1 | Few-shot retriever | Build `services/generation/few_shot.py`. Takes user_id + input embedding. Queries `user_posts` via pgvector cosine similarity. Returns top 3 posts as strings. | Unit test: mock DB returns 3 posts ordered by similarity. Empty corpus returns empty list gracefully. | 2h | S1-T11 | P0 |
| S2-T2 | Prompt builder | Build `services/generation/prompt_builder.py`. Takes voice profile + few-shot examples + variant config. Returns assembled system prompt. Each variant has a different `variant_specific_instruction`. | Unit test: all profile fields injected correctly. Missing profile fields handled with fallback text. Three distinct variant instructions. | 3h | S1-T8 | P0 |
| S2-T3 | Post generator | Build `services/generation/generator.py`. Embeds input. Retrieves few-shots. Assembles 3 prompts. Calls LLM router 3x (can be parallel if rate limits allow, sequential as fallback). Returns 3 raw post strings. | Unit test (mocked LLM): 3 variants returned. Each is 150-350 words. No variant is identical. | 3h | S2-T1, S2-T2 | P0 |
| S2-T4 | Voice match scorer | Build `services/voice_dna/scorer.py`. Takes generated post + voice profile. Makes one LLM call with structured output. Applies weighted scoring formula. Returns `VoiceMatchResult` with overall score and per-dimension breakdown. | Unit test (mocked LLM): scores sum to correct weighted total. Scores clamped to 0-100. | 3h | S1-T8 | P0 |
| S2-T5 | Generation endpoint | `POST /generate`. Validates: profile exists + status = 'ready', usage limit not exceeded, input 10-500 words. Orchestrates: embed → few-shot → generate 3 variants → score 3 variants (parallel). Stores in `generations` table. Returns variants with scores. Logs usage. | End-to-end test: 50-word input → 3 variants returned, each with voice_match_score. Completes in <10s P95. Usage row created. Fails gracefully if profile missing (returns 400 with clear message). | 4h | S2-T3, S2-T4 | P0 |
| S2-T6 | Repurpose endpoint | `POST /repurpose`. Accepts 50-3000 word input. Extracts core insight (single LLM call). Generates one post variant. Scores it. Returns single post with score. | Input with clear insight → relevant post generated. Input with no insight → 400 with "no extractable idea" message. | 2h | S2-T5 | P0 |
| S2-T7 | Generation history endpoint | `GET /generate/history?limit=10&offset=0`. Returns paginated generation history with scores, publish status. | Returns correct user's history only. Pagination works. | 1h | S2-T5 | P1 |
| S2-T8 | Publish mark endpoint | `PATCH /generate/:id/published`. Sets `published = true`, `published_at = now()`, `selected_variant_index`. If sourced from idea queue, updates queue item status to 'published'. | Idempotent. Calling twice does not create duplicate rows. Idea queue item updated. | 1h | S2-T5 | P1 |
| S2-T9 | Generator UI | Build `/dashboard/generate`. Text input (10-500 words, live counter). Submit button. Score loads first (circular indicator), then post text fades in. Three variant tabs. Regenerate single variant button. Edit inline. Copy to clipboard. Mark as published checkbox. | Score visible before full text. Regenerate replaces only that variant. Copy works. Published state persists across reload. | 5h | S2-T5 | P0 |
| S2-T10 | Repurpose UI | Build `/dashboard/repurpose`. Large textarea (3000 word max). Submit. Single result with score. | Input → single post with score. Word count shown on textarea. | 2h | S2-T6 | P1 |
| S2-T11 | Usage limit enforcement | In generation endpoint: check usage this billing period. If at limit, return 429 with `{ error: "limit_reached", limit: X, plan: "starter" }`. Frontend shows upgrade modal. | User on Starter at 20 posts gets 429 on 21st attempt. Upgrade modal shows correct plan info. | 2h | S0-T8 | P1 |
| S2-T12 | Rate limiting middleware | Implement per-user rate limiting in FastAPI middleware. Use in-memory dict for MVP (acceptable for single instance). `/generate`: 30/hour. `/repurpose`: 10/hour. | Exceeding limit returns 429 with `Retry-After` header. In-memory state resets on server restart (acceptable for MVP). | 2h | S0-T5 | P1 |

**Sprint 2 checkpoint:** Full generation flow works end-to-end. User can generate, see scores, edit, copy, and mark as published.

---

## Sprint 3 - Dashboard, Onboarding & First Run
**Goal:** Cohesive product experience from signup to published post.  
**Duration:** 2 days  
**Success:** A new user can complete onboarding and publish their first generated post in under 15 minutes.

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| S3-T1 | Dashboard layout | Build the main dashboard shell. Left sidebar (desktop) / bottom nav (mobile). Navigation: Dashboard, Generate, Repurpose, Voice DNA, History, Settings. | Navigation works. Active state highlighted. Mobile-responsive. | 2h | S0-T6 | P0 |
| S3-T2 | Dashboard home | Build `/dashboard` main view. Components: voice profile card (confidence + post count + link to DNA), Idea Queue (empty state for MVP), quick generate input, recent generations list (last 5 with scores), posts published this week counter. | All components render. Empty states are clear and have CTAs. Quick generate submits to generation flow. | 3h | S2-T5, S2-T7 | P0 |
| S3-T3 | Onboarding flow | Build the complete 4-step onboarding. Step 1: welcome + use case selection. Step 2: build profile (Sprint 1 UI). Step 3: DNA reveal. Step 4: first generation with pre-filled example. Progress indicator on all steps. State persists on browser close. | New user completes all 4 steps without confusion. Pre-filled example is use-case specific (consultant gets consultant example). Cannot skip to Step 4 without building profile. | 4h | S1-T9, S1-T10, S2-T9 | P0 |
| S3-T4 | Onboarding redirect | Middleware: if user is authenticated but has no voice profile, redirect all `/dashboard` routes to `/onboarding`. If onboarding is in progress, resume at the correct step. | User who signs up and goes to `/dashboard` directly is redirected to onboarding. Partial onboarding resumes at correct step. | 1h | S3-T3 | P0 |
| S3-T5 | Settings page | Build `/dashboard/settings`. Sections: Account (name, email), Plan (current plan, usage this month), Billing (link to Stripe customer portal). | Plan and usage display correctly. Stripe portal link works (creates portal session via API). | 2h | S0-T8 | P1 |
| S3-T6 | Free audit tool | Build `/audit` (unauthenticated). Textarea for 5 post paste. Submit → displays a simplified voice fingerprint (hook style + structural pattern + vocabulary register only, not full 7-dimension profile). CTA: "Sign up to build your full profile." | Works without auth. Shows 3 of 7 dimensions. CTA navigates to sign up. This is the lead magnet - make it visually impressive. | 3h | S1-T4 | P1 |
| S3-T7 | Loading states | Every async action has a loading state. Generate button shows spinner. Profile build shows progress bar. Score shows skeleton before it loads. | No action ever results in a frozen UI. User always knows something is happening. | 2h | S2-T9, S3-T2 | P1 |
| S3-T8 | Error states | Every async action has an error state. API errors show a user-friendly message (not a raw error). Retry options where appropriate. | 503 from LLM → "Generation temporarily unavailable. Try again in a moment." 429 → upgrade modal. 400 → specific message from API. | 2h | S2-T9, S3-T2 | P1 |

**Sprint 3 checkpoint:** A new user can sign up, complete onboarding in <15 min, generate a post, and mark it as published. The product is functionally complete for MVP.

---

## Sprint 4 - Payments & Beta
**Goal:** Stripe billing live. 10 beta users onboarded. First paid conversions.  
**Duration:** 2 days  
**Success:** At least 5 of 10 beta users pay $79/mo.

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| S4-T1 | Stripe products | Create products and prices in Stripe dashboard: Starter ($99/mo), Growth ($199/mo), Pro ($299/mo), Beta ($79/mo lifetime). Each has a price ID referenced in `config.py`. | All 4 products exist in Stripe. Price IDs configured in code. | 1h | - | P0 |
| S4-T2 | Checkout session | `POST /billing/checkout`. Creates Stripe Checkout Session for chosen plan. Returns session URL. Frontend redirects to Stripe. | Clicking "Upgrade" redirects to Stripe Checkout for correct plan. Successful payment redirects back to `/dashboard?upgraded=true`. | 2h | S0-T5 | P0 |
| S4-T3 | Stripe webhooks | Build `routers/webhooks.py`. Handle: `checkout.session.completed` (activate plan), `customer.subscription.updated` (change plan), `customer.subscription.deleted` (downgrade to free), `invoice.payment_failed` (flag account). All handlers idempotent via `processed_webhooks` table. | Test with Stripe CLI: each event type updates the user's plan correctly. Duplicate events do not cause double-processing. | 4h | S0-T4 | P0 |
| S4-T4 | Customer portal | `POST /billing/portal`. Creates Stripe Customer Portal session. Returns URL. Frontend link in Settings page opens portal in new tab. | User can manage subscription, view invoices, cancel. | 1h | S4-T2 | P1 |
| S4-T5 | Trial enforcement | Users on free trial (14 days) can use full Growth limits. After trial_ends_at: downgrade to Starter limits if no payment. Show trial banner with days remaining. | Trial user on day 15 without payment is limited to Starter. Trial banner shows correct countdown. | 2h | S4-T3 | P1 |
| S4-T6 | Beta pricing | Create a beta coupon in Stripe (100% discount for first month, then $79/mo locked). OR create a manual $79/mo price. Send beta users a checkout link with this price. | Beta users pay $79. Their plan shows as 'growth' with a beta badge. They cannot accidentally upgrade to a higher plan via self-serve. | 1h | S4-T1 | P0 |
| S4-T7 | Landing page | Build `/` marketing page. Headline: "Your LinkedIn content. Your voice. Your clients." Above fold: headline + sub-headline + CTA (Start free trial). Below fold: how it works (3 steps), voice match score visual, testimonials (placeholder for beta), pricing table. | Page loads in <2s. CTA navigates to sign up. Pricing table shows all 3 plans with correct features. | 3h | S0-T1 | P1 |
| S4-T8 | Beta onboarding calls | For each of the 10 beta users: schedule a 20-min onboarding call. Walk them through profile build. Watch them generate their first post. Note every point of confusion. | All 10 beta users have a built voice profile. At least 5 have generated and published a post. | 5h (non-code) | S3-T3 | P0 |
| S4-T9 | Beta feedback collection | 5-question feedback form (async, Typeform or Notion form). Questions: Did the output sound like you? Did you publish any generated posts? What took longest? What was confusing? Would you pay $79/mo? | All 10 beta users complete the form within 7 days of onboarding. | 1h (non-code) | S4-T8 | P0 |

**Sprint 4 checkpoint:** Payments work. 10 beta users onboarded. Feedback collected. Decision made: launch or fix.

---

## Sprint 5 - Public Launch
**Goal:** First paying users from outside your personal network.  
**Duration:** 1 week  
**Success:** 20 paying users total. DM outreach running weekly.

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| S5-T1 | Production deploy | Deploy Next.js to Vercel. Deploy FastAPI to Railway. PostgreSQL on Railway. Configure all production environment variables. Enable Sentry in production. | Production URLs load. Auth works. Generation works. Payments work. No beta/dev data visible. | 3h | S4-T3 | P0 |
| S5-T2 | Audit tool polish | Make `/audit` look visually impressive. The voice fingerprint output should be beautiful enough that users want to share it. Add a "Share your Voice DNA" button that copies a shareable image to clipboard (use html2canvas). | Audit result is visually distinct. Share button copies image. This is the viral acquisition mechanic. | 3h | S3-T6 | P1 |
| S5-T3 | LinkedIn launch posts | Write 5 LinkedIn posts for launch week. Post 1: "What is Voice DNA" (educational). Post 2: "I analyzed 1000 founder posts and found 6 patterns" (insight). Post 3: Launch announcement. Post 4: Case study from beta user (with permission). Post 5: Behind the scenes build story. | All 5 posts scheduled and ready. Each post uses VoiceDNA to generate a post about VoiceDNA (use yourself as the demo). | 3h (content) | S5-T1 | P0 |
| S5-T4 | DM outreach setup | Build a simple spreadsheet/Notion tracking system for DM outreach. Columns: Name, LinkedIn URL, Niche, DM sent date, Reply status, Trial started, Converted. Target: 50 DMs per week. | System exists. First 50 targets identified and added. First 10 DMs sent on launch day. | 2h (non-code) | S5-T1 | P0 |
| S5-T5 | Analytics | Add PostHog (free tier) to Next.js. Track: sign_up, profile_built, post_generated, post_published, plan_upgraded, trial_started. No PII in event properties. | All 6 events fire correctly. Funnel visible in PostHog dashboard. | 2h | S5-T1 | P1 |
| S5-T6 | SEO basics | Add meta tags to landing page and audit tool. Target keywords: "LinkedIn voice AI", "AI LinkedIn posts that sound like me", "LinkedIn AI writing tool". Submit sitemap to Google Search Console. | All key pages have title + description meta tags. Sitemap submitted. | 1h | S5-T1 | P2 |

**Sprint 5 checkpoint:** Product is live. 20 paying users. DM outreach is a weekly habit.

---

## V1 Sprint - Quick Capture
**Goal:** Mobile voice capture interface live. Idea Queue feeding generation.  
**Duration:** 2 weeks (parallel to early growth, post-sprint 5)  
**Trigger:** Start this sprint only after PMF is confirmed (40%+ of beta posts published without heavy editing).

---

| ID | Task | Description | Acceptance Criteria | Est | Deps | Priority |
|---|---|---|---|---|---|---|
| V1-T1 | R2 storage service | Build `services/capture/storage.py`. Upload audio blob to Cloudflare R2. Return object key. Delete by key. Log deletion in `audio_uploads.deleted_at`. | Unit test (mocked R2): upload returns key. Delete marks `deleted_at`. | 2h | S0-T8 | P0 |
| V1-T2 | Whisper transcription | Build `services/capture/transcriber.py`. Accepts audio file path (or bytes). Calls OpenAI Whisper API (`whisper-1`). Returns transcription string. Handles: file too short (<2s), transcription timeout. | Unit test (mocked Whisper): valid audio → string returned. Short audio → handled with clear error. | 2h | S1-T1 | P0 |
| V1-T3 | Auto-titler | Build `services/capture/titler.py`. Takes transcription string. Calls GPT-4o-mini with title prompt. Returns 5-8 word title. | Unit test (mocked LLM): long transcription → 5-8 word title. Transcription with no clear idea → fallback: first 8 words. | 1h | S1-T1 | P0 |
| V1-T4 | Capture upload endpoint | `POST /capture/upload`. Accepts multipart audio file. Validates: file type (webm/mp4/m4a), max size 10MB. Stores in R2. Creates `audio_uploads` row. Starts background: transcribe → title → update `idea_queue`. Returns `{upload_id, idea_queue_id}`. | Upload returns IDs in <500ms. Background processing completes in <10s. Audio deleted after transcription. | 3h | V1-T1, V1-T2, V1-T3 | P0 |
| V1-T5 | Capture status endpoint | `GET /capture/status/:idea_queue_id`. Returns `{status, transcription, title}`. Frontend polls every 2 seconds after upload. | Returns correct status at each stage. 'ready' state includes transcription and title. | 1h | V1-T4 | P0 |
| V1-T6 | Idea queue endpoints | `GET /capture/queue?status=queued`. `PATCH /capture/:id` (edit title/transcription). `DELETE /capture/:id` (soft delete, status='dismissed'). | Queue returns only current user's items. Edit persists. Delete sets status only, no hard delete. | 2h | V1-T4 | P0 |
| V1-T7 | Capture page (mobile) | Build `/capture` page. Minimal JS. Single hold-to-record button. Uses MediaRecorder API. Handles iOS Safari (audio/mp4) and Android Chrome (audio/webm). Shows transcription after release. User can edit title/transcription. Save button. Resets for next capture. | Works on real iOS Safari. Works on real Android Chrome. Record → release → transcription shown in <8s. Save → item in queue. | 6h | V1-T4 | P0 |
| V1-T8 | Offline capture | IndexedDB integration in `/capture`. If offline when user releases button: store audio in IndexedDB with a `syncing: false` flag. On reconnect: auto-upload. Show "Saved offline - syncing..." indicator. | Capture on airplane mode → stored locally. Reconnect → uploads automatically. User can see offline captures pending sync. | 4h | V1-T7 | P1 |
| V1-T9 | Home screen hint | On first visit to `/capture`, show a one-time tooltip: "Add this page to your home screen for instant access." With instructions for iOS (Safari share → Add to Home Screen) and Android (Chrome menu → Add to Home Screen). | Tooltip shows once. Dismissable. Platform-specific instructions. | 1h | V1-T7 | P2 |
| V1-T10 | Dashboard Idea Queue | Add Idea Queue section to `/dashboard`. Shows queued ideas sorted by capture time (newest first). Each item shows title, capture time, duration. Click → pre-populates quick generate input. Dismiss button. Empty state: "No ideas in queue. Capture one from your phone." | Queue items clickable. Dismissed items disappear. Empty state shows correctly. | 3h | V1-T6 | P0 |
| V1-T11 | Queue → generation link | When generating from a queue item: set `input_type = 'queue_item'` and `source_idea_id`. After generation, if user marks post as published, update queue item status to 'published'. | Generation created with correct source link. Queue item status updates on publish. Dashboard shows correct queue item count. | 2h | S2-T5, V1-T10 | P1 |
| V1-T12 | Announce to users | Write a product update post for existing users. Email via Stripe customer list. LinkedIn post: "VoiceDNA now captures ideas from your phone." Include a 60-second demo video (screen recording, no editing needed). | All existing users notified. Demo video live. | 2h (non-code) | V1-T7 | P1 |

**V1 checkpoint:** Mobile capture is live. Idea Queue shows on dashboard. At least 25% of new generations originate from a queue item within 30 days of launch.

---

## Parking Lot (Do Not Build Until Stated ARR Threshold)

These tasks exist so they are not forgotten. They are not scheduled.

| Task | ARR Threshold | Notes |
|---|---|---|
| Chrome extension for LinkedIn post import | $200K | Removes manual paste. High user request likelihood. |
| LinkedIn API integration | $200K | Requires LinkedIn review. Start application early. |
| Multi-variant repurposing | $150K | After single-variant validated. |
| Voice profile shareable public link | $100K | Viral mechanic. Build after organic share behaviour observed. |
| Multi-language support | $300K | English only until then. |
| Team / agency accounts | $200K | Multi-tenant architecture already designed. |
| Newsletter Voice DNA expansion | $500K | Same ICP, different channel. Expand from existing customers. |
| Spoken-to-written translation model | $300K | Uses `spoken_samples` field already in schema. Needs 90 days of capture data first. |
| Post scheduling integration | $300K | Partner with Buffer or build native. |
| ICP signal detector | $200K | Maps post performance to audience segment. Requires engagement data. |
| CTA optimizer | $200K | In-voice CTA generation. Requires user feedback loop. |
| Mobile native app (iOS / Android) | $500K | Mobile web sufficient until then. |
| Voice-first post generation | $300K | Behavioral research confirmed capture not creation. Revisit with data at this threshold. |

---

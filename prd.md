# VoiceDNA - Product Requirements Document
**Version:** 1.1  
**Status:** Draft  
**Owner:** Rakshit Jain  
**Last Updated:** June 2026  
**Changelog from v1.0:** Added Quick Capture mode (V1 feature), Idea Queue (dashboard), behavioral design principle separating capture from creation, updated non-goals, updated technical spec with voice transcription pipeline and idea_queue schema, updated milestones and risks.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Success Metrics](#3-goals-and-success-metrics)
4. [Non-Goals](#4-non-goals)
5. [Target Users](#5-target-users)
6. [User Stories](#6-user-stories)
7. [Feature Requirements](#7-feature-requirements)
8. [Technical Specification](#8-technical-specification)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Pricing Model](#10-pricing-model)
11. [Launch Milestones](#11-launch-milestones)
12. [Risks and Mitigations](#12-risks-and-mitigations)
13. [Open Questions](#13-open-questions)

---

## 1. Executive Summary

VoiceDNA is a LinkedIn-native AI writing tool built exclusively for founders, consultants, and coaches who use LinkedIn as a client acquisition channel. It learns from a user's existing post history, extracts a precise voice fingerprint across seven writing dimensions, and generates new LinkedIn content that scores against that fingerprint before the user ever sees the output.

VoiceDNA does not generate ideas. It re-performs the user's own ideas in their exact voice.

**Core behavioral design principle:** LinkedIn post creation is a deliberate act. Founders sit down intentionally to produce content. Voice is not the right interface for that creation session - text is. Voice is the right interface for capturing ideas the moment they occur: during a commute, a walk, a client call debrief. VoiceDNA is therefore designed around two distinct modes that serve two distinct behavioral moments:

- **Quick Capture (mobile, voice):** Capture the idea in 30 seconds when it happens. No friction. No writing.
- **Post Creation (desktop, text):** Sit down, open your idea queue, generate the post in your voice. Deliberate, quality-focused.

The full loop: idea captured in the moment → polished post created on schedule → published in your exact voice.

**One-line positioning:** Your LinkedIn content. Your voice. Your clients.

**Revenue target:** $1M ARR within 20 months of launch.

---

## 2. Problem Statement

Founders and consultants with ideas worth sharing face two compounding problems, not one:

**Problem 1 - The creation problem:** Generic AI tools produce content that sounds like everyone else. Founders who use ChatGPT or Taplio get output that is obviously AI-written, damages their credibility, and drives no pipeline. Every existing tool generates from scratch using generic patterns. None of them starts from "who is this person and how do they actually write."

**Problem 2 - The capture problem:** The best insights do not happen at a desk. They happen during a client call, on a commute, in a conversation. By the time a founder sits down to create LinkedIn content, the nuance and specificity that made the insight compelling is gone. The result: they either write a generic version of the original thought or skip posting entirely. This is the blank page problem, and it compounds the creation problem. Even the best voice-cloning tool cannot help if the user arrives at the creation session with nothing specific to say.

**The compounding failure loop:**
1. Great idea occurs during a client call. No capture mechanism. Insight is forgotten or diluted.
2. Founder sits down to post. Blank page. Falls back on generic AI. Output sounds like everyone else.
3. Engagement drops. No inbound leads. LinkedIn feels like wasted effort.
4. Founder posts less. Algorithm deprioritizes content. Pipeline dries up.

**Who experiences this:** B2B founders (Seed–Series B), independent consultants, and professional coaches who post on LinkedIn and want it to drive business outcomes, not just follower counts.

**Cost of not solving it:** A consultant who closes one $5,000 client from a LinkedIn post has justified 15 months of SaaS spend. The cost of inconsistent posting and AI-generic content is lost pipeline that is invisible but real.

---

## 3. Goals and Success Metrics

### Product Goals

| Goal | Metric | Target | Timeline |
|---|---|---|---|
| Users actually publish AI-generated content | % of generated posts published without >20% edits | ≥ 40% of all generated posts | Measure from week 4 |
| Core generation loop is used repeatedly | Posts generated per active user per week | ≥ 3 posts/week for retained users | Month 2 |
| Users find voice output accurate | Average Voice Match Score at publish | ≥ 78% | Month 1 |
| Product retains paying users | Week 8 retention rate | ≥ 55% | Month 2 |
| Product drives revenue | MRR | $10K by month 3, $40K by month 6 | Rolling |
| Capture mode drives creation (V1) | % of generated posts sourced from an Idea Queue capture | ≥ 30% by month 3 post-V1-launch | Month 3 after V1 |

### Business Goals

| Goal | Metric | Target | Timeline |
|---|---|---|---|
| Validate product-market fit | Paying users who convert from beta | ≥ 5 of first 10 beta users | Week 6 |
| Establish pricing viability | Average revenue per user | ≥ $149/mo | Month 2 |
| Build acquisition engine | % of new signups from referral | ≥ 20% by month 6 | Month 6 |

### North Star Metric
**Posts published per week across all active users.** This is the only metric that proves the product is working. Signups, trial starts, Voice DNA builds, and captured ideas are all leading indicators. Published posts are the outcome.

---

## 4. Non-Goals

The following are explicitly out of scope. Any feature request in these categories is logged in the parking lot and not discussed for implementation until the stated revenue threshold.

| Non-Goal | Threshold to revisit | Reason |
|---|---|---|
| Post scheduling and calendar | $300K ARR | Buffer and Taplio already do this better. Zero users switch tools for a scheduler. |
| LinkedIn analytics dashboard | $300K ARR | Shield Analytics is the market leader. We cannot out-build their data depth. |
| Auto-commenting and LinkedIn automation | Never | LinkedIn has killed tools for this. One enforcement action is existential. |
| Multi-platform support (Twitter, newsletter, Instagram) | $500K ARR | LinkedIn-only is the moat claim. Add newsletter as the first expansion, nothing else. |
| Idea generation from scratch | Never | This turns VoiceDNA into Taplio. Users bring the ideas. We re-perform them. |
| AI carousel or visual content generation | $500K ARR | Different problem, different build, different team. |
| Team or agency accounts | $200K ARR | Architecture must support multi-tenant but do not build the UI yet. |
| Full native iOS or Android app | $200K ARR | Mobile web for Quick Capture is sufficient for V1. Native app is not needed until scale. |
| Voice-first post generation interface | $300K ARR | Behavioral research confirms post creation is a deliberate desktop act. Voice belongs in capture, not generation. Build Quick Capture first and validate before extending voice to generation. |
| LinkedIn API integration for post ingestion | $200K ARR | Too slow to approve. Manual paste removes all platform dependency for MVP. |

---

## 5. Target Users

### Primary ICP - Consultants and Coaches
**Who:** Independent consultants, business coaches, fractional executives using LinkedIn as their primary client acquisition channel.  
**Why they pay:** One closed client from a LinkedIn post generates $3,000–$20,000. VoiceDNA at $199/mo pays for itself with one reply per 15 months.  
**Their specific pain:** They have ideas constantly - in client sessions, on calls, in conversations - but lose them before they can write. When they do sit down to write, generic AI output embarrasses them in front of their target clients.  
**WTP:** $149–$299/mo.

### Secondary ICP - B2B SaaS Founders
**Who:** Founders at Seed to Series B companies who post on LinkedIn to build pipeline, attract recruits, and establish category authority.  
**Why they pay:** Inbound from LinkedIn reduces CAC. One enterprise demo request from a post can be worth $50K+ in pipeline. The tool is expensed without approval.  
**Their specific pain:** They have strong opinions and insights but the best ones occur in product discussions, investor calls, and team retrospectives - not when sitting at a content creation desk.  
**WTP:** $149–$199/mo.

### Tertiary ICP - Personal Brand Builders
**Who:** VCs, senior executives, and operators building thought leadership for career leverage.  
**Why they pay:** ROI is softer. They are more price-sensitive. Serve them but do not build for them.  
**WTP:** $99–$149/mo.

### Anti-ICP - Do Not Build For
- Casual LinkedIn users posting fewer than 2x per week
- Users with under 500 followers who are not actively growing
- B2C founders where LinkedIn is not a sales channel
- Content creators using LinkedIn purely for brand awareness with no revenue linkage

---

## 6. User Stories

### Persona A: Consultant (Primary)

**P0 - Must have for MVP launch**
- As a consultant, I want to paste a raw idea or rough notes and receive 3 LinkedIn posts in my exact voice so that I can post without spending 45 minutes writing.
- As a consultant, I want each generated post to show a voice match percentage so that I know whether to publish or regenerate before I waste time editing.
- As a consultant, I want to build my voice profile from my existing LinkedIn posts so that I do not have to manually configure writing styles.
- As a consultant, I want to see my voice fingerprint displayed visually so that I understand what makes my writing distinctive and can verify the system understood me correctly.

**P1 - Ship within 60 days (V1)**
- As a consultant, I want to record a voice note on my phone when I have a good idea so that I do not lose it before I sit down to create content.
- As a consultant, I want my captured voice ideas to appear as a queue on my desktop so that I never face a blank page during a creation session.
- As a consultant, I want to paste a podcast transcript or email thread and receive a LinkedIn post in my voice so that I can turn existing thinking into content without starting from scratch.
- As a consultant, I want to track how my voice match scores change over time so that I know if my generated content is drifting from my actual voice.

**P2 - Future versions**
- As a consultant, I want to specify my ICP and get feedback on whether my posts are attracting the right audience.
- As a consultant, I want CTA suggestions at the end of each post that sound like I wrote them.

### Persona B: B2B Founder (Secondary)

**P0**
- As a founder, I want to input a company insight or market observation and get a LinkedIn post that sounds like how I actually talk, not how AI writes.
- As a founder, I want to know if the output is authentically mine before I post it publicly, because my personal brand affects my company's credibility.

**P1**
- As a founder, I want to record a quick voice note after a customer discovery call while the insight is fresh, so I can turn it into a post later that has the specificity of the real conversation.
- As a founder, I want to repurpose a thread of internal Slack messages or meeting notes into a LinkedIn post in my voice.

### Persona C: Mobile User - Quick Capture (V1)

- As a user commuting to work, I want to record a 30-second voice note about an idea so that I do not lose it before my next content creation session.
- As a user, I want my voice note automatically transcribed and titled so that I can review it in my idea queue without listening to the recording again.
- As a user, I want to see all my captured ideas in one place when I open the desktop app so that my creation session starts with material, not a blank page.
- As a user, I want to delete or edit a captured idea before generating a post from it so that I can refine the rough thought into a sharper brief.
- As a user, I want the capture interface to be accessible from my phone's home screen in under 3 seconds so that the friction of capturing a thought is lower than the friction of losing it.

### Persona D: New User (Onboarding)

- As a new user, I want to understand how voice extraction works in 60 seconds so that I can decide whether this product is worth my time.
- As a new user, I want to be told exactly how many posts to provide for an accurate voice profile so that I do not provide too few and get a poor result.
- As a new user, I want to see a sample Voice DNA report before inputting my own posts so that I know what the output looks like.

---

## 7. Feature Requirements

### Feature 1: Voice DNA Builder (P0 - MVP)

**Description:** Ingests a user's LinkedIn posts, extracts seven writing dimensions, and produces a structured voice fingerprint stored as the user's profile baseline.

**Minimum Input Requirement:** 15 posts minimum for a basic profile. 40+ posts for high-confidence profile.

| Post count | Confidence level | Label shown to user |
|---|---|---|
| < 15 | Cannot build | "Not enough posts. Add at least 15." |
| 15–29 | Low | "Basic profile. Add more posts for better accuracy." |
| 30–49 | Medium | "Good profile. More posts will improve fidelity." |
| 50+ | High | "Strong profile. Voice model is well-calibrated." |

**Seven Voice Dimensions Extracted:**

| Dimension | What is measured | Example output |
|---|---|---|
| Hook style | Classification of opening line pattern | "78% bold statement, 15% question, 7% story" |
| Sentence rhythm | Average sentence length + short/long mixing ratio | "Avg 11 words. 60% short (<8w), 40% medium (8–20w)" |
| Paragraph structure | Single-line vs multi-line ratio + avg paragraph length | "82% single-line paragraphs. Dense writing avoided." |
| Vocabulary register | Formality score + jargon density + word complexity | "Conversational. Low jargon. Accessible vocabulary." |
| Structural pattern | How post is organized | "Problem → insight → proof → close (65% of posts)" |
| CTA style | How the post closes | "Implicit question CTA in 55% of posts. Rarely hard sell." |
| Emotional register | Tone profile | "Analytical (50%), Pragmatic (30%), Provocative (20%)" |

**Acceptance Criteria:**
- [ ] User can paste raw LinkedIn posts as plain text (one post per block, separated by a divider)
- [ ] System accepts a minimum of 15 posts and a maximum of 200 posts in a single profile build
- [ ] Processing completes in under 45 seconds for 50 posts
- [ ] Voice fingerprint displays all seven dimensions with readable labels
- [ ] User can view their voice fingerprint at any time from their dashboard
- [ ] User can update their profile by adding new posts (profile re-calibrates, does not restart)
- [ ] If fewer than 15 posts are provided, system shows a clear error with guidance, not a broken state
- [ ] Voice fingerprint is stored persistently and survives session logout

**Schema note:** The voice profile schema must include a `spoken_samples` JSONB field (nullable at MVP) to support the future spoken-to-written translation model without a schema migration. This field costs nothing now and saves a rebuild later.

---

### Feature 2: Idea → Post Generator (P0 - MVP)

**Description:** Takes a user's raw idea (any text format) and generates 3 LinkedIn post variants in their exact voice. Each variant displays a Voice Match Score.

**Input formats accepted:**
- Free-form text (idea, insight, story, opinion)
- Bullet points
- A question the user wants to explore
- A captured idea from the Idea Queue (one-click handoff)

**Output:**
- 3 post variants, each 150–350 words
- Each variant displays: Voice Match Score (0–100%), word count
- Variant A: User's dominant hook style + dominant structural pattern
- Variant B: User's second-most-used hook style + same structure
- Variant C: User's dominant hook style + alternative structure
- User can regenerate any single variant without regenerating all three
- User can edit any variant inline before copying

**Voice Match Score thresholds:**

| Score | Label | Action |
|---|---|---|
| 85–100% | "Publish-ready. This sounds like you." | None |
| 70–84% | "Close. Minor edits may improve it." | None |
| 55–69% | "Partial match. Consider regenerating." | Soft regenerate prompt |
| Below 55% | "Low match. Regenerate recommended." | Auto-suggests regeneration |

**Acceptance Criteria:**
- [ ] Any text input of 10–500 words is accepted
- [ ] Generation of 3 variants completes in under 10 seconds
- [ ] Each variant displays Voice Match Score before the full text is visible
- [ ] User can regenerate a single variant with one click
- [ ] User can edit a variant inline in the same view
- [ ] User can copy a variant to clipboard with one click
- [ ] Voice profile must be built before generation is available
- [ ] If idea originates from the Idea Queue, it pre-populates the input field on click
- [ ] Generation history is saved for the user's last 50 generations

---

### Feature 3: Voice Match Score (P0 - MVP)

**Description:** Real-time scoring engine comparing any generated post against the user's Voice DNA baseline.

**Dimension weights:**

| Dimension | Weight |
|---|---|
| Hook style match | 25% |
| Structural pattern match | 20% |
| Vocabulary register match | 20% |
| Sentence rhythm match | 15% |
| Paragraph structure match | 10% |
| CTA style match | 10% |

**Visual display:**
- Circular progress indicator showing percentage
- Color + text label (accessible - never color-only)
- Expandable breakdown showing per-dimension scores (collapsed by default)
- Score persists in generation history

**Acceptance Criteria:**
- [ ] Score renders within 3 seconds of generation completion
- [ ] Score is visible before the full post text loads
- [ ] Color coding includes text label for colorblind accessibility
- [ ] Per-dimension breakdown available on expand
- [ ] Score below 55% displays a regenerate prompt

---

### Feature 4: Basic Repurposing Engine (P0 stretch - MVP)

**Description:** Takes any existing content and converts it into a LinkedIn post in the user's voice.

**Input:** Plain text, 50–3,000 words. Examples: email thread, transcript excerpt, meeting notes, article summary.

**Not in MVP:** URL-based import, file upload, YouTube/podcast integration.

**Acceptance Criteria:**
- [ ] Input of 50–3,000 words accepted
- [ ] Processing + generation completes in under 15 seconds
- [ ] System extracts core idea automatically - user does not specify it
- [ ] Output is a single LinkedIn post with Voice Match Score
- [ ] If no extractable insight found, clear error shown: "We couldn't find a core idea to work with. Try pasting text with an argument or insight."

---

### Feature 5: User Dashboard (P0 - MVP)

**Description:** Central screen after login. Shows voice profile status, idea queue, recent generations, and quick-access generation.

**Components:**

| Component | Description |
|---|---|
| Voice profile card | Confidence level, post count, date last updated, link to full DNA |
| Idea Queue | All captured ideas not yet converted to posts. See Feature 7. |
| Quick generate | Text input on dashboard. Enter idea or select from queue, hit generate. |
| Recent generations | Last 10 generated posts with Voice Match Scores. Click to view/copy. |
| Posts published this week | Manual counter. User checks a checkbox on any generated post to mark as published. |
| Usage counter | Posts generated this billing period vs plan limit. |

**Acceptance Criteria:**
- [ ] Dashboard loads in under 2 seconds
- [ ] Idea Queue shows all unprocessed captures sorted by recency
- [ ] Clicking any idea in the queue pre-populates the quick generate input
- [ ] Published posts counter increments when user marks a post as published
- [ ] Usage counter updates in real-time

---

### Feature 6: Onboarding Flow (P0 - MVP)

**Description:** Path from signup to first generated post. Completable in under 10 minutes.

**Steps:**
1. Sign up (email + password or Google OAuth)
2. Enter name, primary use case (Consultant/Coach / Founder / Executive)
3. Voice DNA build: paste LinkedIn posts. Live post counter and confidence meter displayed as user pastes.
4. Voice DNA report displayed. User reviews before proceeding.
5. First generation: pre-filled with a sample idea based on their use case. User can replace.
6. First output displayed with Voice Match Score. User copies. Prompted to post.

**Acceptance Criteria:**
- [ ] Onboarding completable in under 10 minutes with 20 posts pasted
- [ ] User cannot proceed to generation without building a voice profile
- [ ] Each step shows a progress indicator
- [ ] Voice DNA build step shows live post counter and confidence meter
- [ ] First generation step has a pre-populated example
- [ ] Onboarding state persists across browser close and re-open

---

### Feature 7: Quick Capture Mode (P1 - V1, Day 45–60)

**Description:** A mobile-first voice capture interface allowing users to record short voice notes on the go. Notes are transcribed and stored in the Idea Queue on the desktop. This solves the insight-loss problem - the best ideas happen away from desks.

**Behavioral design note:** This feature exists because LinkedIn post creation is deliberate (desktop, text, focused) while idea capture is reactive (mobile, voice, contextual). These are distinct behavioral moments requiring distinct interfaces. Quick Capture is not a step toward voice-first post generation - it is a standalone capture layer feeding the text-based creation workflow.

**Interface:** Mobile web app (not native app). Accessible from phone browser, bookmarkable to home screen. Single-screen UI.

**Core interaction:**
1. User opens Quick Capture on mobile (home screen bookmark)
2. One large button: "Hold to capture"
3. User holds button and speaks (5 seconds to 3 minutes)
4. User releases button
5. Recording transcribed within 5 seconds (OpenAI Whisper)
6. Transcription displayed with auto-generated title (first sentence or extracted topic)
7. User can edit transcription inline or accept as-is
8. Idea saved to their Idea Queue
9. Screen resets, ready for next capture

**Idea Queue item structure:**
- Auto-generated title (editable)
- Full transcription (editable)
- Original audio duration
- Capture timestamp
- Status: Queued / In Progress / Published / Dismissed

**Acceptance Criteria:**
- [ ] Mobile web interface loads in under 2 seconds on 4G
- [ ] Hold-to-record button activates microphone immediately, no additional permission prompts after first use
- [ ] Recording stops on button release. Maximum recording length: 3 minutes. Warning at 2:45.
- [ ] Transcription completes within 5 seconds of recording stop
- [ ] Auto-generated title appears above the transcription
- [ ] User can edit both title and transcription before saving
- [ ] Saved idea appears in Idea Queue on desktop within 2 seconds of save
- [ ] Queue persists across sessions - ideas are not lost on browser close
- [ ] User can dismiss (soft delete) ideas from the queue with one tap
- [ ] No login required after first authentication - session persists on the mobile device
- [ ] Interface works offline for recording; syncs when connectivity returns

**Edge cases:**
- Recording in a noisy environment: Whisper handles this well, but show a "noisy environment detected - check your transcription" warning if confidence score is below threshold
- Recording cut off at 3 minutes: Save what was captured, notify user the recording was trimmed
- No internet connection at capture time: Store audio locally, transcribe and sync when back online
- User accidentally records silence or ambient noise: Show transcription, let user dismiss, no auto-deletion

---

## 8. Technical Specification

### Architecture Overview

```
User (Desktop) → Next.js Frontend → API Routes (Next.js) →
  ├── Voice DNA Service (Python FastAPI)
  │     ├── Text preprocessing
  │     ├── Embedding generation (OpenAI text-embedding-3-small)
  │     ├── Dimension extraction (LLM structured output)
  │     └── Profile storage (PostgreSQL + pgvector)
  ├── Generation Service (Python FastAPI)
  │     ├── Context assembly (voice profile + user input + few-shot examples)
  │     ├── Multi-variant generation (primary: claude-sonnet-4-6, fallback: gpt-4o)
  │     └── Score calculation
  ├── Capture Service (Python FastAPI)
  │     ├── Audio upload endpoint (accepts WebM/MP4 from mobile browser)
  │     ├── Transcription (OpenAI Whisper API)
  │     ├── Auto-title generation (LLM, single call)
  │     └── Idea Queue storage (PostgreSQL)
  └── Auth + Payments (Clerk + Stripe)

User (Mobile) → Mobile Web (Next.js responsive) →
  └── Capture Service (same as above)
```

**Note for builder:** The Capture Service is a new addition vs v1.0. It can be a separate FastAPI module within the same codebase - do not spin up a separate service for this. The audio-to-transcription pipeline mirrors how Mitra AI handles multi-step processing but is simpler: one audio file in, one text string out.


---

### Voice DNA Extraction - LLM Prompt Design

**Step 1: Batch embedding.** Embed all user posts using `text-embedding-3-small`. Store per-post embeddings in `user_posts.content_embedding`. Compute aggregate profile embedding as the mean vector stored in `voice_profiles.profile_embedding`.

**Step 2: Dimension extraction.** Use a structured output LLM call (Claude Sonnet with JSON mode) on a random sample of 15–25 posts per dimension.

Example system prompt for hook style extraction:
```
You are analyzing LinkedIn post openings to classify writing patterns.
For each post, classify its opening line into one of:
- bold_statement: A declarative claim made without hedging
- question: An opening question directed at the reader
- story: A personal narrative or scene-setting
- contrarian: A statement that contradicts conventional wisdom
- data_point: An opening statistic or number
- direct_address: Opens by directly addressing the reader

Respond ONLY with valid JSON. No preamble. Example:
{"classifications": ["bold_statement", "question", "bold_statement"]}
```

**Step 3: Distribution aggregation.** Convert classifications to frequency distributions stored as JSONB.

---

### Post Generation - Prompt Architecture

**System prompt structure:**
```
You are a LinkedIn ghostwriter for [name]. Your only job is to write posts
that are indistinguishable from their authentic writing.

VOICE DNA PROFILE:
- Hooks: Uses bold statements 78% of the time. Rarely opens with questions.
- Structure: Typically follows: [problem/observation] → [insight] → [evidence] → [close]
- Sentences: Short. Average 11 words. Mix of single-word punches and longer lines.
- Paragraphs: Nearly always single-line. Dense blocks are out of character.
- Vocabulary: Conversational. Low jargon unless explaining a specific concept.
- CTA: Ends with an implicit question or leaves the reader to reflect. Never "DM me."
- Tone: Analytical and pragmatic. Occasionally provocative. Never inspirational fluff.

EXAMPLE POSTS (highest voice match to the input idea):
[3 exemplar posts retrieved via pgvector cosine similarity - see few-shot note below]

RULES:
1. Never use em dashes
2. Never use "In today's world" or "In a world where"
3. Never start with "I've been thinking about..."
4. Match paragraph spacing - single lines with white space between
5. Post must be 150–350 words
6. Return ONLY the post text. No preamble. No explanation.
```

**Few-shot selection:** For each generation, retrieve the 3 user posts with highest cosine similarity to the input embedding using pgvector `<=>` operator. Inject as examples. This is the primary quality driver - do not skip it.

---

### Quick Capture - Technical Pipeline

**Audio capture:** Use the browser's `MediaRecorder` API (WebM/Opus format). No third-party SDK needed. Works in Chrome, Safari, and Firefox on mobile.

**Upload:** On recording stop, POST audio blob to `/api/capture/upload`. Max file size: 10MB (approximately 10 minutes of audio - enforce 3-minute cap client-side).

**Transcription:** Call OpenAI Whisper API (`whisper-1`). Average latency for 60-second audio: 2–4 seconds. Cost: $0.006 per minute of audio.

**Auto-title generation:** After transcription, single LLM call (GPT-4o-mini for cost):
```
Given this transcription of a voice note, generate a 5-8 word title
that captures the core idea. Return only the title, no punctuation at start or end.

Transcription: [transcription text]
```

**Offline handling:** If network unavailable at capture time, store audio in browser IndexedDB. On reconnect, auto-sync to server. Show a "Saving..." indicator that resolves to "Saved" on sync. Do not lose captures.

**Audio storage:** Store audio temporarily in S3 (or Cloudflare R2 for cost). Delete audio file after successful transcription. Retain transcription only. Audio should not be stored permanently - both for cost and user privacy.

---

### Voice Match Score Calculation

```python
def calculate_voice_match_score(
    generated_post: str,
    voice_profile: VoiceProfile,
    generated_post_analysis: PostAnalysis
) -> VoiceMatchResult:

    weights = {
        'hook_style': 0.25,
        'structural_pattern': 0.20,
        'vocabulary_register': 0.20,
        'sentence_rhythm': 0.15,
        'paragraph_structure': 0.10,
        'cta_style': 0.10
    }

    scores = {}

    scores['hook_style'] = compare_hook(
        generated_post_analysis.hook_type,
        voice_profile.hook_distribution
    )
    scores['structural_pattern'] = compare_structure(
        generated_post_analysis.structure,
        voice_profile.structural_pattern
    )
    scores['vocabulary_register'] = cosine_similarity(
        generated_post_analysis.vocab_embedding,
        voice_profile.vocab_baseline_embedding
    )
    scores['sentence_rhythm'] = rhythm_similarity(
        generated_post_analysis.sentence_stats,
        voice_profile.sentence_rhythm
    )
    scores['paragraph_structure'] = paragraph_similarity(
        generated_post_analysis.paragraph_stats,
        voice_profile.paragraph_structure
    )
    scores['cta_style'] = compare_cta(
        generated_post_analysis.cta_type,
        voice_profile.cta_style
    )

    weighted_score = sum(
        scores[dim] * weights[dim] for dim in weights
    )

    return VoiceMatchResult(
        overall_score=round(weighted_score * 100),
        dimension_scores=scores,
        label=get_label(weighted_score)
    )
```

---

### LLM Provider Routing

Use the circuit breaker pattern from Mitra AI.

| Call type | Primary model | Fallback | Max tokens |
|---|---|---|---|
| Post generation | claude-sonnet-4-6 | gpt-4o | 500 |
| Voice match scoring | gpt-4o-mini | claude-haiku-4-5 | 200 |
| Dimension extraction | claude-sonnet-4-6 | gpt-4o-mini | 300 |
| Auto-title (capture) | gpt-4o-mini | claude-haiku-4-5 | 30 |
| Repurpose generation | claude-sonnet-4-6 | gpt-4o | 500 |

**Cost targets per operation:**

| Operation | Target cost |
|---|---|
| Voice DNA build (50 posts) | < $0.04 |
| 3-variant post generation | < $0.06 |
| Voice match scoring (per post) | < $0.01 |
| Repurpose generation | < $0.04 |
| Quick Capture transcription (60s) | < $0.006 |
| Auto-title generation | < $0.001 |

A $199/mo user generating 20 posts/month and capturing 10 ideas costs approximately $1.60 in API costs. Gross margin above 99% before infrastructure.

---

### LinkedIn Post Ingestion - MVP Approach

No LinkedIn API for MVP. Manual paste only.

**UX:**
- Large text area: "Paste your LinkedIn posts here. Separate each post with - or a blank line."
- Auto-parser shows live count: "15 posts detected."
- Simple linked guide: "How to copy your posts from LinkedIn" (3-step screenshot guide)

**Post-launch:** Chrome extension that reads posts from the user's own profile page and copies them in the correct format. 2–3 weeks of work. Does not block launch.

---

## 9. Non-Functional Requirements

| Requirement | Target | Notes |
|---|---|---|
| Post generation latency | < 10 seconds for 3 variants | P99. Max 15 seconds. Show spinner. |
| Voice DNA build time | < 45 seconds for 50 posts | Async. Show progress bar. |
| Voice match scoring latency | < 3 seconds per post | Score must render before full post text loads. |
| Quick Capture transcription | < 5 seconds for 60-second audio | Show "Transcribing..." indicator. |
| Dashboard page load | < 2 seconds | Core dashboard view. |
| Mobile capture page load | < 2 seconds on 4G | Capture UI must be fast. Latency kills capture behavior. |
| Uptime | 99% monthly | MVP SLA. Single region acceptable. |
| Data isolation | Strict per-user | No voice profile, post data, or captured ideas shared between users. |
| Audio deletion | Within 60 seconds of successful transcription | Do not retain audio files. Cost and privacy. |
| API key security | Never exposed to frontend | All LLM calls server-side only. |
| Stripe webhook reliability | Idempotent handlers | Duplicate events must not double-charge. |
| Rate limiting | Per-user, per-endpoint | Voice DNA build: 1 per 10 minutes. Generation: 30 per hour. Capture: 20 per hour. |

---

## 10. Pricing Model

| Plan | Price | Post generation | Repurposing | Quick Capture | Target user |
|---|---|---|---|---|---|
| Starter | $99/mo | 20 posts/mo | 5/mo | 10 captures/mo | Casual poster, brand builders |
| Growth | $199/mo | Unlimited | Unlimited | Unlimited | Consultants, coaches, active founders |
| Pro | $299/mo | Unlimited | Unlimited + priority | Unlimited | High-ticket consultants |

**Launch pricing:** First 50 users get a locked-in beta rate of $79/mo (Starter equivalent with Growth limits). Lifetime rate as long as they do not churn.

**Quick Capture for Starter:** 10 captures/mo is generous enough to be useful and creates a natural upgrade trigger. A Starter user who captures 10 ideas will want to capture more. One-line upgrade prompt: "You've used all your captures this month. Upgrade to Growth for unlimited."

**Stripe setup:**
- Monthly recurring for all tiers
- 14-day free trial (no card required for first 7 days)
- Usage enforcement at plan limits with upgrade prompt

---

## 11. Launch Milestones

### MVP - Week 1–6

**Week 1–2: Build core**
- [ ] Database schema deployed (PostgreSQL + pgvector, including `idea_queue` and `audio_uploads` tables)
- [ ] Auth working (Clerk)
- [ ] Voice DNA extraction pipeline built and tested on 3 sample corpora
- [ ] Post generation working with voice profile injection and few-shot selection
- [ ] Voice match scoring functional

**Week 3: Validate**
- [ ] Onboarding flow complete end-to-end
- [ ] Dashboard functional (including empty Idea Queue state)
- [ ] Stripe connected (billing works)
- [ ] 3 internal test users complete full flow
- [ ] Benchmark: at least 2 of 3 testers publish a generated post without >20% edits

**Week 4: Beta**
- [ ] Invite 10 beta users from personal LinkedIn network
- [ ] Onboard all 10 manually
- [ ] Track: posts generated, posts published, edits made
- [ ] Specific question for beta users: "Where do your best LinkedIn ideas usually come from - desk sessions or elsewhere?"

**Week 5–6: Convert**
- [ ] Offer beta users $79/mo locked rate
- [ ] Target: 5 of 10 convert to paid
- [ ] Hard gate: fewer than 4 conversions = do not proceed. Fix product first.
- [ ] 5+ conversions = proceed to public launch

**Week 7–8: Public Launch**
- [ ] LinkedIn posts announcing VoiceDNA
- [ ] Free Voice DNA audit tool live
- [ ] Landing page live with Stripe
- [ ] DM campaign: 50 targeted LinkedIn connections per week

---

### V1 - Week 8–12 (run parallel to early growth, post-PMF confirmation)

**Week 8–9: Quick Capture build**
- [ ] Mobile web capture UI built (responsive Next.js page, hold-to-record)
- [ ] MediaRecorder API integration working on iOS Safari and Android Chrome
- [ ] Whisper transcription pipeline connected
- [ ] Auto-title generation connected
- [ ] Offline capture with IndexedDB sync working

**Week 10: Capture integration**
- [ ] Idea Queue visible on desktop dashboard
- [ ] Queue items clickable → pre-populate generation input
- [ ] Status tracking (Queued / Published / Dismissed) working
- [ ] Capture accessible from mobile home screen bookmark

**Week 11–12: V1 launch**
- [ ] Announce Quick Capture to existing users
- [ ] Track: what % of generated posts originate from a queue item vs direct text input
- [ ] Target metric: 25%+ of generations sourced from queue within 30 days of V1 launch

---

## 12. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Voice fidelity not good enough (users do not publish) | High | Critical | Benchmark before launch: 40%+ of beta-generated posts published without >20% edits. If below, delay and improve few-shot selection before anything else. |
| Users do not use Quick Capture (behavior not adopted) | Medium | Medium | Validate in beta: ask where their best ideas come from. If fewer than 50% say "away from desk," Quick Capture is lower priority. Do not delay MVP for it. |
| iOS Safari microphone access issues with WebRTC | Medium | Medium | Test on iOS Safari specifically during week 8. Fallback: text-based capture input (type idea on mobile, voice is the enhancement not the requirement). |
| Audio transcription quality in noisy environments | Medium | Low | Whisper handles noise well. Flag low-confidence transcriptions and let user correct. The capture is better than losing the idea entirely even if imperfect. |
| LLM API costs exceed budget | Low | Medium | Hard cost limits per user tier. Monitor daily. Cache voice profiles aggressively. |
| Taplio copies the Voice Match Score feature | Medium | Medium | Our moat is the persistent trained profile, not the UI feature. Taplio cannot replicate a user's voice profile without the user's own data. |
| Churn from users who generate but do not publish | High | High | Track publish rate from day 1. If generation-to-publish rate falls below 30%, the product is failing regardless of other metrics. Fix before scaling acquisition. |
| User has insufficient post history (<15 posts) | High | Medium | Starter mode at 8+ posts with clear low-confidence labelling. Onboarding guide on how to export LinkedIn post history. |
| Quick Capture creates offline sync complexity | Low | Medium | IndexedDB + server sync is a solved pattern. Do not over-engineer. Simple retry queue is sufficient. |
| Beehiiv or LinkedIn builds this natively | Low | High | Speed is the only moat against platform encroachment. Get to 500 paying users before this becomes a real threat. |

---

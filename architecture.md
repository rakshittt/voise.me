# VoiceDNA - Architecture v3.1 (Implementation Spec)
**Status:** Approved for build
**Supersedes:** architecture.md v2.0, design.md v3.0
**Merged inputs:** v3.0 Fidelity & Flywheel design + validated findings from authorship research reports (June 2026)
**Last updated:** June 2026

---

## 0. The One-Paragraph Summary

v2.0 is a prompting-only pipeline scored by a rubric the generator can see. Research is unambiguous that this measures the wrong thing: LLMs replicate **explicit** style (emojis, hooks, line breaks, CTAs) trivially and **implicit** style (syntax patterns, function-word distributions, lexical diversity, rare-word usage) almost never. Prompting-only personalization scores 0.484–0.508 on LUAR - *below* the 0.626 random cross-author floor. All 7 of v2.0's scoring dimensions are explicit features. v3.1 adds implicit-style measurement (style embeddings + stylometrics), self-calibrating per-user scoring, a closed edit loop, and an eval harness with absolute external anchors - while keeping cost and ops at solo-founder scale.

**Calibration anchors (memorize these):**

| Anchor | LUAR score |
|---|---|
| Human self-similarity ceiling | 0.756 |
| Same-author control target | ~0.70 |
| Frontier-model prompting ceiling | 0.643–0.649 |
| Random cross-author floor | 0.626 |
| Naive prompting personalization | 0.484–0.508 |

Anything we generate that scores below 0.626 on LUAR sounds like *someone else*. The realistic calibrated ceiling for a prompting-based pipeline is ~80–85% - set thresholds and user expectations accordingly.

---

## 1. Defects Being Fixed (carried from v3.0, sharpened)

| # | Defect | Root cause | v3.1 fix |
|---|---|---|---|
| D1 | Score measures prompt-following, not fidelity | Generator and judge share the rubric (Goodhart) | Decouple judge; remove rubric from generation prompt (§5.2) |
| D2 | Output converges to caricature; Variant B loses by construction | All dims reward dominant pattern | Variant-target scoring (§5.3) |
| D3 | Edit data collected, never used | No consumer for `post_edit_events` | Edit loop: differ → distiller → edit rules + living corpus (§6) |
| D4 | No proof the product works | No holdout, no behavior correlation | Eval harness with LUAR + StyleDistance anchors (§7) |
| **D5 (new)** | **Scorer only measures explicit style - the part LLMs always get right** | All 7 rubric dims are surface/category features | Implicit-style dimensions: style embedding, MTLD, POS-JSD, signature vocabulary (§4, §5.1) |

---

## 2. System Topology (delta view)

Unchanged: Next.js 16 / Vercel front, FastAPI / Railway back, PostgreSQL 16 + pgvector, Clerk, Stripe, R2, GPT-4o family via LLM router. No Redis/Celery yet; one APScheduler worker process added for nightly jobs.

New service modules:

```
services/
  style_embed/          # NEW - self-hosted implicit-style measurement
    encoder.py          #   StyleDistance (primary), ONNX CPU inference
    luar.py             #   LUAR encoder (eval-only metric, not scoring)
    centroids.py        #   per-pillar centroids + EMA updates + LOO distributions
  stylometrics/         # NEW - deterministic implicit features (spaCy)
    features.py         #   MTLD, POS distributions, punctuation rates, sentence stats
    divergence.py       #   POS JS-divergence, MTLD delta vs profile
    signature.py        #   signature-vocabulary presence check + injection candidates
  eval/                 # NEW - fidelity eval harness
    holdout.py          #   holdout reconstruction test
    correlation.py      #   score vs edit-distance tracking (the ρ gate)
    anchors.py          #   LUAR floor/ceiling checks, generic-AI centroid distance
  edit_loop/            # NEW - edit distillation
    differ.py           #   structural diff classification
    distiller.py        #   recurring deltas → edit rules (LLM)
  voice_dna/            # MODIFIED - build pipeline additions
  generation/           # MODIFIED - synthesis step, signature injection, variant targets
  llm/                  # unchanged
```

**Model serving decisions (final):**
- StyleDistance: pretrained HuggingFace checkpoint, ONNX export, CPU inference on the existing Railway instance. Target <300ms per text. NO fine-tuning, NO contrastive training, NO SYNTHSTEL pipeline - pretrained zero-shot until the eval harness proves the checkpoint is the bottleneck.
- LUAR: pretrained checkpoint, eval harness only (it has known length/topic shortcuts, so it is a *metric*, never a scoring input).
- spaCy `en_core_web_sm` + `lexical_diversity` lib for stylometrics. Pure CPU, ~5ms per post.
- Style embedding space ≠ content embedding space. OpenAI embeddings keep driving retrieval (topic similarity). Style vectors drive fidelity. Never mix.

---

## 3. Voice DNA Build Pipeline (v3.1)

```
User pastes 15–200 posts  (paste + GDPR-export upload remain the ingestion paths;
        │                  LinkedIn OAuth does NOT expose member post history - do not plan on it)
        ▼
Step 1  Parse + Clean                      (unchanged)
Step 2  Content embeddings (OpenAI)        (unchanged - retrieval store)
Step 2.5 NEW  Style embeddings (StyleDistance, batch ONNX)
        - per-post style vector → user_posts.style_embedding
Step 2.6 NEW  Holdout selection
        - if post_count ≥ 25: randomly reserve 5 posts → eval_holdouts,
          EXCLUDED from profile build and retrieval
Step 3  Parallel dimension extraction      (unchanged - 6 LLM calls)
Step 3.5 NEW  Stylometric profile
        - per-post: MTLD, POS distribution, punctuation rates, sentence stats
        - store per-feature μ and σ → voice_profiles.stylometric_profile (JSONB)
        - signature vocabulary: rare words/phrases appearing ≥3x in corpus but
          low-frequency in general English → lexical_signature.signature_vocab
Step 3.6 NEW  Centroids + LOO calibration distribution
        - per content-pillar style centroid + global centroid
        - LEAVE-ONE-OUT: for each post i, sim(post_i, centroid(all − i))
          → sorted array of N intra-author similarities = the user's own
          internal style variance → style_centroids.loo_distribution (JSONB)
Step 4  Profile assembly                   (modified - adds stylometric profile,
                                            centroid refs, fidelity placeholders)
Step 5  NEW  Async eval harness kickoff (§7) - does not block "ready" status

Time: 30–60s for 50 posts (was 20–45s).  Cost: ~$0.05.
```

**Why LOO replaces the v3.0 μ/σ band:** percentile against the user's own distribution is self-calibrating, has no magic constants, and automatically widens for high-variance writers. A generated post scoring "78th percentile" means: closer to your centroid than 78% of your own real posts. That sentence is also the honest UI copy.

---

## 4. Voice Match Scoring v3.1 - Explicit + Implicit

Ten dimensions. The judge LLM never sees the generation prompt; the generator never sees the scoring targets (D1 fix).

| # | Dimension | Type | Method | Weight |
|---|---|---|---|---|
| 1 | Style-embedding percentile | **Implicit** | LOO percentile vs pillar centroid (§3 Step 3.6) | **0.22** |
| 2 | MTLD divergence | **Implicit** | \|MTLD_gen − μ_user\| / σ_user → decay score | **0.08** |
| 3 | POS JS-divergence | **Implicit** | JSD of POS distributions, extra weight on adverb/adjective ratios | **0.08** |
| 4 | Signature vocabulary | **Implicit** | fraction of expected signature-vocab presence (length-scaled) | **0.07** |
| 5 | Hook style | Explicit | LLM classification, corpus-anchored | 0.12 |
| 6 | Structural pattern | Explicit | LLM classification, corpus-anchored | 0.12 |
| 7 | Sentence rhythm | Explicit | deterministic | 0.09 |
| 8 | Vocabulary register | Explicit | deterministic | 0.08 |
| 9 | Paragraph structure | Explicit | deterministic | 0.07 |
| 10 | CTA + emotional register | Explicit | LLM classification (merged call) | 0.07 |

Implicit dimensions now carry 0.45 of the weight. That is the point: the v2.0 scorer assigned 100% of weight to features LLMs fake effortlessly.

**Final score = LOO-percentile-calibrated weighted sum, 0–100.**

**Threshold policy (changed):** the v2.0 hard-coded `score ≥ 85` refinement gate is retired. The prompting-based fidelity ceiling is ~80–85 calibrated, so a fixed 85 either always fires or sits on an inflated scorer. New policy:
- Refinement triggers when score < user's 60th LOO percentile OR any implicit dimension < 0.5 OR the generic-AI check fires (below).
- Re-derive the user-facing "ready" badge threshold empirically after 4 weeks of edit-distance data (§7.2). Until then the UI shows the percentile, not a pass/fail.

**Generic-AI drift check (hard gate, independent of score):** maintain a one-time "generic LLM centroid" (style-embed ~200 vanilla GPT-4o LinkedIn posts, ~$2). If a draft is closer to the generic centroid than to the user's centroid → automatic refinement regardless of score. This catches the documented failure mode: imitation outputs clustering with generic GPT text instead of the target author.

---

## 5. Generation Pipeline v3.1

```
User submits idea
   │
   ├─ parallel: embed input (content space) + load profile + edit rules
   ▼
Few-shot retrieval (pgvector, content space, 3 exemplars)
   ranking = cosine × recency_boost × source_boost(published+edited = 1.2)
   ▼
NEW Synthesis step (gpt-4o-mini, ~$0.002)
   3 exemplars → 4–6 bullets: "stylistic moves these posts share"
   ▼
Prompt assembly (prompt_builder.py)
   + voice profile + deep fingerprint
   + 3 exemplars (the WHAT) + synthesis bullets (the HOW)
   + edit rules (now actually populated, §6)
   + NEW signature-vocabulary nudge: "vocabulary this author reaches for:
     [signature_vocab sample]" - natural injection beats post-hoc replacement
   − scoring rubric REMOVED from generator prompt (D1)
   ▼
3 variants (each carries variant_target spec: {hook, structure})
   ▼
Score each (§4) - judge prompt anchored with 2–3 labeled examples
   from the user's own corpus per LLM-classified dimension
   Hook + structure dims score against the VARIANT TARGET, not the
   dominant profile entry (D2). Implicit dims always score vs profile.
   ▼
NEW Signature post-check: if signature-vocab dimension < 0.4 AND refinement
   triggers anyway, critique includes specific vocabulary suggestions
   ("this author writes 'shipped' not 'launched'") - hapax injection done
   through the refinement pass, never naive string replacement
   ▼
Refinement: ONE pass max, keep best of 2 (unchanged - best-of-5 loops
   rejected: 3x cost for marginal gain against a now-honest scorer)
   ▼
Response: variants labeled by STRATEGY ("Your usual style" / "Question hook" /
   "Alternative structure"), each with its own percentile score.
   No score-sorted ordering (D2).
```

Cost per generation: ~$0.11–0.21 (was $0.10–0.20; +synthesis +slightly longer judge prompts). Latency +1.0–1.5s.

---

## 6. Edit Loop (unchanged from v3.0 design, now normative)

Nightly worker:
1. **differ.py** - classify each unprocessed `post_edit_events` row: length delta, sentences shortened/split, hook replaced (first 210 chars changed >60%), CTA removed/changed, killed-words frequency map, emoji/punctuation deltas, paragraph re-breaking → `edit_deltas`.
2. **distiller.py** - for users with ≥5 classified events since last run: one gpt-4o-mini call distills recurring deltas into ≤7 imperative rules with confidence. Rules ≥0.6 → `edit_rules` (active, versioned). Confidence decays 0.05/week when the pattern stops recurring; <0.4 → archived.
3. **Living corpus** - on publish, the edited content is inserted into `user_posts` (`source='published'`, both embeddings computed). Retrieval boost 1.2x.
4. **Centroid maintenance** - EMA update on every published post: `c_new = normalize(0.9·c_old + 0.1·v_post)` (cheap, immediate), plus full centroid + LOO-distribution recompute weekly for users with ≥3 new published posts (exact, periodic). EMA handles drift between recomputes; the weekly job keeps the LOO calibration honest.
5. **Drift detection** - if cosine distance between the EMA centroid and the last full-recompute centroid exceeds 0.15 for two consecutive weeks, surface "your style has evolved - rebuild your DNA?" rather than silently mutating the profile.

---

## 7. Eval Harness (the part that decides everything else)

### 7.1 Holdout reconstruction (per user: at build, then monthly)
1. 5 held-out posts (§3 Step 2.6) → gpt-4o-mini strips each to a neutral one-line idea.
2. Full generation pipeline runs on each idea (1 variant, dominant strategy).
3. Metrics per pair (generated vs original):
   - StyleDistance cosine similarity
   - **LUAR similarity** - the independent ruler. Interpretation bands: <0.626 = sounds like someone else (fail); 0.626–0.649 = frontier-prompting territory (expected for v3.1); >0.65 = beating the published prompting ceiling (validate before celebrating); approach 0.70+ only expected post-adapters.
   - centroid gap: sim(original, centroid) − sim(generated, centroid)
   - MTLD / POS-JSD deltas
4. Aggregate → `voice_profiles.fidelity_score` (internal until §7.2 gate passes).

### 7.2 The ρ gate (project health metric #1)
Weekly Spearman correlation between voice match score and normalized edit distance across all `post_edit_events`. **Acceptance: ρ ≤ −0.4.** Higher score must mean less editing. If the gate fails: freeze feature work, fix scoring. A score users don't feel is negative value. The user-facing "ready" threshold (§4) is derived from this data: the score above which median edit distance falls below 15% of post length.

### 7.3 Checkpoint validation (one-time, before trusting dim 1)
StyleDistance and LUAR were trained mostly on longer text (Reddit, reviews, fanfiction); LinkedIn posts are short and structurally weird. Before dim 1 leaves shadow mode: on our own user corpora, verify mean intra-author style similarity exceeds mean inter-author similarity with a margin ≥0.05 across ≥20 users. If it fails for short posts, fall back to scoring on concatenated post pairs (research shows ~512 words is where attribution stabilizes) or swap encoder. Do not skip this - every downstream number depends on it.

### 7.4 Marketing artifact (later, schema-ready now)
Opt-in blind test: "pick your post out of 3." `eval_holdouts.human_pick_result` reserved. Publish the Turing-test stat only after §7.2 passes.

---

## 8. Schema Delta (v3.0 schema + these changes)

```sql
-- style_centroids: replace band fields with LOO distribution
ALTER TABLE style_centroids DROP COLUMN IF EXISTS intra_sim_mean;
ALTER TABLE style_centroids DROP COLUMN IF EXISTS intra_sim_std;
ALTER TABLE style_centroids ADD COLUMN loo_distribution JSONB;      -- sorted intra-author sims
ALTER TABLE style_centroids ADD COLUMN ema_centroid VECTOR(768);    -- fast-update centroid
ALTER TABLE style_centroids ADD COLUMN last_full_recompute TIMESTAMPTZ;

-- voice_profiles additions
ALTER TABLE voice_profiles ADD COLUMN stylometric_profile JSONB;    -- {feat_mean, feat_std} × ~12
ALTER TABLE voice_profiles ADD COLUMN signature_vocab JSONB;        -- ranked rare words/phrases
ALTER TABLE voice_profiles ADD COLUMN luar_fidelity REAL;           -- holdout LUAR mean
ALTER TABLE voice_profiles ADD COLUMN ready_threshold INT;          -- empirically derived, NULL until §7.2

-- eval_holdouts additions
ALTER TABLE eval_holdouts ADD COLUMN luar_sim REAL;
ALTER TABLE eval_holdouts ADD COLUMN mtld_delta REAL;
ALTER TABLE eval_holdouts ADD COLUMN pos_jsd REAL;

-- generic AI reference (one row)
CREATE TABLE reference_centroids (
  key        VARCHAR(50) PRIMARY KEY,        -- 'generic_gpt4o_linkedin'
  centroid   VECTOR(768) NOT NULL,
  sample_n   INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
(All v3.0 tables - `edit_deltas`, `edit_rules`, `eval_holdouts`, `user_posts.source/style_embedding`, `generations.performance/variant_targets` - remain as specified.)

---

## 9. Cost Model (per Growth user, $199/mo)

| Item | v2.0 | v3.1 |
|---|---|---|
| 20 generations | $2.00 | $2.60 (synthesis + longer judge) |
| Repurpose / DNA match / captures | $0.34 | $0.40 |
| Edit distillation (nightly, amortized) | - | $0.05 |
| Monthly holdout eval (5 gens + scoring + LUAR) | - | $0.55 |
| Style/stylometric inference (CPU, self-hosted) | - | ~$0 marginal |
| Infra share | $0.30 | $0.40 (worker process) |
| **Total COGS** | **$2.64** | **~$4.00 → margin ~98%** |

---

## 10. Rollout (4 sprints, each with an exit gate and a kill switch)

| Sprint | Ship | Exit gate | Kill/branch condition |
|---|---|---|---|
| **5** | style_embed + stylometrics services; build-pipeline Steps 2.5/3.5/3.6; §7.3 checkpoint validation; dims 1–4 in **shadow mode** (computed + logged, invisible) | Checkpoint validation passes (intra > inter by ≥0.05); shadow scores logged on 100% of generations | Validation fails → concatenated-pair scoring fallback or encoder swap BEFORE any further sprint work |
| **6** | D1/D2 fixes: rubric out of generator, decoupled corpus-anchored judge, variant-target scoring, strategy-labeled UI; generic-AI gate; LOO calibration live; holdout harness at build | ρ job live with baseline recorded; <5% of shipped drafts closer to generic centroid than user centroid | ρ baseline worse than −0.1 → scoring debug sprint before Sprint 7 |
| **7** | Edit loop (differ, distiller, rules in prompt); living corpus + EMA centroids; signature-vocab dimension + refinement injection | ≥1 active rule for every user with ≥5 edits; manual QA on 5 users shows rules visibly changing output | Rules don't change output → distillation prompt iteration, hold sprint 8 |
| **8** | Dims 1–4 leave shadow mode; empirically derived ready-threshold; performance capture endpoint + 48h nudge; fidelity_score user-visible **iff ρ ≤ −0.4** | Gate decision documented either way; ≥30% of published posts get performance data in 7 days | <10 active beta users by now → freeze sprints, acquisition is the bottleneck, not architecture |

---

## 11. Explicit Non-Goals (so nobody scope-creeps this)

- **No model training of any kind in this phase.** No StyleDistance fine-tuning, no SYNTHSTEL generation, no NT-Xent loops, no per-user LoRA, no TinyStyler. Adapter phase (DITTO-style DPO on accumulated preference pairs) stays gated behind: ≥50 retained paying users AND ≥30 users with ≥10 preference pairs AND ρ gate passing. If TinyStyler is ever tested, it is tested as a post-hoc style-polish pass, not as the generator.
- No best-of-N candidate loops beyond the single refinement pass.
- No infra migration (stays Railway + pgvector; no Pinecone/Weaviate/ChromaDB/Supabase).
- No LinkedIn OAuth ingestion plan (the API does not expose member posts to third parties).
- No auto-posting, no scheduling, no analytics dashboard (manual performance capture only).
- No multilingual support (mStyleDistance deferred).

## 12. Moat Mapping (what each piece compounds into)

| Rung | Mechanism | v3.1 component |
|---|---|---|
| 1 Switching cost | Profile improves with every edit/publish | §6 edit loop + living corpus + EMA centroids |
| 2 Training moat | (preferred, rejected) pairs accumulate for adapters | `post_edit_events` + `user_posts.source` - schema already collects it |
| 3 Intelligence moat | voice × format × niche × outcome dataset | §10 Sprint 8 performance capture |
| 4 Credibility moat | provable fidelity vs published research anchors | §7 harness; LUAR anchors make the claim externally referenceable |

The pipeline is copyable; the per-user data loop and the measurement that proves it works are not. Protect the instrumentation every sprint.
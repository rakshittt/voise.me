"use client";

import { useState } from "react";
import type { VoiceProfile } from "@/lib/types";
import { Lozenge } from "@/components/ui/Lozenge";
import { Tag } from "@/components/ui/Badge";

/* ── Copy maps ─────────────────────────────────────────────────────────────── */

const PERSONA: Record<string, { headline: string; sub: string; description: string; trait1: string; trait2: string; color: string }> = {
  practitioner: {
    headline: "The Practitioner",
    sub: "Credibility through lived experience",
    description: "You build trust because you've been there. Your posts draw from real situations - readers follow you for what you've done, not what you've read.",
    trait1: "Experience-first",
    trait2: "Story-led authority",
    color: "#4C9AFF",
  },
  analyst: {
    headline: "The Analyst",
    sub: "Credibility through evidence and reasoning",
    description: "You build trust through clear thinking. Your posts are precise and measured - readers come to you to understand complexity.",
    trait1: "Evidence-led",
    trait2: "Structured reasoning",
    color: "#36B37E",
  },
  storyteller: {
    headline: "The Storyteller",
    sub: "Credibility through narrative",
    description: "You put readers inside a scene. They feel what you felt before they learn what you learned - that emotional pull is your signature.",
    trait1: "Scene-setting",
    trait2: "Emotional resonance",
    color: "#FF8B00",
  },
  theorist: {
    headline: "The Theorist",
    sub: "Credibility through frameworks",
    description: "You help readers see bigger pictures. Mental models and systems are your language - followers come to understand how things work.",
    trait1: "Framework-builder",
    trait2: "Systems thinker",
    color: "#6554C0",
  },
  contrarian: {
    headline: "The Contrarian",
    sub: "Credibility by challenging consensus",
    description: "You say what others won't. Readers follow you to have their assumptions tested - your willingness to dissent is the brand.",
    trait1: "Assumption-breaker",
    trait2: "Bold takes",
    color: "#DE350B",
  },
};

const HOOK_COPY: Record<string, string> = {
  story: "Personal story or scene",
  contrarian: "Contrarian take",
  bold_statement: "Bold declarative statement",
  question: "Direct question",
  data_point: "Data point or statistic",
  direct_address: "Speaks directly to reader",
};

const STRUCTURE_COPY: Record<string, string> = {
  problem_insight_proof: "Problem → Insight → Proof",
  story_lesson: "Story → Lesson",
  list_format: "Scannable list",
  contrarian_claim_evidence: "Contrarian claim → Evidence",
  how_to: "Step-by-step how-to",
  observation_question: "Observation → Question",
};

const CTA_COPY: Record<string, string> = {
  implicit_question: "Leaves a question to think on",
  explicit_call: "Direct call to action",
  no_cta: "Content stands alone",
  reflection_prompt: "Invites reader to reflect",
};

const STANCE_COLORS: Record<string, "blue" | "teal" | "yellow" | "red" | "grey"> = {
  advocate: "teal", skeptic: "yellow", contrarian: "red", pragmatist: "blue", neutral: "grey",
};
const STANCE_LABELS: Record<string, string> = {
  advocate: "Champion", skeptic: "Skeptic", contrarian: "Contrarian", pragmatist: "Pragmatist", neutral: "Observer",
};

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.09em" }}>
      {children}
    </p>
  );
}

function DimBar({ label, value, left, right, accent }: { label: string; value: number; left: string; right: string; accent?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{label}</span>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
      </div>
      <div style={{ height: 6, backgroundColor: "var(--ds-background-neutral)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: accent ?? "var(--ds-background-brand-bold)", borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{left}</span>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{right}</span>
      </div>
    </div>
  );
}

function HookBar({ label, value, total, accent }: { label: string; value: number; total: number; accent: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)" }}>
      <div style={{ flex: 1, height: 8, backgroundColor: "var(--ds-background-neutral)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, backgroundColor: accent, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ width: 30, textAlign: "right", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{pct}%</span>
      <span style={{ width: 180, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", flexShrink: 0 }}>{HOOK_COPY[label] ?? label}</span>
    </div>
  );
}

const HOOK_COLORS = ["#4C9AFF", "#36B37E", "#FF8B00", "#6554C0", "#DE350B", "#00B8D9"];

/* ── Share card ─────────────────────────────────────────────────────────────── */

function ShareCard({
  persona,
  personaKey,
  postCount,
  confidence,
  topHooks,
  dominantStructure,
  sigPhrases,
}: {
  persona: typeof PERSONA[string];
  personaKey: string;
  postCount: number;
  confidence: string;
  topHooks: [string, number][];
  dominantStructure: string | null;
  sigPhrases: string[];
}) {
  const accent = persona.color;

  return (
    <div
      id="voise-share-card"
      style={{
        background: "linear-gradient(145deg, #0C0F1A 0%, #141929 55%, #0A0D17 100%)",
        borderRadius: 20,
        padding: "36px 36px 28px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}
    >
      {/* Subtle grid texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "24px 24px", pointerEvents: "none" }} />

      {/* Glow blob */}
      <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", backgroundColor: accent, opacity: 0.12, filter: "blur(80px)", pointerEvents: "none" }} />

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Voice DNA</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", fontVariantNumeric: "tabular-nums" }}>2026</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: confidence === "high" ? "#36B37E" : confidence === "medium" ? "#FF8B00" : "#8993A4", flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{confidence} confidence</span>
        </div>
      </div>

      {/* Persona */}
      <div style={{ marginBottom: 28, position: "relative" }}>
        <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: "0.12em" }}>
          {persona.sub}
        </p>
        <h2 style={{ margin: "0 0 14px", fontSize: 42, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          {persona.headline}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, maxWidth: 420 }}>
          {persona.description}
        </p>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", margin: "0 0 24px" }} />

      {/* Key traits */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, position: "relative" }}>
        {[
          persona.trait1,
          persona.trait2,
          ...(topHooks.slice(0, 1).map(([k]) => HOOK_COPY[k] ?? k)),
          ...(dominantStructure ? [STRUCTURE_COPY[dominantStructure] ?? dominantStructure] : []),
          ...sigPhrases.slice(0, 2),
        ].slice(0, 5).map((trait) => (
          <span key={trait} style={{ padding: "5px 12px", borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
            {trait}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>
          {postCount > 0 ? `${postCount} posts analyzed · 11 dimensions` : "Starter profile · 8 seeded dimensions"}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>
          voise.app
        </span>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export function VoiseDisplay({ profile }: { profile: VoiceProfile }) {
  const [copied, setCopied] = useState(false);
  const confidence = (profile.confidence_level ?? "low") as "high" | "medium" | "low" | "provisional";

  const personaKey = profile.epistemic_style?.persona ?? "practitioner";
  const persona = PERSONA[personaKey] ?? PERSONA.practitioner;

  const hookEntries = profile.hook_distribution
    ? Object.entries(profile.hook_distribution).sort(([, a], [, b]) => b - a)
    : [];
  const topHooks = hookEntries.slice(0, 3);
  const hookTotal = hookEntries.reduce((s, [, v]) => s + v, 0);

  const dominantStructure = profile.structural_pattern?.dominant ?? null;
  const dominantCTA = profile.cta_style?.dominant ?? null;

  const hedgeFreq = profile.epistemic_style?.hedge_frequency ?? 0;
  const selfRefRate = profile.epistemic_style?.self_reference_rate ?? 0;
  const formality = profile.vocabulary_register?.formality_score ?? 0.5;
  const jargon = profile.vocabulary_register?.jargon_density ?? 0;
  const shortRatio = profile.sentence_rhythm?.short_ratio ?? 0.4;

  const sigPhrases = profile.lexical_signature?.signature_phrases?.slice(0, 8) ?? [];
  const positions = profile.belief_stances?.positions?.slice(0, 5) ?? [];

  const emotionalEntries = profile.emotional_register
    ? Object.entries(profile.emotional_register).sort(([, a], [, b]) => b - a).slice(0, 4)
    : [];
  const emotionalTotal = emotionalEntries.reduce((s, [, v]) => s + v, 0);

  const shareText = [
    `I'm ${persona.headline} on LinkedIn.`,
    ``,
    `My Voice DNA:`,
    `• ${persona.sub}`,
    topHooks[0] ? `• Hooks with: ${HOOK_COPY[topHooks[0][0]] ?? topHooks[0][0]}` : null,
    dominantStructure ? `• Structure: ${STRUCTURE_COPY[dominantStructure] ?? dominantStructure}` : null,
    profile.post_count > 0
      ? `• ${profile.post_count} posts analyzed · 11 writing dimensions`
      : `• Starter profile · 8 seeded dimensions`,
    ``,
    `Discover yours → voise.app`,
  ].filter(Boolean).join("\n");

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ text: shareText, title: `My Voice DNA: ${persona.headline}` });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // user cancelled share
    }
  }

  const CONFIDENCE_APPEARANCE = { high: "success", medium: "moved", low: "removed", provisional: "moved" } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* ── Share Card ─────────────────────────────────────────────────────── */}
      <ShareCard
        persona={persona}
        personaKey={personaKey}
        postCount={profile.post_count}
        confidence={confidence}
        topHooks={topHooks}
        dominantStructure={dominantStructure}
        sigPhrases={sigPhrases}
      />

      {/* Share button row */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)", flexWrap: "wrap" }}>
        <button
          onClick={handleShare}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--ds-space-075)",
            padding: "var(--ds-space-100) var(--ds-space-200)",
            borderRadius: "var(--ds-radius-100)",
            border: "1.5px solid var(--ds-border-brand)",
            backgroundColor: "var(--ds-background-brand-subtle)",
            color: "var(--ds-text-brand)",
            fontWeight: "var(--ds-font-weight-semibold)",
            fontSize: "var(--ds-font-size-100)",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13.5 1L6 8.5M13.5 1H9.5M13.5 1V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 3H3C2.44772 3 2 3.44772 2 4V13C2 13.5523 2.44772 14 3 14H12C12.5523 14 13 13.5523 13 13V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {copied ? "Copied to clipboard!" : "Share your Voice DNA"}
        </button>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          Screenshot the card above to share on LinkedIn
        </p>
      </div>

      {/* ── Full breakdown ──────────────────────────────────────────────────── */}

      {/* Confidence + meta */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)", flexWrap: "wrap" }}>
        <Lozenge appearance={CONFIDENCE_APPEARANCE[confidence] ?? "moved"} isBold>
          {confidence === "provisional" ? "Starter profile" : `${confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence`}
        </Lozenge>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          {profile.post_count > 0 ? `${profile.post_count} posts analyzed · 11 dimensions mapped` : "Based on questionnaire answers"}
        </span>
      </div>

      {/* ── 1. Writing style dimensions ────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
        <SectionLabel>Your writing style - 5 key dimensions</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
          <DimBar
            label="Assertiveness"
            value={1 - hedgeFreq}
            left="Hedged"
            right="Bold"
          />
          <DimBar
            label="Personal voice"
            value={selfRefRate}
            left="Observational"
            right="First-person"
            accent="#36B37E"
          />
          <DimBar
            label="Formality"
            value={formality}
            left="Conversational"
            right="Formal"
            accent="#6554C0"
          />
          <DimBar
            label="Sentence punch"
            value={shortRatio}
            left="Long-form"
            right="Punchy"
            accent="#FF8B00"
          />
          <DimBar
            label="Technical depth"
            value={jargon}
            left="Plain language"
            right="Industry-native"
            accent="#00B8D9"
          />
        </div>
      </div>

      {/* ── 2. Hook distribution ────────────────────────────────────────────── */}
      {hookEntries.length > 0 && (
        <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
          <SectionLabel>How you open posts</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
            {hookEntries.slice(0, 5).map(([key, val], i) => (
              <HookBar key={key} label={key} value={val} total={hookTotal} accent={HOOK_COLORS[i] ?? "#8993A4"} />
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Content formula ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
        <SectionLabel>Your content formula</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { step: "01", label: "OPEN WITH", value: topHooks[0] ? HOOK_COPY[topHooks[0][0]] ?? topHooks[0][0] : null },
            { step: "02", label: "BUILD WITH", value: dominantStructure ? STRUCTURE_COPY[dominantStructure] : null },
            { step: "03", label: "CLOSE WITH", value: dominantCTA ? CTA_COPY[dominantCTA] : null },
          ].filter((r) => r.value).map((row, i, arr) => (
            <div key={row.step} style={{ display: "flex", gap: "var(--ds-space-200)", alignItems: "flex-start", paddingBottom: i < arr.length - 1 ? "var(--ds-space-200)" : 0, marginBottom: i < arr.length - 1 ? "var(--ds-space-200)" : 0, borderBottom: i < arr.length - 1 ? "1px solid var(--ds-border)" : "none" }}>
              <div style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--ds-background-brand-subtle)", border: "1px solid var(--ds-border-brand)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--ds-text-brand)" }}>{row.step}</span>
              </div>
              <div>
                <p style={{ margin: "0 0 2px", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.09em" }}>{row.label}</p>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{row.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. Emotional register ───────────────────────────────────────────── */}
      {emotionalEntries.length > 0 && (
        <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
          <SectionLabel>Your emotional register</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ds-space-200)" }}>
            {emotionalEntries.map(([key, val], i) => {
              const pct = emotionalTotal > 0 ? Math.round((val / emotionalTotal) * 100) : 0;
              return (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", textTransform: "capitalize" }}>{key}</span>
                    <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, backgroundColor: "var(--ds-background-neutral)", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: HOOK_COLORS[i], borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. Topics you own ──────────────────────────────────────────────── */}
      {positions.length > 0 && (
        <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
          <SectionLabel>Topics you consistently own</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-175)" }}>
            {positions.map((p) => (
              <div key={p.topic} style={{ display: "flex", alignItems: "flex-start", gap: "var(--ds-space-150)", padding: "var(--ds-space-150)", backgroundColor: "var(--ds-background-neutral-subtle)", borderRadius: "var(--ds-radius-100)" }}>
                <Tag text={STANCE_LABELS[p.stance] ?? p.stance} color={STANCE_COLORS[p.stance] ?? "grey"} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{p.topic}</p>
                  <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: 1.5 }}>{p.summary}</p>
                </div>
                <span style={{ flexShrink: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", marginLeft: "auto", whiteSpace: "nowrap" }}>
                  {p.evidence_count}× cited
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. Signature phrases ────────────────────────────────────────────── */}
      {sigPhrases.length > 0 && (
        <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-300)" }}>
          <SectionLabel>Phrases that sound unmistakably like you</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-075)" }}>
            {sigPhrases.map((phrase) => (
              <Tag key={phrase} text={phrase} color="blue" />
            ))}
          </div>
          <p style={{ margin: "var(--ds-space-150) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            These phrases recur across your posts and make your writing recognizable - even to someone who doesn't know your name.
          </p>
        </div>
      )}

    </div>
  );
}

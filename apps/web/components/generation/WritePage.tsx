"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { GenerateForm } from "./GenerateForm";
import { RepurposeForm } from "./RepurposeForm";

/* ── Shared side-block shell ─────────────────────────────────────────────── */

function SideBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "var(--ds-radius-200)", border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface)", overflow: "hidden" }}>
      <div style={{ padding: "10px var(--ds-space-200)", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface-sunken)" }}>
        <span style={{ fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {label}
        </span>
      </div>
      <div style={{ padding: "var(--ds-space-200)" }}>{children}</div>
    </div>
  );
}

/* ── Idea-mode sidebar ───────────────────────────────────────────────────── */

const IDEA_STEPS = [
  { n: "1", text: "Describe your idea (10–2000 characters)" },
  { n: "2", text: "We generate 3 post variants in your voice" },
  { n: "3", text: "Each variant is scored against your Voice DNA" },
];

const SCORE_GUIDE = [
  { color: "#16a34a", bg: "rgba(22,163,74,0.1)",  range: "90%+",   label: "Excellent",   desc: "Indistinguishable from your own writing" },
  { color: "#d97706", bg: "rgba(217,119,6,0.1)",  range: "70–89%", label: "Good",         desc: "Strong match, minor tweaks may help" },
  { color: "var(--ds-text-subtlest)", bg: "var(--ds-background-neutral)", range: "50–69%", label: "Building", desc: "Close but the voice isn't fully there yet" },
  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  range: "<50%",   label: "Developing",  desc: "Try adding more posts to your Voice DNA" },
];

function IdeaSidebar() {
  return (
    <>
      <SideBlock label="How it works">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          {IDEA_STEPS.map((s) => (
            <div key={s.n} style={{ display: "flex", gap: "var(--ds-space-150)", alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", backgroundColor: "var(--ds-background-brand-subtle)", color: "var(--ds-text-brand)", fontSize: 11, fontWeight: "var(--ds-font-weight-bold)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.n}
              </span>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>
                {s.text}
              </p>
            </div>
          ))}
        </div>
      </SideBlock>

      <SideBlock label="Tips for better results">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          {[
            "Be specific - \"I learned SaaS pricing is broken\" beats \"pricing\"",
            "Include context: who, what, where, and why it matters",
            "Mention the angle or lesson you want to share",
            "The more specific your idea, the higher the voice score",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: "var(--ds-space-075)", alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, fontSize: 11, color: "var(--ds-text-brand)", marginTop: 3, fontWeight: "var(--ds-font-weight-bold)" }}>✦</span>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>{tip}</p>
            </div>
          ))}
        </div>
      </SideBlock>

      <SideBlock label="Voice score guide">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          {SCORE_GUIDE.map((g) => (
            <div key={g.range} style={{ display: "flex", gap: "var(--ds-space-100)", alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 999, fontSize: 11, fontWeight: "var(--ds-font-weight-bold)", color: g.color, backgroundColor: g.bg, marginTop: 1, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                {g.range}
              </span>
              <div>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{g.label}</p>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </SideBlock>
    </>
  );
}

/* ── Repurpose-mode sidebar ──────────────────────────────────────────────── */

const REPURPOSE_SOURCES = [
  { icon: "✍️", label: "Blog posts & articles" },
  { icon: "🎙", label: "Podcast / video transcripts" },
  { icon: "📧", label: "Newsletter editions" },
  { icon: "📄", label: "Research papers (key findings)" },
  { icon: "🐦", label: "Threads or Twitter/X posts" },
  { icon: "📊", label: "Reports & case studies" },
];

function RepurposeSidebar() {
  return (
    <>
      <SideBlock label="Works best with">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          {REPURPOSE_SOURCES.map((s) => (
            <div key={s.label} style={{ display: "flex", gap: "var(--ds-space-100)", alignItems: "center" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{s.icon}</span>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </SideBlock>

      <SideBlock label="Tips">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          {[
            "Paste the full source, not a summary - more context means a better extract.",
            "If the piece has multiple key ideas, run it once per idea for best results.",
            "The voice score is shown inline - no need to check separately.",
          ].map((tip, i) => (
            <div key={i} style={{ display: "flex", gap: "var(--ds-space-075)", alignItems: "flex-start" }}>
              <span style={{ flexShrink: 0, fontSize: 11, color: "var(--ds-text-brand)", marginTop: 3, fontWeight: "var(--ds-font-weight-bold)" }}>✦</span>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>{tip}</p>
            </div>
          ))}
        </div>
      </SideBlock>
    </>
  );
}

/* ── Tab bar ─────────────────────────────────────────────────────────────── */

type Mode = "idea" | "repurpose";

function TabBar({ active, onChange }: { active: Mode; onChange: (m: Mode) => void }) {
  const tabs: { key: Mode; label: string; desc: string }[] = [
    { key: "idea",      label: "New idea",         desc: "Turn a thought into a post" },
    { key: "repurpose", label: "Repurpose content", desc: "Rewrite existing content in your voice" },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--ds-space-050)",
        padding: "var(--ds-space-050)",
        backgroundColor: "var(--ds-surface-sunken)",
        borderRadius: "var(--ds-radius-200)",
        border: "1px solid var(--ds-border)",
        width: "fit-content",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "var(--ds-space-100) var(--ds-space-200)",
              borderRadius: "var(--ds-radius-100)",
              border: "none",
              cursor: "pointer",
              backgroundColor: isActive ? "var(--ds-surface)" : "transparent",
              boxShadow: isActive ? "var(--ds-shadow-raised)" : "none",
              transition: "all 0.15s",
              textAlign: "left",
            }}
          >
            <span
              style={{
                fontSize: "var(--ds-font-size-100)",
                fontWeight: isActive ? "var(--ds-font-weight-semibold)" : "var(--ds-font-weight-regular)",
                color: isActive ? "var(--ds-text)" : "var(--ds-text-subtle)",
              }}
            >
              {tab.label}
            </span>
            <span
              style={{
                fontSize: "var(--ds-font-size-075)",
                color: isActive ? "var(--ds-text-subtle)" : "var(--ds-text-subtlest)",
                marginTop: 2,
              }}
            >
              {tab.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */

export function WritePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawMode = searchParams.get("mode");
  const mode: Mode = rawMode === "repurpose" ? "repurpose" : "idea";

  function switchMode(next: Mode) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "idea") {
      params.delete("mode");
    } else {
      params.set("mode", next);
    }
    const qs = params.toString();
    router.push(`/dashboard/write${qs ? `?${qs}` : ""}`);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
          Write
        </h1>
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          {mode === "idea"
            ? "Describe your idea and get 3 LinkedIn posts written in your voice, ranked by match score."
            : "Paste any long-form content - article, transcript, or newsletter. We rewrite it as a LinkedIn post in your voice."}
        </p>
      </div>

      {/* Tab switcher */}
      <TabBar active={mode} onChange={switchMode} />

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6" style={{ alignItems: "start" }}>

        {/* Left: active form */}
        <div>
          {mode === "idea" ? <GenerateForm /> : <RepurposeForm />}
        </div>

        {/* Right: contextual sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>
          {mode === "idea" ? <IdeaSidebar /> : <RepurposeSidebar />}
        </div>

      </div>
    </div>
  );
}

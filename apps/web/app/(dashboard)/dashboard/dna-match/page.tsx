import Link from "next/link";
import { DNAMatchForm } from "@/components/dna-match/DNAMatchForm";
import { Lozenge } from "@/components/ui/Lozenge";

function SideBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "var(--ds-radius-200)", border: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface)", overflow: "hidden" }}>
      <div style={{ padding: "10px var(--ds-space-200)", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface-sunken)" }}>
        <span style={{ fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{label}</span>
      </div>
      <div style={{ padding: "var(--ds-space-200)" }}>{children}</div>
    </div>
  );
}

const SCORE_TIERS = [
  { color: "#16a34a", bg: "rgba(22,163,74,0.1)", range: "90%+", label: "Excellent", desc: "Post it - reads like your own writing" },
  { color: "#d97706", bg: "rgba(217,119,6,0.1)", range: "70–89%", label: "Good", desc: "Minor tweaks will close the gap" },
  { color: "var(--ds-text-subtle)", bg: "var(--ds-background-neutral)", range: "50–69%", label: "Building", desc: "Review the flagged dimensions" },
  { color: "#ef4444", bg: "rgba(239,68,68,0.1)", range: "<50%", label: "Developing", desc: "Significant rewrite recommended" },
];

const DIMENSIONS = [
  "Hook structure & opening pattern",
  "Sentence rhythm & length variation",
  "Vocabulary register",
  "Argument & idea structure",
  "Emotional tone & register",
  "CTA style & close",
];

const USE_CASES = [
  "Check AI-written drafts before posting",
  "Review content written by ghostwriters",
  "Audit older posts to understand style drift",
  "Validate repurposed content after editing",
];

export default function DNAMatchPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginBottom: "var(--ds-space-075)" }}>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            DNA Match
          </h1>
          <Lozenge appearance="new" isBold>Beta</Lozenge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Paste any draft and see how closely it matches your Voice DNA - dimension by dimension, with specific guidance on what to fix.
        </p>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6" style={{ alignItems: "start" }}>

        {/* Left: form */}
        <DNAMatchForm />

        {/* Right: sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>

          <SideBlock label="Score guide">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-125)" }}>
              {SCORE_TIERS.map((t) => (
                <div key={t.range} style={{ display: "flex", gap: "var(--ds-space-100)", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "1px 7px", borderRadius: 999, fontSize: 11, fontWeight: "var(--ds-font-weight-bold)", color: t.color, backgroundColor: t.bg, marginTop: 2, whiteSpace: "nowrap" as const, fontVariantNumeric: "tabular-nums" }}>
                    {t.range}
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{t.label}</p>
                    <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SideBlock>

          <SideBlock label="What gets scored">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
              {DIMENSIONS.map((d, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--ds-space-075)", alignItems: "center" }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", backgroundColor: "var(--ds-icon-brand)", flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{d}</p>
                </div>
              ))}
            </div>
          </SideBlock>

          <SideBlock label="Use cases">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
              {USE_CASES.map((u, i) => (
                <div key={i} style={{ display: "flex", gap: "var(--ds-space-075)", alignItems: "flex-start" }}>
                  <span style={{ flexShrink: 0, fontSize: 11, color: "var(--ds-text-subtlest)", marginTop: 2 }}>→</span>
                  <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{u}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "var(--ds-space-150)", paddingTop: "var(--ds-space-150)", borderTop: "1px solid var(--ds-border)" }}>
              <Link
                href="/dashboard/write"
                style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-link)", textDecoration: "none" }}
              >
                Generate a new post instead →
              </Link>
            </div>
          </SideBlock>

        </div>
      </div>
    </div>
  );
}

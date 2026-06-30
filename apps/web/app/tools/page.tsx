import type { Metadata } from "next";
import Link from "next/link";
import { PublicToolHeader } from "@/components/marketing/PublicToolHeader";
import { PublicToolCTA } from "@/components/marketing/PublicToolCTA";
import { PUBLIC_TOOLS } from "@/lib/publicTools";

export const metadata: Metadata = {
  title: "Free LinkedIn Content Tools | Voise",
  description:
    "Free LinkedIn tools to check your hooks, post health, character limits, and voice - no account needed. Built by Voise, the AI that writes in your voice.",
};

const BEFORE = `I am pleased to share some thoughts on leadership and effective communication. After years of experience in the industry, I have found that there are several key insights that can help professionals succeed...`;

const AFTER = `Most people think leadership is about having the right answers. It's not. The best leader I ever worked for said "I don't know" more than anyone I'd met - and people trusted him completely because of it...`;

export default function ToolsIndexPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background-neutral-subtle)" }}>
      <PublicToolHeader />

      <main className="tool-page-shell" style={{ padding: "var(--ds-space-600) 0", display: "flex", flexDirection: "column", gap: "var(--ds-space-600)" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-600)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-500)" }}>
            Free LinkedIn content tools
          </h1>
          <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-200)", lineHeight: "var(--ds-line-height-400)" }}>
            No account needed. Use them as often as you like.
          </p>
        </div>

        <div className="tools-card-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--ds-space-200)" }}>
          {PUBLIC_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              style={{
                display: "block",
                padding: "var(--ds-space-250)",
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
                borderRadius: "var(--ds-radius-200)",
                textDecoration: "none",
              }}
            >
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-200)", color: "var(--ds-text)" }}>
                {tool.title} →
              </p>
              <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)" }}>
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Voise awareness: what the full product does beyond these free checks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--ds-text-brand)" }}>
              Beyond the free tools
            </p>
            <h2 style={{ margin: 0, fontSize: "var(--ds-font-size-400)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>
              These tools check your post. Voise writes it for you - in your voice.
            </h2>
            <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)", lineHeight: "var(--ds-line-height-300)", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
              Voise learns an 11-dimension fingerprint of how you actually write - hooks, rhythm, vocabulary, structure -
              from posts you&apos;ve already published. Every generated post is scored against that fingerprint before you see it.
            </p>
          </div>

          {/* Before / after */}
          <div style={{ borderRadius: "var(--ds-radius-300)", border: "1px solid var(--ds-border)", overflow: "hidden", background: "var(--ds-surface)" }}>
            <div className="tools-before-after" style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: "var(--ds-space-200)", borderRight: "1px solid var(--ds-border)", background: "var(--ds-surface-sunken)" }}>
                <p style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ds-text-subtlest)" }}>
                  Generic AI
                </p>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)", fontStyle: "italic" }}>
                  {BEFORE}
                </p>
              </div>
              <div style={{ padding: "var(--ds-space-200)", background: "var(--ds-background-brand-subtle)" }}>
                <p style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--ds-text-brand)" }}>
                  Your voice ✦
                </p>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-300)" }}>
                  {AFTER}
                </p>
              </div>
            </div>
            <div style={{ padding: "var(--ds-space-100) var(--ds-space-200)", background: "var(--ds-background-neutral-subtle)", borderTop: "1px solid var(--ds-border)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", textAlign: "center" }}>
              Same topic. Different voices. Voise generates the one that sounds like you wrote it.
            </div>
          </div>

          {/* 3-step explainer */}
          <div className="tools-steps" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ds-space-200)" }}>
            {[
              { step: "1", title: "Build your Voice DNA", body: "Paste your existing posts, articles, or transcripts. We extract 11 dimensions of how you write." },
              { step: "2", title: "Generate from an idea", body: "Drop in a rough idea or a topic. Voise drafts full variants in your fingerprint, not a generic AI tone." },
              { step: "3", title: "See the score before posting", body: "Every variant is scored against your voice fingerprint, so you know it sounds like you before it's public." },
            ].map((s) => (
              <div key={s.step} style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)" }}>
                  {s.step}
                </span>
                <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{s.title}</p>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)" }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <PublicToolCTA
          title="Stop checking. Start writing in your voice."
          body="30-day free trial. No credit card required, no LinkedIn login required."
        />
      </main>

      <style>{`
        @media (max-width: 640px) {
          .tools-card-grid { grid-template-columns: 1fr !important; }
          .tools-before-after { grid-template-columns: 1fr !important; }
          .tools-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

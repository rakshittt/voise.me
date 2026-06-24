import Link from "next/link";
import { IdeaGenerator } from "@/components/generation/IdeaGenerator";

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

const IDEA_TYPES = [
  { icon: "📖", label: "Personal story", desc: "A moment that changed how you think" },
  { icon: "🔥", label: "Hot take", desc: "A contrarian or under-appreciated view" },
  { icon: "⚙️", label: "Practical how-to", desc: "A specific tactic or framework you use" },
  { icon: "👁️", label: "Industry observation", desc: "A trend or pattern you've noticed" },
  { icon: "💡", label: "Lesson learned", desc: "What you wish you knew sooner" },
];

export default function IdeasPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
          Post Ideas
        </h1>
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Get 5 post ideas tailored to your voice and audience. Each comes with an opening hook ready to develop.
        </p>
      </div>

      {/* 2-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6" style={{ alignItems: "start" }}>

        {/* Left: generator */}
        <IdeaGenerator />

        {/* Right: sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>

          <SideBlock label="About this tool">
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)" }}>
              Idea Generator uses your Voice DNA and audience context to produce ideas you&apos;d actually want to write. Ideas are not generic - they&apos;re filtered through your writing fingerprint and tailored to your specified audience.
            </p>
          </SideBlock>

          <SideBlock label="Idea types">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-125)" }}>
              {IDEA_TYPES.map((t) => (
                <div key={t.label} style={{ display: "flex", gap: "var(--ds-space-150)", alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{t.icon}</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{t.label}</p>
                    <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SideBlock>

          <SideBlock label="Next step">
            <p style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              Found an idea you like? Develop it into a full post with voice scoring.
            </p>
            <Link
              href="/dashboard/write"
              style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-link)", textDecoration: "none" }}
            >
              Generate a post from your idea →
            </Link>
          </SideBlock>

        </div>
      </div>
    </div>
  );
}

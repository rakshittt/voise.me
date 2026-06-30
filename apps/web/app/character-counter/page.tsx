import type { Metadata } from "next";
import { PublicToolHeader } from "@/components/marketing/PublicToolHeader";
import { RelatedTools } from "@/components/marketing/RelatedTools";
import { CharacterCounterTool } from "./CharacterCounterTool";

export const metadata: Metadata = {
  title: "Free LinkedIn Character Counter | Voise",
  description: "Track every LinkedIn field limit and preview where \"see more\" cuts off your post. Free, instant, no account needed.",
};

export default function CharacterCounterPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background-neutral-subtle)" }}>
      <PublicToolHeader />

      <main className="tool-page-shell" style={{ padding: "var(--ds-space-600) 0", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          <div>
            <span style={{ display: "inline-block", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ds-text-brand)", background: "var(--ds-background-brand-subtle)", padding: "var(--ds-space-050) var(--ds-space-150)", borderRadius: "var(--ds-radius-200)" }}>
              Free tool
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-600)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-500)" }}>
            LinkedIn character counter
          </h1>
          <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-200)", lineHeight: "var(--ds-line-height-400)" }}>
            Posts, headlines, About sections, comments - every LinkedIn field has its own limit. Check yours and preview where &ldquo;see more&rdquo; cuts your post.
          </p>
        </div>

        <CharacterCounterTool />

        <RelatedTools currentHref="/character-counter" />
      </main>
    </div>
  );
}

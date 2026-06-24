import Link from "next/link";
import { AuditTool } from "./AuditTool";
import { VoiseLogo } from "@/components/ui/VoiseLogo";

export default function AuditPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background-neutral-subtle)" }}>
      <header style={{ background: "var(--ds-surface)", borderBottom: `1px solid var(--ds-border)`, padding: "var(--ds-space-150) var(--ds-space-300)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <VoiseLogo markSize={24} fontSize={14} fontWeight={800} letterSpacing="-0.03em" gap={7} />
        </Link>
        <div style={{ display: "flex", gap: "var(--ds-space-150)", alignItems: "center" }}>
          <Link href="/sign-in" style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", textDecoration: "none" }}>Sign in</Link>
          <Link
            href="/sign-up"
            style={{ fontSize: "var(--ds-font-size-100)", padding: "var(--ds-space-075) var(--ds-space-200)", background: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", fontWeight: "var(--ds-font-weight-semibold)", borderRadius: "var(--ds-radius-100)", textDecoration: "none" }}
          >
            Get started
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "var(--ds-space-600) var(--ds-space-200)", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          <div>
            <span style={{ display: "inline-block", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ds-text-brand)", background: "var(--ds-background-brand-subtle)", padding: "var(--ds-space-050) var(--ds-space-150)", borderRadius: "var(--ds-radius-200)" }}>
              Free voice audit
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-600)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-500)" }}>
            What does your LinkedIn voice sound like?
          </h1>
          <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-200)", lineHeight: "var(--ds-line-height-400)" }}>
            Paste 5–20 of your LinkedIn posts. We&apos;ll analyze 3 key dimensions of your writing style - instantly, no account needed.
          </p>
        </div>

        <AuditTool />
      </main>
    </div>
  );
}

import Link from "next/link";
import { getRelatedTools } from "@/lib/publicTools";

export function RelatedTools({ currentHref }: { currentHref: string }) {
  const tools = getRelatedTools(currentHref);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ds-text-subtlest)" }}>
        More free tools
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--ds-space-150)" }}>
        {tools.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            style={{
              display: "block",
              padding: "var(--ds-space-200)",
              background: "var(--ds-surface)",
              border: "1px solid var(--ds-border)",
              borderRadius: "var(--ds-radius-200)",
              textDecoration: "none",
            }}
          >
            <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
              {tool.title} →
            </p>
            <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)" }}>
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

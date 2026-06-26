import Link from "next/link";
import { VoiseLogo } from "@/components/ui/VoiseLogo";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/pricing",  label: "Pricing"  },
  { href: "/audit",    label: "Free audit" },
];

export function MarketingNav() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      backgroundColor: "var(--ds-surface)",
      borderBottom: "1px solid var(--ds-border)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 var(--ds-space-300)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <VoiseLogo markSize={26} fontSize={15} fontWeight={800} letterSpacing="-0.03em" gap={8} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} style={{
                color: "var(--ds-text-subtle)",
                fontSize: "var(--ds-font-size-100)",
                fontWeight: "var(--ds-font-weight-medium)",
                padding: "6px 12px",
                borderRadius: "var(--ds-radius-100)",
                textDecoration: "none",
              }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
          <Link href="/sign-in" style={{
            color: "var(--ds-text-subtle)",
            fontSize: "var(--ds-font-size-100)",
            fontWeight: "var(--ds-font-weight-medium)",
            padding: "6px 12px",
            textDecoration: "none",
          }}>
            Sign in
          </Link>
          <Link href="/sign-up" style={{
            backgroundColor: "var(--ds-background-brand-bold)",
            color: "var(--ds-text-inverse)",
            fontSize: "var(--ds-font-size-100)",
            fontWeight: "var(--ds-font-weight-bold)",
            padding: "7px 16px",
            borderRadius: "var(--ds-radius-200)",
            textDecoration: "none",
          }}>
            Get started free
          </Link>
        </div>
      </div>
    </nav>
  );
}

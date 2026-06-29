import Link from "next/link";
import { VoiseLogo } from "@/components/ui/VoiseLogo";

const COLS = [
  {
    heading: "Product",
    links: [
      { href: "/features",    label: "Features"        },
      { href: "/pricing",     label: "Pricing"         },
      { href: "/audit",       label: "Free voice audit" },
      { href: "/how-it-works",label: "How it works"    },
    ],
  },
  {
    heading: "Use cases",
    links: [
      { href: "/features#founders",    label: "Founders"    },
      { href: "/features#consultants", label: "Consultants" },
      { href: "/features#coaches",     label: "Coaches"     },
      { href: "/features#executives",  label: "Executives"  },
    ],
  },
  {
    heading: "Account",
    links: [
      { href: "/sign-up",  label: "Create account" },
      { href: "/sign-in",  label: "Sign in"        },
      { href: "/dashboard",label: "Dashboard"      },
    ],
  },
];

export function MarketingFooter() {
  return (
    <footer style={{ backgroundColor: "var(--ds-surface-sunken)", borderTop: "1px solid var(--ds-border)" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px var(--ds-space-300) 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <VoiseLogo markSize={26} fontSize={15} gap={8} />
            <p style={{ margin: "16px 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)", maxWidth: 280 }}>
              AI-powered LinkedIn content that scores against your personal voice fingerprint. Not generic. Not close. Unmistakably you.
            </p>
          </div>
          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <p style={{ margin: "0 0 16px", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", textDecoration: "none" }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--ds-border)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>© 2026 Voise. All rights reserved.</span>
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { href: "/privacy", label: "Privacy" },
              { href: "/terms",   label: "Terms"   },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

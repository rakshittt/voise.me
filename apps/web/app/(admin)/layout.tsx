import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

async function checkAdminAccess(): Promise<boolean> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return false;

  try {
    const res = await fetch(
      `${process.env.API_URL ?? "http://localhost:8000"}/admin/stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "⬛" },
  { href: "/admin/users", label: "Users", icon: "👤" },
  { href: "/admin/usage", label: "API Usage", icon: "📊" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const isAdmin = await checkAdminAccess();
  if (!isAdmin) redirect("/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--ds-surface-sunken)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          backgroundColor: "var(--ds-surface)",
          borderRight: "1px solid var(--ds-border)",
          display: "flex",
          flexDirection: "column",
          padding: "var(--ds-space-300) 0",
        }}
      >
        {/* Brand */}
        <div style={{ padding: "0 var(--ds-space-200) var(--ds-space-300)", borderBottom: "1px solid var(--ds-border)", marginBottom: "var(--ds-space-200)" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Voise
            </span>
          </Link>
          <div style={{ marginTop: "var(--ds-space-050)", display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
            <span style={{ fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>Admin</span>
            <span style={{ fontSize: "var(--ds-font-size-075)", padding: "2px 6px", borderRadius: 4, backgroundColor: "var(--ds-background-danger-bold)", color: "var(--ds-text-inverse)", fontWeight: "var(--ds-font-weight-semibold)" }}>STAFF</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "0 var(--ds-space-100)" }}>
          {NAV_ITEMS.map((item) => (
            <AdminNavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
          ))}
        </nav>

        {/* Back to app */}
        <div style={{ padding: "var(--ds-space-200)", borderTop: "1px solid var(--ds-border)", marginTop: "auto" }}>
          <Link
            href="/dashboard"
            style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", textDecoration: "none" }}
          >
            ← Back to app
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <header
          style={{
            height: 52,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 var(--ds-space-300)",
            backgroundColor: "var(--ds-surface)",
            borderBottom: "1px solid var(--ds-border)",
          }}
        >
          <UserButton />
        </header>

        <main style={{ flex: 1, padding: "var(--ds-space-400) var(--ds-space-500)", overflowX: "hidden" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminNavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--ds-space-150)",
        padding: "var(--ds-space-100) var(--ds-space-150)",
        borderRadius: "var(--ds-radius-100)",
        fontSize: "var(--ds-font-size-100)",
        fontWeight: "var(--ds-font-weight-medium)",
        color: "var(--ds-text-subtle)",
        textDecoration: "none",
        transition: "background 0.1s",
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </Link>
  );
}

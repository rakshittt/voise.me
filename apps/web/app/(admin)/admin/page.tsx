import { auth } from "@clerk/nextjs/server";

interface AdminStats {
  users: {
    total: number;
    new_7d: number;
    new_30d: number;
    active_trials: number;
    by_plan: Record<string, number>;
  };
  generations: {
    total: number;
    last_7d: number;
  };
  voices_built: number;
  costs: {
    total_usd: number;
    last_30d_usd: number;
    last_7d_usd: number;
  };
}

async function fetchStats(): Promise<AdminStats | null> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return null;
  try {
    const res = await fetch(
      `${process.env.API_URL ?? "http://localhost:8000"}/admin/stats`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function fmt(n: number) { return n.toLocaleString(); }

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-250) var(--ds-space-300)" }}>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ margin: "0 0 var(--ds-space-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>
      {children}
    </h2>
  );
}

const PLAN_COLORS: Record<string, string> = {
  starter: "var(--ds-text-subtle)",
  trial: "var(--ds-text-warning)",
  growth: "var(--ds-text-brand)",
  pro: "var(--ds-text-success)",
};

export default async function AdminOverviewPage() {
  const stats = await fetchStats();

  if (!stats) {
    return (
      <div style={{ padding: "var(--ds-space-600)", textAlign: "center", color: "var(--ds-text-subtle)" }}>
        Failed to load admin stats. Check that the API is running.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-500)", maxWidth: 1100 }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
          Overview
        </h1>
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Real-time product metrics.
        </p>
      </div>

      {/* Users */}
      <div>
        <SectionTitle>Users</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total users" value={fmt(stats.users.total)} />
          <StatCard label="Active trials" value={fmt(stats.users.active_trials)} />
          <StatCard label="New (7d)" value={fmt(stats.users.new_7d)} sub={`${fmt(stats.users.new_30d)} this month`} />
          <StatCard label="Voices built" value={fmt(stats.voices_built)} sub={`of ${fmt(stats.users.total)} users`} />
        </div>

        {/* Plan breakdown */}
        {Object.keys(stats.users.by_plan).length > 0 && (
          <div style={{ marginTop: "var(--ds-space-300)", backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "var(--ds-space-250) var(--ds-space-300)" }}>
            <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Plan breakdown</p>
            <div style={{ display: "flex", gap: "var(--ds-space-400)", flexWrap: "wrap" }}>
              {Object.entries(stats.users.by_plan).map(([plan, count]) => (
                <div key={plan} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: PLAN_COLORS[plan] ?? "var(--ds-text)" }}>
                    {fmt(count)}
                  </span>
                  <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", textTransform: "capitalize" }}>{plan}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generations */}
      <div>
        <SectionTitle>Content</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Total generations" value={fmt(stats.generations.total)} />
          <StatCard label="Generated (7d)" value={fmt(stats.generations.last_7d)} />
        </div>
      </div>

      {/* Costs */}
      <div>
        <SectionTitle>API Costs</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="All time" value={`$${stats.costs.total_usd.toFixed(2)}`} />
          <StatCard label="Last 30 days" value={`$${stats.costs.last_30d_usd.toFixed(2)}`} />
          <StatCard label="Last 7 days" value={`$${stats.costs.last_7d_usd.toFixed(4)}`} />
        </div>
        {stats.users.total > 0 && (
          <p style={{ margin: "var(--ds-space-150) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            Cost per user (all time): ${(stats.costs.total_usd / stats.users.total).toFixed(4)}
          </p>
        )}
      </div>
    </div>
  );
}

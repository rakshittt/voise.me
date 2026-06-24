"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  plan: string;
  is_admin: boolean;
  created_at: string;
  trial_days_remaining: number | null;
  total_generations: number;
  last_active_at: string | null;
}

interface UsersResponse {
  users: UserRow[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  starter: { label: "Starter", color: "var(--ds-text-subtle)", bg: "var(--ds-background-neutral)" },
  trial:   { label: "Trial",   color: "var(--ds-text-warning)", bg: "rgba(217,119,6,0.1)" },
  growth:  { label: "Growth",  color: "var(--ds-text-brand)",   bg: "var(--ds-background-brand-subtle)" },
  pro:     { label: "Pro",     color: "var(--ds-text-success)", bg: "rgba(22,163,74,0.1)" },
};

function PlanBadge({ plan }: { plan: string }) {
  const b = PLAN_BADGE[plan] ?? { label: plan, color: "var(--ds-text)", bg: "var(--ds-background-neutral)" };
  return (
    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: b.color, backgroundColor: b.bg }}>
      {b.label}
    </span>
  );
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), per_page: "50" });
    if (debouncedSearch) qs.set("search", debouncedSearch);
    if (planFilter) qs.set("plan", planFilter);
    try {
      const res = await fetch(`/api/admin/users?${qs}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, planFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [debouncedSearch, planFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)", maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ds-space-200)" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>Users</h1>
          <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
            {data ? `${data.total.toLocaleString()} total` : "Loading…"}
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "var(--ds-space-150)", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Search email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "var(--ds-space-075) var(--ds-space-150)",
              border: "1px solid var(--ds-border)",
              borderRadius: "var(--ds-radius-100)",
              fontSize: "var(--ds-font-size-100)",
              color: "var(--ds-text)",
              backgroundColor: "var(--ds-surface)",
              outline: "none",
              width: 220,
            }}
          />
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{
              padding: "var(--ds-space-075) var(--ds-space-150)",
              border: "1px solid var(--ds-border)",
              borderRadius: "var(--ds-radius-100)",
              fontSize: "var(--ds-font-size-100)",
              color: "var(--ds-text)",
              backgroundColor: "var(--ds-surface)",
            }}
          >
            <option value="">All plans</option>
            <option value="starter">Starter</option>
            <option value="trial">Trial</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-background-neutral-subtle)" }}>
                {["User", "Plan", "Generations", "Last active", "Joined", ""].map((h) => (
                  <th key={h} style={{ padding: "var(--ds-space-150) var(--ds-space-200)", textAlign: "left", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--ds-space-500)", textAlign: "center", color: "var(--ds-text-subtlest)", fontSize: "var(--ds-font-size-100)" }}>
                    Loading…
                  </td>
                </tr>
              ) : data?.users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--ds-space-500)", textAlign: "center", color: "var(--ds-text-subtlest)", fontSize: "var(--ds-font-size-100)" }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                data?.users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--ds-border)" }}>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-text)" }}>
                          {u.name ?? "-"}
                          {u.is_admin && <span style={{ marginLeft: 6, fontSize: "var(--ds-font-size-075)", padding: "1px 5px", borderRadius: 3, backgroundColor: "var(--ds-background-danger-bold)", color: "var(--ds-text-inverse)" }}>ADMIN</span>}
                        </span>
                        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{u.email ?? "no email"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", whiteSpace: "nowrap" }}>
                      <PlanBadge plan={u.plan} />
                      {u.trial_days_remaining !== null && (
                        <span style={{ marginLeft: 6, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
                          {u.trial_days_remaining}d left
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>
                      {u.total_generations.toLocaleString()}
                    </td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", whiteSpace: "nowrap" }}>
                      {u.last_active_at ? relativeDate(u.last_active_at) : "Never"}
                    </td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", whiteSpace: "nowrap" }}>
                      {relativeDate(u.created_at)}
                    </td>
                    <td style={{ padding: "var(--ds-space-150) var(--ds-space-200)", textAlign: "right" }}>
                      <Link
                        href={`/admin/users/${u.id}`}
                        style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-link)", textDecoration: "none", fontWeight: "var(--ds-font-weight-medium)" }}
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div style={{ padding: "var(--ds-space-200) var(--ds-space-300)", borderTop: "1px solid var(--ds-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              Page {data.page} of {data.total_pages}
            </span>
            <div style={{ display: "flex", gap: "var(--ds-space-100)" }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)", fontSize: "var(--ds-font-size-075)", cursor: "pointer", opacity: page === 1 ? 0.4 : 1 }}
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page === data.total_pages}
                style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid var(--ds-border)", background: "var(--ds-surface)", color: "var(--ds-text)", fontSize: "var(--ds-font-size-075)", cursor: "pointer", opacity: page === data.total_pages ? 0.4 : 1 }}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

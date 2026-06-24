import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { GenerationHistoryItem } from "@/lib/types";
import { HistoryItemCard } from "@/components/dashboard/HistoryItemCard";

async function fetchHistory(token: string): Promise<GenerationHistoryItem[]> {
  const base = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/generate/history?limit=50&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function StatBox({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div style={{ border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", backgroundColor: "var(--ds-surface)", padding: "var(--ds-space-250) var(--ds-space-300)" }}>
      <p style={{ margin: "0 0 var(--ds-space-075)", fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase" as const, letterSpacing: "0.07em" }}>
        {label}
      </p>
      <div style={{ fontSize: 32, fontWeight: 800, color: "var(--ds-text)", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
        {value}
      </div>
      {sub && <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{sub}</p>}
    </div>
  );
}

export default async function HistoryPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const history = token ? await fetchHistory(token) : [];

  const allScores = history.flatMap((g) =>
    (g.variants ?? []).map((v: { voice_match_score?: number }) => v.voice_match_score ?? 0)
  ).filter((s: number) => s > 0);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length)
    : null;

  function scoreColor(s: number | null) {
    if (s === null) return "var(--ds-text-subtlest)";
    if (s >= 80) return "#16a34a";
    if (s >= 60) return "#d97706";
    return "var(--ds-text-subtlest)";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ds-space-300)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            History
          </h1>
          <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
            All your generated posts. Click any row to expand variants and copy.
          </p>
        </div>
        {history.length > 0 && (
          <Link
            href="/dashboard/write"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-075)", padding: "10px 20px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", textDecoration: "none", whiteSpace: "nowrap" as const, flexShrink: 0 }}
          >
            ✦ Write a post
          </Link>
        )}
      </div>

      {history.length === 0 ? (
        /* ── Empty state ─────────────────────────────────────────────────── */
        <div
          style={{
            border: "1px solid var(--ds-border)",
            borderRadius: "var(--ds-radius-200)",
            backgroundColor: "var(--ds-surface)",
            padding: "var(--ds-space-800)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-200)",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 40 }}>📝</div>
          <div>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.01em" }}>
              No posts generated yet
            </p>
            <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
              Generate your first LinkedIn post in your voice - scored against your Voice DNA.
            </p>
          </div>
          <Link
            href="/dashboard/write"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-075)", padding: "10px 20px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", textDecoration: "none" }}
          >
            Generate your first post →
          </Link>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatBox
              label="Total generated"
              value={history.length}
              sub={`${history.length} post idea${history.length !== 1 ? "s" : ""} turned into posts`}
            />
            <StatBox
              label="Avg voice score"
              value={
                avgScore !== null
                  ? <span style={{ color: scoreColor(avgScore) }}>{avgScore}%</span>
                  : <span style={{ color: "var(--ds-text-subtlest)", fontSize: 24 }}>-</span>
              }
              sub={avgScore !== null ? "Across all variants generated" : "Generate posts to see your score"}
            />
          </div>

          {/* History list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
            {history.map((gen) => (
              <HistoryItemCard key={gen.id} gen={gen} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

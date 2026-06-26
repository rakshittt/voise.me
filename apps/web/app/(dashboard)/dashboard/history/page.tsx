import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { GenerationHistoryItem } from "@/lib/types";
import { HistoryFeed } from "@/components/dashboard/HistoryFeed";

const PAGE_SIZE = 20;
const BASE = process.env.API_URL ?? "http://localhost:8000";

async function fetchHistory(token: string, offset = 0): Promise<GenerationHistoryItem[]> {
  try {
    const res = await fetch(`${BASE}/generate/history?limit=${PAGE_SIZE}&offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

async function fetchStats(token: string): Promise<{ total: number; avg_score: number | null; best_score: number | null }> {
  try {
    const res = await fetch(`${BASE}/generate/history/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { total: 0, avg_score: null, best_score: null };
    return res.json();
  } catch {
    return { total: 0, avg_score: null, best_score: null };
  }
}

export default async function HistoryPage() {
  const { getToken } = await auth();
  const token = await getToken();

  const [history, stats] = token
    ? await Promise.all([fetchHistory(token), fetchStats(token)])
    : [[], { total: 0, avg_score: null, best_score: null }];

  const hasMore = history.length === PAGE_SIZE;

  if (stats.total === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            History
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ds-text-subtle)" }}>
            Every post you generate lives here - searchable, filterable, refinable.
          </p>
        </div>

        <div style={{
          border: "1px solid var(--ds-border)",
          borderRadius: "var(--ds-radius-200)",
          backgroundColor: "var(--ds-surface)",
          padding: "64px 32px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          alignItems: "center",
        }}>
          <div style={{ fontSize: 40 }}>📝</div>
          <div>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "var(--ds-text)", letterSpacing: "-0.01em" }}>
              No posts generated yet
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ds-text-subtle)" }}>
              Write your first LinkedIn post in your voice - scored against your Voice DNA.
            </p>
          </div>
          <Link
            href="/dashboard/write"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
          >
            ✦ Write your first post →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            History
          </h1>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--ds-text-subtle)" }}>
            Every post you generate lives here - searchable, filterable, refinable.
          </p>
        </div>
        <Link
          href="/dashboard/write"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontWeight: 600, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          ✦ Write a post
        </Link>
      </div>

      {/* Feed (client component - handles search, filter, pagination) */}
      <HistoryFeed
        initialItems={history}
        initialHasMore={hasMore}
        stats={stats}
      />
    </div>
  );
}

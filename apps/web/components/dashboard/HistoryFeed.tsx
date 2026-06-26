"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import type { GenerationHistoryItem } from "@/lib/types";
import { HistoryItemCard } from "./HistoryItemCard";

const PAGE_SIZE = 20;

type TypeFilter = "all" | "idea" | "repurpose";

interface HistoryStats {
  total: number;
  avg_score: number | null;
  best_score: number | null;
}

interface Props {
  initialItems: GenerationHistoryItem[];
  initialHasMore: boolean;
  stats: HistoryStats;
}

/* ── Date grouping ──────────────────────────────────────────────────────── */

function dateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfThisWeek = new Date(startOfToday);
  startOfThisWeek.setDate(startOfThisWeek.getDate() - startOfThisWeek.getDay());

  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  if (d >= startOfThisWeek) return "This week";

  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function groupItems(items: GenerationHistoryItem[]): { label: string; items: GenerationHistoryItem[] }[] {
  const map = new Map<string, GenerationHistoryItem[]>();
  for (const item of items) {
    const label = dateLabel(item.created_at);
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

/* ── Stat card ───────────────────────────────────────────────────────────── */

function StatCard({ label, value, sub, color }: { label: string; value: React.ReactNode; sub?: string; color?: string }) {
  return (
    <div style={{
      border: "1px solid var(--ds-border)",
      borderRadius: "var(--ds-radius-200)",
      backgroundColor: "var(--ds-surface)",
      padding: "20px 24px",
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </p>
      <div style={{ fontSize: 30, fontWeight: 800, color: color ?? "var(--ds-text)", lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ds-text-subtlest)" }}>{sub}</p>}
    </div>
  );
}

function scoreColor(s: number | null): string {
  if (s === null) return "var(--ds-text-subtlest)";
  if (s >= 80) return "#16a34a";
  if (s >= 60) return "#d97706";
  return "var(--ds-text-subtlest)";
}

/* ── Main feed ───────────────────────────────────────────────────────────── */

export function HistoryFeed({ initialItems, initialHasMore, stats }: Props) {
  const [items, setItems] = useState<GenerationHistoryItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const offsetRef = useRef(initialItems.length);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/generate/history?limit=${PAGE_SIZE}&offset=${offsetRef.current}`);
      if (!res.ok) return;
      const data: GenerationHistoryItem[] = await res.json();
      setItems((prev) => [...prev, ...data]);
      offsetRef.current += data.length;
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      // silently fail - user can retry
    } finally {
      setLoadingMore(false);
    }
  }, []);

  /* Client-side filter over all loaded items */
  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== "all" && item.input_type !== typeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const inInput = item.input_text.toLowerCase().includes(q);
      const inVariants = (item.variants ?? []).some((v) =>
        v.content?.toLowerCase().includes(q)
      );
      return inInput || inVariants;
    });
  }, [items, search, typeFilter]);

  const grouped = useMemo(() => groupItems(filtered), [filtered]);

  const typeOptions: { key: TypeFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "idea", label: "Ideas" },
    { key: "repurpose", label: "Repurposed" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total generated"
          value={stats.total}
          sub={`${stats.total} post${stats.total !== 1 ? "s" : ""} written in your voice`}
        />
        <StatCard
          label="Avg voice score"
          value={
            stats.avg_score !== null
              ? <span style={{ color: scoreColor(stats.avg_score) }}>{stats.avg_score}%</span>
              : <span style={{ fontSize: 22, color: "var(--ds-text-subtlest)" }}>-</span>
          }
          sub={stats.avg_score !== null ? "Across all variants" : "Generate posts to see your score"}
        />
        <StatCard
          label="Best voice score"
          value={
            stats.best_score !== null
              ? <span style={{ color: scoreColor(stats.best_score) }}>{stats.best_score}%</span>
              : <span style={{ fontSize: 22, color: "var(--ds-text-subtlest)" }}>-</span>
          }
          sub={stats.best_score !== null ? "Your personal best" : "Keep generating to set one"}
        />
      </div>

      {/* Search + filter row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180, maxWidth: 360 }}>
          <svg
            width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2}
            viewBox="0 0 24 24"
            style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ds-text-subtlest)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 32,
              paddingRight: 12,
              paddingTop: 7,
              paddingBottom: 7,
              fontSize: 13,
              border: "1px solid var(--ds-border)",
              borderRadius: 8,
              background: "var(--ds-surface)",
              color: "var(--ds-text)",
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#0A66C2"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
          />
        </div>

        {/* Type filter tabs */}
        <div style={{ display: "flex", gap: 4, background: "var(--ds-background-neutral-subtle)", padding: 3, borderRadius: 8, border: "1px solid var(--ds-border)" }}>
          {typeOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              style={{
                padding: "5px 14px",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                background: typeFilter === key ? "var(--ds-surface)" : "transparent",
                color: typeFilter === key ? "var(--ds-text)" : "var(--ds-text-subtle)",
                boxShadow: typeFilter === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.12s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Count indicator */}
        {search || typeFilter !== "all" ? (
          <span style={{ fontSize: 12, color: "var(--ds-text-subtlest)", marginLeft: 4 }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      {/* Empty search result */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "48px 24px",
          border: "1px dashed var(--ds-border)",
          borderRadius: "var(--ds-radius-200)",
          color: "var(--ds-text-subtle)",
        }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>No posts match your search</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>
            {search ? `No results for "${search}"` : "No posts of this type yet"}
          </p>
        </div>
      )}

      {/* Date-grouped list */}
      {grouped.map(({ label, items: groupItems }) => (
        <div key={label} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              {label}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--ds-border)" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {groupItems.map((gen) => (
              <HistoryItemCard key={gen.id} gen={gen} />
            ))}
          </div>
        </div>
      ))}

      {/* Load more */}
      {hasMore && filtered.length > 0 && !search && typeFilter === "all" && (
        <div style={{ textAlign: "center", paddingBottom: 8 }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: "9px 24px",
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid var(--ds-border)",
              borderRadius: 8,
              background: "var(--ds-surface)",
              color: loadingMore ? "var(--ds-text-disabled)" : "var(--ds-text)",
              cursor: loadingMore ? "not-allowed" : "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { if (!loadingMore) e.currentTarget.style.background = "var(--ds-background-neutral-subtle)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--ds-surface)"; }}
          >
            {loadingMore ? "Loading…" : "Load more posts"}
          </button>
        </div>
      )}

      {/* End of list indicator */}
      {!hasMore && items.length > PAGE_SIZE && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--ds-text-subtlest)", margin: 0 }}>
          All {stats.total} posts loaded
        </p>
      )}
    </div>
  );
}

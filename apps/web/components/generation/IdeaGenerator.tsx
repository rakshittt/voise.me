"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IdeaItem, IdeasResponse } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Card } from "@/components/ui/Card";
import Heading from "@/components/ui/Heading";

const HISTORY_KEY = "voise_ideas_history";
const MAX_HISTORY = 10;

interface IdeaHistoryEntry {
  id: string;
  niche: string;
  focus_topic?: string;
  ideas: IdeaItem[];
  generated_at: number;
}

function loadHistory(): IdeaHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveToHistory(entry: IdeaHistoryEntry) {
  const prev = loadHistory().filter((e) => e.id !== entry.id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([entry, ...prev].slice(0, MAX_HISTORY)));
}

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Story:       { bg: "var(--ds-background-information)",      text: "var(--ds-text-information)" },
  Insight:     { bg: "var(--ds-background-discovery)",        text: "var(--ds-text-discovery)" },
  List:        { bg: "var(--ds-background-success)",          text: "var(--ds-text-success)" },
  "How-to":    { bg: "var(--ds-background-success)",          text: "var(--ds-text-success)" },
  Contrarian:  { bg: "var(--ds-background-warning)",          text: "var(--ds-text-warning)" },
  Observation: { bg: "var(--ds-background-neutral)",          text: "var(--ds-text-subtle)" },
};

function ContentTypeBadge({ type }: { type: string }) {
  const colors = CONTENT_TYPE_COLORS[type] ?? CONTENT_TYPE_COLORS.Observation;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "var(--ds-radius-050)",
        fontSize: "var(--ds-font-size-075)",
        fontWeight: "var(--ds-font-weight-semibold)",
        backgroundColor: colors.bg,
        color: colors.text,
        letterSpacing: "0.02em",
      }}
    >
      {type}
    </span>
  );
}

function IdeaCard({ idea, index }: { idea: IdeaItem; index: number }) {
  const writeUrl = `/dashboard/write?idea=${encodeURIComponent(idea.hook)}`;

  return (
    <Card elevation="raised" padding="none">
      <div style={{ padding: "var(--ds-space-200)" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ds-space-150)", marginBottom: "var(--ds-space-100)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: "50%",
                backgroundColor: "var(--ds-background-neutral)",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-semibold)",
                color: "var(--ds-text-subtle)",
                flexShrink: 0,
              }}
            >
              {index + 1}
            </span>
            <ContentTypeBadge type={idea.content_type} />
          </div>
        </div>

        {/* Title */}
        <p
          style={{
            margin: "0 0 var(--ds-space-100)",
            fontSize: "var(--ds-font-size-200)",
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text)",
            lineHeight: "var(--ds-line-height-200)",
          }}
        >
          {idea.title}
        </p>

        {/* Hook */}
        <div
          style={{
            backgroundColor: "var(--ds-surface-sunken)",
            borderLeft: "3px solid var(--ds-border-brand)",
            borderRadius: "0 var(--ds-radius-100) var(--ds-radius-100) 0",
            padding: "var(--ds-space-100) var(--ds-space-150)",
            marginBottom: "var(--ds-space-100)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "var(--ds-font-size-100)",
              color: "var(--ds-text)",
              fontStyle: "italic",
              lineHeight: "var(--ds-line-height-300)",
            }}
          >
            &ldquo;{idea.hook}&rdquo;
          </p>
        </div>

        {/* Rationale */}
        <p
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-075)",
            color: "var(--ds-text-subtlest)",
            lineHeight: "var(--ds-line-height-200)",
          }}
        >
          {idea.rationale}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--ds-border)",
          padding: "var(--ds-space-100) var(--ds-space-200)",
          backgroundColor: "var(--ds-background-neutral-subtle)",
        }}
      >
        <Link href={writeUrl} style={{ textDecoration: "none" }}>
          <Button appearance="primary" spacing="compact" shouldFitContainer>
            Write this post →
          </Button>
        </Link>
      </div>
    </Card>
  );
}

/* ── Recommended ideas ──────────────────────────────────────────────────── */

const CONTENT_TYPE_ICONS: Record<string, string> = {
  Story:       "📖",
  Insight:     "💡",
  List:        "📋",
  "How-to":    "🔧",
  Contrarian:  "🔥",
  Observation: "🔭",
};

function logIdeaEvent(idea: IdeaItem, eventType: "accepted" | "skipped" | "written") {
  fetch("/api/ideas/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: idea.title,
      hook: idea.hook,
      content_type: idea.content_type,
      rationale: idea.rationale ?? "",
      event_type: eventType,
      recommendation_score: null,
    }),
  }).catch(() => null);
}

function RecommendedCard({ idea, index }: { idea: IdeaItem; index: number }) {
  const href = `/dashboard/write?idea=${encodeURIComponent(idea.hook)}`;
  const colors = CONTENT_TYPE_COLORS[idea.content_type] ?? CONTENT_TYPE_COLORS.Observation;
  const icon = CONTENT_TYPE_ICONS[idea.content_type] ?? "💡";

  return (
    <Link
      href={href}
      onClick={() => logIdeaEvent(idea, "accepted")}
      style={{ textDecoration: "none", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "var(--ds-space-100)",
          padding: "var(--ds-space-200)",
          backgroundColor: "var(--ds-surface)",
          border: "1px solid var(--ds-border)",
          borderRadius: "var(--ds-radius-200)",
          cursor: "pointer",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--ds-border-brand)";
          e.currentTarget.style.boxShadow = "var(--ds-shadow-raised)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--ds-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {/* Type + number */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
            <span style={{ fontSize: 13 }}>{icon}</span>
            <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: colors.text, backgroundColor: colors.bg, padding: "1px 7px", borderRadius: 4 }}>
              {idea.content_type}
            </span>
          </div>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontWeight: "var(--ds-font-weight-semibold)" }}>
            #{index + 1}
          </span>
        </div>

        {/* Title */}
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", lineHeight: 1.4 }}>
          {idea.title}
        </p>

        {/* Hook preview */}
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          &ldquo;{idea.hook}&rdquo;
        </p>

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: "var(--ds-space-075)", display: "flex", alignItems: "center", gap: "var(--ds-space-050)" }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-link)" }}>
            Write this post →
          </span>
        </div>
      </div>
    </Link>
  );
}

function RecommendedIdeas({ onRefresh }: { onRefresh?: () => void }) {
  const [ideas, setIdeas] = useState<IdeaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch("/api/ideas/recommended")
      .then((r) => r.json())
      .then((data) => {
        if (data.ready && Array.isArray(data.ideas)) {
          setIdeas(data.ideas);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetch("/api/ideas/recommended?refresh=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.ready && Array.isArray(data.ideas)) {
          setIdeas(data.ideas);
        }
      })
      .catch(() => null)
      .finally(() => setRefreshing(false));
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Suggested for you
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--ds-space-150)" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 140, backgroundColor: "var(--ds-background-neutral-subtle)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  if (ideas.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Suggested for you
          </p>
          <span style={{ fontSize: "var(--ds-font-size-075)", padding: "1px 7px", borderRadius: 10, backgroundColor: "var(--ds-background-brand-subtle)", color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)" }}>
            Based on your voice
          </span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ fontSize: "var(--ds-font-size-075)", color: refreshing ? "var(--ds-text-disabled)" : "var(--ds-text-subtlest)", background: "none", border: "none", cursor: refreshing ? "not-allowed" : "pointer", padding: 0, display: "flex", alignItems: "center", gap: 4 }}
        >
          <span style={refreshing ? { display: "inline-block", animation: "spin 1s linear infinite" } : undefined}>↺</span>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div style={{ position: "relative" }}>
        {refreshing && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.65)", borderRadius: "var(--ds-radius-200)", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", fontWeight: "var(--ds-font-weight-semibold)", backgroundColor: "var(--ds-surface)", padding: "var(--ds-space-075) var(--ds-space-150)", borderRadius: "var(--ds-radius-100)", border: "1px solid var(--ds-border)" }}>
              Generating fresh ideas for your voice…
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ opacity: refreshing ? 0.4 : 1, transition: "opacity 0.2s" }}>
          {ideas.map((idea, i) => (
            <RecommendedCard key={i} idea={idea} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Past idea sets ─────────────────────────────────────────────────────── */

function PastIdeaSets({ onReuse }: { onReuse: (entry: IdeaHistoryEntry) => void }) {
  const [history, setHistory] = useState<IdeaHistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  if (history.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Past idea sets
        </p>
        <button
          onClick={() => { localStorage.removeItem(HISTORY_KEY); setHistory([]); }}
          style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Clear all
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
        {history.map((entry) => {
          const isOpen = expanded === entry.id;
          const date = new Date(entry.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return (
            <div
              key={entry.id}
              style={{
                backgroundColor: "var(--ds-surface)",
                border: `1px solid ${isOpen ? "var(--ds-border-brand)" : "var(--ds-border)"}`,
                borderRadius: "var(--ds-radius-200)",
                overflow: "hidden",
              }}
            >
              {/* Row */}
              <button
                onClick={() => setExpanded(isOpen ? null : entry.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--ds-space-125) var(--ds-space-200)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  gap: "var(--ds-space-150)",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.niche}
                  </p>
                  {entry.focus_topic && (
                    <p style={{ margin: "2px 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.focus_topic}
                    </p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", flexShrink: 0 }}>
                  <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{date}</span>
                  <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{entry.ideas.length} ideas</span>
                  <span style={{ fontSize: 11, color: "var(--ds-text-subtlest)" }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </button>

              {/* Expanded ideas */}
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--ds-border)", backgroundColor: "var(--ds-background-neutral-subtle)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {entry.ideas.map((idea, i) => {
                      const colors = CONTENT_TYPE_COLORS[idea.content_type] ?? CONTENT_TYPE_COLORS.Observation;
                      const writeUrl = `/dashboard/write?idea=${encodeURIComponent(idea.hook)}`;
                      return (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "var(--ds-space-150)",
                            padding: "var(--ds-space-125) var(--ds-space-200)",
                            borderBottom: i < entry.ideas.length - 1 ? "1px solid var(--ds-border)" : "none",
                            backgroundColor: "var(--ds-surface)",
                          }}
                        >
                          <span style={{ flexShrink: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: colors.text, backgroundColor: colors.bg, padding: "1px 7px", borderRadius: 4, marginTop: 2 }}>
                            {idea.content_type}
                          </span>
                          <p style={{ flex: 1, margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.5 }}>
                            {idea.title}
                          </p>
                          <Link
                            href={writeUrl}
                            style={{ flexShrink: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-link)", textDecoration: "none", marginTop: 2 }}
                          >
                            Write →
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: "var(--ds-space-100) var(--ds-space-200)", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => onReuse(entry)}
                      style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      Regenerate for this audience →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Types ───────────────────────────────────────────────────────────────── */

type ViewState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "result"; data: IdeasResponse }
  | { type: "error"; message: string };

export function IdeaGenerator() {
  const [niche, setNiche] = useState("");
  const [focusTopic, setFocusTopic] = useState("");
  const [view, setView] = useState<ViewState>({ type: "idle" });

  const handleReuse = (entry: IdeaHistoryEntry) => {
    setNiche(entry.niche);
    setFocusTopic(entry.focus_topic ?? "");
  };

  const handleGenerate = async () => {
    if (niche.trim().length < 5) return;
    setView({ type: "loading" });

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          focus_topic: focusTopic.trim() || null,
          count: 5,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        const detail = err.detail;
        throw new Error(typeof detail === "string" ? detail : "Failed to generate ideas");
      }

      const data: IdeasResponse = await res.json();
      saveToHistory({
        id: crypto.randomUUID(),
        niche: niche.trim(),
        focus_topic: focusTopic.trim() || undefined,
        ideas: data.ideas,
        generated_at: Date.now(),
      });
      setView({ type: "result", data });
    } catch (err) {
      setView({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  };

  const handleReset = () => {
    setView({ type: "idle" });
  };

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (view.type === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ds-space-800) 0", gap: "var(--ds-space-200)" }}>
        <Spinner size="large" />
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Reading your voice and generating ideas for <strong>{niche}</strong>…
        </p>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>~10 seconds</p>
      </div>
    );
  }

  /* ── Result ──────────────────────────────────────────────────────────────── */
  if (view.type === "result") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Heading size="medium" as="h2">Post ideas for you</Heading>
            <p style={{ color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)", margin: "var(--ds-space-025) 0 0" }}>
              Based on your voice and audience: <strong>{view.data.niche}</strong>
            </p>
          </div>
          <Button appearance="default" spacing="compact" onClick={handleReset}>
            New ideas
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          {view.data.ideas.map((idea, i) => (
            <IdeaCard key={i} idea={idea} index={i} />
          ))}
        </div>

        <div style={{ textAlign: "center", paddingTop: "var(--ds-space-100)" }}>
          <Button appearance="subtle" spacing="compact" onClick={handleReset}>
            Change niche or regenerate
          </Button>
        </div>
      </div>
    );
  }

  /* ── Idle / Input ────────────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
      {view.type === "error" && (
        <SectionMessage appearance="error" title="Couldn't generate ideas">
          {view.message}
        </SectionMessage>
      )}

      {/* Recommended ideas - always visible in idle state */}
      {view.type === "idle" && <RecommendedIdeas />}

      {/* Divider */}
      {view.type === "idle" && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-200)" }}>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--ds-border)" }} />
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", whiteSpace: "nowrap", fontWeight: "var(--ds-font-weight-semibold)" }}>
            OR GENERATE FOR A SPECIFIC AUDIENCE
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "var(--ds-border)" }} />
        </div>
      )}

      {/* Empty state hero */}
      {view.type === "idle" && (
        <div
          style={{
            textAlign: "center",
            padding: "var(--ds-space-400) var(--ds-space-200)",
            borderRadius: "var(--ds-radius-200)",
            backgroundColor: "var(--ds-surface-sunken)",
            border: "1px solid var(--ds-border)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--ds-radius-200)",
              backgroundColor: "var(--ds-background-brand-bold)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--ds-space-150)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
          </div>
          <Heading size="medium" as="h2">What should you post next?</Heading>
          <p style={{ color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)", marginTop: "var(--ds-space-075)", marginBottom: 0, maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>
            Tell us who you&apos;re writing for and we&apos;ll generate 5 ideas tailored to your voice and audience.
          </p>
        </div>
      )}

      {/* Input form */}
      <Card elevation="flat" padding="none">
        <div style={{ padding: "var(--ds-space-200)" }}>
          {/* Niche input */}
          <div style={{ marginBottom: "var(--ds-space-150)" }}>
            <label
              style={{
                display: "block",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-semibold)",
                color: "var(--ds-text-subtle)",
                marginBottom: "var(--ds-space-050)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Who are you writing for? *
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. early-stage B2B SaaS founders, senior product managers, first-time engineering managers"
              maxLength={200}
              style={{
                width: "100%",
                padding: "var(--ds-space-100) var(--ds-space-150)",
                borderRadius: "var(--ds-radius-100)",
                border: "2px solid var(--ds-border)",
                backgroundColor: "var(--ds-surface)",
                fontSize: "var(--ds-font-size-100)",
                color: "var(--ds-text)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-focused)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && niche.trim().length >= 5) handleGenerate(); }}
            />
          </div>

          {/* Focus topic (optional) */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-semibold)",
                color: "var(--ds-text-subtle)",
                marginBottom: "var(--ds-space-050)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Topic focus <span style={{ fontWeight: "var(--ds-font-weight-regular)", textTransform: "none", letterSpacing: 0, color: "var(--ds-text-subtlest)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              placeholder="e.g. hiring decisions, go-to-market strategy, building in public"
              maxLength={200}
              style={{
                width: "100%",
                padding: "var(--ds-space-100) var(--ds-space-150)",
                borderRadius: "var(--ds-radius-100)",
                border: "2px solid var(--ds-border)",
                backgroundColor: "var(--ds-surface)",
                fontSize: "var(--ds-font-size-100)",
                color: "var(--ds-text)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-focused)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && niche.trim().length >= 5) handleGenerate(); }}
            />
          </div>
        </div>

        <div
          style={{
            borderTop: "1px solid var(--ds-border)",
            padding: "var(--ds-space-075) var(--ds-space-200)",
            backgroundColor: "var(--ds-background-neutral-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            5 ideas will be generated
          </span>
          {niche.trim().length >= 5 && (
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              Ready ✓
            </span>
          )}
        </div>
      </Card>

      <Button
        appearance="primary"
        isDisabled={niche.trim().length < 5}
        onClick={handleGenerate}
        shouldFitContainer
      >
        Generate 5 ideas for my voice
      </Button>

      {/* History - only shown in idle state */}
      {view.type === "idle" && <PastIdeaSets onReuse={handleReuse} />}
    </div>
  );
}

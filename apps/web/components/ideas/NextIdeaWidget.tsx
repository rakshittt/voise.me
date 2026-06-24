"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { IdeaItem } from "@/lib/types";

const CONTENT_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Story:       { bg: "var(--ds-background-information)",   text: "var(--ds-text-information)" },
  Insight:     { bg: "var(--ds-background-discovery)",     text: "var(--ds-text-discovery)" },
  List:        { bg: "var(--ds-background-success)",       text: "var(--ds-text-success)" },
  "How-to":    { bg: "var(--ds-background-success)",       text: "var(--ds-text-success)" },
  Contrarian:  { bg: "var(--ds-background-warning)",       text: "var(--ds-text-warning)" },
  Observation: { bg: "var(--ds-background-neutral)",       text: "var(--ds-text-subtle)" },
};

export function NextIdeaWidget() {
  const [idea, setIdea] = useState<IdeaItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    fetch("/api/ideas/top")
      .then((r) => r.json())
      .then((data) => {
        if (data.idea) {
          setIdea(data.idea);
          setStatus("ready");
        } else {
          setStatus("empty");
        }
      })
      .catch(() => setStatus("empty"));
  }, []);

  if (status === "loading") {
    return (
      <div
        style={{
          borderRadius: "var(--ds-radius-200)",
          border: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-surface)",
          padding: "var(--ds-space-200)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--ds-space-100)",
        }}
      >
        <div style={{ width: "40%", height: 10, borderRadius: 4, backgroundColor: "var(--ds-background-neutral-subtle)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "100%", height: 14, borderRadius: 4, backgroundColor: "var(--ds-background-neutral-subtle)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "80%", height: 14, borderRadius: 4, backgroundColor: "var(--ds-background-neutral-subtle)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    );
  }

  if (status === "empty" || !idea) return null;

  const colors = CONTENT_TYPE_COLORS[idea.content_type] ?? CONTENT_TYPE_COLORS.Observation;
  const writeUrl = `/dashboard/write?idea=${encodeURIComponent(idea.hook)}`;

  return (
    <div
      style={{
        borderRadius: "var(--ds-radius-200)",
        border: "1px solid var(--ds-border-brand)",
        backgroundColor: "var(--ds-background-brand-subtle)",
        overflow: "hidden",
      }}
    >
      {/* Label */}
      <div
        style={{
          padding: "8px var(--ds-space-200)",
          borderBottom: "1px solid var(--ds-border-brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          ✦ Write next
        </span>
        <span
          style={{
            fontSize: "var(--ds-font-size-075)",
            padding: "1px 7px",
            borderRadius: 4,
            backgroundColor: colors.bg,
            color: colors.text,
            fontWeight: "var(--ds-font-weight-semibold)",
          }}
        >
          {idea.content_type}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "var(--ds-space-175) var(--ds-space-200)" }}>
        <p
          style={{
            margin: "0 0 var(--ds-space-075)",
            fontSize: "var(--ds-font-size-075)",
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text)",
            lineHeight: 1.4,
          }}
        >
          {idea.title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-075)",
            color: "var(--ds-text-subtle)",
            lineHeight: 1.55,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          &ldquo;{idea.hook}&rdquo;
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "var(--ds-space-100) var(--ds-space-200)",
          borderTop: "1px solid var(--ds-border-brand)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link
          href={writeUrl}
          onClick={() => {
            fetch("/api/ideas/events", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: idea.title,
                hook: idea.hook,
                content_type: idea.content_type,
                rationale: idea.rationale ?? "",
                event_type: "accepted",
                recommendation_score: null,
              }),
            }).catch(() => null);
          }}
          style={{
            fontSize: "var(--ds-font-size-075)",
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text-brand)",
            textDecoration: "none",
          }}
        >
          Write this post →
        </Link>
        <Link
          href="/dashboard/ideas"
          style={{
            fontSize: "var(--ds-font-size-075)",
            color: "var(--ds-text-subtlest)",
            textDecoration: "none",
          }}
        >
          See more ideas
        </Link>
      </div>
    </div>
  );
}

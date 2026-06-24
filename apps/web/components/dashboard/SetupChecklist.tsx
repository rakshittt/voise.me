"use client";

import { useState } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

interface SetupChecklistProps {
  profileReady: boolean;
  hasGenerations: boolean;
}

export function SetupChecklist({ profileReady, hasGenerations }: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const items: ChecklistItem[] = [
    {
      id: "dna",
      label: "Build your Voice DNA",
      description: "Paste your writing so Voise can learn your style.",
      href: "/onboarding/build-profile",
      cta: "Start →",
      done: profileReady,
    },
    {
      id: "generate",
      label: "Generate your first post",
      description: "Turn an idea into 3 variants scored against your voice.",
      href: "/dashboard/write",
      cta: "Generate →",
      done: hasGenerations,
    },
  ];

  const completedCount = items.filter((i) => i.done).length;
  const allDone = completedCount === items.length;

  if (allDone) return null;

  const progressPct = completedCount / items.length;

  return (
    <div
      style={{
        borderRadius: "var(--ds-radius-200)",
        border: "1px solid var(--ds-border)",
        backgroundColor: "var(--ds-surface)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--ds-space-150) var(--ds-space-200)",
          borderBottom: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-surface-sunken)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)" }}>
          <span style={{ fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
            Getting started
          </span>
          <span
            style={{
              fontSize: "var(--ds-font-size-075)",
              color: "var(--ds-text-subtlest)",
              backgroundColor: "var(--ds-background-neutral)",
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {completedCount}/{items.length}
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--ds-icon-subtle)",
            padding: "var(--ds-space-025)",
            lineHeight: 1,
            fontSize: 18,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, backgroundColor: "var(--ds-background-neutral)" }}>
        <div
          style={{
            height: "100%",
            width: `${progressPct * 100}%`,
            backgroundColor: "var(--ds-background-brand-bold)",
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Items */}
      <div>
        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--ds-space-150)",
              padding: "var(--ds-space-150) var(--ds-space-200)",
              borderBottom: idx < items.length - 1 ? "1px solid var(--ds-border)" : "none",
              opacity: item.done ? 0.55 : 1,
            }}
          >
            {/* Checkbox circle */}
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                border: `2px solid ${item.done ? "var(--ds-border-success)" : "var(--ds-border)"}`,
                backgroundColor: item.done ? "var(--ds-background-success-bold)" : "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {item.done && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  margin: "0 0 var(--ds-space-025)",
                  fontWeight: "var(--ds-font-weight-semibold)",
                  fontSize: "var(--ds-font-size-075)",
                  color: "var(--ds-text)",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.label}
              </p>
              {!item.done && (
                <>
                  <p style={{ margin: "0 0 var(--ds-space-075)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>
                    {item.description}
                  </p>
                  <Link
                    href={item.href}
                    style={{
                      fontSize: "var(--ds-font-size-075)",
                      fontWeight: "var(--ds-font-weight-semibold)",
                      color: "var(--ds-text-brand)",
                      textDecoration: "none",
                    }}
                  >
                    {item.cta}
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

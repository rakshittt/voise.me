"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VoiceStrengthResponse } from "@/lib/types";

const STEPS: Array<{ key: "provisional" | "learning" | "established"; label: string; color: string }> = [
  { key: "provisional", label: "Starter",     color: "#FF8B00" },
  { key: "learning",    label: "Learning",    color: "#4C9AFF" },
  { key: "established", label: "Established", color: "#36B37E" },
];

const STEP_INDEX: Record<string, number> = { provisional: 0, learning: 1, established: 2 };

export function VoiceStrengthWidget() {
  const [strength, setStrength] = useState<VoiceStrengthResponse | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/voice-profile/strength");
        if (res.ok) {
          const data = (await res.json()) as VoiceStrengthResponse;
          setStrength(data);
        }
      } catch {
        // non-fatal - widget silently stays hidden
      }
    })();
  }, []);

  // Only meaningful for seed profiles; extracted profiles are always established
  if (!strength || strength.profile_type === "extracted") return null;

  const currentIdx = STEP_INDEX[strength.level] ?? 0;
  const currentStep = STEPS[currentIdx];

  return (
    <div
      style={{
        padding: "var(--ds-space-200)",
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: "var(--ds-radius-200)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--ds-space-150)",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Voice Strength
        </p>
        <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: currentStep?.color }}>
          {currentStep?.label}
        </span>
      </div>

      {/* Step track */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
        {STEPS.map((step, i) => {
          const filled = i <= currentIdx;
          return (
            <div key={step.key} style={{ display: "contents" }}>
              <div
                style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  backgroundColor: filled ? step.color : "var(--ds-background-neutral)",
                  boxShadow: i === currentIdx ? `0 0 0 3px ${step.color}33` : "none",
                  transition: "background-color 0.2s",
                }}
              />
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, backgroundColor: i < currentIdx ? STEPS[i + 1].color : "var(--ds-background-neutral)", transition: "background-color 0.2s" }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {STEPS.map((step) => (
          <span key={step.key} style={{ fontSize: "var(--ds-font-size-075)", color: strength.level === step.key ? step.color : "var(--ds-text-subtlest)", fontWeight: strength.level === step.key ? "var(--ds-font-weight-semibold)" : "var(--ds-font-weight-regular)" }}>
            {step.label}
          </span>
        ))}
      </div>

      {/* Next milestone */}
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: 1.5 }}>
        {strength.next_milestone}
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: "var(--ds-space-200)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
        <span>
          <strong style={{ color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>{strength.edit_count}</strong>
          {" "}edit{strength.edit_count !== 1 ? "s" : ""}
        </span>
        <span>
          <strong style={{ color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>{strength.posts_added}</strong>
          {" "}post{strength.posts_added !== 1 ? "s" : ""} added
        </span>
      </div>

      {/* CTA - only when not yet established */}
      {strength.level !== "established" && (
        <Link
          href="/dashboard/sources"
          style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)", textDecoration: "none" }}
        >
          Add writing samples to level up →
        </Link>
      )}
    </div>
  );
}

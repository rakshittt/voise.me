"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TextArea } from "@/components/ui/TextArea";
import { PublicToolCTA } from "@/components/marketing/PublicToolCTA";
import { LINKEDIN_FIELD_LIMITS } from "@/lib/linkedinLimits";

function FieldTab({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "var(--ds-space-075) var(--ds-space-150)",
        borderRadius: "var(--ds-radius-200)",
        border: `1px solid ${active ? "var(--ds-border-brand)" : "var(--ds-border)"}`,
        background: active ? "var(--ds-background-brand-bold)" : "var(--ds-surface)",
        color: active ? "var(--ds-text-inverse)" : "var(--ds-text-subtle)",
        fontSize: "var(--ds-font-size-075)",
        fontWeight: "var(--ds-font-weight-semibold)",
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

export function CharacterCounterTool() {
  const [fieldId, setFieldId] = useState(LINKEDIN_FIELD_LIMITS[0].id);
  const [text, setText] = useState("");

  const field = LINKEDIN_FIELD_LIMITS.find((f) => f.id === fieldId) ?? LINKEDIN_FIELD_LIMITS[0];
  const charCount = [...text].length;
  const overLimit = charCount > field.limit;
  const nearLimit = !overLimit && charCount > field.limit * 0.85;
  const pct = Math.min(100, Math.round((charCount / field.limit) * 100));

  const truncated = field.truncateAt && charCount > field.truncateAt;
  const visiblePart = field.truncateAt ? text.slice(0, field.truncateAt) : text;
  const hiddenPart = field.truncateAt ? text.slice(field.truncateAt) : "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-100)" }}>
        {LINKEDIN_FIELD_LIMITS.map((f) => (
          <FieldTab key={f.id} active={f.id === fieldId} label={f.label} onClick={() => setFieldId(f.id)} />
        ))}
      </div>

      <Card elevation="flat" padding="none">
        <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)" }}>
          <TextArea
            label={field.label}
            placeholder={field.description}
            value={text}
            onChange={(e) => setText(e.target.value)}
            minimumRows={field.id === "post" ? 12 : field.id === "about" ? 10 : 4}
          />
        </div>
        <div
          style={{
            borderTop: "1px solid var(--ds-border)",
            padding: "var(--ds-space-150) var(--ds-space-200)",
            background: "var(--ds-background-neutral-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-075)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "var(--ds-font-size-100)",
                fontWeight: "var(--ds-font-weight-semibold)",
                color: overLimit ? "var(--ds-text-danger)" : nearLimit ? "var(--ds-text-warning)" : "var(--ds-text-subtle)",
              }}
            >
              {charCount.toLocaleString()} / {field.limit.toLocaleString()} characters
            </span>
            {overLimit && (
              <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-danger)", fontWeight: "var(--ds-font-weight-semibold)" }}>
                {(charCount - field.limit).toLocaleString()} over limit
              </span>
            )}
          </div>
          <div style={{ height: 6, background: "var(--ds-background-neutral)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: overLimit ? "var(--ds-background-danger-bold, #c0392b)" : nearLimit ? "var(--ds-background-warning-bold)" : "var(--ds-background-brand-bold)",
                transition: "width 0.15s",
              }}
            />
          </div>
        </div>
      </Card>

      {field.truncateAt && (
        <Card elevation="raised" padding="default">
          <p style={{ margin: "0 0 var(--ds-space-100)", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
            &ldquo;...see more&rdquo; preview
          </p>
          <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            Approximate - LinkedIn doesn&apos;t publish an exact cutoff and it varies by device and feed. Use this as a rule of thumb for where your best line should land.
          </p>
          {text.trim() ? (
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", whiteSpace: "pre-wrap", lineHeight: "var(--ds-line-height-300)" }}>
              {visiblePart}
              {truncated && (
                <>
                  <span style={{ color: "var(--ds-text-subtle)", fontWeight: "var(--ds-font-weight-semibold)" }}>...see more</span>
                  <span style={{ background: "var(--ds-background-warning-subtle, var(--ds-background-neutral-subtle))", color: "var(--ds-text-subtlest)" }}>{hiddenPart}</span>
                </>
              )}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtlest)" }}>Start typing above to see the preview.</p>
          )}
        </Card>
      )}

      <PublicToolCTA
        title="Stop counting characters. Start writing in your voice."
        body="Voise tells you when a post is too long for its own good - and rewrites it in your voice, scored before you publish."
        handoffContent={field.id === "post" ? text : undefined}
        handoffSource="character-counter"
        handoffKind="idea"
      />
    </div>
  );
}

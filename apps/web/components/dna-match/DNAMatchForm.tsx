"use client";

import { useState } from "react";
import Link from "next/link";
import type { DNAMatchResponse, DNAMatchDimension } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";

type Rating = DNAMatchDimension["rating"];

function ratingAppearance(rating: Rating): "success" | "moved" | "removed" {
  return { strong: "success", fair: "moved", weak: "removed" }[rating] as "success" | "moved" | "removed";
}

function ratingLabel(rating: Rating) {
  return { strong: "Strong", fair: "Fair", weak: "Needs work" }[rating];
}

function scoreToColor(score: number) {
  if (score >= 80) return "var(--ds-text-success)";
  if (score >= 65) return "var(--ds-text-warning)";
  if (score >= 50) return "var(--ds-icon-warning)";
  return "var(--ds-text-danger)";
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = scoreToColor(score);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="48" cy="48" r={radius} fill="none" stroke="var(--ds-border)" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={radius} fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span style={{ position: "absolute", fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color, fontVariantNumeric: "tabular-nums" }}>
        {score}%
      </span>
    </div>
  );
}

function DimensionRow({ dim }: { dim: DNAMatchDimension }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(dim.score * 100);

  const guidanceBg = {
    strong: "var(--ds-background-success)",
    fair: "var(--ds-background-warning)",
    weak: "var(--ds-background-danger)",
  }[dim.rating];

  const guidanceBorder = {
    strong: "var(--ds-border-success)",
    fair: "var(--ds-border-warning)",
    weak: "var(--ds-border-danger)",
  }[dim.rating];

  const guidanceIcon = { strong: "✓", fair: "◎", weak: "⚠" }[dim.rating];
  const guidanceIconColor = {
    strong: "var(--ds-text-success)",
    fair: "var(--ds-text-warning)",
    weak: "var(--ds-text-danger)",
  }[dim.rating];

  const barColor = {
    strong: "var(--ds-background-success-bold)",
    fair: "var(--ds-background-warning-bold)",
    weak: "var(--ds-background-danger-bold)",
  }[dim.rating];

  return (
    <div
      style={{
        background: "var(--ds-surface)",
        borderRadius: "var(--ds-radius-200)",
        border: `1px solid var(--ds-border)`,
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          padding: "var(--ds-space-150) var(--ds-space-200)",
          display: "flex",
          alignItems: "center",
          gap: "var(--ds-space-150)",
          textAlign: "left",
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ds-background-neutral-subtle)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ds-space-050)" }}>
            <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{dim.label}</span>
            <Lozenge appearance={ratingAppearance(dim.rating)}>{ratingLabel(dim.rating)}</Lozenge>
          </div>
          <div style={{ height: 6, width: "100%", background: "var(--ds-background-neutral)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: "var(--ds-radius-200)", transition: "width 0.5s", width: `${pct}%`, background: barColor }} />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)", flexShrink: 0 }}>
          <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", fontVariantNumeric: "tabular-nums", width: 36, textAlign: "right" }}>
            {pct}%
          </span>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "0 var(--ds-space-200) var(--ds-space-200)", borderTop: `1px solid var(--ds-border)`, paddingTop: "var(--ds-space-150)", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div style={{ background: "var(--ds-background-neutral-subtle)", borderRadius: "var(--ds-radius-100)", padding: "var(--ds-space-150)" }}>
              <p style={{ margin: "0 0 var(--ds-space-050)", fontSize: "10px", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                This content
              </p>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{dim.post_label}</p>
            </div>
            <div style={{ background: "var(--ds-background-brand-subtle)", borderRadius: "var(--ds-radius-100)", padding: "var(--ds-space-150)", border: `1px solid var(--ds-border-brand)` }}>
              <p style={{ margin: "0 0 var(--ds-space-050)", fontSize: "10px", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Your Voice DNA
              </p>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)" }}>{dim.profile_label}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--ds-space-100)", padding: "var(--ds-space-100) var(--ds-space-150)", borderRadius: "var(--ds-radius-100)", background: guidanceBg, border: `1px solid ${guidanceBorder}` }}>
            <span style={{ fontSize: "var(--ds-font-size-100)", marginTop: 1, color: guidanceIconColor, flexShrink: 0 }}>{guidanceIcon}</span>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-300)" }}>{dim.guidance}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DNAMatchResult({ result, onReset }: { result: DNAMatchResponse; onReset: () => void }) {
  const weakDims = result.dimensions.filter((d) => d.rating === "weak");
  const strongDims = result.dimensions.filter((d) => d.rating === "strong");

  const scoreBg = result.overall_score >= 80
    ? "var(--ds-background-success)"
    : result.overall_score >= 65
    ? "var(--ds-background-warning)"
    : "var(--ds-background-danger)";
  const scoreBorder = result.overall_score >= 80
    ? "var(--ds-border-success)"
    : result.overall_score >= 65
    ? "var(--ds-border-warning)"
    : "var(--ds-border-danger)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>
      {/* Score card */}
      <div style={{ borderRadius: "var(--ds-radius-200)", border: `1px solid ${scoreBorder}`, padding: "var(--ds-space-250)", background: scoreBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-300)" }}>
          <ScoreCircle score={result.overall_score} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 var(--ds-space-050)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Voice DNA Match
            </p>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-300)" }}>
              {result.summary}
            </p>
            <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              {result.word_count} words analyzed · {strongDims.length} of 7 dimensions matching
            </p>
          </div>
        </div>
      </div>

      {/* What to fix */}
      {weakDims.length > 0 && (
        <Card elevation="flat" padding="default">
          <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Top fixes to sound more like you
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
            {weakDims.slice(0, 3).map((d) => (
              <li key={d.key} style={{ display: "flex", alignItems: "flex-start", gap: "var(--ds-space-100)" }}>
                <span style={{ color: "var(--ds-text-danger)", fontSize: "var(--ds-font-size-100)", marginTop: 1, flexShrink: 0 }}>⚠</span>
                <div>
                  <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{d.label}: </span>
                  <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{d.guidance}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Dimension breakdown */}
      <div>
        <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Dimension breakdown
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          {result.dimensions.map((dim) => (
            <DimensionRow key={dim.key} dim={dim} />
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)", paddingTop: "var(--ds-space-100)" }}>
        <Button appearance="default" onClick={onReset}>Analyze another</Button>
        <Link
          href="/dashboard/write"
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "var(--ds-space-075) var(--ds-space-200)",
            borderRadius: "var(--ds-radius-100)",
            background: "var(--ds-background-brand-bold)",
            color: "var(--ds-text-inverse)",
            fontWeight: "var(--ds-font-weight-semibold)",
            fontSize: "var(--ds-font-size-100)",
            textDecoration: "none",
            transition: "background 0.15s",
          }}
        >
          Generate in my voice →
        </Link>
      </div>
    </div>
  );
}

const CHAR_LIMIT = 5000;
const MIN_CHARS = 50;

const PLACEHOLDER = `Paste any LinkedIn post here - yours, a draft, or something you wrote outside of Voise.

We'll compare it against your Voice DNA fingerprint and tell you exactly which dimensions match and which diverge.`;

export function DNAMatchForm() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DNAMatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const canSubmit = charCount >= MIN_CHARS && charCount <= CHAR_LIMIT && !loading;

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/dna-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 400 && typeof data.detail === "string" && data.detail.includes("Voice profile")) {
          setError("You need a Voice DNA profile first. Build one in the Voice DNA tab.");
        } else if (res.status === 429) {
          setError("You've hit the limit (20 analyses/hour). Try again later.");
        } else {
          setError(data.detail ?? "Something went wrong. Please try again.");
        }
        return;
      }
      setResult(data as DNAMatchResponse);
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <DNAMatchResult
        result={result}
        onReset={() => { setResult(null); setContent(""); }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
      <div style={{ position: "relative" }}>
        <TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={PLACEHOLDER}
          minimumRows={10}
          maxLength={CHAR_LIMIT}
        />
        <span
          style={{
            position: "absolute",
            bottom: "var(--ds-space-100)",
            right: "var(--ds-space-150)",
            fontSize: "var(--ds-font-size-075)",
            color: charCount > CHAR_LIMIT * 0.9 ? "var(--ds-text-warning)" : "var(--ds-text-subtlest)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {charCount}/{CHAR_LIMIT}
        </span>
      </div>

      {charCount > 0 && charCount < MIN_CHARS && (
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-warning)" }}>
          Paste at least {MIN_CHARS} characters for a meaningful analysis.
        </p>
      )}

      {error && (
        <SectionMessage appearance="error" title="Analysis failed">
          {error}
          {error.includes("Voice DNA") && (
            <> <Link href="/dashboard/voice-dna" style={{ color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)" }}>Build Voice DNA →</Link></>
          )}
        </SectionMessage>
      )}

      <Button
        appearance="primary"
        shouldFitContainer
        isDisabled={!canSubmit}
        onClick={handleSubmit}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", justifyContent: "center" }}>
            <Spinner size="small" appearance="invert" /> Analyzing…
          </span>
        ) : "Run DNA Match"}
      </Button>

      <Card elevation="flat" padding="default">
        <p style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          What this checks
        </p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
          {[
            "How you open (hook style)",
            "How you structure the post",
            "Word choice and vocabulary register",
            "Sentence rhythm and pacing",
            "Paragraph layout and line breaks",
            "How you close and call to action",
            "Overall tone and emotional register",
          ].map((tip) => (
            <li key={tip} style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              <span style={{ color: "var(--ds-text-brand)", fontSize: 10 }}>◆</span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

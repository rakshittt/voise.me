"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";

interface ParsedResult {
  chunks: string[];
  count: number;
}

interface Props {
  sourceType: "text" | "transcript";
  onImport: (chunks: string[]) => void;
}

const CONFIG = {
  text: {
    label: "Paste your writing",
    placeholder:
      "Paste anything you've written - newsletters, articles, LinkedIn posts, tweet threads, blog posts, emails, essays…\n\nThe more you paste, the more accurate your voice model will be. Aim for 3,000+ words.",
    hint: "We'll automatically split it into voice samples. Mix sources for the best results.",
    minLabel: "Need at least ~1,500 words (≈15 samples)",
  },
  transcript: {
    label: "Paste your transcript",
    placeholder:
      "Paste a video or podcast transcript here.\n\nFormats that work best:\n  John: Here is what I think...\n  Host: That makes sense.\n\nOr just paste raw transcript text without speaker labels.",
    hint: "We'll detect speaker turns automatically and extract your spoken voice.",
    minLabel: "Need at least ~1,500 words (≈15 samples)",
  },
} as const;

function confidenceLabel(count: number): { label: string; appearance: "success" | "moved" | "removed" } {
  if (count >= 50) return { label: "High confidence", appearance: "success" };
  if (count >= 25) return { label: "Medium confidence", appearance: "moved" };
  return { label: "Enough to start", appearance: "removed" };
}

export function TextSourceInput({ sourceType, onImport }: Props) {
  const cfg = CONFIG[sourceType];
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState("");

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const handleParse = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/voice-profile/parse-text-source", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Parse failed");
      setResult(data as ParsedResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    const conf = confidenceLabel(result.count);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>
        <div
          style={{
            border: `1px solid var(--ds-border-success)`,
            borderRadius: "var(--ds-radius-200)",
            background: "var(--ds-background-success)",
            padding: "var(--ds-space-250)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-150)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)" }}>
            <span style={{ fontSize: 24 }}>✓</span>
            <div>
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", fontSize: "var(--ds-font-size-100)" }}>
                {result.count} voice samples extracted
              </p>
              <div style={{ marginTop: "var(--ds-space-050)" }}>
                <Lozenge appearance={conf.appearance}>{conf.label}</Lozenge>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
            {result.chunks.slice(0, 3).map((chunk, i) => (
              <div
                key={i}
                style={{
                  background: "var(--ds-surface)",
                  borderRadius: "var(--ds-radius-100)",
                  border: `1px solid var(--ds-border)`,
                  padding: "var(--ds-space-100) var(--ds-space-150)",
                  fontSize: "var(--ds-font-size-075)",
                  color: "var(--ds-text-subtle)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {chunk}
              </div>
            ))}
            {result.count > 3 && (
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                + {result.count - 3} more samples
              </p>
            )}
          </div>
        </div>

        {result.count < 15 ? (
          <SectionMessage appearance="warning" title="Not enough samples">
            Only {result.count} usable samples found. Paste more content and try again.
          </SectionMessage>
        ) : (
          <Button appearance="primary" shouldFitContainer onClick={() => onImport(result.chunks)}>
            Build Voice DNA from {result.count} samples →
          </Button>
        )}

        <Button appearance="subtle" shouldFitContainer onClick={() => { setResult(null); setError(""); }}>
          ← Paste different content
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>{cfg.hint}</p>

      <TextArea
        label={cfg.label}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={cfg.placeholder}
        minimumRows={12}
        resize="vertical"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{cfg.minLabel}</span>
        <span
          style={{
            fontSize: "var(--ds-font-size-075)",
            fontWeight: wordCount >= 1500 ? "var(--ds-font-weight-semibold)" : "normal",
            color: wordCount >= 1500 ? "var(--ds-text-success)" : "var(--ds-text-subtlest)",
          }}
        >
          {wordCount.toLocaleString()} words
        </span>
      </div>

      {error && (
        <SectionMessage appearance="error" title="Parse failed">{error}</SectionMessage>
      )}

      <Button
        appearance="primary"
        shouldFitContainer
        isDisabled={loading || wordCount < 100}
        onClick={handleParse}
      >
        {loading ? (
          <span style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
            <Spinner size="small" appearance="invert" /> Splitting into samples…
          </span>
        ) : "Extract voice samples →"}
      </Button>
    </div>
  );
}

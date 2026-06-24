"use client";

import { useState } from "react";
import type { GenerationHistoryItem } from "@/lib/types";
import { LinkedInPreview } from "@/components/generation/LinkedInPreview";
import { RefinementChat } from "@/components/generation/RefinementChat";
import { Lozenge, scoreToAppearance } from "@/components/ui/Lozenge";
import { Button } from "@/components/ui/Button";

type HistoryVariant = {
  content: string;
  variant_type: string;
  voice_match_score: number;
  word_count: number;
};

function HistoryVariantCard({
  variant,
  rank,
  generationId,
}: {
  variant: HistoryVariant;
  rank: number;
  generationId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(variant.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: "var(--ds-radius-200)",
        border: `1px solid ${refineOpen ? "var(--ds-border-brand)" : rank === 0 ? "var(--ds-border-brand)" : "var(--ds-border)"}`,
        overflow: "hidden",
        background: "var(--ds-surface)",
      }}
    >
      {/* Header - metadata only */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ds-space-075)",
          padding: "var(--ds-space-100) var(--ds-space-200)",
          borderBottom: `1px solid var(--ds-border)`,
          background: "var(--ds-background-neutral-subtle)",
        }}
      >
        <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Variant {variant.variant_type}
        </span>
        {rank === 0 && <Lozenge appearance="inprogress" isBold>Best match</Lozenge>}
        <Lozenge appearance={scoreToAppearance(variant.voice_match_score)}>
          {variant.voice_match_score}% match
        </Lozenge>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{variant.word_count}w</span>
      </div>

      {/* LinkedIn preview */}
      <div style={{ padding: "var(--ds-space-150)", background: "var(--ds-background-neutral-subtle)" }}>
        <LinkedInPreview content={variant.content} />
      </div>

      {/* Action footer - shown after reading the content */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px var(--ds-space-200)",
          borderTop: `1px solid var(--ds-border)`,
          background: "var(--ds-surface)",
        }}
      >
        <button
          onClick={() => setRefineOpen((o) => !o)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            fontSize: 13,
            fontWeight: 600,
            border: `1px solid ${refineOpen ? "var(--ds-border-brand)" : "var(--ds-border-brand)"}`,
            borderRadius: 6,
            background: refineOpen ? "var(--ds-background-brand-bold)" : "var(--ds-background-brand-subtle)",
            color: refineOpen ? "var(--ds-text-inverse)" : "var(--ds-text-brand)",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <span style={{ fontSize: 12 }}>✦</span>
          {refineOpen ? "Close refine" : "Refine with AI"}
        </button>
        <Button appearance="subtle" spacing="compact" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>

      {/* Inline refinement chat panel */}
      {refineOpen && (
        <RefinementChat
          generationId={generationId}
          initialContent={variant.content}
          initialScore={variant.voice_match_score}
          onClose={() => setRefineOpen(false)}
        />
      )}
    </div>
  );
}

export function HistoryItemCard({ gen }: { gen: GenerationHistoryItem }) {
  const [open, setOpen] = useState(false);

  const variants = (gen.variants ?? []) as HistoryVariant[];
  const sorted = [...variants].sort(
    (a, b) => (b.voice_match_score ?? 0) - (a.voice_match_score ?? 0)
  );
  const topScore = sorted[0]?.voice_match_score ?? 0;

  return (
    <div
      style={{
        background: "var(--ds-surface)",
        borderRadius: "var(--ds-radius-200)",
        border: `1px solid var(--ds-border)`,
        overflow: "hidden",
      }}
    >
      {/* Collapsed row */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          textAlign: "left",
          padding: "var(--ds-space-200)",
          background: "none",
          border: "none",
          cursor: "pointer",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ds-background-neutral-subtle)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ds-space-150)" }}>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {gen.input_text}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)", flexShrink: 0 }}>
            <Lozenge appearance={scoreToAppearance(topScore)}>{topScore}%</Lozenge>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{open ? "▲" : "▼"}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginTop: "var(--ds-space-100)" }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            {new Date(gen.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span style={{ color: "var(--ds-border)", fontSize: "var(--ds-font-size-075)" }}>·</span>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", textTransform: "capitalize" }}>{gen.input_type}</span>
          <span style={{ color: "var(--ds-border)", fontSize: "var(--ds-font-size-075)" }}>·</span>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{variants.length} variant{variants.length !== 1 ? "s" : ""}</span>
        </div>
      </button>

      {open && sorted.length > 0 && (
        <div
          style={{
            borderTop: `1px solid var(--ds-border)`,
            padding: "var(--ds-space-200)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-200)",
            background: "var(--ds-background-neutral-subtle)",
          }}
        >
          {sorted.map((v, i) => (
            <HistoryVariantCard
              key={`${v.variant_type}-${i}`}
              variant={v}
              rank={i}
              generationId={gen.id.toString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}

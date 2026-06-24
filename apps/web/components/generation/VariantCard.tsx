"use client";

import { useState, useEffect, useCallback } from "react";
import type { GenerationVariant, DimensionScores, InteractionEventPayload } from "@/lib/types";
import { editDistance } from "@/lib/editDistance";
import { LinkedInPreview } from "./LinkedInPreview";
import { Lozenge, scoreToAppearance } from "@/components/ui/Lozenge";
import { Button } from "@/components/ui/Button";
import { SectionMessage } from "@/components/ui/SectionMessage";

/* ── Voice dimension copy ──────────────────────────────────────────────────── */

const DIMENSION_COPY: Record<keyof DimensionScores, { good: string; bad: string }> = {
  hook_style:          { good: "Opens the way you typically do", bad: "Opening style differs from your pattern" },
  structural_pattern:  { good: "Follows your usual post structure", bad: "Structure doesn't match your typical flow" },
  vocabulary_register: { good: "Word choice feels like yours", bad: "Vocabulary register is off" },
  sentence_rhythm:     { good: "Sentence rhythm matches yours", bad: "Sentences are longer/shorter than your norm" },
  paragraph_structure: { good: "Paragraph breaks match your style", bad: "Paragraph format differs from yours" },
  cta_style:           { good: "Ending matches your usual close", bad: "Closing style differs from your pattern" },
};

function getVoiceReasons(scores: DimensionScores) {
  const matches: string[] = [];
  const gaps: string[] = [];
  (Object.keys(DIMENSION_COPY) as Array<keyof DimensionScores>).forEach((key) => {
    const pct = Math.round((scores[key] ?? 0) * 100);
    if (pct >= 75) matches.push(DIMENSION_COPY[key].good);
    else if (pct < 55) gaps.push(DIMENSION_COPY[key].bad);
  });
  return { matches: matches.slice(0, 3), gaps: gaps.slice(0, 2) };
}

/* ── LinkedIn algorithm signals ───────────────────────────────────────────── */

interface AlgoSignal { label: string; pass: boolean; tip: string }

function computeAlgoSignals(text: string): AlgoSignal[] {
  const words = text.trim().split(/\s+/);
  const wordCount = words.length;
  const paragraphs = text.trim().split(/\n\n+/);
  const firstLine = text.trim().split("\n")[0] ?? "";
  const firstLineWords = firstLine.split(/\s+/).length;
  const endsWithQuestion = /[?][\s"']*$/.test(text.trim());
  const avgParaLength = wordCount / Math.max(paragraphs.length, 1);
  const hasExternalLink = /https?:\/\//.test(text);
  const startsWithI = /^I\b/.test(firstLine.trim());

  return [
    {
      label: "Scroll-stopping hook",
      pass: firstLineWords <= 14 && !startsWithI,
      tip: firstLineWords > 14
        ? "First line is too long - trim to ≤14 words to stop the scroll."
        : startsWithI
        ? "Avoid starting with 'I'. Tension or insight hooks get more initial clicks."
        : "First line is punchy - good for scroll-stopping.",
    },
    {
      label: "Optimal length",
      pass: wordCount >= 150 && wordCount <= 350,
      tip: wordCount < 150
        ? "Too short - aim for 150–350 words for better algorithmic reach."
        : wordCount > 350
        ? "A bit long - posts over 350 words see lower reach. Consider tightening."
        : `${wordCount} words - within the ideal 150–350 range.`,
    },
    {
      label: "Readable paragraph breaks",
      pass: avgParaLength <= 50 && paragraphs.length >= 3,
      tip: avgParaLength > 50
        ? "Paragraphs are too dense - break into 1–3 sentence chunks."
        : "Good white space - easy to read on mobile.",
    },
    {
      label: "Engagement trigger",
      pass: endsWithQuestion,
      tip: endsWithQuestion
        ? "Ends with a question - invites comments which boost reach."
        : "Consider ending with a question to drive comments.",
    },
    {
      label: "No external links",
      pass: !hasExternalLink,
      tip: hasExternalLink
        ? "Contains a URL - LinkedIn suppresses posts with external links. Move to first comment."
        : "No external links - reach won't be suppressed.",
    },
  ];
}

/* ── Expandable section ────────────────────────────────────────────────────── */

function ExpandableSection({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: "var(--ds-radius-100)",
        overflow: "hidden",
        backgroundColor: "var(--ds-surface)",
      }}
    >
      <button
        onClick={() => setOpen((b) => !b)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--ds-space-100) var(--ds-space-150)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
            {label}
          </span>
          {badge}
        </div>
        <span style={{ color: "var(--ds-icon-subtle)", fontSize: "var(--ds-font-size-075)" }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div style={{ padding: "var(--ds-space-050) var(--ds-space-150) var(--ds-space-150)", borderTop: "1px solid var(--ds-border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ── AlgoSignalRow ─────────────────────────────────────────────────────────── */

function AlgoSignalRow({ signal }: { signal: AlgoSignal }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: "var(--ds-space-050) 0" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
        <span style={{ color: signal.pass ? "var(--ds-icon-success)" : "var(--ds-icon-warning)", fontSize: 14, flexShrink: 0 }}>
          {signal.pass ? "✓" : "⚠"}
        </span>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", flex: 1 }}>{signal.label}</span>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-icon-subtle)" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <p style={{ margin: "var(--ds-space-050) 0 0 22px", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>
          {signal.tip}
        </p>
      )}
    </button>
  );
}

/* ── Rejection reason tap ──────────────────────────────────────────────────── */

type RejectionReason = NonNullable<InteractionEventPayload["rejection_reason"]>;

const REJECTION_REASONS: { value: RejectionReason; label: string }[] = [
  { value: "not_my_voice", label: "Not my voice" },
  { value: "wrong_angle",  label: "Wrong angle"  },
  { value: "too_long",     label: "Too long"      },
  { value: "disagree",     label: "Disagree"      },
];

function ReasonPicker({
  onSelect,
  onSkip,
}: {
  onSelect: (reason: RejectionReason) => void;
  onSkip: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)", flexWrap: "wrap" }}>
      <span style={{
        fontSize: "var(--ds-font-size-075)",
        color: "var(--ds-text-subtle)",
        whiteSpace: "nowrap",
        marginRight: "var(--ds-space-025)",
      }}>
        Why regenerate?
      </span>
      {REJECTION_REASONS.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onSelect(value)}
          style={{
            padding: "2px var(--ds-space-075)",
            fontSize: "var(--ds-font-size-075)",
            border: "1px solid var(--ds-border)",
            borderRadius: "var(--ds-radius-100)",
            background: "var(--ds-surface)",
            color: "var(--ds-text)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            transition: "background 0.1s, border-color 0.1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--ds-background-neutral)";
            e.currentTarget.style.borderColor = "var(--ds-border-focused)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--ds-surface)";
            e.currentTarget.style.borderColor = "var(--ds-border)";
          }}
        >
          {label}
        </button>
      ))}
      <button
        onClick={onSkip}
        style={{
          padding: "2px var(--ds-space-075)",
          fontSize: "var(--ds-font-size-075)",
          border: "none",
          background: "none",
          color: "var(--ds-text-subtlest)",
          cursor: "pointer",
          textDecoration: "underline",
          whiteSpace: "nowrap",
        }}
      >
        Skip
      </button>
    </div>
  );
}

/* ── Main VariantCard ──────────────────────────────────────────────────────── */

interface VariantCardProps {
  variant: GenerationVariant & { originalIndex: number };
  generationId: string;
  rank: number;
  sessionId: string;
  shownAt: number;
  onInteract: () => void;
  onRegenerate?: (reason?: string) => void;
  regenerating?: boolean;
}

export function VariantCard({
  variant,
  generationId,
  rank,
  sessionId,
  shownAt,
  onInteract,
  onRegenerate,
  regenerating,
}: VariantCardProps) {
  const [content, setContent] = useState(variant.content);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [awaitingReason, setAwaitingReason] = useState(false);
  const originalContent = variant.content;

  const showRegeneratePrompt = variant.voice_match_score < 55;

  const sendEvent = useCallback(
    (extra: Partial<InteractionEventPayload>, isInteraction = true) => {
      fetch("/api/interaction/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation_id: generationId,
          session_id: sessionId,
          ...extra,
        }),
      }).catch(() => {});
      if (isInteraction) onInteract();
    },
    [generationId, sessionId, onInteract],
  );

  // Record that the user saw this variant (not an interaction signal - just instrumentation)
  useEffect(() => {
    sendEvent({ event_type: "variant_shown", variant_index: variant.originalIndex }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    const dist = editDistance(originalContent, content);
    const originalWords = originalContent.trim().split(/\s+/).length;
    const currentWords = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
    sendEvent({
      event_type: "copied",
      variant_index: variant.originalIndex,
      edit_distance_from_original: dist,
      word_count_delta: currentWords - originalWords,
      time_to_action_ms: Date.now() - shownAt,
    });
  };

  // First click → show reason picker; reason selection → fire event + regenerate
  const handleRegenerate = () => {
    setAwaitingReason(true);
  };

  const executeRegenerate = (reason?: RejectionReason) => {
    setAwaitingReason(false);
    sendEvent({
      event_type: "regenerated",
      variant_index: variant.originalIndex,
      rejection_reason: reason,
      time_to_action_ms: Date.now() - shownAt,
    });
    onRegenerate?.(reason);
  };

  const handleEditDone = () => {
    setEditing(false);
    if (content.trim() !== originalContent.trim()) {
      const dist = editDistance(originalContent, content);
      const originalWords = originalContent.trim().split(/\s+/).length;
      const currentWords = content.trim() === "" ? 0 : content.trim().split(/\s+/).length;
      sendEvent({
        event_type: "edited",
        variant_index: variant.originalIndex,
        edit_distance_from_original: dist,
        word_count_delta: currentWords - originalWords,
        time_to_action_ms: Date.now() - shownAt,
      });
      fetch("/api/generate/edit-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          generation_id: generationId,
          variant_index: variant.originalIndex,
          generated_content: originalContent,
          edited_content: content,
        }),
      }).catch(() => {});
    }
  };

  const voiceReasons = variant.dimension_scores ? getVoiceReasons(variant.dimension_scores) : null;
  const algoSignals = computeAlgoSignals(content);
  const algoPassing = algoSignals.filter((s) => s.pass).length;
  const scoreAppearance = scoreToAppearance(variant.voice_match_score);

  return (
    <div
      style={{
        borderRadius: "var(--ds-radius-200)",
        border: rank === 0
          ? "2px solid var(--ds-border-brand)"
          : "1px solid var(--ds-border)",
        backgroundColor: "var(--ds-surface)",
        overflow: "hidden",
        boxShadow: rank === 0 ? "var(--ds-shadow-raised)" : "none",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--ds-space-100) var(--ds-space-200)",
          borderBottom: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-surface-sunken)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Variant {variant.variant_type}
          </span>
          {rank === 0 && <Lozenge appearance="inprogress" isBold>Best match</Lozenge>}
          <Lozenge appearance={scoreAppearance} isBold>
            {variant.voice_match_score}% voice match
          </Lozenge>
        </div>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          {variant.word_count} words
        </span>
      </div>

      {/* Post preview */}
      <div style={{ padding: "var(--ds-space-200)" }}>
        <LinkedInPreview
          content={content}
          editing={editing}
          onContentChange={setContent}
        />
      </div>

      {/* Insight accordions */}
      <div style={{ padding: "0 var(--ds-space-200) var(--ds-space-100)", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
        {voiceReasons && (
          <ExpandableSection label="Why this sounds like you">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)", paddingTop: "var(--ds-space-100)" }}>
              {voiceReasons.matches.map((m) => (
                <div key={m} style={{ display: "flex", alignItems: "flex-start", gap: "var(--ds-space-100)" }}>
                  <span style={{ color: "var(--ds-icon-success)", marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)" }}>{m}</span>
                </div>
              ))}
              {voiceReasons.gaps.map((g) => (
                <div key={g} style={{ display: "flex", alignItems: "flex-start", gap: "var(--ds-space-100)" }}>
                  <span style={{ color: "var(--ds-icon-warning)", marginTop: 2, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{g}</span>
                </div>
              ))}
              {voiceReasons.matches.length === 0 && voiceReasons.gaps.length === 0 && (
                <p style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", margin: 0 }}>
                  Mid-range voice match - some dimensions align, others can improve.
                </p>
              )}
            </div>
          </ExpandableSection>
        )}

        <ExpandableSection
          label="Algorithm signals"
          badge={
            <Lozenge appearance={algoPassing >= 4 ? "success" : algoPassing >= 3 ? "moved" : "removed"}>
              {algoPassing}/{algoSignals.length} passing
            </Lozenge>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", paddingTop: "var(--ds-space-075)" }}>
            {algoSignals.map((s) => (
              <AlgoSignalRow key={s.label} signal={s} />
            ))}
          </div>
        </ExpandableSection>
      </div>

      {/* Low-score regenerate nudge */}
      {showRegeneratePrompt && onRegenerate && (
        <div style={{ margin: "0 var(--ds-space-200) var(--ds-space-150)" }}>
          <SectionMessage
            appearance="warning"
            title="Low voice match"
            actions={[{
              text: regenerating ? "Regenerating…" : "Regenerate",
              onClick: handleRegenerate,
            }]}
          >
            Voice match is low. Regenerating may produce a closer result.
          </SectionMessage>
        </div>
      )}

      {/* Action bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ds-space-100)",
          flexWrap: "wrap",
          padding: "var(--ds-space-100) var(--ds-space-200)",
          borderTop: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-surface-sunken)",
        }}
      >
        {editing ? (
          <>
            <Button appearance="primary" spacing="compact" onClick={handleEditDone}>
              Done
            </Button>
            <Button
              appearance="subtle"
              spacing="compact"
              onClick={() => { setContent(variant.content); setEditing(false); }}
            >
              Discard
            </Button>
          </>
        ) : regenerating ? (
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
            Regenerating…
          </span>
        ) : awaitingReason ? (
          <ReasonPicker
            onSelect={(reason) => executeRegenerate(reason)}
            onSkip={() => executeRegenerate()}
          />
        ) : (
          <>
            <Button appearance="default" spacing="compact" onClick={() => setEditing(true)}>Edit</Button>
            <Button appearance="default" spacing="compact" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </Button>
            {onRegenerate && !showRegeneratePrompt && (
              <Button appearance="default" spacing="compact" onClick={handleRegenerate}>
                Regenerate
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

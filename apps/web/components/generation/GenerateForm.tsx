"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { GenerationResponse, GenerationVariant, RegenerateVariantResponse } from "@/lib/types";
import { UpgradeModal } from "./UpgradeModal";
import { VariantCard } from "./VariantCard";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { Spinner } from "@/components/ui/Spinner";
import { SectionMessage } from "@/components/ui/SectionMessage";
import Heading from "@/components/ui/Heading";

interface LimitError {
  error: "limit_reached";
  limit: number;
  used: number;
  plan: string;
}

type ViewState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "result"; data: GenerationResponse; generationId: string }
  | { type: "error"; message: string }
  | { type: "limit_reached"; limitInfo: LimitError };

function fireAbandonedEvent(sessionId: string, generationId: string) {
  fetch("/api/interaction/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generation_id: generationId,
      session_id: sessionId,
      event_type: "abandoned",
    }),
  }).catch(() => {});
}

export function GenerateForm() {
  const searchParams = useSearchParams();
  const [idea, setIdea] = useState(searchParams.get("idea") ?? "");
  const [view, setView] = useState<ViewState>({ type: "idle" });
  const [variants, setVariants] = useState<(GenerationVariant & { originalIndex: number })[]>([]);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [shownAt, setShownAt] = useState<number>(0);
  // Accumulated rejection reasons this session - fed back into regeneration prompt
  const [sessionFeedback, setSessionFeedback] = useState<string[]>([]);
  // Ref so changes don't trigger re-renders - only read in event handlers
  const hasInteractedRef = useRef(false);

  const handleGenerate = async (overrideIdea?: string) => {
    const ideaToUse = overrideIdea ?? idea;
    if (!ideaToUse.trim() || ideaToUse.length < 10) return;
    setView({ type: "loading" });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: ideaToUse, input_type: "idea" }),
      });

      if (!res.ok) {
        const err = await res.json();
        const detail = err.detail;
        if (detail && typeof detail === "object" && detail.error === "limit_reached") {
          setView({ type: "limit_reached", limitInfo: detail as LimitError });
          return;
        }
        throw new Error(typeof detail === "string" ? detail : "Generation failed");
      }

      const data: GenerationResponse = await res.json();
      const sorted = [...data.variants]
        .map((v, i) => ({ ...v, originalIndex: i }))
        .sort((a, b) => b.voice_match_score - a.voice_match_score);
      setVariants(sorted);
      setView({ type: "result", data, generationId: data.generation_id });

      // Reset session tracking for this new generate→interact session
      setSessionId(crypto.randomUUID());
      setShownAt(Date.now());
      setSessionFeedback([]);
      hasInteractedRef.current = false;
    } catch (err) {
      setView({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  };

  useEffect(() => {
    const prefilledIdea = searchParams.get("idea");
    if (prefilledIdea && prefilledIdea.trim().length >= 10) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleGenerate(prefilledIdea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerate = async (originalIndex: number, reason?: string) => {
    if (view.type !== "result") return;

    // Accumulate reason for subsequent regenerations in this session
    const newFeedback = reason ? [...sessionFeedback, reason] : sessionFeedback;
    if (reason) setSessionFeedback(newFeedback);

    setRegeneratingIndex(originalIndex);
    try {
      const res = await fetch(`/api/generate/${view.generationId}/regenerate-variant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variant_index: originalIndex,
          session_feedback: newFeedback,
        }),
      });
      if (!res.ok) return;
      const data: RegenerateVariantResponse = await res.json();
      setVariants((prev) =>
        prev.map((v) =>
          v.originalIndex === originalIndex ? { ...data.variant, originalIndex } : v
        )
      );
    } catch {
      // Non-blocking
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleReset = () => {
    // If the user generated and walked away without any interaction, record it
    if (view.type === "result" && !hasInteractedRef.current && sessionId) {
      fireAbandonedEvent(sessionId, view.generationId);
    }
    setIdea("");
    setVariants([]);
    setView({ type: "idle" });
  };

  /* ── Upgrade gate ─────────────────────────────────────────────────────── */
  if (view.type === "limit_reached") {
    return (
      <UpgradeModal
        plan={view.limitInfo.plan}
        used={view.limitInfo.used}
        limit={view.limitInfo.limit}
        action="generation"
        onClose={() => setView({ type: "idle" })}
      />
    );
  }

  /* ── Loading state ────────────────────────────────────────────────────── */
  if (view.type === "loading") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ds-space-800) var(--ds-space-300)", gap: "var(--ds-space-200)" }}
      >
        <Spinner size="large" label="Generating variants" />
        <p style={{ color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)", margin: 0, textAlign: "center" }}>
          Generating 3 variants and scoring against your voice…
        </p>
        <p style={{ color: "var(--ds-text-subtlest)", fontSize: "var(--ds-font-size-075)", margin: 0 }}>
          ~15 seconds
        </p>
      </div>
    );
  }

  /* ── Result state ─────────────────────────────────────────────────────── */
  if (view.type === "result") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <Heading size="medium" as="h2">Your posts</Heading>
            <p style={{ color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)", margin: "var(--ds-space-025) 0 0" }}>
              Sorted by voice match. Edit inline, then copy when ready.
            </p>
          </div>
          <Button appearance="default" spacing="compact" onClick={handleReset}>
            Generate new
          </Button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
          {variants.map((v, i) => (
            <VariantCard
              key={`${v.variant_type}-${v.originalIndex}`}
              variant={v}
              generationId={view.generationId}
              rank={i}
              sessionId={sessionId}
              shownAt={shownAt}
              onInteract={() => { hasInteractedRef.current = true; }}
              onRegenerate={(reason) => handleRegenerate(v.originalIndex, reason)}
              regenerating={regeneratingIndex === v.originalIndex}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Idle / input state ───────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
      {view.type === "error" && (
        <SectionMessage appearance="error" title="Generation failed">
          {view.message}
        </SectionMessage>
      )}

      <div
        style={{
          backgroundColor: "var(--ds-surface)",
          border: "1px solid var(--ds-border)",
          borderRadius: "var(--ds-radius-200)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "var(--ds-space-200)" }}>
          <TextArea
            label="What do you want to post about?"
            placeholder="Describe your idea, observation, story, or lesson. The more specific the better."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            maxLength={2000}
            minimumRows={3}
            resize="none"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--ds-space-100) var(--ds-space-200)",
            borderTop: "1px solid var(--ds-border)",
            backgroundColor: "var(--ds-surface-sunken)",
          }}
        >
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            {idea.length}/2000
          </span>
          {idea.length >= 10 && (
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              3 variants scored against your voice
            </span>
          )}
        </div>
      </div>

      <Button
        appearance="primary"
        isDisabled={idea.length < 10}
        onClick={() => handleGenerate()}
        shouldFitContainer
      >
        Generate 3 variants
      </Button>
    </div>
  );
}

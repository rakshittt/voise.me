"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { GenerationResponse } from "@/lib/types";
import { UpgradeModal } from "@/components/generation/UpgradeModal";
import { VariantCard } from "@/components/generation/VariantCard";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Spinner } from "@/components/ui/Spinner";
import { Lozenge } from "@/components/ui/Lozenge";
import Heading from "@/components/ui/Heading";
import { StepIndicator } from "./StepIndicator";
import { getToolHandoff, clearToolHandoff } from "@/lib/toolHandoff";

const TOOL_LABELS: Record<string, string> = {
  write: "Post Writer",
  "hook-checker": "Hook Checker",
  "post-checker": "Post Health Checker",
  "character-counter": "Character Counter",
  audit: "Voice Audit",
};

function computeInitialIdea(): { value: string; source: string | null } {
  if (typeof window === "undefined") return { value: DEFAULT_EXAMPLE, source: null };
  const handoff = getToolHandoff();
  if (handoff?.kind === "idea" && handoff.content.trim()) {
    return { value: handoff.content, source: handoff.source };
  }
  const useCase = localStorage.getItem("voise_use_case") ?? "default";
  return { value: USE_CASE_EXAMPLES[useCase] ?? DEFAULT_EXAMPLE, source: null };
}

const USE_CASE_EXAMPLES: Record<string, string> = {
  founder:
    "The counterintuitive thing about building a company is that the biggest risk isn't running out of money - it's building the wrong thing. Here's what I wish I'd known earlier.",
  consultant:
    "I've worked with 30+ companies over the last 5 years and noticed a pattern that separates the ones that scale from the ones that stay stuck. It comes down to one thing most consultants won't tell you.",
  executive:
    "Most leaders talk about building a strong culture, but they confuse culture with perks. Culture isn't the free lunches or the ping-pong table. Here's what it actually is.",
  creator:
    "The best framework I've ever found for turning complex ideas into clear content - and it takes under 10 minutes to apply. I use it for everything I write.",
};

const DEFAULT_EXAMPLE =
  "One thing I've learned the hard way that changed how I approach everything in my work. I wish someone had told me this earlier.";

interface LimitError {
  error: "limit_reached";
  limit: number;
  used: number;
  plan: string;
}

type ViewState =
  | { type: "idle"; prefilled: string }
  | { type: "loading" }
  | { type: "result"; data: GenerationResponse; generationId: string }
  | { type: "error"; message: string }
  | { type: "limit_reached"; limitInfo: LimitError };

export function FirstGenStep() {
  const router = useRouter();
  const [idea, setIdea] = useState(() => computeInitialIdea().value);
  const [view, setView] = useState<ViewState>(() => ({ type: "idle", prefilled: computeInitialIdea().value }));
  const [handoffSource] = useState<string | null>(() => computeInitialIdea().source);
  const [sessionId, setSessionId] = useState<string>("");
  const [shownAt, setShownAt] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem("voise_onboarding_step", "4");
    clearToolHandoff();
  }, []);

  const handleGenerate = async () => {
    if (idea.trim().length < 10) return;
    setView({ type: "loading" });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input_text: idea, input_type: "idea" }),
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
      localStorage.removeItem("voise_onboarding_step");
      setSessionId(crypto.randomUUID());
      setShownAt(Date.now());
      setView({ type: "result", data, generationId: data.generation_id });
    } catch (err) {
      setView({
        type: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  if (view.type === "limit_reached") {
    return (
      <UpgradeModal
        plan={view.limitInfo.plan}
        used={view.limitInfo.used}
        limit={view.limitInfo.limit}
        action="generation"
        onClose={() => setView({ type: "idle", prefilled: idea })}
      />
    );
  }

  if (view.type === "loading") {
    return (
      <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ds-space-800) 0", gap: "var(--ds-space-200)" }}>
        <Spinner size="large" />
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Writing your first post in your voice…
        </p>
      </div>
    );
  }

  if (view.type === "result") {
    const sorted = [...view.data.variants]
      .map((v, i) => ({ ...v, originalIndex: i }))
      .sort((a, b) => b.voice_match_score - a.voice_match_score);

    return (
      <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          <div style={{ marginBottom: "var(--ds-space-050)" }}>
            <Lozenge appearance="success" isBold>Your Voice DNA is working</Lozenge>
          </div>
          <Heading size="xlarge" as="h1">Your first generated post</Heading>
          <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
            Each variant is scored against your voice fingerprint. The best match is shown first.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
          {sorted.map((v, i) => (
            <VariantCard
              key={v.variant_type}
              variant={v}
              generationId={view.generationId}
              rank={i}
              sessionId={sessionId}
              shownAt={shownAt}
              onInteract={() => {}}
            />
          ))}
        </div>

        <Button appearance="primary" shouldFitContainer onClick={() => router.push("/dashboard")}>
          Go to dashboard →
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
        <StepIndicator current={4} total={4} />
        <Heading size="xlarge" as="h1">Generate your first post</Heading>
        {handoffSource ? (
          <div>
            <Lozenge appearance="inprogress">
              Picked up from {TOOL_LABELS[handoffSource] ?? "the tool"} you just used
            </Lozenge>
          </div>
        ) : (
          <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
            We&apos;ve pre-filled an idea based on your use case. Edit it or use it as-is.
          </p>
        )}
      </div>

      {view.type === "error" && (
        <SectionMessage appearance="error" title="Generation failed">
          {view.message}
        </SectionMessage>
      )}

      <div
        style={{
          background: "var(--ds-surface)",
          borderRadius: "var(--ds-radius-200)",
          border: `1px solid var(--ds-border)`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)" }}>
          <TextArea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            minimumRows={5}
            resize="vertical"
            maxLength={2000}
          />
        </div>
        <div style={{ borderTop: `1px solid var(--ds-border)`, padding: "var(--ds-space-075) var(--ds-space-200)", background: "var(--ds-background-neutral-subtle)" }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{idea.length}/2000</span>
        </div>
      </div>

      <Button
        appearance="primary"
        shouldFitContainer
        isDisabled={idea.trim().length < 10}
        onClick={handleGenerate}
      >
        Generate 3 variants →
      </Button>

      <button
        onClick={() => router.push("/dashboard")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--ds-text-subtlest)",
          fontSize: "var(--ds-font-size-075)",
          padding: "var(--ds-space-050) 0",
          textDecoration: "underline",
          textUnderlineOffset: 3,
          alignSelf: "center",
        }}
      >
        Skip for now
      </button>
    </div>
  );
}

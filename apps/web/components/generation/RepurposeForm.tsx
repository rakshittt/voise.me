"use client";

import { useState } from "react";
import type { RepurposeResponse } from "@/lib/types";
import { notifyTrialExtended } from "@/lib/trialEvents";
import { UpgradeModal } from "./UpgradeModal";
import { RefinementChat } from "./RefinementChat";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";
import { scoreToAppearance } from "@/components/ui/Lozenge";
import { Card } from "@/components/ui/Card";
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
  | { type: "result"; data: RepurposeResponse }
  | { type: "error"; message: string }
  | { type: "limit_reached"; limitInfo: LimitError };

export function RepurposeForm() {
  const [source, setSource] = useState("");
  const [view, setView] = useState<ViewState>({ type: "idle" });
  const [editedContent, setEditedContent] = useState("");
  const [displayScore, setDisplayScore] = useState(0);
  const [refineOpen, setRefineOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [published, setPublished] = useState(false);

  const handleRepurpose = async () => {
    if (source.trim().length < 50) return;
    setView({ type: "loading" });

    try {
      const res = await fetch("/api/generate/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_text: source }),
      });

      if (!res.ok) {
        const err = await res.json();
        const detail = err.detail;
        if (detail && typeof detail === "object" && detail.error === "limit_reached") {
          setView({ type: "limit_reached", limitInfo: detail as LimitError });
          return;
        }
        throw new Error(typeof detail === "string" ? detail : "Repurpose failed");
      }

      const data: RepurposeResponse = await res.json();
      setEditedContent(data.content);
      setDisplayScore(data.voice_match_score);
      setRefineOpen(false);
      setView({ type: "result", data });
      if (data.trial_extended) notifyTrialExtended();
    } catch (err) {
      setView({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(editedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
    if (view.type !== "result") return;
    try {
      await fetch(`/api/generate/${view.data.generation_id}/published`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant_index: 0 }),
      });
      setPublished(true);
    } catch {
      // Non-blocking
    }
  };

  if (view.type === "limit_reached") {
    return (
      <UpgradeModal
        plan={view.limitInfo.plan}
        used={view.limitInfo.used}
        limit={view.limitInfo.limit}
        action="repurpose"
        onClose={() => setView({ type: "idle" })}
      />
    );
  }

  if (view.type === "loading") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ds-space-800) 0", gap: "var(--ds-space-200)" }}>
        <Spinner size="large" />
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Extracting key insight and writing in your voice…
        </p>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>~10 seconds</p>
      </div>
    );
  }

  if (view.type === "result") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <Heading size="medium" as="h2">Repurposed post</Heading>
            <div style={{ marginTop: "var(--ds-space-050)" }}>
              <Lozenge appearance={scoreToAppearance(displayScore)} isBold>
                {displayScore}% voice match
              </Lozenge>
            </div>
          </div>
          <Button
            appearance="default"
            onClick={() => { setView({ type: "idle" }); setSource(""); setPublished(false); setRefineOpen(false); }}
          >
            Repurpose another
          </Button>
        </div>

        <Card elevation="raised" padding="none">
          <div style={{ padding: "var(--ds-space-200)" }}>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", whiteSpace: "pre-wrap", lineHeight: "var(--ds-line-height-300)" }}>
              {editedContent}
            </p>
          </div>
          <div
            style={{
              borderTop: `1px solid var(--ds-border)`,
              padding: "var(--ds-space-100) var(--ds-space-200)",
              display: "flex",
              alignItems: "center",
              gap: "var(--ds-space-100)",
              background: "var(--ds-background-neutral-subtle)",
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
                border: `1px solid var(--ds-border-brand)`,
                borderRadius: 6,
                background: refineOpen ? "var(--ds-background-brand-bold)" : "var(--ds-background-brand-subtle)",
                color: refineOpen ? "var(--ds-text-inverse)" : "var(--ds-text-brand)",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              <span style={{ fontSize: 12 }}>✦</span>
              {refineOpen ? "Close" : "Edit with AI"}
            </button>
            <Button appearance="subtle" spacing="compact" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</Button>
            <div style={{ marginLeft: "auto" }}>
              {!published ? (
                <Button appearance="primary" spacing="compact" onClick={handlePublish}>Mark published</Button>
              ) : (
                <Lozenge appearance="success" isBold>Published</Lozenge>
              )}
            </div>
          </div>

          {refineOpen && (
            <RefinementChat
              generationId={view.data.generation_id}
              initialContent={editedContent}
              initialScore={displayScore}
              onClose={() => setRefineOpen(false)}
              onApply={(content, score) => {
                setEditedContent(content);
                setDisplayScore(score);
              }}
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      {view.type === "error" && (
        <SectionMessage appearance="error" title="Repurpose failed">
          {view.message}
        </SectionMessage>
      )}

      <Card elevation="flat" padding="none">
        <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)" }}>
          <TextArea
            label="Paste your content here"
            placeholder="Paste a blog post, article, newsletter, or transcript. We extract the key insight and rewrite it as a LinkedIn post in your voice. Works best with 300–5,000 words."
            value={source}
            onChange={(e) => setSource(e.target.value)}
            minimumRows={14}
            maxLength={10000}
          />
        </div>
        <div
          style={{
            borderTop: `1px solid var(--ds-border)`,
            padding: "var(--ds-space-075) var(--ds-space-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--ds-background-neutral-subtle)",
          }}
        >
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{source.length}/10,000</span>
          {source.length >= 50 && (
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>Ready to repurpose</span>
          )}
        </div>
      </Card>

      <Button
        appearance="primary"
        shouldFitContainer
        isDisabled={source.trim().length < 50}
        onClick={handleRepurpose}
      >
        Repurpose into LinkedIn post
      </Button>
    </div>
  );
}

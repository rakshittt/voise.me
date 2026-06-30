"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { Card } from "@/components/ui/Card";
import { Lozenge, scoreToAppearance } from "@/components/ui/Lozenge";
import { PublicToolCTA } from "@/components/marketing/PublicToolCTA";
import { checkPostHealth, type PostHealthResult, type PostHealthSeverity } from "@/lib/postHealthChecker";

const SEVERITY_ICON: Record<PostHealthSeverity, string> = {
  pass: "✅",
  warn: "⚠️",
  fail: "🚫",
};

const SEVERITY_BG: Record<PostHealthSeverity, string> = {
  pass: "var(--ds-background-success-subtle, var(--ds-background-neutral-subtle))",
  warn: "var(--ds-background-warning-subtle, var(--ds-background-neutral-subtle))",
  fail: "var(--ds-background-danger-subtle, var(--ds-background-neutral-subtle))",
};

function ResultDisplay({ result, post, onReset }: { result: PostHealthResult; post: string; onReset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <Card elevation="raised" padding="default">
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          <div style={{ fontSize: "var(--ds-font-size-700)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{result.score}</div>
          <div>
            <Lozenge appearance={scoreToAppearance(result.score)} isBold>
              {result.rating === "strong" ? "Looks healthy" : result.rating === "fair" ? "A few flags" : "Several risk flags"}
            </Lozenge>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
        {result.checks.map((c) => (
          <div
            key={c.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--ds-space-150)",
              padding: "var(--ds-space-150)",
              borderRadius: "var(--ds-radius-100)",
              background: SEVERITY_BG[c.severity],
            }}
          >
            <span style={{ fontSize: "var(--ds-font-size-200)", lineHeight: 1, flexShrink: 0 }}>{SEVERITY_ICON[c.severity]}</span>
            <div>
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{c.label}</p>
              <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{c.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <PublicToolCTA
        handoffContent={post}
        handoffSource="post-checker"
        handoffKind="idea"
        primaryLabel="Fix this in my voice →"
      />

      <Button appearance="subtle" shouldFitContainer onClick={onReset}>
        Check another post
      </Button>
    </div>
  );
}

export function PostHealthTool() {
  const [post, setPost] = useState("");
  const [result, setResult] = useState<PostHealthResult | null>(null);

  if (result) {
    return <ResultDisplay result={result} post={post} onReset={() => setResult(null)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <Card elevation="flat" padding="none">
        <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)" }}>
          <TextArea
            label="Paste your full post"
            placeholder="We'll check for common reach-killers: early links, hashtag overload, wall-of-text formatting, engagement bait, and more."
            value={post}
            onChange={(e) => setPost(e.target.value)}
            minimumRows={10}
          />
        </div>
      </Card>

      <Button appearance="primary" shouldFitContainer isDisabled={post.trim().length < 10} onClick={() => setResult(checkPostHealth(post))}>
        Check my post →
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { Card } from "@/components/ui/Card";
import { Lozenge, scoreToAppearance } from "@/components/ui/Lozenge";
import { PublicToolCTA } from "@/components/marketing/PublicToolCTA";
import { checkHook, type HookCheckResult } from "@/lib/hookChecker";

function CheckRow({ check }: { check: HookCheckResult["checks"][number] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--ds-space-150)",
        padding: "var(--ds-space-150)",
        borderRadius: "var(--ds-radius-100)",
        background: check.passed ? "var(--ds-background-success-subtle, var(--ds-background-neutral-subtle))" : "var(--ds-background-warning-subtle, var(--ds-background-neutral-subtle))",
      }}
    >
      <span style={{ fontSize: "var(--ds-font-size-200)", lineHeight: 1, flexShrink: 0 }}>{check.passed ? "✅" : "⚠️"}</span>
      <div>
        <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{check.label}</p>
        {check.detail && (
          <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{check.detail}</p>
        )}
      </div>
    </div>
  );
}

function ResultDisplay({ result, post, onReset }: { result: HookCheckResult; post: string; onReset: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <Card elevation="raised" padding="default">
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
          <div style={{ fontSize: "var(--ds-font-size-700)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{result.score}</div>
          <div>
            <Lozenge appearance={scoreToAppearance(result.score)} isBold>
              {result.rating === "strong" ? "Strong hook" : result.rating === "fair" ? "Could be stronger" : "Needs work"}
            </Lozenge>
          </div>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", fontStyle: "italic" }}>
            &ldquo;{result.hook}&rdquo;
          </p>
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
        {result.checks.map((c) => (
          <CheckRow key={c.id} check={c} />
        ))}
      </div>

      <PublicToolCTA
        title="Want every line scored, not just the hook?"
        body="Voise scores full posts against your personal voice fingerprint across 11 dimensions - hook, structure, rhythm, and more."
        handoffContent={post}
        handoffSource="hook-checker"
        handoffKind="idea"
        primaryLabel="Rewrite this in my voice →"
      />

      <Button appearance="subtle" shouldFitContainer onClick={onReset}>
        Check another hook
      </Button>
    </div>
  );
}

export function HookCheckerTool() {
  const [post, setPost] = useState("");
  const [result, setResult] = useState<HookCheckResult | null>(null);

  if (result) {
    return <ResultDisplay result={result} post={post} onReset={() => setResult(null)} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <Card elevation="flat" padding="none">
        <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)" }}>
          <TextArea
            label="Paste your post (or just the opening lines)"
            placeholder="Paste your full post. We'll check your first line - the part that decides whether someone clicks &quot;see more.&quot;"
            value={post}
            onChange={(e) => setPost(e.target.value)}
            minimumRows={8}
          />
        </div>
      </Card>

      <Button appearance="primary" shouldFitContainer isDisabled={post.trim().length < 5} onClick={() => setResult(checkHook(post))}>
        Check my hook →
      </Button>
    </div>
  );
}

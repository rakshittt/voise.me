"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";

interface AuditResult {
  hook_distribution: Record<string, number>;
  structural_pattern: { dominant?: string; frequency?: number; alternatives?: Array<{ pattern: string; frequency: number }> };
  vocabulary_register: { formality_score?: number; jargon_density?: number; avg_word_length?: number };
  post_count: number;
}

const HOOK_LABELS: Record<string, string> = {
  bold_statement: "Bold declaration",
  question: "Opens with a question",
  story: "Personal story / scene",
  contrarian: "Contrarian take",
  data_point: "Statistic or number",
  direct_address: "Direct address to reader",
};

const PATTERN_LABELS: Record<string, string> = {
  problem_insight_proof: "Problem → Insight → Proof",
  story_lesson: "Story → Lesson",
  list_format: "Structured list",
  contrarian_claim_evidence: "Contrarian claim + evidence",
  how_to: "Step-by-step how-to",
  observation_question: "Observation + question",
};

function BarChart({ data }: { data: Record<string, number> }) {
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  const max = sorted[0]?.[1] ?? 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
      {sorted.map(([key, value]) => {
        const pct = Math.round(value * 100);
        const barWidth = Math.round((value / max) * 100);
        const label = HOOK_LABELS[key] ?? key.replace(/_/g, " ");
        return (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-025)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", textTransform: "capitalize" }}>{label}</span>
              <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)" }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: "var(--ds-background-neutral)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--ds-background-brand-bold)", borderRadius: "var(--ds-radius-200)", transition: "width 0.7s", width: `${barWidth}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultDisplay({ result }: { result: AuditResult }) {
  const dominantHook = Object.entries(result.hook_distribution).sort(([, a], [, b]) => b - a)[0]?.[0];
  const dominantPattern = result.structural_pattern.dominant;
  const formality = result.vocabulary_register.formality_score ?? 0.5;
  const formalityLabel = formality > 0.6 ? "Formal" : formality < 0.3 ? "Casual" : "Conversational";
  const jargon = (result.vocabulary_register.jargon_density ?? 0) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ marginBottom: "var(--ds-space-200)" }}>
          <Lozenge appearance="success" isBold>Analysis complete - {result.post_count} posts analyzed</Lozenge>
        </div>
        <h2 style={{ margin: "0 0 var(--ds-space-075)", fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>Your Voice Snapshot</h2>
        <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
          3 of 7 dimensions shown. Build your full Voice DNA to get the complete picture.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
        {/* Hook Distribution */}
        <Card elevation="raised" padding="default">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--ds-space-200)" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Hook Style</p>
              <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>How you open your posts</p>
            </div>
            {dominantHook && <Lozenge appearance="inprogress">{HOOK_LABELS[dominantHook] ?? dominantHook}</Lozenge>}
          </div>
          <BarChart data={result.hook_distribution} />
        </Card>

        {/* Structural Pattern */}
        <Card elevation="raised" padding="default">
          <p style={{ margin: "0 0 var(--ds-space-025)", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Post Structure</p>
          <p style={{ margin: "0 0 var(--ds-space-200)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>How you build your arguments</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
            {dominantPattern && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--ds-space-100) var(--ds-space-150)", background: "var(--ds-background-brand-subtle)", borderRadius: "var(--ds-radius-100)", border: `1px solid var(--ds-border-brand)` }}>
                <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)" }}>Dominant</span>
                <span style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-brand)" }}>
                  {PATTERN_LABELS[dominantPattern] ?? dominantPattern.replace(/_/g, " ")}
                </span>
              </div>
            )}
            {(result.structural_pattern.alternatives ?? []).slice(0, 2).map((alt) => (
              <div key={alt.pattern} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--ds-space-100) var(--ds-space-150)", background: "var(--ds-background-neutral-subtle)", borderRadius: "var(--ds-radius-100)" }}>
                <span style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>{Math.round(alt.frequency * 100)}%</span>
                <span style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{PATTERN_LABELS[alt.pattern] ?? alt.pattern.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Vocabulary Register */}
        <Card elevation="raised" padding="default">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--ds-space-200)" }}>
            <div>
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Vocabulary Register</p>
              <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>Tone and language complexity</p>
            </div>
            <Lozenge appearance="default">{formalityLabel}</Lozenge>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ds-space-150)" }}>
            <div style={{ padding: "var(--ds-space-150)", background: "var(--ds-background-neutral-subtle)", borderRadius: "var(--ds-radius-100)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{Math.round(formality * 100)}</div>
              <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", marginTop: "var(--ds-space-025)" }}>Formality score</div>
              <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>(out of 100)</div>
            </div>
            <div style={{ padding: "var(--ds-space-150)", background: "var(--ds-background-neutral-subtle)", borderRadius: "var(--ds-radius-100)", textAlign: "center" }}>
              <div style={{ fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{Math.round(jargon)}%</div>
              <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", marginTop: "var(--ds-space-025)" }}>Jargon density</div>
              <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>industry terms</div>
            </div>
          </div>
        </Card>
      </div>

      {/* CTA */}
      <div style={{ backgroundColor: "var(--ds-background-brand-bold)", borderRadius: "var(--ds-radius-300)", padding: "var(--ds-space-400)", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
        <h3 style={{ margin: 0, fontWeight: "var(--ds-font-weight-bold)", fontSize: "var(--ds-font-size-300)", color: "var(--ds-text-inverse)" }}>Get your full Voice DNA</h3>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "var(--ds-font-size-100)" }}>
          This is 3 of 7 dimensions. Sign up to analyze sentence rhythm, paragraph structure, CTA style, and emotional register - and generate posts scored against all 7.
        </p>
        <div style={{ display: "flex", gap: "var(--ds-space-150)", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/sign-up"
            style={{ padding: "var(--ds-space-100) var(--ds-space-250)", background: "var(--ds-surface)", color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)", borderRadius: "var(--ds-radius-100)", fontSize: "var(--ds-font-size-100)", textDecoration: "none" }}
          >
            Build your full profile - free →
          </Link>
          <Link
            href="/sign-in"
            style={{ padding: "var(--ds-space-100) var(--ds-space-250)", border: "1px solid rgba(255,255,255,0.4)", color: "var(--ds-text-inverse)", fontWeight: "var(--ds-font-weight-semibold)", borderRadius: "var(--ds-radius-100)", fontSize: "var(--ds-font-size-100)", textDecoration: "none" }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AuditTool() {
  const [posts, setPosts] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const postCount = posts.trim()
    ? posts
        .replace(/\r\n/g, "\n")
        .split(/\n---+\n|\n{2,}/)
        .filter((p) => p.trim().split(/\s+/).filter(Boolean).length >= 30).length
    : 0;

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail ?? "Analysis failed");
      }
      const data: AuditResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "var(--ds-space-800) 0", gap: "var(--ds-space-200)" }}>
        <Spinner size="large" />
        <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>Analyzing your voice…</p>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>~10 seconds</p>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
        <ResultDisplay result={result} />
        <Button appearance="subtle" shouldFitContainer onClick={() => { setResult(null); setPosts(""); }}>
          Analyze different posts
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      {error && (
        <SectionMessage appearance="error" title="Analysis failed">{error}</SectionMessage>
      )}

      <Card elevation="flat" padding="none">
        <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)" }}>
          <TextArea
            label="Paste 5–20 of your LinkedIn posts"
            placeholder={"Separate each post with a blank line or ---\n\nMinimum 3 posts, 30 words each."}
            value={posts}
            onChange={(e) => setPosts(e.target.value)}
            minimumRows={10}
          />
        </div>
        <div style={{ borderTop: `1px solid var(--ds-border)`, padding: "var(--ds-space-075) var(--ds-space-200)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--ds-background-neutral-subtle)" }}>
          <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: postCount >= 3 ? "var(--ds-text-success)" : "var(--ds-text-subtlest)" }}>
            {postCount} valid posts detected
          </span>
          {postCount < 3 && <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>need at least 3</span>}
        </div>
      </Card>

      <Button
        appearance="primary"
        shouldFitContainer
        isDisabled={postCount < 3}
        onClick={handleAnalyze}
      >
        Analyze my voice →
      </Button>
    </div>
  );
}

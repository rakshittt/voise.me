"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CardBasedPostInput } from "./CardBasedPostInput";
import { LinkedInExportUpload } from "./LinkedInExportUpload";
import { PdfUploadInput } from "./PdfUploadInput";
import { TextSourceInput } from "./TextSourceInput";
import { UrlImportInput } from "./UrlImportInput";
import { Button } from "@/components/ui/Button";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import Heading from "@/components/ui/Heading";
import { Card } from "@/components/ui/Card";

type Mode = "select" | "export" | "manual" | "text_paste" | "transcript" | "url_import" | "pdf";

interface BuildStatus {
  status: "not_started" | "building" | "ready" | "failed";
  post_count?: number;
}

function IconLinkedIn() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
      <path d="M16 3h5v5" /><path d="M10 14L21 3" />
    </svg>
  );
}
function IconPaste() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
function IconGlobe() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8" />
      <path d="M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}
function IconPdf() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13h1.5a1.5 1.5 0 010 3H9v-3zM16 13v3M14 13h2" />
    </svg>
  );
}
function IconEdit() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

const SOURCE_OPTIONS: {
  id: Mode;
  Icon: () => React.ReactElement;
  title: string;
  description: string;
  badge?: string;
  meta: string;
}[] = [
  {
    id: "export",
    Icon: IconLinkedIn,
    title: "LinkedIn Export",
    description: "Upload your LinkedIn data export to import all your posts at once.",
    badge: "Recommended",
    meta: "Typically 50–200 posts",
  },
  {
    id: "text_paste",
    Icon: IconPaste,
    title: "Paste writing",
    description: "Paste newsletters, articles, essays, or any writing in one block.",
    meta: "Best for bloggers & writers",
  },
  {
    id: "url_import",
    Icon: IconGlobe,
    title: "Blog / Article URL",
    description: "Paste a URL - we'll fetch and extract the text automatically.",
    meta: "Medium, Substack, personal blogs",
  },
  {
    id: "transcript",
    Icon: IconMic,
    title: "Transcript",
    description: "Paste a video or podcast transcript to capture your spoken voice.",
    meta: "Supports speaker-turn format",
  },
  {
    id: "pdf",
    Icon: IconPdf,
    title: "Upload PDF",
    description: "Upload an e-book, essay, or exported article as a PDF file.",
    meta: "Text-layer PDFs · Max 20 MB",
  },
  {
    id: "manual",
    Icon: IconEdit,
    title: "Add one at a time",
    description: "Paste individual posts one by one with a preview before building.",
    meta: "Good for fewer than 20 posts",
  },
];

const PROGRESS_STEPS = [
  { threshold: 15, label: "Parsing your writing samples" },
  { threshold: 35, label: "Generating semantic embeddings" },
  { threshold: 60, label: "Extracting 11 voice dimensions" },
  { threshold: 85, label: "Building your fingerprint" },
];

const INSIGHT_MESSAGES = [
  "Reading your hook patterns…",
  "Mapping your sentence rhythm…",
  "Profiling your vocabulary register…",
  "Identifying your argument structures…",
  "Detecting your emotional tone…",
  "Spotting your signature phrases…",
  "Analysing your CTA style…",
  "Calibrating your epistemic voice…",
  "Measuring lexical diversity…",
  "Cross-referencing your belief stances…",
  "Almost done - finalising your fingerprint…",
];

export function BuildProfileForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("select");
  const [postCount, setPostCount] = useState(0);
  const [polling, setPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [insightIdx, setInsightIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insightRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (insightRef.current) {
      clearInterval(insightRef.current);
      insightRef.current = null;
    }
  }, []);

  const startPolling = useCallback(
    (count: number) => {
      setPolling(true);
      setPostCount(count);
      setProgress(10);
      setInsightIdx(0);
      insightRef.current = setInterval(() => {
        setInsightIdx((i) => (i + 1) % INSIGHT_MESSAGES.length);
      }, 2200);

      pollRef.current = setInterval(async () => {
        setProgress((p) => Math.min(p + Math.random() * 6, 90));
        try {
          const res = await fetch("/api/voice-profile/status");
          const data: BuildStatus = await res.json();
          if (data.status === "ready") {
            setProgress(100);
            stopPolling();
            setPolling(false);
            router.push("/onboarding/your-dna");
          } else if (data.status === "failed") {
            stopPolling();
            setPolling(false);
            setError("Voice DNA build failed. Please try again.");
          }
        } catch {
          // Network hiccup - keep polling
        }
      }, 3000);
    },
    [router, stopPolling]
  );

  useEffect(() => () => { stopPolling(); }, [stopPolling]);

  const SOURCE_TYPE_MAP: Partial<Record<Mode, string>> = {
    export: "linkedin_export",
    manual: "manual",
    text_paste: "paste_text",
    transcript: "transcript",
    url_import: "url_import",
    pdf: "pdf",
  };

  const handleBuild = async (posts: string[]) => {
    setError(null);
    const rawText = posts.join("\n\n---\n\n");
    try {
      const res = await fetch("/api/voice-profile/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: rawText, source_type: SOURCE_TYPE_MAP[mode] ?? "unknown" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error((data as { detail?: string }).detail ?? "Failed to start build");
      }
      startPolling(posts.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  // ── Building / polling screen ──────────────────────────────────────────────
  if (polling) {
    return (
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
        <div>
          <p style={{ margin: "0 0 var(--ds-space-050)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Step 2 of 4 · Building
          </p>
          <Heading size="xlarge" as="h1">Analyzing your voice…</Heading>
          <p style={{ margin: "var(--ds-space-100) 0 0", color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
            Extracting 11 dimensions of your writing style from {postCount} sample{postCount !== 1 ? "s" : ""}. Takes 20–60 seconds.
          </p>
        </div>

        {/* Animated insight ticker */}
        <div
          style={{
            padding: "var(--ds-space-100) var(--ds-space-200)",
            borderRadius: "var(--ds-radius-100)",
            backgroundColor: "var(--ds-background-brand-subtle)",
            border: "1px solid var(--ds-border-information)",
            fontSize: "var(--ds-font-size-075)",
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text-brand)",
            minHeight: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {INSIGHT_MESSAGES[insightIdx]}
        </div>

        <Card elevation="flat" padding="default">
          <div style={{ marginBottom: "var(--ds-space-200)" }}>
            <ProgressBar value={progress / 100} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)", textAlign: "left" }}>
            {PROGRESS_STEPS.map((step) => (
              <div key={step.label} style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
                <span style={{ fontSize: "var(--ds-font-size-075)", color: progress > step.threshold ? "var(--ds-text-success)" : "var(--ds-text-subtlest)", transition: "color 0.3s", flexShrink: 0 }}>
                  {progress > step.threshold ? "✓" : "○"}
                </span>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: progress > step.threshold ? "var(--ds-text)" : "var(--ds-text-subtlest)", transition: "color 0.3s" }}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {error && (
          <SectionMessage appearance="error" title="Build failed">
            {error}
          </SectionMessage>
        )}
      </div>
    );
  }

  // ── Source selector ────────────────────────────────────────────────────────
  if (mode === "select") {
    return (
      <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 var(--ds-space-050)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Step 2 of 4
          </p>
          <Heading size="xlarge" as="h1">Add your writing</Heading>
          <p style={{ margin: "var(--ds-space-100) 0 0", color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
            Voise learns from any writing you&apos;ve done - not just LinkedIn posts. We need at least 15 samples. More is better.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => { setMode(opt.id); setError(null); }}
              style={{
                textAlign: "left",
                background: "var(--ds-surface)",
                border: `2px solid var(--ds-border)`,
                borderRadius: "var(--ds-radius-200)",
                padding: "var(--ds-space-200)",
                cursor: "pointer",
                transition: "border-color 0.15s, box-shadow 0.15s",
                display: "flex",
                flexDirection: "column",
                gap: "var(--ds-space-100)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--ds-border-brand)";
                e.currentTarget.style.boxShadow = "var(--ds-shadow-raised)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--ds-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--ds-radius-100)",
                    backgroundColor: "var(--ds-background-brand-subtle)",
                    border: "1px solid var(--ds-border-brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ds-icon-brand)",
                    flexShrink: 0,
                  }}
                >
                  <opt.Icon />
                </div>
                {opt.badge && <Lozenge appearance="inprogress">{opt.badge}</Lozenge>}
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{opt.title}</p>
                <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>{opt.description}</p>
              </div>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontWeight: "var(--ds-font-weight-medium)" }}>{opt.meta}</p>
            </button>
          ))}
        </div>

        {error && (
          <SectionMessage appearance="error" title="Error">
            {error}
          </SectionMessage>
        )}
      </div>
    );
  }

  // ── Active source views ────────────────────────────────────────────────────
  const HEADERS: Record<Exclude<Mode, "select">, { step: string; title: string }> = {
    export:     { step: "Step 2 of 4", title: "Import from LinkedIn" },
    text_paste: { step: "Step 2 of 4", title: "Paste your writing" },
    url_import: { step: "Step 2 of 4", title: "Import from URL" },
    transcript: { step: "Step 2 of 4", title: "Paste a transcript" },
    pdf:        { step: "Step 2 of 4", title: "Upload a PDF" },
    manual:     { step: "Step 2 of 4", title: "Add posts one at a time" },
  };

  const h = HEADERS[mode];

  return (
    <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--ds-space-200)" }}>
        <Button appearance="subtle" onClick={() => { setMode("select"); setError(null); }}>
          ← Back
        </Button>
        <div>
          <p style={{ margin: "0 0 var(--ds-space-025)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {h.step}
          </p>
          <Heading size="large" as="h1">{h.title}</Heading>
        </div>
      </div>

      {mode === "export" && <LinkedInExportUpload onImport={handleBuild} />}
      {mode === "text_paste" && <TextSourceInput sourceType="text" onImport={handleBuild} />}
      {mode === "url_import" && <UrlImportInput onImport={handleBuild} />}
      {mode === "transcript" && <TextSourceInput sourceType="transcript" onImport={handleBuild} />}
      {mode === "pdf" && <PdfUploadInput onImport={handleBuild} />}
      {mode === "manual" && <CardBasedPostInput onReady={handleBuild} />}

      {error && (
        <SectionMessage appearance="error" title="Error">
          {error}
        </SectionMessage>
      )}
    </div>
  );
}

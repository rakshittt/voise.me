"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";

interface ParsedResult {
  posts: string[];
  count: number;
}

interface Props {
  onImport: (posts: string[]) => void;
}

const STEPS = [
  {
    label: "Open \"Download my data\"",
    detail: "Go to LinkedIn → Settings & Privacy → Data Privacy → scroll to \"Download my data\"",
    link: "https://www.linkedin.com/settings/",
    linkLabel: "Open LinkedIn Settings",
  },
  {
    label: "Select the full archive",
    detail:
      "Choose the first option - \"Download larger data archive\" - NOT the individual checkboxes. " +
      "The individual options (Articles, Profile, etc.) do not include your posts.",
  },
  {
    label: "Click \"Request archive\" and wait",
    detail:
      "LinkedIn will email you a download link. This typically takes a few hours (sometimes up to 24 h).",
  },
  {
    label: "Upload the ZIP here",
    detail: "When the email arrives, download the ZIP and drag it below.",
  },
];

function confidenceLabel(count: number): { label: string; appearance: "success" | "moved" | "removed" } {
  if (count >= 50) return { label: "Strong profile - high confidence", appearance: "success" };
  if (count >= 30) return { label: "Good profile - medium confidence", appearance: "moved" };
  return { label: "Basic profile - add more for accuracy", appearance: "removed" };
}

export function LinkedInExportUpload({ onImport }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(async (file: File) => {
    setError(null);
    setResult(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/voice-profile/parse-export", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to parse export");
      setResult(data as ParsedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) upload(file);
    },
    [upload]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
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
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-200)", color: "var(--ds-text)" }}>
                {result.count} posts found
              </p>
              <div style={{ marginTop: "var(--ds-space-050)" }}>
                <Lozenge appearance={conf.appearance}>{conf.label}</Lozenge>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
            {result.posts.slice(0, 3).map((post, i) => (
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
                {post}
              </div>
            ))}
            {result.count > 3 && (
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                + {result.count - 3} more posts
              </p>
            )}
          </div>
        </div>

        {result.count < 15 ? (
          <SectionMessage appearance="warning" title="Not enough posts">
            Only {result.count} posts with 30+ words found (need at least 15). Try the <strong>Paste writing</strong> source to add newsletters, articles, or copied posts directly.
          </SectionMessage>
        ) : (
          <Button appearance="primary" shouldFitContainer onClick={() => onImport(result.posts)}>
            Import {result.count} posts and build my Voice DNA →
          </Button>
        )}

        <Button appearance="subtle" shouldFitContainer onClick={() => { setResult(null); setError(null); }}>
          Upload a different file
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>
      {/* Step-by-step instructions */}
      <div
        style={{
          borderRadius: "var(--ds-radius-200)",
          border: `1px solid var(--ds-border)`,
          background: "var(--ds-background-neutral-subtle)",
          overflow: "hidden",
        }}
      >
        {STEPS.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "var(--ds-space-150)",
              padding: "var(--ds-space-150) var(--ds-space-200)",
              borderTop: i > 0 ? `1px solid var(--ds-border)` : "none",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: "var(--ds-background-brand-subtle)",
                color: "var(--ds-text-brand)",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-bold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {i + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{step.label}</p>
              <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{step.detail}</p>
              {step.link && (
                <a
                  href={step.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: "var(--ds-space-050)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)", textDecoration: "none" }}
                >
                  {step.linkLabel} ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          position: "relative",
          cursor: "pointer",
          borderRadius: "var(--ds-radius-200)",
          border: `2px dashed ${dragging ? "var(--ds-border-brand)" : "var(--ds-border)"}`,
          padding: "var(--ds-space-500)",
          textAlign: "center",
          backgroundColor: dragging ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)",
          transition: "border-color 0.15s, background-color 0.15s",
          userSelect: "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.csv"
          onChange={handleFileChange}
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ds-space-100)" }}>
            <Spinner size="medium" />
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>Parsing your LinkedIn posts…</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 32, marginBottom: "var(--ds-space-100)" }}>📁</div>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
              Drop your LinkedIn export here, or{" "}
              <span style={{ color: "var(--ds-text-brand)" }}>browse</span>
            </p>
            <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
              LinkedIn data archive ZIP · Max 10 MB
            </p>
          </>
        )}
      </div>

      {error && (
        <SectionMessage appearance="error" title="Upload failed">{error}</SectionMessage>
      )}
    </div>
  );
}

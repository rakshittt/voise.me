"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";

interface ParsedResult {
  chunks: string[];
  count: number;
  page_count: number;
}

interface Props {
  onImport: (chunks: string[]) => void;
}

function confidenceLabel(count: number): { label: string; appearance: "success" | "moved" | "removed" } {
  if (count >= 50) return { label: "Strong - high confidence", appearance: "success" };
  if (count >= 20) return { label: "Good - medium confidence", appearance: "moved" };
  return { label: "Basic - add more sources for accuracy", appearance: "removed" };
}

export function PdfUploadInput({ onImport }: Props) {
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
      const res = await fetch("/api/voice-profile/parse-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to parse PDF");
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
            border: "1px solid var(--ds-border-success)",
            borderRadius: "var(--ds-radius-200)",
            backgroundColor: "var(--ds-background-success)",
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
                {result.count} writing samples extracted
              </p>
              <p style={{ margin: "2px 0 var(--ds-space-075)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
                from {result.page_count} page{result.page_count !== 1 ? "s" : ""}
              </p>
              <Lozenge appearance={conf.appearance}>{conf.label}</Lozenge>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
            {result.chunks.slice(0, 3).map((chunk, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "var(--ds-surface)",
                  borderRadius: "var(--ds-radius-100)",
                  border: "1px solid var(--ds-border)",
                  padding: "var(--ds-space-100) var(--ds-space-150)",
                  fontSize: "var(--ds-font-size-075)",
                  color: "var(--ds-text-subtle)",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {chunk}
              </div>
            ))}
            {result.count > 3 && (
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                + {result.count - 3} more segments
              </p>
            )}
          </div>
        </div>

        {result.count < 15 ? (
          <SectionMessage appearance="warning" title="Not enough content">
            Only {result.count} usable segments found (need at least 15). The PDF may be short or mostly tables/images.
            Try adding another source - paste the text directly or import a URL.
          </SectionMessage>
        ) : (
          <Button appearance="primary" shouldFitContainer onClick={() => onImport(result.chunks)}>
            Use these {result.count} samples to build my Voice DNA →
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
      {/* Info banner */}
      <div
        style={{
          borderRadius: "var(--ds-radius-100)",
          border: "1px solid var(--ds-border-information)",
          backgroundColor: "var(--ds-background-information)",
          padding: "var(--ds-space-150) var(--ds-space-200)",
          fontSize: "var(--ds-font-size-075)",
          color: "var(--ds-text-information)",
          lineHeight: "var(--ds-line-height-200)",
        }}
      >
        <strong>Works best with text-layer PDFs</strong> - e-books, essays, newsletters, or exported articles.
        Scanned PDFs (images of pages) cannot be read. Max 20 MB · 150 pages.
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
          padding: "var(--ds-space-600)",
          textAlign: "center",
          backgroundColor: dragging ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)",
          transition: "border-color 0.15s, background-color 0.15s",
          userSelect: "none",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap", border: 0 }}
        />

        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ds-space-150)" }}>
            <Spinner size="medium" />
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
              Extracting text from your PDF…
            </p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 36, marginBottom: "var(--ds-space-150)" }}>📄</div>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
              Drop your PDF here, or{" "}
              <span style={{ color: "var(--ds-text-brand)" }}>browse</span>
            </p>
            <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
              PDF files only · Max 20 MB
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

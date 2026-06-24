"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Lozenge } from "@/components/ui/Lozenge";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";

interface FetchResult {
  chunks: string[];
  count: number;
  title: string;
  source_url: string;
}

interface Props {
  onImport: (chunks: string[]) => void;
}

export function UrlImportInput({ onImport }: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/voice-profile/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Fetch failed");
      setResult(data as FetchResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not fetch the URL");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
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
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {result.title || "Article fetched"}
              </p>
              <div style={{ marginTop: "var(--ds-space-050)" }}>
                <Lozenge appearance="success">{result.count} samples extracted</Lozenge>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
            {result.chunks.slice(0, 3).map((chunk, i) => (
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
                {chunk}
              </div>
            ))}
            {result.count > 3 && (
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                + {result.count - 3} more samples
              </p>
            )}
          </div>
        </div>

        {result.count < 15 ? (
          <SectionMessage appearance="warning" title="Not enough samples">
            Only {result.count} usable samples from this URL. Try a longer article or add more sources.
          </SectionMessage>
        ) : (
          <Button appearance="primary" shouldFitContainer onClick={() => onImport(result.chunks)}>
            Build Voice DNA from {result.count} samples →
          </Button>
        )}

        <Button appearance="subtle" shouldFitContainer onClick={() => { setResult(null); setError(""); setUrl(""); }}>
          ← Fetch a different URL
        </Button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
        Paste the URL of any blog post, article, newsletter issue, or Medium story.
        We&apos;ll extract the text and split it into voice samples automatically.
      </p>

      <div style={{ display: "flex", gap: "var(--ds-space-100)", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <TextField
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && !loading && url.trim() && handleFetch()}
            placeholder="https://yourblog.com/your-post"
          />
        </div>
        <Button
          appearance="primary"
          isDisabled={loading || !url.trim()}
          onClick={handleFetch}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
              <Spinner size="small" appearance="invert" /> Fetching…
            </span>
          ) : "Fetch"}
        </Button>
      </div>

      <Card elevation="flat" padding="default">
        <p style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Works well with:
        </p>
        <ul style={{ margin: 0, paddingLeft: "var(--ds-space-200)", display: "flex", flexDirection: "column", gap: "var(--ds-space-050)" }}>
          {[
            "Personal blog posts and articles",
            "Medium, Substack, or Beehiiv posts",
            "Public newsletter archives",
            "LinkedIn articles (the long-form ones)",
          ].map((item) => (
            <li key={item} style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{item}</li>
          ))}
        </ul>
        <p style={{ margin: "var(--ds-space-100) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          One article ≈ 5–15 samples. Paste 3–5 URLs one at a time for a richer model.
        </p>
      </Card>

      {error && (
        <SectionMessage appearance="error" title="Fetch failed">{error}</SectionMessage>
      )}
    </div>
  );
}

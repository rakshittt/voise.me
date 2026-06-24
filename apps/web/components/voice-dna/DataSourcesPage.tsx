"use client";

import { useCallback, useEffect, useState } from "react";
import { LinkedInExportUpload } from "./LinkedInExportUpload";
import { TextSourceInput } from "./TextSourceInput";
import { UrlImportInput } from "./UrlImportInput";
import { PdfUploadInput } from "./PdfUploadInput";
import { CardBasedPostInput } from "./CardBasedPostInput";
import { Button } from "@/components/ui/Button";
import { Lozenge } from "@/components/ui/Lozenge";
import { SectionMessage } from "@/components/ui/SectionMessage";
import Heading from "@/components/ui/Heading";

/* ── Types ──────────────────────────────────────────────────────────────────── */

type SourceType =
  | "linkedin_export"
  | "paste_text"
  | "url_import"
  | "transcript"
  | "pdf"
  | "manual";

interface DataSourceRecord {
  id: string;
  source_type: string;
  label: string | null;
  post_count: number;
  added_at: string;
}

/* ── Source metadata ────────────────────────────────────────────────────────── */

const SOURCE_META: Record<
  SourceType,
  { title: string; description: string; meta: string; Icon: () => React.ReactElement }
> = {
  linkedin_export: {
    title: "LinkedIn Posts",
    description: "Your posts directly from LinkedIn's data export.",
    meta: "Typically 50–200 posts",
    Icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h6" />
        <path d="M16 3h5v5" /><path d="M10 14L21 3" />
      </svg>
    ),
  },
  paste_text: {
    title: "Pasted Writing",
    description: "Newsletters, articles, essays, or any prose you've written.",
    meta: "Best for bloggers & writers",
    Icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  url_import: {
    title: "Blog & Articles",
    description: "Fetch any public URL - we extract the text automatically.",
    meta: "Medium, Substack, personal blogs",
    Icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3.6 9h16.8M3.6 15h16.8" />
        <path d="M12 3a14.5 14.5 0 010 18M12 3a14.5 14.5 0 000 18" />
      </svg>
    ),
  },
  transcript: {
    title: "Transcripts",
    description: "Video or podcast transcripts that capture your spoken voice.",
    meta: "Supports speaker-turn format",
    Icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
      </svg>
    ),
  },
  pdf: {
    title: "PDF Documents",
    description: "E-books, essays, or exported articles as PDF files.",
    meta: "Text-layer PDFs · Max 20 MB",
    Icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 13h1.5a1.5 1.5 0 010 3H9v-3zM16 13v3M14 13h2" />
      </svg>
    ),
  },
  manual: {
    title: "Manual Posts",
    description: "Add individual posts one by one with a preview.",
    meta: "Good for fewer than 20 posts",
    Icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
};

const ALL_SOURCE_TYPES = Object.keys(SOURCE_META) as SourceType[];

/* ── DNA strength helper ────────────────────────────────────────────────────── */

function dnaStrength(total: number): { label: string; appearance: "success" | "inprogress" | "removed"; bar: number } {
  if (total >= 80) return { label: "Strong", appearance: "success", bar: 100 };
  if (total >= 40) return { label: "Good", appearance: "inprogress", bar: Math.round((total / 80) * 100) };
  return { label: "Getting started", appearance: "removed", bar: Math.round((total / 40) * 50) };
}

/* ── Source icon wrapper ────────────────────────────────────────────────────── */

function SourceIcon({ type, active }: { type: SourceType; active: boolean }) {
  const { Icon } = SOURCE_META[type];
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "var(--ds-radius-200)",
        backgroundColor: active ? "var(--ds-background-brand-subtle)" : "var(--ds-background-neutral)",
        border: `1px solid ${active ? "var(--ds-border-brand)" : "var(--ds-border)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: active ? "var(--ds-icon-brand)" : "var(--ds-icon-subtle)",
        flexShrink: 0,
      }}
    >
      <Icon />
    </div>
  );
}

/* ── Import modal ────────────────────────────────────────────────────────────── */

interface ImportModalProps {
  sourceType: SourceType;
  onClose: () => void;
  onSuccess: (count: number) => void;
}

function ImportModal({ sourceType, onClose, onSuccess }: ImportModalProps) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const handleImport = async (posts: string[]) => {
    setError(null);
    setImporting(true);
    try {
      const res = await fetch("/api/voice-profile/add-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: posts.join("\n\n---\n\n"),
          source_type: sourceType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data as { detail?: string }).detail ?? "Failed to add content");
      setImportedCount(posts.length);
      setDone(true);
      onSuccess(posts.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setImporting(false);
    }
  };

  const meta = SOURCE_META[sourceType];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: 500,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        overflowY: "auto",
        padding: "var(--ds-space-400) var(--ds-space-200)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          backgroundColor: "var(--ds-surface)",
          borderRadius: "var(--ds-radius-300)",
          border: "1px solid var(--ds-border)",
          boxShadow: "var(--ds-shadow-overlay)",
          overflow: "hidden",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--ds-space-250) var(--ds-space-300)",
            borderBottom: "1px solid var(--ds-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)" }}>
            <SourceIcon type={sourceType} active={false} />
            <div>
              <Heading size="medium" as="h2">{meta.title}</Heading>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                {meta.meta}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ds-icon-subtle)",
              padding: "var(--ds-space-075)",
              borderRadius: "var(--ds-radius-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal body */}
        <div style={{ padding: "var(--ds-space-300)" }}>
          {done ? (
            <div style={{ textAlign: "center", padding: "var(--ds-space-400) 0" }}>
              <div style={{ fontSize: 48, marginBottom: "var(--ds-space-150)" }}>✓</div>
              <Heading size="large" as="h3">Added to your Voice DNA</Heading>
              <p style={{ color: "var(--ds-text-subtle)", margin: "var(--ds-space-100) 0 var(--ds-space-300)" }}>
                {importedCount} new writing sample{importedCount !== 1 ? "s" : ""} are being processed. Your Voice DNA will automatically update.
              </p>
              <Button appearance="primary" onClick={onClose}>Done</Button>
            </div>
          ) : importing ? (
            <div style={{ textAlign: "center", padding: "var(--ds-space-400) 0", color: "var(--ds-text-subtle)" }}>
              <div style={{ marginBottom: "var(--ds-space-150)", fontSize: "var(--ds-font-size-100)" }}>
                Adding to your Voice DNA…
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div style={{ marginBottom: "var(--ds-space-200)" }}>
                  <SectionMessage appearance="error" title="Import failed">{error}</SectionMessage>
                </div>
              )}
              {sourceType === "linkedin_export" && <LinkedInExportUpload onImport={handleImport} />}
              {sourceType === "paste_text" && <TextSourceInput sourceType="text" onImport={handleImport} />}
              {sourceType === "url_import" && <UrlImportInput onImport={handleImport} />}
              {sourceType === "transcript" && <TextSourceInput sourceType="transcript" onImport={handleImport} />}
              {sourceType === "pdf" && <PdfUploadInput onImport={handleImport} />}
              {sourceType === "manual" && <CardBasedPostInput onReady={handleImport} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export function DataSourcesPage() {
  const [sources, setSources] = useState<DataSourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<SourceType | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data-sources");
        if (!res.ok) throw new Error("Failed to load sources");
        const data = (await res.json()) as DataSourceRecord[];
        setSources(data);
      } catch {
        setFetchError("Could not load your data sources.");
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshKey]);

  const handleSuccess = useCallback((_count: number) => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Aggregate by source_type
  const aggregated = sources.reduce<Record<string, { total: number; last: string }>>((acc, s) => {
    if (!acc[s.source_type]) acc[s.source_type] = { total: 0, last: s.added_at };
    acc[s.source_type].total += s.post_count;
    if (s.added_at > acc[s.source_type].last) acc[s.source_type].last = s.added_at;
    return acc;
  }, {});

  const connectedTypes = Object.keys(aggregated) as SourceType[];
  const notConnectedTypes = ALL_SOURCE_TYPES.filter((t) => !aggregated[t]);
  const totalPosts = Object.values(aggregated).reduce((sum, v) => sum + v.total, 0);
  const strength = dnaStrength(totalPosts);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-200)", maxWidth: 720 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: 72,
              borderRadius: "var(--ds-radius-200)",
              backgroundColor: "var(--ds-background-neutral)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (fetchError) {
    return <SectionMessage appearance="error" title="Error">{fetchError}</SectionMessage>;
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--ds-space-300)", flexWrap: "wrap", gap: "var(--ds-space-150)" }}>
        <div>
          <Heading size="xlarge" as="h1">Training Sources</Heading>
          <p style={{ margin: "var(--ds-space-075) 0 0", color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
            Every source you add improves the accuracy of your Voice DNA.
          </p>
        </div>

        {/* DNA strength pill */}
        {totalPosts > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--ds-space-100)",
              padding: "var(--ds-space-075) var(--ds-space-150)",
              borderRadius: "var(--ds-radius-300)",
              backgroundColor: "var(--ds-background-neutral)",
              border: "1px solid var(--ds-border)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: strength.appearance === "success" ? "var(--ds-icon-success)" : strength.appearance === "inprogress" ? "var(--ds-icon-information)" : "var(--ds-icon-warning)",
              }}
            />
            <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
              {totalPosts} samples · {strength.label}
            </span>
          </div>
        )}
      </div>

      {/* Connected sources */}
      {connectedTypes.length > 0 && (
        <section style={{ marginBottom: "var(--ds-space-500)" }}>
          <p
            style={{
              margin: "0 0 var(--ds-space-150)",
              fontSize: "var(--ds-font-size-075)",
              fontWeight: "var(--ds-font-weight-semibold)",
              color: "var(--ds-text-subtlest)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Connected
          </p>
          <div
            style={{
              borderRadius: "var(--ds-radius-200)",
              border: "1px solid var(--ds-border)",
              overflow: "hidden",
              backgroundColor: "var(--ds-surface)",
            }}
          >
            {connectedTypes.map((type, idx) => {
              const meta = SOURCE_META[type] ?? {
                title: type,
                description: "",
                meta: "",
                Icon: () => <span>?</span>,
              };
              const agg = aggregated[type];
              return (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ds-space-200)",
                    padding: "var(--ds-space-200) var(--ds-space-250)",
                    borderTop: idx > 0 ? "1px solid var(--ds-border)" : "none",
                  }}
                >
                  <SourceIcon type={type} active={true} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
                        {meta.title}
                      </span>
                      <Lozenge appearance="success">Active</Lozenge>
                    </div>
                    <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                      {agg.total} sample{agg.total !== 1 ? "s" : ""} · Last added {formatDate(agg.last)}
                    </p>
                  </div>
                  <Button
                    appearance="default"
                    onClick={() => setActiveModal(type)}
                  >
                    Add more
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Not-yet-connected sources */}
      {notConnectedTypes.length > 0 && (
        <section>
          <p
            style={{
              margin: "0 0 var(--ds-space-150)",
              fontSize: "var(--ds-font-size-075)",
              fontWeight: "var(--ds-font-weight-semibold)",
              color: "var(--ds-text-subtlest)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {connectedTypes.length > 0 ? "Add a new source" : "Connect your first source"}
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "var(--ds-space-150)",
            }}
          >
            {notConnectedTypes.map((type) => {
              const meta = SOURCE_META[type];
              return (
                <div
                  key={type}
                  style={{
                    backgroundColor: "var(--ds-surface)",
                    border: "1px solid var(--ds-border)",
                    borderRadius: "var(--ds-radius-200)",
                    padding: "var(--ds-space-200)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--ds-space-150)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ds-space-100)" }}>
                    <SourceIcon type={type} active={false} />
                    <Button
                      appearance="primary"
                      onClick={() => setActiveModal(type)}
                    >
                      Connect
                    </Button>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
                      {meta.title}
                    </p>
                    <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>
                      {meta.description}
                    </p>
                    <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontWeight: "var(--ds-font-weight-medium)" }}>
                      {meta.meta}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {connectedTypes.length === 0 && notConnectedTypes.length === 0 && (
        <SectionMessage appearance="information" title="No sources yet">
          Connect your first source to start building your Voice DNA.
        </SectionMessage>
      )}

      {/* Tip footer */}
      <div
        style={{
          marginTop: "var(--ds-space-500)",
          padding: "var(--ds-space-200) var(--ds-space-250)",
          borderRadius: "var(--ds-radius-200)",
          backgroundColor: "var(--ds-background-neutral)",
          border: "1px solid var(--ds-border)",
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--ds-space-150)",
        }}
      >
        <span style={{ color: "var(--ds-icon-information)", flexShrink: 0, marginTop: 2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
          </svg>
        </span>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>
          <strong style={{ color: "var(--ds-text)" }}>More sources = stronger Voice DNA.</strong>{" "}
          80+ samples across multiple source types gives the most accurate fingerprint. Adding blogs, transcripts, and newsletters alongside LinkedIn posts captures how you write across all contexts - not just your polished posts.
        </p>
      </div>

      {/* Import modal */}
      {activeModal && (
        <ImportModal
          sourceType={activeModal}
          onClose={() => setActiveModal(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

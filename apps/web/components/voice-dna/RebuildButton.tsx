"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RebuildButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleRebuild = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/voice-profile/rebuild", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? "Rebuild failed");
      }
      setState("done");
      // Poll status then redirect to the DNA page once ready
      const poll = setInterval(async () => {
        const statusRes = await fetch("/api/voice-profile/status");
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.status === "ready") {
            clearInterval(poll);
            router.refresh();
          }
        }
      }, 3000);
      // Safety timeout - stop polling after 3 minutes
      setTimeout(() => clearInterval(poll), 180_000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  };

  if (state === "done") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: "var(--ds-radius-100)", border: "1px solid var(--ds-border-success)", background: "var(--ds-background-success)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-success)", fontWeight: "var(--ds-font-weight-semibold)" }}>
        ✓ Rebuilding - refreshes automatically
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ padding: "8px 16px", borderRadius: "var(--ds-radius-100)", border: "1px solid var(--ds-border-danger)", background: "var(--ds-background-danger)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-danger)" }}>
        Rebuild failed - try again
      </div>
    );
  }

  return (
    <button
      onClick={handleRebuild}
      disabled={state === "loading"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "8px 16px",
        backgroundColor: state === "loading" ? "var(--ds-background-neutral)" : "var(--ds-background-brand-bold)",
        color: state === "loading" ? "var(--ds-text-subtle)" : "var(--ds-text-inverse)",
        border: "none",
        borderRadius: "var(--ds-radius-100)",
        fontSize: "var(--ds-font-size-075)",
        fontWeight: "var(--ds-font-weight-semibold)",
        cursor: state === "loading" ? "not-allowed" : "pointer",
        transition: "background 0.15s",
      }}
    >
      {state === "loading" ? "Rebuilding…" : "Rebuild fingerprint →"}
    </button>
  );
}

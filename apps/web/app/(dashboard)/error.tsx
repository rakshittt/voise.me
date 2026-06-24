"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--ds-space-800) var(--ds-space-400)",
      }}
    >
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
        <div>
          <h2 style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-400)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            Something went wrong
          </h2>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
            This page ran into an error. Try refreshing or go back to the dashboard.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--ds-space-150)", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "var(--ds-space-100) var(--ds-space-200)",
              borderRadius: "var(--ds-radius-100)",
              border: "none",
              backgroundColor: "var(--ds-background-brand-bold)",
              color: "var(--ds-text-inverse)",
              fontWeight: "var(--ds-font-weight-semibold)",
              fontSize: "var(--ds-font-size-100)",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            style={{
              padding: "var(--ds-space-100) var(--ds-space-200)",
              borderRadius: "var(--ds-radius-100)",
              border: "1px solid var(--ds-border)",
              color: "var(--ds-text)",
              fontWeight: "var(--ds-font-weight-semibold)",
              fontSize: "var(--ds-font-size-100)",
              textDecoration: "none",
            }}
          >
            Dashboard home
          </Link>
        </div>
      </div>
    </div>
  );
}

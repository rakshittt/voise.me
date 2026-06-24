"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, sans-serif", backgroundColor: "var(--ds-background-neutral-subtle)" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 24px",
          }}
        >
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>⚡</div>
            <div>
              <h1 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 800, color: "var(--ds-text)", letterSpacing: "-0.03em" }}>
                Something went wrong
              </h1>
              <p style={{ margin: 0, fontSize: 15, color: "var(--ds-text-subtle)", lineHeight: 1.6 }}>
                An unexpected error occurred. We&apos;ve been notified and are looking into it.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "var(--ds-background-brand-bold)",
                  color: "var(--ds-text-inverse)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1.5px solid var(--ds-border)",
                  backgroundColor: "transparent",
                  color: "var(--ds-text)",
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

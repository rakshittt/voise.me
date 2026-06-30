"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveToolHandoff, type ToolHandoffKind } from "@/lib/toolHandoff";

export function PublicToolCTA({
  title = "Get posts that score 85%+ in your voice",
  body = "This tool checks the basics. Voise learns your actual writing voice and generates - and scores - full posts against it.",
  handoffContent,
  handoffSource,
  handoffKind = "idea",
  primaryLabel,
}: {
  title?: string;
  body?: string;
  /** When set, "Get started" carries this content through signup into the product instead of dropping it. */
  handoffContent?: string;
  handoffSource?: string;
  handoffKind?: ToolHandoffKind;
  primaryLabel?: string;
}) {
  const router = useRouter();
  const hasHandoff = Boolean(handoffContent?.trim() && handoffSource);

  const handlePrimaryClick = () => {
    if (handoffContent && handoffSource) {
      saveToolHandoff(handoffContent, handoffSource, handoffKind);
    }
    router.push("/sign-up");
  };

  return (
    <div
      style={{
        backgroundColor: "var(--ds-background-brand-bold)",
        borderRadius: "var(--ds-radius-300)",
        padding: "var(--ds-space-400)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "var(--ds-space-150)",
      }}
    >
      <h3 style={{ margin: 0, fontWeight: "var(--ds-font-weight-bold)", fontSize: "var(--ds-font-size-300)", color: "var(--ds-text-inverse)" }}>
        {title}
      </h3>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "var(--ds-font-size-100)" }}>{body}</p>
      <div style={{ display: "flex", gap: "var(--ds-space-150)", justifyContent: "center", flexWrap: "wrap" }}>
        {hasHandoff ? (
          <button
            type="button"
            onClick={handlePrimaryClick}
            style={{
              padding: "var(--ds-space-100) var(--ds-space-250)",
              background: "var(--ds-surface)",
              color: "var(--ds-text-brand)",
              fontWeight: "var(--ds-font-weight-semibold)",
              borderRadius: "var(--ds-radius-100)",
              fontSize: "var(--ds-font-size-100)",
              border: "none",
              cursor: "pointer",
            }}
          >
            {primaryLabel ?? "Use this in my voice →"}
          </button>
        ) : (
          <Link
            href="/sign-up"
            style={{
              padding: "var(--ds-space-100) var(--ds-space-250)",
              background: "var(--ds-surface)",
              color: "var(--ds-text-brand)",
              fontWeight: "var(--ds-font-weight-semibold)",
              borderRadius: "var(--ds-radius-100)",
              fontSize: "var(--ds-font-size-100)",
              textDecoration: "none",
            }}
          >
            {primaryLabel ?? "Get started free →"}
          </Link>
        )}
        <Link
          href="/sign-in"
          style={{
            padding: "var(--ds-space-100) var(--ds-space-250)",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "var(--ds-text-inverse)",
            fontWeight: "var(--ds-font-weight-semibold)",
            borderRadius: "var(--ds-radius-100)",
            fontSize: "var(--ds-font-size-100)",
            textDecoration: "none",
          }}
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

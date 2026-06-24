"use client";

import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

function PathCard({
  title,
  description,
  badge,
  onClick,
  isPrimary,
}: {
  title: string;
  description: string;
  badge: string;
  onClick: () => void;
  isPrimary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        textAlign: "left",
        padding: "var(--ds-space-300)",
        borderRadius: "var(--ds-radius-200)",
        border: isPrimary
          ? "2px solid var(--ds-border-brand)"
          : "1.5px solid var(--ds-border)",
        background: isPrimary
          ? "var(--ds-background-brand-subtle)"
          : "var(--ds-surface)",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "var(--ds-space-150)",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 4px 16px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: 999,
          fontSize: "var(--ds-font-size-075)",
          fontWeight: "var(--ds-font-weight-semibold)",
          backgroundColor: isPrimary
            ? "var(--ds-background-brand-bold)"
            : "var(--ds-background-neutral)",
          color: isPrimary
            ? "var(--ds-text-inverse)"
            : "var(--ds-text-subtle)",
        }}
      >
        {badge}
      </span>

      <div>
        <p
          style={{
            margin: "0 0 var(--ds-space-075)",
            fontSize: "var(--ds-font-size-200)",
            fontWeight: "var(--ds-font-weight-bold)",
            color: "var(--ds-text)",
            lineHeight: 1.25,
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-100)",
            color: "var(--ds-text-subtle)",
            lineHeight: "var(--ds-line-height-300)",
          }}
        >
          {description}
        </p>
      </div>

      <span
        style={{
          fontSize: "var(--ds-font-size-100)",
          fontWeight: "var(--ds-font-weight-semibold)",
          color: isPrimary ? "var(--ds-text-brand)" : "var(--ds-text-subtle)",
        }}
      >
        Get started →
      </span>
    </button>
  );
}

export function PathSelectorStep() {
  const router = useRouter();

  return (
    <div
      style={{
        maxWidth: 600,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "var(--ds-space-400)",
      }}
    >
      <StepIndicator current={2} total={4} />

      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            margin: "0 0 var(--ds-space-100)",
            fontSize: "var(--ds-font-size-500)",
            fontWeight: "var(--ds-font-weight-bold)",
            color: "var(--ds-text)",
            lineHeight: 1.2,
          }}
        >
          Do you have writing samples?
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-100)",
            color: "var(--ds-text-subtle)",
          }}
        >
          Choose the path that fits you best - you can always add more sources later.
        </p>
      </div>

      <div style={{ display: "flex", gap: "var(--ds-space-200)", flexWrap: "wrap" }}>
        <PathCard
          title="I have writing samples"
          description="LinkedIn posts, articles, newsletters, or transcripts. We'll extract your real voice fingerprint from what you've already written."
          badge="Recommended"
          isPrimary
          onClick={() => router.push("/onboarding/build-profile")}
        />
        <PathCard
          title="I'm starting fresh"
          description="No posts yet? Answer five quick questions and we'll build a starter profile that gets you writing immediately."
          badge="New to LinkedIn"
          onClick={() => router.push("/onboarding/seed-questionnaire")}
        />
      </div>
    </div>
  );
}

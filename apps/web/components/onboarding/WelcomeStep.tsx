"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

const BEFORE = `I am pleased to share some thoughts on leadership and effective communication. After years of experience in the industry, I have found that there are several key insights that can help professionals succeed. Here are my top strategies for growth in today's competitive landscape...`;

const AFTER = `Most people think leadership is about having the right answers. It's not. The best leader I ever worked for said "I don't know" more than anyone I'd met - and people trusted him completely because of it. Here's the thing nobody tells you about authority...`;

export function WelcomeStep() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/onboarding/start");
  };

  return (
    <div style={{ maxWidth: 600, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-500)" }}>

      {/* Hero */}
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            margin: "0 0 var(--ds-space-150)",
            fontSize: "clamp(1.75rem, 5vw, 2.5rem)",
            fontWeight: "var(--ds-font-weight-bold)",
            color: "var(--ds-text)",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          LinkedIn posts that<br />
          <span style={{ color: "var(--ds-background-brand-bold)" }}>actually sound like you</span>
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-200)",
            color: "var(--ds-text-subtle)",
            lineHeight: "var(--ds-line-height-300)",
            maxWidth: 440,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Voise learns how you write - your hooks, rhythm, vocabulary, opinions - then generates posts that pass the &ldquo;did I write this?&rdquo; test.
        </p>
      </div>

      {/* Before / After */}
      <div
        style={{
          borderRadius: "var(--ds-radius-300)",
          border: "1px solid var(--ds-border)",
          overflow: "hidden",
          backgroundColor: "var(--ds-surface)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          {/* Before */}
          <div
            style={{
              padding: "var(--ds-space-200)",
              borderRight: "1px solid var(--ds-border)",
              backgroundColor: "var(--ds-surface-sunken)",
            }}
          >
            <p
              style={{
                margin: "0 0 var(--ds-space-100)",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--ds-text-subtlest)",
              }}
            >
              Generic AI
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--ds-font-size-075)",
                color: "var(--ds-text-subtle)",
                lineHeight: "var(--ds-line-height-300)",
                fontStyle: "italic",
              }}
            >
              {BEFORE}
            </p>
          </div>

          {/* After */}
          <div
            style={{
              padding: "var(--ds-space-200)",
              backgroundColor: "var(--ds-background-brand-subtle)",
            }}
          >
            <p
              style={{
                margin: "0 0 var(--ds-space-100)",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: "var(--ds-text-brand)",
              }}
            >
              Your voice ✦
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "var(--ds-font-size-075)",
                color: "var(--ds-text)",
                lineHeight: "var(--ds-line-height-300)",
              }}
            >
              {AFTER}
            </p>
          </div>
        </div>

        <div
          style={{
            padding: "var(--ds-space-100) var(--ds-space-200)",
            backgroundColor: "var(--ds-background-neutral-subtle)",
            borderTop: "1px solid var(--ds-border)",
            fontSize: "var(--ds-font-size-075)",
            color: "var(--ds-text-subtlest)",
            textAlign: "center",
          }}
        >
          Same topic. Different voices. Voise generates the one that sounds like you wrote it.
        </div>
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ds-space-100)" }}>
        <div style={{ width: "100%" }}>
          <Button appearance="primary" shouldFitContainer onClick={handleStart}>
            Build my Voice DNA →
          </Button>
        </div>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          Takes 2 minutes · No LinkedIn login required
        </p>
      </div>

      {/* Founder's note */}
      <div
        style={{
          borderTop: "1px solid var(--ds-border)",
          paddingTop: "var(--ds-space-300)",
          display: "flex",
          gap: "var(--ds-space-150)",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: "var(--ds-background-brand-bold)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--ds-font-size-075)",
            fontWeight: "var(--ds-font-weight-bold)",
            color: "white",
            flexShrink: 0,
          }}
        >
          R
        </div>
        <div>
          <p
            style={{
              margin: "0 0 var(--ds-space-050)",
              fontSize: "var(--ds-font-size-075)",
              color: "var(--ds-text-subtle)",
              lineHeight: "var(--ds-line-height-300)",
              fontStyle: "italic",
            }}
          >
            &ldquo;I built Voise because every AI post I wrote sounded the same - polished, structured, and nothing like me. Your voice is the one thing AI can&apos;t replicate. This tool makes sure it doesn&apos;t have to.&rdquo;
          </p>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
            Rakshit, founder of Voise
          </p>
        </div>
      </div>

    </div>
  );
}

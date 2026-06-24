"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Heading from "@/components/ui/Heading";
import { Lozenge } from "@/components/ui/Lozenge";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  trial: "Trial",
};

interface UpgradeModalProps {
  plan: string;
  used: number;
  limit: number;
  action: string;
  onClose: () => void;
}

export function UpgradeModal({ plan, used, limit, action, onClose }: UpgradeModalProps) {
  const planLabel = PLAN_NAMES[plan] ?? plan;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(9,30,66,0.54)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          background: "var(--ds-surface)",
          borderRadius: "var(--ds-radius-300)",
          boxShadow: "var(--ds-shadow-overlay)",
          width: "100%",
          maxWidth: 440,
          margin: "0 var(--ds-space-200)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "var(--ds-background-brand-bold)",
            padding: "var(--ds-space-500) var(--ds-space-400)",
            textAlign: "center",
          }}
        >
          <Heading size="large" as="h2" color="color.text.inverse">
            You&apos;ve hit your {planLabel} plan limit
          </Heading>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "var(--ds-font-size-100)",
              marginTop: "var(--ds-space-100)",
            }}
          >
            {used}/{limit} {action}s used this billing period
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "var(--ds-space-400)", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
          <p
            style={{
              textAlign: "center",
              fontSize: "var(--ds-font-size-100)",
              color: "var(--ds-text-subtle)",
              margin: 0,
            }}
          >
            Upgrade to keep generating posts in your authentic voice.
          </p>

          {/* Plan cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--ds-space-150)" }}>
            <Card elevation="flat" padding="default">
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Growth</p>
              <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>
                $79<span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "normal", color: "var(--ds-text-subtle)" }}>/mo</span>
              </p>
              <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>20 posts · 10 repurposes</p>
            </Card>
            <div
              style={{
                borderRadius: "var(--ds-radius-200)",
                border: `2px solid var(--ds-border-brand)`,
                backgroundColor: "var(--ds-background-brand-subtle)",
                padding: "var(--ds-space-200)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -12,
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <Lozenge appearance="inprogress" isBold>Popular</Lozenge>
              </div>
              <p style={{ margin: 0, fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Pro</p>
              <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>
                $199<span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "normal", color: "var(--ds-text-subtle)" }}>/mo</span>
              </p>
              <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>100 posts · 50 repurposes</p>
            </div>
          </div>

          <Button
            appearance="primary"
            shouldFitContainer
            onClick={async () => {
              const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan: "growth" }),
              });
              if (res.ok) {
                const { url } = await res.json();
                window.location.href = url;
              }
            }}
          >
            Upgrade now
          </Button>

          <Button appearance="subtle" shouldFitContainer onClick={onClose}>
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
}

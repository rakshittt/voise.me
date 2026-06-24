"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EvalScore } from "@/lib/types";
import Heading from "@/components/ui/Heading";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lozenge } from "@/components/ui/Lozenge";
import { ProgressBar } from "@/components/ui/ProgressBar";

interface UserData {
  name: string;
  email: string;
  plan: string;
  generates_used: number;
  generates_limit: number;
  generates_unlimited: boolean;
  repurposes_used: number;
  repurposes_limit: number;
  repurposes_unlimited: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter - Free",
  growth: "Growth - $79/mo",
  pro: "Pro - $199/mo",
  trial: "Trial",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
      {children}
    </p>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{value || "-"}</p>
    </div>
  );
}

function UsageRow({ label, used, limit, unlimited }: { label: string; used: number; limit: number; unlimited?: boolean }) {
  if (unlimited) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-050)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{label}</span>
          <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-success)" }}>{used} / Unlimited</span>
        </div>
        <ProgressBar value={0} />
      </div>
    );
  }
  const pct = Math.min(1, used / limit);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-050)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{label}</span>
        <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)" }}>{used} / {limit}</span>
      </div>
      <ProgressBar value={pct} />
    </div>
  );
}

async function openPortal() {
  const res = await fetch("/api/billing/portal", { method: "POST" });
  if (res.ok) {
    const { url } = await res.json();
    window.open(url, "_blank");
  }
}

async function startCheckout(plan: string) {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
  if (res.ok) {
    const { url } = await res.json();
    window.location.href = url;
  }
}

export function SettingsPage() {
  const searchParams = useSearchParams();
  const showUpgrade = searchParams.get("upgrade") === "true";
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [evalScore, setEvalScore] = useState<EvalScore | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/voice-profile/eval-score")
      .then((r) => r.json())
      .then((d: EvalScore) => setEvalScore(d))
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "var(--ds-space-400) 0", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: "var(--ds-background-neutral)",
              borderRadius: "var(--ds-radius-200)",
              height: 120,
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--ds-space-400) 0", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)", maxWidth: 560 }}>
      {/* Account */}
      <Card elevation="raised" padding="default">
        <Heading size="small" as="h2">Account</Heading>
        <div style={{ marginTop: "var(--ds-space-200)", display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
          <FieldRow label="Name" value={data?.name ?? ""} />
          <FieldRow label="Email" value={data?.email ?? ""} />
        </div>
      </Card>

      {/* Plan + usage */}
      <Card elevation="raised" padding="default">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Heading size="small" as="h2">Plan</Heading>
          <Lozenge appearance="inprogress" isBold>
            {PLAN_LABELS[data?.plan ?? "starter"] ?? data?.plan}
          </Lozenge>
        </div>

        {data && (
          <div style={{ marginTop: "var(--ds-space-300)", display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
            <SectionLabel>Usage this billing period</SectionLabel>
            <UsageRow label="Post generations" used={data.generates_used} limit={data.generates_limit} unlimited={data.generates_unlimited} />
            <UsageRow label="Repurposes" used={data.repurposes_used} limit={data.repurposes_limit} unlimited={data.repurposes_unlimited} />
          </div>
        )}

        {(data?.plan === "starter" || showUpgrade) && (
          <div style={{ marginTop: "var(--ds-space-300)", paddingTop: "var(--ds-space-250)", borderTop: `1px solid var(--ds-border)`, display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
              Upgrade to get more generations and priority support.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => startCheckout("growth")}
                style={{
                  padding: "var(--ds-space-150)",
                  borderRadius: "var(--ds-radius-200)",
                  border: `2px solid var(--ds-border)`,
                  textAlign: "left",
                  cursor: "pointer",
                  background: "var(--ds-surface)",
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-brand)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
              >
                <div style={{ fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Growth</div>
                <div style={{ fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", margin: "var(--ds-space-050) 0" }}>$79<span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "normal", color: "var(--ds-text-subtle)" }}>/mo</span></div>
                <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>20 posts · 10 repurposes</div>
              </button>
              <button
                onClick={() => startCheckout("pro")}
                style={{
                  padding: "var(--ds-space-150)",
                  borderRadius: "var(--ds-radius-200)",
                  border: `2px solid var(--ds-border-brand)`,
                  textAlign: "left",
                  cursor: "pointer",
                  background: "var(--ds-background-brand-subtle)",
                  transition: "opacity 0.15s",
                }}
              >
                <div style={{ fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>Pro</div>
                <div style={{ fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", margin: "var(--ds-space-050) 0" }}>$199<span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "normal", color: "var(--ds-text-subtle)" }}>/mo</span></div>
                <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>100 posts · 50 repurposes</div>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Billing */}
      <Card elevation="raised" padding="default">
        <Heading size="small" as="h2">Billing</Heading>
        <p style={{ margin: "var(--ds-space-100) 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Manage your payment method and invoices in the Stripe customer portal.
        </p>
        <Button appearance="default" onClick={openPortal}>Open billing portal →</Button>
        <p style={{ margin: "var(--ds-space-100) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          Billing is handled securely by Stripe. Voise never stores your card details.
        </p>
      </Card>

      {/* Voice DNA Fidelity */}
      <Card elevation="raised" padding="default">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <Heading size="small" as="h2">Voice DNA Fidelity</Heading>
            <p style={{ margin: "var(--ds-space-050) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
              How closely generated posts match your actual writing style, measured against held-out posts from your corpus.
            </p>
          </div>
          {evalScore?.has_data && (
            <div style={{ textAlign: "right", marginLeft: "var(--ds-space-200)", flexShrink: 0 }}>
              <span style={{ fontSize: "var(--ds-font-size-600)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{evalScore.fidelity_pct}%</span>
              <p style={{ margin: "var(--ds-space-025) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
                {evalScore.eval_count} sample{evalScore.eval_count !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>

        {evalScore?.has_data ? (
          <div style={{ marginTop: "var(--ds-space-150)", display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
            <ProgressBar value={(evalScore.fidelity_pct ?? 0) / 100} />
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
              Cosine similarity between posts generated for your held-out ideas and the originals you actually wrote. Updates each time your Voice DNA rebuilds.
            </p>
          </div>
        ) : (
          <p style={{ margin: "var(--ds-space-150) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtlest)" }}>
            Fidelity score will appear after your Voice DNA has been built. It measures generation quality automatically on each rebuild.
          </p>
        )}
      </Card>

      <DangerZone />
    </div>
  );
}

function DangerZone() {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "Failed to delete account");
      }
      // Redirect to home after deletion - Clerk session will be invalidated server-side
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <Card elevation="raised" padding="default">
      <Heading size="small" as="h2">Danger zone</Heading>
      <p style={{ margin: "var(--ds-space-100) 0 var(--ds-space-200)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
        Permanently delete your account, Voice DNA, and all generated posts. This cannot be undone.
      </p>
      {error && (
        <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-danger)" }}>{error}</p>
      )}
      {confirming ? (
        <div style={{ display: "flex", gap: "var(--ds-space-150)", alignItems: "center" }}>
          <Button
            appearance="danger"
            isDisabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting…" : "Yes, delete everything"}
          </Button>
          <Button appearance="subtle" onClick={() => setConfirming(false)} isDisabled={deleting}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button appearance="danger" onClick={() => setConfirming(true)}>
          Delete account
        </Button>
      )}
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { Spinner } from "@/components/ui/Spinner";

interface CreatorContext {
  current_role: string;
  current_company: string;
  work_highlights: string;
  expertise_topics: string;
  credibility_markers: string;
}

const EMPTY: CreatorContext = {
  current_role: "",
  current_company: "",
  work_highlights: "",
  expertise_topics: "",
  credibility_markers: "",
};

function Field({
  label,
  hint,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  maxLength,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
}) {
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid var(--ds-border)",
    backgroundColor: "var(--ds-surface)",
    fontSize: "var(--ds-font-size-100)",
    color: "var(--ds-text)",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    lineHeight: 1.5,
    resize: multiline ? "vertical" : undefined,
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div>
        <label style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", display: "block" }}>
          {label}
        </label>
        <p style={{ margin: "2px 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{hint}</p>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-focused)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          style={inputStyle}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-focused)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
        />
      )}
      {maxLength && value.length > maxLength * 0.8 && (
        <span style={{ fontSize: 11, color: "var(--ds-text-subtlest)", textAlign: "right" }}>
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--ds-surface)",
        border: "1px solid var(--ds-border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--ds-border)", background: "var(--ds-surface-sunken)" }}>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{title}</p>
        <p style={{ margin: "2px 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>{description}</p>
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [ctx, setCtx] = useState<CreatorContext>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/context")
      .then((r) => r.json())
      .then((data) => {
        if (data.creator_context) setCtx({ ...EMPTY, ...data.creator_context });
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof CreatorContext) => (v: string) => setCtx((prev) => ({ ...prev, [key]: v }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account/context", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ctx),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const filled = Object.values(ctx).filter(Boolean).length;

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--ds-space-800) 0" }}>
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 720 }}>

      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
          Creator Profile
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", maxWidth: 560 }}>
          Tell Voise who you are. This context gets woven into every post so your generated content includes real specifics - not generic placeholders.
        </p>
      </div>

      {/* Completion nudge */}
      {filled < 3 && (
        <div style={{ padding: "12px 16px", background: "var(--ds-background-discovery)", border: "1px solid var(--ds-border-discovery)", borderRadius: 8, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-discovery)" }}>
          <strong>Tip:</strong> Fill in at least Work Highlights and Credibility - those two fields have the biggest impact on post quality.
        </div>
      )}

      {error && <SectionMessage appearance="error" title="Save failed">{error}</SectionMessage>}

      {/* Section 1: Current role */}
      <Section
        title="Your current role"
        description="Sets the professional lens for every post. Keeps generated content grounded in your actual position."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Job title"
            hint="What you do"
            value={ctx.current_role}
            onChange={set("current_role")}
            placeholder="e.g. Founder, Head of Product, Senior Engineer"
            maxLength={200}
          />
          <Field
            label="Company / organization"
            hint="Where you work"
            value={ctx.current_company}
            onChange={set("current_company")}
            placeholder="e.g. Acme Inc, Self-employed, YC S24"
            maxLength={200}
          />
        </div>
      </Section>

      {/* Section 2: Work you've done */}
      <Section
        title="Work you've done"
        description="Specific projects, companies, products, or milestones. Voise will reference these to make posts concrete and verifiable."
      >
        <Field
          label="Notable work & highlights"
          hint="Past roles, projects you built, companies you've worked at, or milestones you've hit"
          value={ctx.work_highlights}
          onChange={set("work_highlights")}
          placeholder={`e.g.\n- Built 0→1 B2B SaaS product that reached $2M ARR\n- Previously led product at Series B fintech (Stripe, Plaid integrations)\n- Founded and sold a bootstrapped analytics tool in 2021`}
          multiline
          rows={5}
          maxLength={2000}
        />
      </Section>

      {/* Section 3: Expertise */}
      <Section
        title="Topic expertise"
        description="The specific domains you write about with authority. Helps Voise pitch the right depth and use the right terminology."
      >
        <Field
          label="Areas of deep expertise"
          hint="List your core topics - the more specific the better"
          value={ctx.expertise_topics}
          onChange={set("expertise_topics")}
          placeholder="e.g. B2B SaaS pricing strategy, developer tooling, early-stage hiring, product-led growth, LLM application development"
          multiline
          rows={3}
          maxLength={1000}
        />
      </Section>

      {/* Section 4: Credibility */}
      <Section
        title="Credibility & social proof"
        description="Awards, publications, speaking slots, metrics, notable clients. These add authority without self-promotion - used sparingly and naturally."
      >
        <Field
          label="Credentials & achievements"
          hint="Anything that gives you earned authority to speak on your topics"
          value={ctx.credibility_markers}
          onChange={set("credibility_markers")}
          placeholder={`e.g.\n- Forbes 30 Under 30, 2023\n- Speaker at SaaStr Annual and ProductCon\n- Guest author in Harvard Business Review\n- Grew team NPS from 22 to 71 in 18 months\n- Advising 3 YC companies`}
          multiline
          rows={4}
          maxLength={1000}
        />
      </Section>

      {/* Save */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button appearance="primary" onClick={handleSave} isDisabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        {saved && (
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-success)", fontWeight: "var(--ds-font-weight-semibold)" }}>
            ✓ Saved - will apply to your next generated post
          </span>
        )}
      </div>
    </div>
  );
}

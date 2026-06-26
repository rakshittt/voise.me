"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/Nav";
import { MarketingFooter } from "@/components/marketing/Footer";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in-view"); obs.disconnect(); } },
      { rootMargin: "-40px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, style, delay }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal" style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}>{children}</div>;
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.maxHeight = open ? el.scrollHeight + "px" : "0";
  }, [open]);
  return (
    <div style={{ border: `1px solid ${open ? "var(--ds-border-brand)" : "var(--ds-border)"}`, borderRadius: "var(--ds-radius-200)", overflow: "hidden", transition: "border-color 0.2s" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: open ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)", border: "none", cursor: "pointer", textAlign: "left", gap: 16 }}>
        <span style={{ fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{q}</span>
        <span style={{ flexShrink: 0, color: "var(--ds-text-subtlest)", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "none", fontSize: 18 }}>⌄</span>
      </button>
      <div ref={bodyRef} style={{ maxHeight: 0, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <p style={{ margin: 0, padding: "0 20px 18px", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)" }}>{a}</p>
      </div>
    </div>
  );
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l3 3 7-7" />
  </svg>
);
const DashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M3 7h8" />
  </svg>
);
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

/* ── Feature matrix ─────────────────────────────────────────────────────── */
const MATRIX = [
  {
    section: "🧬 Voice DNA",
    rows: [
      { feature: "Voice DNA fingerprint build", starter: true, growth: true },
      { feature: "Sources: LinkedIn posts",          starter: true, growth: true },
      { feature: "Sources: Blog URLs & transcripts", starter: true, growth: true },
      { feature: "Zero-post onboarding (7 questions)", starter: true, growth: true },
      { feature: "Automatic fingerprint updates",    starter: true, growth: true },
    ],
  },
  {
    section: "⚡ Generation",
    rows: [
      { feature: "Generations per month",            starter: "20", growth: "Unlimited" },
      { feature: "Repurposes per month",             starter: "5",  growth: "Unlimited" },
      { feature: "Variants per generation",          starter: "3",  growth: "3" },
      { feature: "Voice match score on every draft", starter: true, growth: true },
      { feature: "AI refinement chat",               starter: true, growth: true },
    ],
  },
  {
    section: "💡 Ideas & Inspiration",
    rows: [
      { feature: "Idea recommendations",             starter: false, growth: true },
      { feature: "Ideas based on voice patterns",    starter: false, growth: true },
    ],
  },
  {
    section: "📊 History & Analytics",
    rows: [
      { feature: "Full generation history",          starter: true, growth: true },
      { feature: "Search & filter posts",            starter: true, growth: true },
      { feature: "Avg voice score trend",            starter: true, growth: true },
      { feature: "Copy-without-edit rate tracking",  starter: false, growth: true },
    ],
  },
  {
    section: "🎖️ Support",
    rows: [
      { feature: "Community support",                starter: true,  growth: true },
      { feature: "Priority support",                 starter: false, growth: true },
      { feature: "14-day free trial",                starter: false, growth: true },
    ],
  },
];

const FAQS = [
  {
    q: "What counts as one generation?",
    a: "Each time you submit an idea, Voise produces 3 scored post variants - that counts as 1 generation. Refining a variant in the AI chat does not count against your generation limit.",
  },
  {
    q: "What happens when I hit the Starter limit?",
    a: "You'll see a clear notification before you run out. You can upgrade to Growth at any time to unlock unlimited generations. We never cut you off mid-session.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade at any time - access unlocks immediately. Downgrade takes effect at the end of your current billing period. No lock-in.",
  },
  {
    q: "Is the 14-day trial really free?",
    a: "Yes. The Growth trial gives you full access to every feature for 14 days - unlimited generations, idea recommendations, and priority support. No charge until the trial ends. Cancel any time before that with no cost.",
  },
  {
    q: "Do you offer annual pricing?",
    a: "Annual pricing is coming soon. If you'd like to lock in a discount, reach out to us and we'll work something out.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards via Stripe. Invoicing is available on annual plans.",
  },
];

function MatrixCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{value}</span>;
  }
  if (value) return <span style={{ color: "var(--ds-icon-success)" }}><CheckIcon /></span>;
  return <span style={{ color: "var(--ds-text-subtlest)" }}><DashIcon /></span>;
}

export default function PricingPage() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ backgroundColor: "var(--ds-background-default)", minHeight: "100vh" }}>
      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", borderBottom: "1px solid var(--ds-border)", padding: "64px 24px 72px", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", animation: mounted ? "fadeInUp 0.45s both" : "none" }}>
          <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Pricing</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 14px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Simple, honest pricing.
          </h1>
          <p style={{ fontSize: "var(--ds-font-size-200)", color: "var(--ds-text-subtle)", margin: 0, lineHeight: 1.65 }}>
            Start free - no card required. Upgrade when you&apos;re ready.<br />No lock-in. No surprises.
          </p>
        </div>
      </section>

      {/* ── PLAN CARDS ────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-default)", padding: "56px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Starter */}
          <Reveal>
            <div style={{ backgroundColor: "var(--ds-surface)", border: "1.5px solid var(--ds-border)", borderRadius: "var(--ds-radius-300)", padding: "var(--ds-space-500)", height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ marginBottom: "auto" }}>
                <div style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Starter</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 52, fontWeight: 900, color: "var(--ds-text)", lineHeight: 1, letterSpacing: "-0.05em" }}>Free</span>
                </div>
                <p style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", margin: "0 0 var(--ds-space-400)", lineHeight: 1.55 }}>
                  Build your Voice DNA and start generating. No card required, ever.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 var(--ds-space-400)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { e: "🧬", t: "Full Voice DNA fingerprint" },
                    { e: "⚡", t: "20 generations per month" },
                    { e: "🔄", t: "5 repurposes per month" },
                    { e: "🎯", t: "Voice match score on every draft" },
                    { e: "💬", t: "AI refinement chat" },
                    { e: "📊", t: "Full generation history" },
                  ].map(({ e, t }) => (
                    <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", lineHeight: 1.45 }}>
                      <span style={{ flexShrink: 0, fontSize: 15 }}>{e}</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: "var(--ds-radius-200)", border: "1.5px solid var(--ds-border-brand)", color: "var(--ds-text-brand)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none", marginTop: "var(--ds-space-300)" }}>
                Start free - no card
              </Link>
            </div>
          </Reveal>

          {/* Growth */}
          <Reveal delay={80}>
            <div style={{ backgroundColor: "var(--ds-background-brand-bold)", border: "none", borderRadius: "var(--ds-radius-300)", padding: "var(--ds-space-500)", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
              <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--ds-background-warning-bold)", color: "var(--ds-text)", fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", padding: "3px 14px", borderRadius: "var(--ds-radius-400)", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Most popular
              </div>
              <div style={{ marginBottom: "auto" }}>
                <div style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>Growth</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 52, fontWeight: 900, color: "var(--ds-text-inverse)", lineHeight: 1, letterSpacing: "-0.05em" }}>$29</span>
                  <span style={{ fontSize: "var(--ds-font-size-100)", color: "rgba(255,255,255,0.55)" }}>/month</span>
                </div>
                <p style={{ fontSize: "var(--ds-font-size-075)", color: "rgba(255,255,255,0.6)", margin: "0 0 var(--ds-space-400)", lineHeight: 1.55 }}>
                  For professionals who post consistently - every single week.
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 var(--ds-space-400)", display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { e: "✨", t: "Everything in Starter" },
                    { e: "∞",  t: "Unlimited generations" },
                    { e: "∞",  t: "Unlimited repurposes" },
                    { e: "💡", t: "Idea recommendations" },
                    { e: "📈", t: "Copy-without-edit rate tracking" },
                    { e: "🎖️", t: "Priority support" },
                    { e: "🎁", t: "14-day free trial" },
                  ].map(({ e, t }) => (
                    <li key={t} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "var(--ds-font-size-100)", color: "rgba(255,255,255,0.9)", lineHeight: 1.45 }}>
                      <span style={{ flexShrink: 0, fontSize: 15 }}>{e}</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: "var(--ds-radius-200)", backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none", marginTop: "var(--ds-space-300)" }}>
                Start 14-day free trial
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Trust line */}
        <p style={{ textAlign: "center", marginTop: 20, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          Secure payment via Stripe · Cancel any time · No hidden fees
        </p>
      </section>

      {/* ── FEATURE MATRIX ────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Reveal style={{ marginBottom: 40, textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
              Full feature comparison
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", margin: 0 }}>
              Everything that ships with each plan.
            </p>
          </Reveal>

          <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", overflow: "hidden" }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", borderBottom: "2px solid var(--ds-border)", backgroundColor: "var(--ds-surface-sunken)" }}>
              <div style={{ padding: "14px 20px", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Feature</div>
              <div style={{ padding: "14px 20px", textAlign: "center", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Starter</div>
              <div style={{ padding: "14px 20px", textAlign: "center", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Growth</div>
            </div>

            {MATRIX.map((section) => (
              <div key={section.section}>
                {/* Section header */}
                <div style={{ padding: "10px 20px", backgroundColor: "var(--ds-background-neutral-subtle)", borderTop: "1px solid var(--ds-border)", borderBottom: "1px solid var(--ds-border)" }}>
                  <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{section.section}</span>
                </div>
                {section.rows.map((row, ri) => (
                  <div key={row.feature} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px", borderBottom: ri < section.rows.length - 1 ? "1px solid var(--ds-border)" : "none" }}>
                    <div style={{ padding: "13px 20px", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>{row.feature}</div>
                    <div style={{ padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MatrixCell value={row.starter} />
                    </div>
                    <div style={{ padding: "13px 20px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,82,204,0.02)" }}>
                      <MatrixCell value={row.growth} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-default)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
              Pricing questions
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", margin: 0 }}>
              Everything you need to know before you commit to nothing.
            </p>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-brand-bold)", padding: "72px 24px" }}>
        <Reveal style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, color: "var(--ds-text-inverse)", margin: "0 0 14px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Start building your voice today.
          </h2>
          <p style={{ fontSize: "var(--ds-font-size-200)", color: "rgba(255,255,255,0.65)", margin: "0 0 32px" }}>
            Free forever. No card. No obligations.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", padding: "12px 24px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none" }}>
              Start free <ArrowRight />
            </Link>
            <Link href="/features" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.12)", color: "var(--ds-text-inverse)", border: "1px solid rgba(255,255,255,0.25)", padding: "12px 22px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-medium)", textDecoration: "none" }}>
              Explore features
            </Link>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

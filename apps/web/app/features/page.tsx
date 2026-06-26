"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/Nav";
import { MarketingFooter } from "@/components/marketing/Footer";

/* ── Hooks ──────────────────────────────────────────────────────────────── */
function useReveal(rootMargin = "-48px") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("in-view"); obs.disconnect(); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return ref;
}

function Reveal({ children, style, delay }: { children: React.ReactNode; style?: React.CSSProperties; delay?: number }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal" style={{ transitionDelay: delay ? `${delay}ms` : undefined, ...style }}>{children}</div>;
}
function RevealLeft({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal-left" style={style}>{children}</div>;
}
function RevealRight({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal-right" style={style}>{children}</div>;
}

/* ── Icons ──────────────────────────────────────────────────────────────── */
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l3 3 7-7" />
  </svg>
);
const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

/* ── Dimension bar visual ────────────────────────────────────────────────── */
const DIMENSIONS = [
  { label: "Hook style",          pct: 82 },
  { label: "Sentence rhythm",     pct: 68 },
  { label: "Vocabulary register", pct: 91 },
  { label: "Post structure",      pct: 74 },
  { label: "Paragraph breaks",    pct: 87 },
  { label: "CTA style",           pct: 60 },
  { label: "Epistemic stance",    pct: 79 },
  { label: "Self-reference",      pct: 88 },
  { label: "Emotional register",  pct: 72 },
  { label: "Signature phrases",   pct: 93 },
  { label: "Belief stances",      pct: 65 },
];

function DimensionBar({ label, pct, delay }: { label: string; pct: number; delay: number }) {
  const ref = useReveal("-10px");
  const barColor =
    pct >= 80 ? "var(--ds-background-success-bold)"
    : pct >= 65 ? "var(--ds-background-brand-bold)"
    : "var(--ds-background-warning-bold)";
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms` }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", fontWeight: "var(--ds-font-weight-medium)" }}>{label}</span>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontWeight: "var(--ds-font-weight-semibold)" }}>{pct}%</span>
      </div>
      <div style={{ height: 5, backgroundColor: "var(--ds-background-neutral)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, backgroundColor: barColor, animation: `barGrow 0.9s ${delay}ms cubic-bezier(0.16,1,0.3,1) both` }} />
      </div>
    </div>
  );
}

/* ── Idea card mock ─────────────────────────────────────────────────────── */
const IDEA_CARDS = [
  { tag: "Insight", score: 84, text: "The counterintuitive reason most LinkedIn advice backfires for founders" },
  { tag: "Story",   score: 91, text: "What I learned from posting daily for 30 days (it wasn't what I expected)" },
  { tag: "How-to",  score: 78, text: "3 things I stopped doing on LinkedIn that doubled my engagement" },
];

/* ── Chat mock ──────────────────────────────────────────────────────────── */
const CHAT_MESSAGES = [
  { role: "user", text: "Make the hook bolder" },
  { role: "assistant", score: 79, preview: "Most founders treat LinkedIn like a résumé.\n\nIt's not. It's a conversation you're not having.\n\nHere's what changed when I started posting like I talk…" },
  { role: "user", text: "Cut the length by a third" },
  { role: "assistant", score: 88, preview: "Most founders treat LinkedIn like a résumé.\n\nWrong room. Wrong format. Wrong game.\n\nHere's what actually works…" },
];

/* ── History mock ────────────────────────────────────────────────────────── */
const HISTORY_ITEMS = [
  { date: "Today",     hook: "The mistake I see founders make every week on LinkedIn is...",    score: 91, type: "Idea" },
  { date: "Yesterday", hook: "3 things I stopped doing that doubled my engagement rate",         score: 88, type: "Idea" },
  { date: "Jun 20",    hook: "Why consistency beats virality every single time",                 score: 85, type: "Repurposed" },
  { date: "Jun 18",    hook: "What nobody tells you about building a personal brand in B2B",    score: 76, type: "Idea" },
];

/* ── Feature sections data ───────────────────────────────────────────────── */
const FEATURES = [
  {
    id: "voice-dna",
    emoji: "🧬",
    tag: "Core",
    title: "Voice DNA",
    headline: "Your writing has a fingerprint. We map every dimension of it.",
    desc: "Most AI writing tools treat style as a single dial - formal vs casual. That's not how voice works. Voise extracts the dimensions of your writing and builds a private model that belongs only to you. Every generated post is scored against it before you see it.",
    bullets: [
      "Builds from LinkedIn posts, blog URLs, or transcripts",
      "Zero-post onboarding: answer 7 questions to create a seed profile",
      "Updates automatically as you generate and refine",
      "Nobody else's writing influences your model",
    ],
  },
  {
    id: "score",
    emoji: "🎯",
    tag: "Scoring engine",
    title: "Voice Match Score",
    headline: "A number from 0 to 100 on every draft. Not a feeling.",
    desc: "Every generated variant is evaluated against your fingerprint before you see it. The score tells you where it stands - across hook, rhythm, vocabulary, CTA, and the rest. Above 85 means it genuinely sounds like you. Below 60 means regenerate.",
    bullets: [
      "Scored before you read it - no bias from seeing the content first",
      "Highlights which dimensions are off and by how much",
      "Score improves as the model learns your feedback",
      "Copy-without-edit rate tracked over time on Growth",
    ],
  },
  {
    id: "ideas",
    emoji: "💡",
    tag: "Inspiration",
    title: "Idea Recommendations",
    headline: "Never stare at a blank page again.",
    desc: "When you don't know what to write about, Voise surfaces ideas calibrated to your voice patterns, your proven topics, and your audience's engagement history. Every recommendation is already in your wheelhouse - not a generic prompt, a specific starting point.",
    bullets: [
      "Ideas based on your content patterns and voice fingerprint",
      "Ranked by how well they fit your established style",
      "One click to start generating from any idea",
      "Refreshes with new angles when you want them",
    ],
  },
  {
    id: "refine",
    emoji: "💬",
    tag: "Iterative writing",
    title: "Refine with AI",
    headline: "Tell it what's wrong. The next version knows.",
    desc: "Refinement isn't regeneration. When you tell Voise to make the hook bolder or cut the length by a third, it adapts the specific draft - holding everything else constant. Quick chips make common refinements one click. The score updates with every iteration.",
    bullets: [
      "Real-time feedback loop in the same session",
      "Quick chips: make hook bolder, cut by half, add a story, remove jargon",
      "Voice match score updates after every refinement",
      "Prior instructions are remembered within the session",
    ],
  },
  {
    id: "history",
    emoji: "📊",
    tag: "Progress tracking",
    title: "History & Analytics",
    headline: "Every post saved, searchable, and scored.",
    desc: "Your full generation history is always available - search by content, filter by type, group by date. More importantly, Voise tracks how your average voice match score trends over time. The copy-without-edit rate tells you objectively how much the model has learned you.",
    bullets: [
      "Searchable history of every post you've generated",
      "Filter by type: Idea vs Repurposed",
      "Date-grouped: Today, Yesterday, This week, by month",
      "Avg score and copy-without-edit rate trending over time",
    ],
  },
];

/* ── Feature section component ───────────────────────────────────────────── */
function FeatureSection({ feature, idx }: { feature: typeof FEATURES[0]; idx: number }) {
  const isEven = idx % 2 === 0;
  const bg = isEven ? "var(--ds-background-default)" : "var(--ds-surface-sunken)";

  return (
    <section id={feature.id} style={{ backgroundColor: bg, padding: "88px 24px", scrollMarginTop: 72 }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 64, alignItems: "center" }}>

        {/* Copy - alternates sides */}
        <div style={{ order: isEven ? 0 : 1 }}>
          {isEven ? (
            <RevealLeft>
              <FeatureCopy feature={feature} />
            </RevealLeft>
          ) : (
            <RevealRight>
              <FeatureCopy feature={feature} />
            </RevealRight>
          )}
        </div>

        {/* Visual */}
        <div style={{ order: isEven ? 1 : 0 }}>
          {isEven ? (
            <RevealRight>
              <FeatureVisual id={feature.id} />
            </RevealRight>
          ) : (
            <RevealLeft>
              <FeatureVisual id={feature.id} />
            </RevealLeft>
          )}
        </div>
      </div>
    </section>
  );
}

function FeatureCopy({ feature }: { feature: typeof FEATURES[0] }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 28 }}>{feature.emoji}</span>
        <span style={{ display: "inline-block", fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", backgroundColor: "var(--ds-background-brand-subtle)", borderRadius: "var(--ds-radius-400)", padding: "3px 10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {feature.tag}
        </span>
      </div>
      <h2 style={{ fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
        {feature.headline}
      </h2>
      <p style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)", margin: "0 0 24px" }}>
        {feature.desc}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {feature.bullets.map((b) => (
          <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", lineHeight: 1.5 }}>
            <span style={{ color: "var(--ds-icon-success)", flexShrink: 0, marginTop: 2 }}><CheckIcon /></span>{b}
          </li>
        ))}
      </ul>
    </>
  );
}

/* ── Feature visuals (mocks) ─────────────────────────────────────────────── */
function FeatureVisual({ id }: { id: string }) {
  if (id === "voice-dna") return <VoiceDNAVisual />;
  if (id === "score")     return <ScoreVisual />;
  if (id === "ideas")     return <IdeasVisual />;
  if (id === "refine")    return <RefineVisual />;
  if (id === "history")   return <HistoryVisual />;
  return null;
}

function VoiceDNAVisual() {
  return (
    <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", padding: "var(--ds-space-300)", boxShadow: "var(--ds-shadow-raised)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ds-space-250)" }}>
        <div>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Voice DNA</p>
          <p style={{ margin: "3px 0 0", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>Your personal fingerprint</p>
        </div>
        <div style={{ backgroundColor: "var(--ds-background-success)", borderRadius: "var(--ds-radius-150)", padding: "6px 12px" }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: "var(--ds-text-success)", letterSpacing: "-0.04em" }}>87<span style={{ fontSize: 10, opacity: 0.75 }}>%</span></span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {DIMENSIONS.map((d, i) => <DimensionBar key={d.label} label={d.label} pct={d.pct} delay={i * 40} />)}
      </div>
    </div>
  );
}

function ScoreVisual() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Bad */}
      <div style={{ backgroundColor: "var(--ds-surface)", border: "1.5px solid var(--ds-border-danger)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
        <div style={{ backgroundColor: "var(--ds-background-danger)", borderBottom: "1px solid var(--ds-border-danger)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-danger)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Generic AI output</span>
          <span style={{ backgroundColor: "var(--ds-background-danger)", color: "var(--ds-text-danger)", border: "1px solid var(--ds-border-danger)", borderRadius: "var(--ds-radius-150)", padding: "2px 8px", fontWeight: "var(--ds-font-weight-bold)", fontSize: "var(--ds-font-size-075)" }}>34% match</span>
        </div>
        <p style={{ margin: 0, padding: "12px 16px", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: 1.6 }}>
          In today&apos;s fast-paced digital landscape, it&apos;s more important than ever to leverage synergies and drive impactful outcomes…
        </p>
      </div>
      {/* Good */}
      <div style={{ backgroundColor: "var(--ds-surface)", border: "1.5px solid var(--ds-border-success)", borderRadius: "var(--ds-radius-200)", overflow: "hidden" }}>
        <div style={{ backgroundColor: "var(--ds-background-success)", borderBottom: "1px solid var(--ds-border-success)", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Voise output</span>
          <span style={{ backgroundColor: "var(--ds-background-success)", color: "var(--ds-text-success)", border: "1px solid var(--ds-border-success)", borderRadius: "var(--ds-radius-150)", padding: "2px 8px", fontWeight: "var(--ds-font-weight-bold)", fontSize: "var(--ds-font-size-075)" }}>91% match</span>
        </div>
        <p style={{ margin: 0, padding: "12px 16px", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.6 }}>
          The biggest mistake I see founders make on LinkedIn isn&apos;t posting too little. It&apos;s posting what they think their audience wants to hear…
        </p>
      </div>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", textAlign: "center" }}>
        Same idea. Scored before you read it.
      </p>
    </div>
  );
}

function IdeasVisual() {
  return (
    <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", overflow: "hidden", boxShadow: "var(--ds-shadow-raised)" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface-sunken)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>Ideas for you</span>
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)", cursor: "pointer" }}>↺ Refresh</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {IDEA_CARDS.map((idea, i) => (
          <div key={idea.text} style={{ padding: "16px 18px", borderBottom: i < IDEA_CARDS.length - 1 ? "1px solid var(--ds-border)" : "none", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", backgroundColor: "var(--ds-background-brand-subtle)", padding: "2px 7px", borderRadius: "var(--ds-radius-400)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{idea.tag}</span>
                <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", backgroundColor: "var(--ds-background-success)", padding: "2px 7px", borderRadius: "var(--ds-radius-400)" }}>{idea.score}% fit</span>
              </div>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.5 }}>{idea.text}</p>
            </div>
            <button style={{ flexShrink: 0, padding: "5px 12px", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", border: "none", borderRadius: "var(--ds-radius-150)", cursor: "pointer" }}>
              Write
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefineVisual() {
  return (
    <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", overflow: "hidden", boxShadow: "var(--ds-shadow-raised)" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--ds-background-brand-bold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ds-text-inverse)", fontSize: 12, flexShrink: 0 }}>✦</div>
        <div>
          <div style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>Refine with AI</div>
          <div style={{ fontSize: "var(--ds-font-size-050)", color: "var(--ds-text-subtlest)" }}>Voice fingerprint stays locked - only the phrasing changes</div>
        </div>
      </div>
      {/* Chat */}
      <div style={{ padding: "var(--ds-space-200)", display: "flex", flexDirection: "column", gap: 10, backgroundColor: "var(--ds-surface-sunken)" }}>
        {CHAT_MESSAGES.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ maxWidth: "75%", padding: "8px 12px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "16px 16px 3px 16px", fontSize: "var(--ds-font-size-075)", lineHeight: 1.5 }}>
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Refined version</span>
                <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", backgroundColor: "var(--ds-background-success)", padding: "2px 7px", borderRadius: "var(--ds-radius-400)" }}>{msg.score}%</span>
              </div>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.preview}</p>
            </div>
          )
        )}
      </div>
      {/* Chips */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface)", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["Make hook bolder", "Cut by half", "Add a story", "More direct"].map((chip) => (
          <span key={chip} style={{ padding: "4px 10px", fontSize: "var(--ds-font-size-075)", border: "1px solid var(--ds-border-brand)", color: "var(--ds-text-brand)", borderRadius: "var(--ds-radius-400)", cursor: "pointer", backgroundColor: "var(--ds-background-brand-subtle)" }}>{chip}</span>
        ))}
      </div>
    </div>
  );
}

function HistoryVisual() {
  return (
    <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", overflow: "hidden", boxShadow: "var(--ds-shadow-raised)" }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--ds-border)" }}>
        {[
          { label: "Total generated", val: "47" },
          { label: "Avg score",       val: "84%" },
          { label: "Best score",      val: "93%" },
        ].map((stat) => (
          <div key={stat.label} style={{ padding: "12px 16px", textAlign: "center", borderRight: "1px solid var(--ds-border)" }}>
            <div style={{ fontSize: "var(--ds-font-size-300)", fontWeight: 900, color: "var(--ds-text)", letterSpacing: "-0.03em" }}>{stat.val}</div>
            <div style={{ fontSize: "var(--ds-font-size-050)", color: "var(--ds-text-subtlest)", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      {/* History rows */}
      <div style={{ padding: "var(--ds-space-150)", display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ margin: "0 0 6px", fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Recent</p>
        {HISTORY_ITEMS.map((item) => (
          <div key={item.hook} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", backgroundColor: "var(--ds-surface-sunken)", borderRadius: "var(--ds-radius-150)", border: "1px solid var(--ds-border)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: "0 0 4px", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.hook}</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: "var(--ds-font-size-050)", color: "var(--ds-text-subtlest)" }}>{item.date}</span>
                <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-semibold)", color: item.type === "Repurposed" ? "var(--ds-text-discovery)" : "var(--ds-text-brand)", backgroundColor: item.type === "Repurposed" ? "var(--ds-background-discovery)" : "var(--ds-background-brand-subtle)", padding: "1px 6px", borderRadius: "var(--ds-radius-400)" }}>{item.type}</span>
              </div>
            </div>
            <span style={{ flexShrink: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", backgroundColor: "var(--ds-background-success)", padding: "2px 7px", borderRadius: "var(--ds-radius-400)" }}>{item.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function FeaturesPage() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ backgroundColor: "var(--ds-background-default)", minHeight: "100vh" }}>
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-brand-bold)", padding: "72px 24px 80px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", animation: mounted ? "fadeInUp 0.45s both" : "none" }}>
          <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>Features</p>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "var(--ds-text-inverse)", margin: "0 0 16px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Everything you need to publish consistently in your own voice.
          </h1>
          <p style={{ fontSize: "var(--ds-font-size-200)", color: "rgba(255,255,255,0.7)", margin: "0 0 32px", lineHeight: 1.65, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            Five integrated tools. One flywheel. The longer you use it, the better it knows you.
          </p>
          <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", padding: "12px 24px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none" }}>
            Start free - no card <ArrowRight />
          </Link>
        </div>
      </section>

      {/* ── FEATURE NAV ──────────────────────────────── */}
      <div style={{ backgroundColor: "var(--ds-surface)", borderBottom: "1px solid var(--ds-border)", padding: "0 24px", position: "sticky", top: 56, zIndex: 90, overflowX: "auto" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", display: "flex", gap: 0, minWidth: "max-content" }}>
          {FEATURES.map((f) => (
            <a key={f.id} href={`#${f.id}`} style={{ display: "flex", alignItems: "center", gap: 6, padding: "14px 20px", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textDecoration: "none", borderBottom: "2px solid transparent", whiteSpace: "nowrap" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ds-text-brand)"; e.currentTarget.style.borderBottomColor = "var(--ds-border-brand)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ds-text-subtle)"; e.currentTarget.style.borderBottomColor = "transparent"; }}>
              <span>{f.emoji}</span> {f.title}
            </a>
          ))}
        </div>
      </div>

      {/* ── FEATURE SECTIONS ──────────────────────────── */}
      {FEATURES.map((feature, idx) => (
        <FeatureSection key={feature.id} feature={feature} idx={idx} />
      ))}

      {/* ── HOW THEY CONNECT ──────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-brand-bold)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <Reveal>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 14px" }}>The flywheel</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 40px)", fontWeight: 900, color: "var(--ds-text-inverse)", margin: "0 0 20px", letterSpacing: "-0.04em", lineHeight: 1.06 }}>
              Five features. One compounding system.
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-200)", color: "rgba(255,255,255,0.65)", margin: "0 auto 48px", maxWidth: 540, lineHeight: 1.7 }}>
              Voice DNA trains the model. The Score tells you when a draft is ready. Ideas fill the blank page. Refinement adapts in real time. History shows your score trending up. Each one feeds the next.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 2, marginBottom: 48 }}>
            {[
              { step: "01", emoji: "🧬", label: "Voice DNA",  sub: "Builds your model"     },
              { step: "02", emoji: "🎯", label: "Score",       sub: "Validates every draft" },
              { step: "03", emoji: "💡", label: "Ideas",       sub: "Fills the blank page"  },
              { step: "04", emoji: "💬", label: "Refine",      sub: "Adapts in real time"   },
              { step: "05", emoji: "📊", label: "History",     sub: "Shows you improving"   },
            ].map((item, i) => (
              <FlyWheelCard key={item.step} item={item} delay={i * 70} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", padding: "12px 24px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none" }}>
              Start building your voice <ArrowRight />
            </Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.12)", color: "var(--ds-text-inverse)", border: "1px solid rgba(255,255,255,0.25)", padding: "12px 22px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-medium)", textDecoration: "none" }}>
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

function FlyWheelCard({ item, delay }: { item: { step: string; emoji: string; label: string; sub: string }; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--ds-radius-200)", padding: "20px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{item.emoji}</div>
      <div style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "rgba(255,255,255,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>{item.step}</div>
      <div style={{ fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-inverse)", marginBottom: 4 }}>{item.label}</div>
      <div style={{ fontSize: "var(--ds-font-size-075)", color: "rgba(255,255,255,0.5)" }}>{item.sub}</div>
    </div>
  );
}

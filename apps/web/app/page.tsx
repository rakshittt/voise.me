"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MarketingNav } from "@/components/marketing/Nav";
import { MarketingFooter } from "@/components/marketing/Footer";

/* ── Scroll-reveal hook ─────────────────────────────────────────────────── */
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

/* Wrapper components - each owns exactly one hook call */
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

/* ── Animated count-up ──────────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / 1200, 1);
          setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { rootMargin: "-20px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{value}{suffix}</span>;
}

/* ── FAQ accordion ──────────────────────────────────────────────────────── */
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
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 16, backgroundColor: open ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)" }}>
        <span style={{ fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", letterSpacing: "-0.01em" }}>{q}</span>
        <span style={{ flexShrink: 0, color: "var(--ds-text-subtlest)", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "none", fontSize: 18, lineHeight: 1 }}>⌄</span>
      </button>
      <div ref={bodyRef} style={{ maxHeight: 0, overflow: "hidden", transition: "max-height 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <p style={{ margin: 0, padding: "0 20px 18px", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)" }}>{a}</p>
      </div>
    </div>
  );
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


/* ── Score ring ──────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 96, strokeW = 8, color, track }: {
  score: number; size?: number; strokeW?: number; color: string; track: string;
}) {
  const [num, setNum] = useState(0);
  const [active, setActive] = useState(false);
  const divRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = divRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        setActive(true);
        const t0 = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - t0) / 1500, 1);
          setNum(Math.round((1 - Math.pow(1 - t, 3)) * score));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { rootMargin: "-30px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [score]);
  const r = (size - strokeW * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = active ? circ * (1 - score / 100) : circ;
  return (
    <div ref={divRef} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={strokeW} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
          strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color, letterSpacing: "-0.04em", fontVariantNumeric: "tabular-nums" }}>
          {num}%
        </span>
      </div>
    </div>
  );
}

/* ── Hero live score ticker ──────────────────────────────────────────────── */
function HeroLiveScore() {
  const [v, setV] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const tid = setTimeout(() => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - t0) / 2400, 1);
        setV(Math.round((1 - Math.pow(1 - t, 3)) * 91));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, 700);
    return () => clearTimeout(tid);
  }, []);
  return <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 900, color: "#4ade80" }}>{v}%</span>;
}

/* ── Testimonial marquee ─────────────────────────────────────────────────── */
function TestimonialMarquee({ testimonials }: { testimonials: typeof TESTIMONIALS }) {
  const doubled = [...testimonials, ...testimonials];
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      {/* Fade left / right edges */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(90deg, var(--ds-background-default) 0%, transparent 10%, transparent 90%, var(--ds-background-default) 100%)" }} />
      <div className="marquee-track" style={{ display: "flex", gap: 20, width: "max-content" }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ width: 340, flexShrink: 0, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 5 }).map((_, j) => <span key={j} style={{ color: "#f59e0b", fontSize: 13 }}>★</span>)}
            </div>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text)", lineHeight: 1.65, flex: 1 }}>&ldquo;{t.quote}&rdquo;</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid var(--ds-border)" }}>
              <div>
                <div style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{t.author}</div>
                <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", marginTop: 1 }}>{t.role}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: "var(--ds-font-weight-bold)", backgroundColor: "var(--ds-background-success)", color: "var(--ds-text-success)", borderRadius: "var(--ds-radius-150)", padding: "2px 9px" }}>
                🎯 {t.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Data ───────────────────────────────────────────────────────────────── */
const STATS = [
  { value: 500, suffix: "+", emoji: "👥", label: "Creators using Voise" },
  { value: 3,   suffix: "×", emoji: "✨", label: "More accurate than generic AI" },
  { value: 87,  suffix: "%", emoji: "🎯", label: "Avg voice match score" },
  { value: 2,   suffix: "h", emoji: "⏱️", label: "Saved per post, per week" },
];

const PROBLEMS = [
  {
    icon: "🕐",
    title: "It takes 2–3 hours per post",
    desc: "Every time you sit down to write, you're starting from scratch. Researching, drafting, editing, second-guessing. By the time it's done, you've spent your best thinking hours on one post.",
  },
  {
    icon: "🤖",
    title: "Generic AI sounds like everyone else",
    desc: "ChatGPT, Gemini, every AI writing tool - they're trained on the same internet. The output is averaged across millions of users. Your post ends up sounding like everyone else using the same tool.",
  },
  {
    icon: "🔄",
    title: "Consistency is the real problem",
    desc: "You post well for two weeks, then life happens. The algorithm punishes inconsistency. Your audience drifts. And every time you restart, you're building back from zero.",
  },
];

const HOW_IT_WORKS = [
  {
    n: "01",
    emoji: "📄",
    title: "Add your writing",
    desc: "Paste your LinkedIn posts, drop a blog URL, or add a transcript. No posts yet? Answer 7 questions and we build your seed profile from scratch.",
    tag: "Setup · 5 minutes",
  },
  {
    n: "02",
    emoji: "🧬",
    title: "We build your Voice DNA",
    desc: "Our model analyzes your writing across multiple dimensions - hook style, sentence rhythm, vocabulary, CTA patterns, belief stances, and more. This is your personal fingerprint.",
    tag: "Automatic",
  },
  {
    n: "03",
    emoji: "⚡",
    title: "Generate & score",
    desc: "Describe your idea. Get 3 post variants, each scored 0–100 against your Voice DNA. Pick the one above 85%. Or refine it - tell the AI what's wrong and the next version adapts.",
    tag: "Per post · ~3 minutes",
  },
  {
    n: "04",
    emoji: "🚀",
    title: "Publish with confidence",
    desc: "When the score hits your threshold, it genuinely sounds like you. Copy it out. Post it yourself. Your audience grows because the voice they followed is consistent.",
    tag: "You're in control",
  },
];

const FEATURES = [
  {
    emoji: "🧬",
    title: "Voice DNA - Your personal fingerprint",
    desc: "We map the dimensions of how you write: hook style, sentence rhythm, vocabulary register, post structure, paragraph breaks, CTA style, epistemic stance, self-reference, emotional register, signature phrases, and belief stances. No other tool goes this deep.",
    tag: "Core feature",
  },
  {
    emoji: "🎯",
    title: "Voice Match Score - 0 to 100 on every draft",
    desc: "Every generated post is scored against your fingerprint before you see it. Above 85 means it genuinely sounds like you. Below 60 means it doesn't - regenerate or refine. The score removes the guesswork.",
    tag: "Scoring engine",
  },
  {
    emoji: "💡",
    title: "Idea Recommendations - Based on your patterns",
    desc: "When you're stuck on what to write about, Voise surfaces ideas grounded in your existing content, your proven topics, and your voice style. Every suggestion is already calibrated for your audience.",
    tag: "Inspiration",
  },
  {
    emoji: "💬",
    title: "Refine with AI - Real-time feedback loop",
    desc: "Tell the AI what's wrong with a draft: 'hook is too generic', 'too long', 'add a story'. The next variant incorporates your feedback - in the same session. Quick chips make it one click for common refinements.",
    tag: "Iterative writing",
  },
  {
    emoji: "📊",
    title: "History & Trend - Watch your score improve",
    desc: "Every post you generate is saved and searchable. Voise tracks your average voice match score over time. The copy-without-edit rate improves as the model learns your feedback patterns session by session.",
    tag: "Progress tracking",
  },
];

const FOR_WHO = [
  {
    emoji: "🏗️",
    title: "SaaS founders",
    desc: "Build a personal brand that attracts talent and customers - without spending your best thinking hours on LinkedIn copy.",
  },
  {
    emoji: "💼",
    title: "B2B consultants",
    desc: "Your insights are your product. Voise helps you package them consistently without losing the voice that clients hired you for.",
  },
  {
    emoji: "🎙️",
    title: "Executive coaches",
    desc: "You help people find their voice. Voise makes sure yours never gets diluted by generic AI on the way to the publish button.",
  },
  {
    emoji: "⚡",
    title: "Agency founders",
    desc: "Post consistently while running a team. Describe the idea in 30 seconds, get a scored draft in 2 minutes. Stay visible.",
  },
];

const TESTIMONIALS = [
  {
    quote: "I used to spend two hours per post. Now I describe the idea, get three variants with scores, pick the one above 85%, and I'm done in ten minutes. My team thinks I hired a ghostwriter.",
    author: "Marcus T.",
    role: "SaaS founder · 12k followers",
    score: 91,
  },
  {
    quote: "The score changed how I work. I stopped hitting publish at 60% and kept regenerating until I hit 85+. Engagement doubled in six weeks. The number makes it objective.",
    author: "Priya S.",
    role: "B2B consultant · 8k followers",
    score: 88,
  },
  {
    quote: "Every other tool sounds the same no matter who uses it. Voise is the first one that actually figured out how I write. There's a measurable difference and the score proves it.",
    author: "James K.",
    role: "Executive coach · 22k followers",
    score: 93,
  },
];

const FAQS = [
  {
    q: "How is Voise different from ChatGPT or other AI writing tools?",
    a: "ChatGPT writes from a prompt using patterns averaged across millions of users. Voise builds a private model from your specific writing, scores every generated draft against that model, and refines based on your real-time feedback. The output isn't just AI-generated text - it's text measured against your fingerprint.",
  },
  {
    q: "What if I don't have many LinkedIn posts?",
    a: "If you have 15 or more posts, we build directly from those. If you're starting fresh, answer 7 questions about how you think and write - we build a seed profile from your responses and update it automatically as you generate and refine.",
  },
  {
    q: "What counts as one generation?",
    a: "Each time you submit an idea, Voise produces 3 scored variants - that counts as 1 generation. Refining a variant in the AI chat does not count against your generation limit.",
  },
  {
    q: "Can I try it before paying?",
    a: "Yes. The Starter plan is completely free - no credit card required. You get full Voice DNA setup, 20 generations per month, and 5 repurposes. The Growth plan comes with a 14-day free trial at full access.",
  },
  {
    q: "Does Voise post to LinkedIn for me?",
    a: "No. Voise generates and scores the content. You copy it, review it, and post it yourself. You stay in full control of what goes live - we don't touch your LinkedIn account.",
  },
];

/* ── Sub-components ─────────────────────────────────────────────────────── */

function ProblemCard({ card, delay }: { card: typeof PROBLEMS[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", padding: "var(--ds-space-300)" }}>
      <div style={{ fontSize: 28, marginBottom: "var(--ds-space-200)" }}>{card.icon}</div>
      <h3 style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>{card.title}</h3>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)" }}>{card.desc}</p>
    </div>
  );
}

function StepCard({ step, i }: { step: typeof HOW_IT_WORKS[0]; i: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${i * 80}ms`, display: "flex", gap: "var(--ds-space-250)" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: "var(--ds-radius-200)", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
          {step.emoji}
        </div>
        {i < 3 && <div style={{ width: 1, height: 32, backgroundColor: "var(--ds-border)", margin: "8px auto 0" }} />}
      </div>
      <div style={{ paddingTop: 8, paddingBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginBottom: "var(--ds-space-100)" }}>
          <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", letterSpacing: "0.08em" }}>{step.n}</span>
          <span style={{ display: "inline-block", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)", backgroundColor: "var(--ds-background-brand-subtle)", borderRadius: "var(--ds-radius-400)", padding: "2px 10px" }}>
            {step.tag}
          </span>
        </div>
        <h3 style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>{step.title}</h3>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)", maxWidth: 440 }}>{step.desc}</p>
      </div>
    </div>
  );
}

function FeatureCard({ feature, i }: { feature: typeof FEATURES[0]; i: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal card-lift" style={{ transitionDelay: `${i * 70}ms`, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", padding: "var(--ds-space-300)" }}>
      <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, backgroundColor: "var(--ds-background-brand-subtle)", borderRadius: "var(--ds-radius-200)", marginBottom: "var(--ds-space-200)", fontSize: 22 }}>
        {feature.emoji}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginBottom: "var(--ds-space-100)" }}>
        <h3 style={{ margin: 0, fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.01em" }}>{feature.title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)" }}>{feature.desc}</p>
    </div>
  );
}

function WhoCard({ card, delay }: { card: typeof FOR_WHO[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, padding: "var(--ds-space-250) var(--ds-space-300)", backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", borderLeft: "3px solid var(--ds-border-brand)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-150)", marginBottom: "var(--ds-space-075)" }}>
        <span style={{ fontSize: 22 }}>{card.emoji}</span>
        <h3 style={{ margin: 0, fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>{card.title}</h3>
      </div>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)" }}>{card.desc}</p>
    </div>
  );
}

function TestimonialCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", padding: "var(--ds-space-300)", display: "flex", flexDirection: "column", gap: "var(--ds-space-200)" }}>
      <div style={{ display: "flex", gap: 2 }} aria-label="5 stars">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} style={{ color: "#f59e0b", fontSize: 14 }}>★</span>
        ))}
      </div>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-400)", flex: 1 }}>&ldquo;{t.quote}&rdquo;</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "var(--ds-space-200)", borderTop: "1px solid var(--ds-border)" }}>
        <div>
          <div style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>{t.author}</div>
          <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", marginTop: 2 }}>{t.role}</div>
        </div>
        <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", backgroundColor: "var(--ds-background-success)", color: "var(--ds-text-success)", borderRadius: "var(--ds-radius-150)", padding: "3px 9px" }}>
          🎯 {t.score}%
        </span>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ backgroundColor: "var(--ds-background-default)", minHeight: "100vh" }}>
      <MarketingNav />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-brand-bold)", padding: "96px 24px 104px", position: "relative", overflow: "hidden" }}>
        {/* Grid overlay */}
        <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "48px 48px", pointerEvents: "none" }} />

        {/* Animated blobs */}
        <div aria-hidden style={{ position: "absolute", top: "-15%", left: "0%", width: 560, height: 560, background: "radial-gradient(circle, rgba(100,160,255,0.22) 0%, transparent 70%)", animation: "blobFloat 16s ease-in-out infinite", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", top: "10%", right: "-8%", width: 440, height: 440, background: "radial-gradient(circle, rgba(150,200,255,0.14) 0%, transparent 70%)", animation: "blobFloatB 20s ease-in-out infinite 2s", pointerEvents: "none" }} />
        <div aria-hidden style={{ position: "absolute", bottom: "-10%", left: "30%", width: 360, height: 360, background: "radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)", animation: "blobFloat 13s ease-in-out infinite 4s", pointerEvents: "none" }} />

        {/* Central radial glow */}
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative" }}>
          {/* Eyebrow */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 32, backgroundColor: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "var(--ds-radius-400)", padding: "5px 14px 5px 8px", animation: mounted ? "fadeInUp 0.4s both" : "none" }}>
            <span style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "var(--ds-text-inverse)", fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", padding: "2px 8px", borderRadius: "var(--ds-radius-400)", letterSpacing: "0.08em", textTransform: "uppercase" }}>New</span>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "rgba(255,255,255,0.8)" }}>Voice match scoring on every draft</span>
          </div>

          {/* Headline - lines stagger in */}
          <h1 style={{ fontSize: "clamp(38px, 6.5vw, 68px)", fontWeight: 900, color: "var(--ds-text-inverse)", lineHeight: 1.04, margin: "0 0 var(--ds-space-300)", letterSpacing: "-0.04em" }}>
            {[
              { text: "LinkedIn posts that",   delay: "0.06s" },
              { text: "sound unmistakably",     delay: "0.13s" },
              { text: "like you.",              delay: "0.20s" },
            ].map(({ text, delay }) => (
              <span key={text} style={{ display: "block", animation: mounted ? `fadeInUp 0.55s ${delay} both` : "none" }}>
                {text}
              </span>
            ))}
          </h1>

          {/* Sub */}
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.75, margin: "0 auto var(--ds-space-400)", maxWidth: 520, animation: mounted ? "fadeInUp 0.5s 0.28s both" : "none" }}>
            Voise learns your writing style and scores every generated post against your personal fingerprint. Not a guess. A number. Publish when it clears 85.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: "var(--ds-space-150)", justifyContent: "center", flexWrap: "wrap", marginBottom: "var(--ds-space-200)", animation: mounted ? "fadeInUp 0.5s 0.35s both" : "none" }}>
            <Link href="/sign-up" className="btn-glow" style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-100)", backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", padding: "12px 24px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none", letterSpacing: "-0.01em" }}>
              Build your Voice DNA - free <ArrowRight />
            </Link>
            <Link href="/features" style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-075)", backgroundColor: "rgba(255,255,255,0.12)", color: "var(--ds-text-inverse)", border: "1px solid rgba(255,255,255,0.25)", padding: "12px 22px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-medium)", textDecoration: "none" }}>
              See how it works
            </Link>
          </div>

          {/* Live score demo widget */}
          <div style={{ animation: mounted ? "fadeInUp 0.5s 0.45s both" : "none", display: "flex", justifyContent: "center", marginBottom: "var(--ds-space-200)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "rgba(22,163,74,0.18)", border: "1px solid rgba(74,222,128,0.35)", borderRadius: "var(--ds-radius-400)", padding: "8px 18px", animation: mounted ? "floatUD 3.5s ease-in-out infinite 1.2s" : "none" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#4ade80", animation: "pulseDot 2s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>Voice match score</span>
              <HeroLiveScore />
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(74,222,128,0.9)", letterSpacing: "0.05em" }}>✓ READY</span>
            </div>
          </div>

          <p style={{ fontSize: "var(--ds-font-size-075)", color: "rgba(255,255,255,0.4)", animation: mounted ? "fadeIn 0.6s 0.5s both" : "none" }}>
            No credit card · 14-day free trial on Growth · Cancel any time
          </p>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--ds-surface)", borderBottom: "1px solid var(--ds-border)", padding: "24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(24px, 7vw, 72px)", flexWrap: "wrap" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{s.emoji}</div>
              <div style={{ fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 900, color: "var(--ds-text)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", marginTop: 4, fontWeight: "var(--ds-font-weight-medium)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── THE PROBLEM ────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>The problem</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              Writing LinkedIn consistently is one of the<br />hardest things you&apos;ll do as a creator.
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-200)", color: "var(--ds-text-subtle)", margin: 0, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
              Most people face three specific walls - and generic AI makes all three worse.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {PROBLEMS.map((card, i) => <ProblemCard key={card.title} card={card} delay={i * 80} />)}
          </div>
          <Reveal style={{ marginTop: 32, textAlign: "center" }}>
            <div style={{ display: "inline-block", backgroundColor: "var(--ds-background-brand-subtle)", border: "1px solid var(--ds-border-brand)", borderRadius: "var(--ds-radius-200)", padding: "16px 28px" }}>
              <p style={{ margin: 0, fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)" }}>
                There&apos;s a third option - fast <em>and</em> unmistakably you.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-default)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 64, alignItems: "start" }}>
            <RevealLeft>
              <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>How it works</p>
              <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
                From idea to publish-ready in under 10 minutes.
              </h2>
              <p style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-400)", margin: "0 0 24px" }}>
                A four-step system that builds on itself. The longer you use it, the better it knows you - and the less time each post takes.
              </p>
              <Link href="/features" style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-075)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-brand)", textDecoration: "none" }}>
                See all features <ArrowRight />
              </Link>
            </RevealLeft>
            <div>
              {HOW_IT_WORKS.map((step, i) => <StepCard key={step.n} step={step} i={i} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Features</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              Everything you need to publish consistently in your voice.
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-200)", color: "var(--ds-text-subtle)", margin: 0 }}>
              Five integrated tools. One flywheel.{" "}
              <Link href="/features" style={{ color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)", textDecoration: "none" }}>See all features →</Link>
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map((feature, i) => <FeatureCard key={feature.title} feature={feature} i={i} />)}
          </div>
        </div>
      </section>

      {/* ── SCORE PROOF ────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-default)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>The score in action</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 12px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              You know before you publish.<br />Not a feeling. A number.
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-200)", color: "var(--ds-text-subtle)", margin: 0 }}>
              Same idea. Two very different results.
            </p>
          </Reveal>

          {/* Animated score rings comparison */}
          <Reveal style={{ display: "flex", justifyContent: "center", gap: "clamp(40px, 10vw, 120px)", marginBottom: 40 }}>
            <div style={{ textAlign: "center" }}>
              <ScoreRing score={34} size={112} strokeW={9} color="#ae2a19" track="#ffd5d2" />
              <p style={{ margin: "12px 0 0", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-danger)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Generic AI</p>
              <p style={{ margin: "4px 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>Don&apos;t publish this</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <div style={{ width: 1, flex: 1, backgroundColor: "var(--ds-border)" }} />
              <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", fontWeight: "var(--ds-font-weight-semibold)", whiteSpace: "nowrap" }}>same idea</span>
              <div style={{ width: 1, flex: 1, backgroundColor: "var(--ds-border)" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <ScoreRing score={91} size={112} strokeW={9} color="#216e4e" track="#dcfff1" />
              <p style={{ margin: "12px 0 0", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Voise output</p>
              <p style={{ margin: "4px 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>Ready to publish</p>
            </div>
          </Reveal>

          {/* Post comparison cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
            <RevealLeft>
              <div style={{ backgroundColor: "var(--ds-surface)", border: "1.5px solid var(--ds-border-danger)", borderRadius: "var(--ds-radius-250)", overflow: "hidden" }}>
                <div style={{ backgroundColor: "var(--ds-background-danger)", borderBottom: "1px solid var(--ds-border-danger)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-danger)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Generic AI</span>
                  <span style={{ color: "var(--ds-text-danger)", border: "1px solid var(--ds-border-danger)", borderRadius: "var(--ds-radius-150)", padding: "3px 9px", fontWeight: "var(--ds-font-weight-bold)", fontSize: "var(--ds-font-size-100)" }}>34% match</span>
                </div>
                <div style={{ padding: "var(--ds-space-250)" }}>
                  <p style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-400)", margin: "0 0 var(--ds-space-200)" }}>
                    In today&apos;s fast-paced digital landscape, it&apos;s more important than ever to leverage synergies and drive impactful outcomes aligned with your core value proposition.<br /><br />
                    As thought leaders, we must embrace innovation to unlock exponential growth. Are you ready to level up? 👇
                  </p>
                  <div style={{ backgroundColor: "var(--ds-background-danger)", borderRadius: "var(--ds-radius-100)", padding: "10px 14px", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-danger)", fontWeight: "var(--ds-font-weight-semibold)" }}>
                    Hook, vocabulary, and rhythm are all off your pattern. Don&apos;t publish this.
                  </div>
                </div>
              </div>
            </RevealLeft>
            <RevealRight>
              <div style={{ backgroundColor: "var(--ds-surface)", border: "1.5px solid var(--ds-border-success)", borderRadius: "var(--ds-radius-250)", overflow: "hidden" }}>
                <div style={{ backgroundColor: "var(--ds-background-success)", borderBottom: "1px solid var(--ds-border-success)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Voise output</span>
                  <span style={{ color: "var(--ds-text-success)", border: "1px solid var(--ds-border-success)", borderRadius: "var(--ds-radius-150)", padding: "3px 9px", fontWeight: "var(--ds-font-weight-bold)", fontSize: "var(--ds-font-size-100)" }}>91% match</span>
                </div>
                <div style={{ padding: "var(--ds-space-250)" }}>
                  <p style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-400)", margin: "0 0 var(--ds-space-200)" }}>
                    The biggest mistake I see founders make on LinkedIn isn&apos;t posting too little.<br /><br />
                    It&apos;s posting what they think their audience wants to hear.<br /><br />
                    Your real insights are already there - in your Slack messages, client calls, 2am thoughts. You just need a way to get them out consistently.
                  </p>
                  <div style={{ backgroundColor: "var(--ds-background-success)", borderRadius: "var(--ds-radius-100)", padding: "10px 14px", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-success)", fontWeight: "var(--ds-font-weight-semibold)" }}>
                    91% - hook, rhythm, vocabulary, and CTA all match your pattern. Ready to publish.
                  </div>
                </div>
              </div>
            </RevealRight>
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Who it&apos;s for</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              Built for professionals where voice is the product.
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            {FOR_WHO.map((card, i) => <WhoCard key={card.title} card={card} delay={i * 70} />)}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-default)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Real results</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              From people who&apos;ve actually posted with it.
            </h2>
          </Reveal>
          <TestimonialMarquee testimonials={TESTIMONIALS} />
        </div>
      </section>

      {/* ── PRICING PREVIEW ────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Pricing</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              Start free. Upgrade when you&apos;re ready.
            </h2>
            <p style={{ fontSize: "var(--ds-font-size-200)", color: "var(--ds-text-subtle)", margin: 0 }}>
              No credit card to start. No contracts.{" "}
              <Link href="/pricing" style={{ color: "var(--ds-text-brand)", fontWeight: "var(--ds-font-weight-semibold)", textDecoration: "none" }}>See full comparison →</Link>
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {/* Starter */}
            <Reveal>
              <div style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-250)", padding: "var(--ds-space-400)" }}>
                <div style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Starter</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "var(--ds-text)", lineHeight: 1, letterSpacing: "-0.04em" }}>Free</span>
                </div>
                <p style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", margin: "0 0 var(--ds-space-300)" }}>Build your Voice DNA and start generating.</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 var(--ds-space-300)", display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Full Voice DNA setup", "20 generations / month", "5 repurposes / month", "Voice match score on every draft"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
                      <span style={{ color: "var(--ds-icon-success)", flexShrink: 0 }}><CheckIcon /></span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: "var(--ds-radius-200)", border: "1.5px solid var(--ds-border-brand)", color: "var(--ds-text-brand)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none" }}>
                  Start free
                </Link>
              </div>
            </Reveal>
            {/* Growth */}
            <Reveal delay={80}>
              <div style={{ backgroundColor: "var(--ds-background-brand-bold)", border: "none", borderRadius: "var(--ds-radius-250)", padding: "var(--ds-space-400)", position: "relative" }}>
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", backgroundColor: "var(--ds-background-warning-bold)", color: "var(--ds-text)", fontSize: "var(--ds-font-size-050)", fontWeight: "var(--ds-font-weight-bold)", padding: "3px 12px", borderRadius: "var(--ds-radius-400)", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Most popular
                </div>
                <div style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Growth</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, color: "var(--ds-text-inverse)", lineHeight: 1, letterSpacing: "-0.04em" }}>$29</span>
                  <span style={{ fontSize: "var(--ds-font-size-100)", color: "rgba(255,255,255,0.6)" }}>/mo</span>
                </div>
                <p style={{ fontSize: "var(--ds-font-size-075)", color: "rgba(255,255,255,0.65)", margin: "0 0 var(--ds-space-300)" }}>For professionals posting every week without exception.</p>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 var(--ds-space-300)", display: "flex", flexDirection: "column", gap: 10 }}>
                  {["Everything in Starter", "Unlimited generations", "Unlimited repurposes", "Idea recommendations", "Priority support"].map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--ds-font-size-100)", color: "rgba(255,255,255,0.9)" }}>
                      <span style={{ color: "rgba(255,255,255,0.8)", flexShrink: 0 }}><CheckIcon /></span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" style={{ display: "block", textAlign: "center", padding: "10px", borderRadius: "var(--ds-radius-200)", backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none" }}>
                  Start 14-day free trial
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-default)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 900, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.12 }}>
              Questions you probably have.
            </h2>
          </Reveal>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-background-brand-bold)", padding: "96px 24px" }}>
        <Reveal style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 900, color: "var(--ds-text-inverse)", margin: "0 0 16px", letterSpacing: "-0.04em", lineHeight: 1.06 }}>
            Your voice is your most valuable asset on LinkedIn.<br />
            <span style={{ opacity: 0.65, fontWeight: 400 }}>Stop diluting it.</span>
          </h2>
          <p style={{ fontSize: "var(--ds-font-size-200)", color: "rgba(255,255,255,0.65)", margin: "0 0 36px", lineHeight: 1.7 }}>
            Build your Voice DNA today. Every post you generate is scored against your fingerprint - the only thing you publish is content that sounds unmistakably like you.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <Link href="/sign-up" style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-100)", backgroundColor: "var(--ds-text-inverse)", color: "var(--ds-background-brand-bold)", padding: "13px 28px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-bold)", textDecoration: "none" }}>
              Build your Voice DNA - free <ArrowRight />
            </Link>
            <Link href="/pricing" style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-075)", backgroundColor: "rgba(255,255,255,0.12)", color: "var(--ds-text-inverse)", border: "1px solid rgba(255,255,255,0.25)", padding: "13px 22px", borderRadius: "var(--ds-radius-200)", fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-medium)", textDecoration: "none" }}>
              See pricing
            </Link>
          </div>
          <p style={{ fontSize: "var(--ds-font-size-075)", color: "rgba(255,255,255,0.4)", margin: 0 }}>
            No credit card · 14-day trial on Growth · Cancel any time
          </p>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}

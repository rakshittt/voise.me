"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { VoiseLogo, VoiseMark } from "@/components/ui/VoiseLogo";

/* ─────────────────────────────────────────────────────────────────────────────
   SVG icons (20×20 viewBox, 18px render)
───────────────────────────────────────────────────────────────────────────── */

const Icon = {
  Hook: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3v7a4 4 0 1 1-4-4" /><path d="M10 3l2.5 2.5L10 8" />
    </svg>
  ),
  Rhythm: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M1 10h2l2-6 3 12 3-9 2 3h6" />
    </svg>
  ),
  Vocab: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2" /><path d="M6 7h8M6 10h5M6 13h7" />
    </svg>
  ),
  Structure: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" /><rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" /><rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Para: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 5h14M3 9h10M3 13h14M3 17h8" />
    </svg>
  ),
  CTA: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" /><path d="M7 10h6M10 7l3 3-3 3" />
    </svg>
  ),
  Brain: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3.5C8 3.5 6 5 6 7c0 .5.1 1 .3 1.4C5.5 9 5 10 5 11c0 1.5 1 2.8 2.5 3.3V16h5v-1.7C14 13.8 15 12.5 15 11c0-1-.5-2-1.3-2.6.2-.4.3-.9.3-1.4 0-2-2-3.5-4-3.5z" />
      <path d="M10 3.5v12.5M7.5 8.5h5M7 12.5h6" />
    </svg>
  ),
  Person: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="6" r="3" /><path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  ),
  Heart: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 16.5S3 12 3 7a4 4 0 0 1 7-2.6A4 4 0 0 1 17 7c0 5-7 9.5-7 9.5z" />
    </svg>
  ),
  Pen: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3l3 3-9 9H5v-3L14 3z" /><path d="M12 5l3 3" />
    </svg>
  ),
  Flag: () => (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3v14M4 3h10l-2 4 2 4H4" />
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6.5l3 3 6-6" />
    </svg>
  ),
  Cross: () => (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M2 2l7 7M9 2L2 9" />
    </svg>
  ),
  Lightning: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Star: () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
      <path d="M6.5 1l1.4 4H12L8.5 7.5l1.4 4-3.4-2.1-3.4 2.1 1.4-4L1 5h4.1z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────────────────────
   Reveal hook - IntersectionObserver, fires once
───────────────────────────────────────────────────────────────────────────── */

function useReveal(rootMargin = "-50px") {
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

/* ─────────────────────────────────────────────────────────────────────────────
   Animated count-up number
───────────────────────────────────────────────────────────────────────────── */

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
          const t = Math.min((now - start) / 1300, 1);
          setValue(Math.round((1 - Math.pow(1 - t, 3)) * target));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { rootMargin: "-30px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{value}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ accordion item
───────────────────────────────────────────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.maxHeight = open ? el.scrollHeight + "px" : "0";
  }, [open]);
  return (
    <div style={{ backgroundColor: "var(--ds-surface)", border: `1px solid ${open ? "var(--ds-border-brand)" : "var(--ds-border)"}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ds-text)", letterSpacing: "-0.02em", lineHeight: 1.4 }}>{q}</span>
        <span style={{ flexShrink: 0, color: "var(--ds-icon-subtle)", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "none" }}><Icon.ChevronDown /></span>
      </button>
      <div ref={bodyRef} className={`faq-body${open ? " open" : ""}`}>
        <p style={{ margin: 0, padding: "0 24px 20px", fontSize: 14, color: "var(--ds-text-subtle)", lineHeight: 1.8 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Score pill
───────────────────────────────────────────────────────────────────────────── */

function ScorePill({ score, size = "md" }: { score: number; size?: "sm" | "md" }) {
  const good = score >= 80, mid = score >= 60;
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 1, background: good ? "var(--ds-background-success)" : mid ? "var(--ds-background-warning)" : "var(--ds-background-danger)", color: good ? "var(--ds-text-success)" : mid ? "var(--ds-text-warning)" : "var(--ds-text-danger)", borderRadius: 6, padding: size === "sm" ? "2px 7px" : "4px 10px", fontWeight: 700, fontSize: size === "sm" ? 11 : 13 }}>
      {score}<span style={{ fontSize: 9, opacity: 0.8 }}>%</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Dot-grid SVG background
───────────────────────────────────────────────────────────────────────────── */

function DotGrid() {
  return (
    <svg aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.4, pointerEvents: "none" }}>
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="var(--ds-border-bold)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Voice fingerprint card (hero visual)
───────────────────────────────────────────────────────────────────────────── */

const BARS = [
  { label: "Hook style",         w: 82 },
  { label: "Sentence rhythm",    w: 68 },
  { label: "Vocabulary",         w: 91 },
  { label: "Post structure",     w: 74 },
  { label: "Paragraph breaks",   w: 87 },
  { label: "CTA style",          w: 60 },
  { label: "Epistemic stance",   w: 79 },
  { label: "Self-reference",     w: 88 },
  { label: "Emotional register", w: 72 },
  { label: "Signature phrases",  w: 93 },
  { label: "Belief stances",     w: 65 },
];

function VoiceFingerprint() {
  const ref = useReveal("-20px");
  return (
    <div ref={ref} className="reveal float-anim" style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 16, padding: "24px 28px", boxShadow: "var(--ds-shadow-raised)", maxWidth: 340, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Voice fingerprint</p>
          <p style={{ margin: "3px 0 0", fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>Your personal profile</p>
        </div>
        <div style={{ backgroundColor: "var(--ds-background-success)", borderRadius: 8, padding: "6px 12px" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ds-text-success)", letterSpacing: "-0.04em" }}>87<span style={{ fontSize: 11, fontWeight: 600, opacity: 0.75 }}>%</span></span>
        </div>
      </div>
      {BARS.map((b, i) => (
        <div key={b.label} style={{ marginBottom: i < BARS.length - 1 ? 8 : 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: "var(--ds-text-subtle)", fontWeight: 500 }}>{b.label}</span>
            <span style={{ fontSize: 10, color: "var(--ds-text-subtlest)", fontWeight: 600 }}>{b.w}%</span>
          </div>
          <div style={{ height: 4, backgroundColor: "var(--ds-background-neutral)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${b.w}%`, borderRadius: 4, background: b.w >= 80 ? "var(--ds-background-success-bold)" : b.w >= 65 ? "var(--ds-background-brand-bold)" : "var(--ds-background-warning-bold)", animation: `barGrow 0.8s ${i * 55}ms cubic-bezier(0.16,1,0.3,1) both` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Button primitives
───────────────────────────────────────────────────────────────────────────── */

function PrimaryBtn({ href, children, large }: { href: string; children: React.ReactNode; large?: boolean }) {
  return (
    <Link href={href} className="btn-shimmer" style={{ display: "inline-flex", alignItems: "center", gap: 7, backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", padding: large ? "15px 30px" : "11px 22px", borderRadius: 8, fontSize: large ? 15 : 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em" }}>
      {children}
    </Link>
  );
}

function GhostBtn({ href, children, inverse }: { href: string; children: React.ReactNode; inverse?: boolean }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: inverse ? "1.5px solid rgba(255,255,255,0.4)" : "1.5px solid var(--ds-border-bold)", color: inverse ? "rgba(255,255,255,0.9)" : "var(--ds-text)", padding: "11px 22px", borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: "none", letterSpacing: "-0.01em" }}>
      {children}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────────────────────────── */

const VOICE_DIMENSIONS = [
  { Icon: Icon.Hook,      label: "Hook style",          desc: "How you open - story, question, bold claim, or data." },
  { Icon: Icon.Rhythm,    label: "Sentence rhythm",     desc: "The cadence and average length of your sentences." },
  { Icon: Icon.Vocab,     label: "Vocabulary register", desc: "Formal, casual, jargon-heavy, or plain-spoken." },
  { Icon: Icon.Structure, label: "Post structure",      desc: "Problem→insight, story→lesson, list, how-to." },
  { Icon: Icon.Para,      label: "Paragraph breaks",    desc: "How you control white space and reading pace." },
  { Icon: Icon.CTA,       label: "CTA style",           desc: "How you close - question, reflection, or implicit." },
  { Icon: Icon.Brain,     label: "Epistemic stance",    desc: "How confidently you assert vs. hedge your claims." },
  { Icon: Icon.Person,    label: "Self-reference",      desc: "How much you draw on personal experience." },
  { Icon: Icon.Heart,     label: "Emotional register",  desc: "Your tonal signature - warm, analytical, urgent." },
  { Icon: Icon.Pen,       label: "Signature phrases",   desc: "Words and patterns that recur across your posts." },
  { Icon: Icon.Flag,      label: "Belief stances",      desc: "The positions and topics you consistently own." },
];

const STATS = [
  { value: 200, suffix: "+", label: "creators in beta" },
  { value: 11,  suffix: "",  label: "voice dimensions" },
  { value: 87,  suffix: "%", label: "avg voice match" },
  { value: 10,  suffix: "m", label: "avg time per post" },
];

const HOW_IT_WORKS = [
  {
    n: "01", title: "Add your writing - or start fresh",
    desc: "Paste LinkedIn posts, drop a blog URL, or upload a transcript. No writing yet? Answer 7 questions and we build your seed fingerprint from that.",
    svg: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--ds-background-brand-subtle)" />
        <rect x="10" y="12" width="28" height="4" rx="2" fill="var(--ds-background-brand-bold)" opacity="0.3" />
        <rect x="10" y="20" width="20" height="4" rx="2" fill="var(--ds-background-brand-bold)" opacity="0.55" />
        <rect x="10" y="28" width="24" height="4" rx="2" fill="var(--ds-background-brand-bold)" />
        <circle cx="36" cy="36" r="8" fill="var(--ds-background-brand-bold)" />
        <path d="M33 36l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "02", title: "We build your fingerprint",
    desc: "Our model extracts 11 dimensions of how you write. This becomes your personal scoring benchmark.",
    svg: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--ds-background-discovery)" />
        <rect x="10" y="8"  width="28" height="3" rx="1.5" fill="var(--ds-background-discovery-bold)" opacity="0.3" />
        <rect x="10" y="14" width="20" height="3" rx="1.5" fill="var(--ds-background-discovery-bold)" opacity="0.43" />
        <rect x="10" y="20" width="34" height="3" rx="1.5" fill="var(--ds-background-discovery-bold)" opacity="0.56" />
        <rect x="10" y="26" width="16" height="3" rx="1.5" fill="var(--ds-background-discovery-bold)" opacity="0.69" />
        <rect x="10" y="32" width="26" height="3" rx="1.5" fill="var(--ds-background-discovery-bold)" opacity="0.82" />
        <rect x="10" y="38" width="22" height="3" rx="1.5" fill="var(--ds-background-discovery-bold)" opacity="0.95" />
        <circle cx="36" cy="12" r="7" fill="var(--ds-background-discovery-bold)" />
        <path d="M33 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "03", title: "Generate & get your score",
    desc: "Describe an idea. Get 3 variants, each scored 0–100 against your fingerprint. Tell it why you rejected one - wrong hook, too formal - and the next session already knows.",
    svg: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--ds-background-success)" />
        <rect x="10" y="10" width="28" height="22" rx="4" stroke="var(--ds-background-success-bold)" strokeWidth="2" fill="none" />
        <path d="M16 20h16M16 25h10" stroke="var(--ds-background-success-bold)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <circle cx="36" cy="36" r="8" fill="var(--ds-background-success-bold)" />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="9" fontWeight="700">87</text>
      </svg>
    ),
  },
];

const TESTIMONIALS = [
  { quote: "I spent two hours on every LinkedIn post. With Voise I do it in ten minutes - and my team keeps asking if I hired a ghostwriter. I didn't. It just sounds like me.", author: "Marcus T.", role: "SaaS founder, 12k followers", initials: "MT", score: 91 },
  { quote: "The voice match score changed everything. I stopped hitting publish at 60% and kept regenerating until it hit 85+. My engagement rate doubled in six weeks.", author: "Priya S.", role: "B2B consultant, 8k followers", initials: "PS", score: 88 },
  { quote: "I'd tried every AI writing tool. They all sound the same. Voise is the first one that actually figured out how I write. The score is proof.", author: "James K.", role: "Executive coach, 22k followers", initials: "JK", score: 93 },
];

const PRICING = [
  { name: "Starter", price: "Free", period: "",    highlight: false, cta: "Start for free",           href: "/sign-up", desc: "Build your fingerprint and generate your first posts.",   features: ["Full 11-dimension Voice DNA", "20 generations / month", "5 repurposes / month", "Voice match score on every post"] },
  { name: "Growth",  price: "$79",  period: "/mo", highlight: true,  cta: "Start 14-day free trial", href: "/sign-up", desc: "For professionals publishing consistently. No limits.",     features: ["Everything in Starter", "Unlimited generations", "Unlimited repurposes", "Algorithm signal checker", "Priority support"] },
  { name: "Pro",     price: "$199", period: "/mo", highlight: false, cta: "Start 14-day free trial", href: "/sign-up", desc: "For thought leaders who rely on LinkedIn every day.",       features: ["Everything in Growth", "Early access to features", "Dedicated onboarding call"] },
];

const FAQS = [
  { q: "Won't the output still sound like AI?",          a: "Most AI tools write from generic patterns. Voise is trained on YOUR posts - your specific hooks, sentence rhythm, vocabulary. The score tells you how close the match is. When it hits 85+, readers can't tell. And the system keeps learning: the more you use it, the sharper the match becomes." },
  { q: "What if I don't have many LinkedIn posts?",      a: "If you have 15+ posts, we build your fingerprint directly from those. No writing at all? Answer 7 questions about how you think and write - we build your seed voice profile from that. You can layer in real writing samples later and the fingerprint improves automatically." },
  { q: "Does Voise get more accurate over time?",     a: "Yes - this is the part most users notice first. Every time you regenerate, reject a variant, or tell the system why it was wrong, that signal feeds back into your fingerprint. Beta users typically go from a 40% copy-without-edit rate early on to over 70% after 30 posts. The system tracks this so you can watch it improve." },
  { q: "How is this different from ChatGPT or Claude?",  a: "Those tools write generically from a prompt. Voise adds two layers on top: a scored fingerprint built from your writing, and a feedback loop that adapts to your real-time choices. Every draft is evaluated against 11 dimensions of your specific style - and you can regenerate until the score is high enough." },
  { q: "Does Voise post to LinkedIn for me?",         a: "No. Voise generates and scores the content. You copy it, review it, and post it yourself. We deliberately don't touch your LinkedIn account - you stay in full control of what goes live. The Content Calendar inside the app lets you plan publish dates, but nothing is automated." },
  { q: "What counts as one generation?",                 a: "Each time you submit an idea, Voise produces 3 scored variants. That counts as 1 generation. You can also regenerate individual variants - each single regeneration counts as 1." },
];

const FEEDBACK_FEATURES = [
  {
    label: "Signal",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--ds-background-warning)" />
        <path d="M15 26h4l3-8 4 16 3-10 3 6h6" stroke="var(--ds-icon-warning)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Every choice is a signal",
    desc: "Tap 'wrong hook' or 'too formal' when you reject a variant. Copy without editing when it's right. Voise logs every signal silently in the background.",
  },
  {
    label: "Adapt",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--ds-background-brand-subtle)" />
        <path d="M14 34l8-12 6 6 8-14" stroke="var(--ds-background-brand-bold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="34" r="2.5" fill="var(--ds-background-brand-bold)" />
        <circle cx="36" cy="14" r="2.5" fill="var(--ds-background-brand-bold)" />
      </svg>
    ),
    title: "Adapts within the session",
    desc: "Each rejection sharpens the next variant in real time. By the third generation in a session, it has already course-corrected on rhythm, hook style, and register.",
  },
  {
    label: "Compound",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <rect width="48" height="48" rx="12" fill="var(--ds-background-success)" />
        <path d="M12 36l8-14 6 8 6-10 4 6" stroke="var(--ds-background-success-bold)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 22v8h-8" stroke="var(--ds-background-success-bold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Compounds over time",
    desc: "Your interaction history distills nightly into sharper fingerprint weights. The longer you use Voise, the rarer the low-score variant becomes.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Card sub-components - each gets its own reveal hook (no hooks-in-map)
───────────────────────────────────────────────────────────────────────────── */

function ProblemCard({ cls, badge, badgeBg, badgeClr, title, icon, bullets }: {
  cls: string; badge: string; badgeBg: string; badgeClr: string;
  title: string; icon: React.ReactNode; bullets: string[];
}) {
  const ref = useReveal();
  return (
    <div ref={ref} className={`${cls} card-lift`} style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 12, padding: "28px 24px" }}>
      <div style={{ marginBottom: 16 }}>{icon}</div>
      <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, color: badgeClr, background: badgeBg, borderRadius: 4, padding: "2px 8px", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{badge}</span>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--ds-text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>{title}</h3>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
        {bullets.map((b) => (
          <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "var(--ds-text-subtle)", lineHeight: 1.55 }}>
            <span style={{ color: "var(--ds-icon-danger)", marginTop: 2, flexShrink: 0 }}><Icon.Cross /></span>{b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCard({ step, delay }: { step: typeof HOW_IT_WORKS[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal card-lift" style={{ transitionDelay: `${delay}ms`, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 12, padding: "28px 24px" }}>
      <div style={{ marginBottom: 20 }}>{step.svg}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ds-text-subtlest)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{step.n}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ds-text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>{step.title}</h3>
      <p style={{ fontSize: 14, color: "var(--ds-text-subtle)", lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
    </div>
  );
}

function FeedbackCard({ item, delay }: { item: typeof FEEDBACK_FEATURES[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal card-lift" style={{ transitionDelay: `${delay}ms`, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 12, padding: "28px 24px" }}>
      <div style={{ marginBottom: 16 }}>{item.icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--ds-text-subtlest)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>{item.label}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ds-text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>{item.title}</h3>
      <p style={{ fontSize: 14, color: "var(--ds-text-subtle)", lineHeight: 1.7, margin: 0 }}>{item.desc}</p>
    </div>
  );
}

function TestimonialCard({ t, delay }: { t: typeof TESTIMONIALS[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal card-lift" style={{ transitionDelay: `${delay}ms`, backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 12, padding: "28px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map((n) => <span key={n} style={{ color: "#f59e0b" }}><Icon.Star /></span>)}</div>
        <ScorePill score={t.score} size="sm" />
      </div>
      <p style={{ fontSize: 14, color: "var(--ds-text)", lineHeight: 1.75, margin: 0, flex: 1, fontStyle: "italic" }}>&ldquo;{t.quote}&rdquo;</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{t.initials}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ds-text)" }}>{t.author}</div>
          <div style={{ fontSize: 12, color: "var(--ds-text-subtle)", marginTop: 2 }}>{t.role}</div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({ plan, delay }: { plan: typeof PRICING[0]; delay: number }) {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal" style={{ transitionDelay: `${delay}ms`, backgroundColor: "var(--ds-surface)", border: plan.highlight ? "2px solid var(--ds-border-brand)" : "1px solid var(--ds-border)", borderRadius: 12, padding: "32px 28px", position: "relative", boxShadow: plan.highlight ? "var(--ds-shadow-raised)" : "none" }}>
      {plan.highlight && (
        <div style={{ position: "absolute", top: 0, left: 28, right: 28, backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", textAlign: "center", fontSize: 10, fontWeight: 700, padding: "3px 0", borderRadius: "0 0 6px 6px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Most popular</div>
      )}
      <div style={{ marginTop: plan.highlight ? 18 : 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text-subtle)", marginBottom: 8 }}>{plan.name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 8 }}>
          <span style={{ fontSize: 38, fontWeight: 900, color: "var(--ds-text)", lineHeight: 1, letterSpacing: "-0.05em" }}>{plan.price}</span>
          {plan.period && <span style={{ color: "var(--ds-text-subtle)", fontSize: 14 }}>{plan.period}</span>}
        </div>
        <p style={{ color: "var(--ds-text-subtle)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.55 }}>{plan.desc}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
          {plan.features.map((f) => (
            <li key={f} style={{ fontSize: 14, color: "var(--ds-text)", display: "flex", alignItems: "flex-start", gap: 8, lineHeight: 1.4 }}>
              <span style={{ color: "var(--ds-icon-success)", flexShrink: 0, marginTop: 2 }}><Icon.Check /></span>{f}
            </li>
          ))}
        </ul>
        <Link href={plan.href} className={plan.highlight ? "btn-shimmer" : ""} style={{ display: "block", textAlign: "center", padding: "11px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none", letterSpacing: "-0.01em", backgroundColor: plan.highlight ? "var(--ds-background-brand-bold)" : "transparent", color: plan.highlight ? "var(--ds-text-inverse)" : "var(--ds-text-brand)", border: plan.highlight ? "none" : "1.5px solid var(--ds-border-brand)" }}>
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}

function BadScoreCard() {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal-left card-lift" style={{ backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", backgroundColor: "var(--ds-background-danger)", borderBottom: "1px solid var(--ds-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ds-text-danger)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Generic AI output</span>
        <ScorePill score={34} size="sm" />
      </div>
      <div style={{ padding: 20 }}>
        <p style={{ fontSize: 14, color: "var(--ds-text)", lineHeight: 1.75, margin: "0 0 16px" }}>
          In today&apos;s fast-paced digital landscape, it&apos;s more important than ever to leverage synergies and drive impactful outcomes aligned with your core value proposition.<br /><br />
          As thought leaders, we must embrace innovation to unlock exponential growth. Are you ready to level up? 👇
        </p>
        <div style={{ padding: "10px 14px", backgroundColor: "var(--ds-background-danger)", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color: "var(--ds-icon-danger)", flexShrink: 0, marginTop: 1 }}><Icon.Cross /></span>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ds-text-danger)", fontWeight: 500, lineHeight: 1.5 }}>34% match - Hook, vocabulary, and sentence rhythm all wrong. Don&apos;t publish.</p>
        </div>
      </div>
    </div>
  );
}

function GoodScoreCard() {
  const ref = useReveal();
  return (
    <div ref={ref} className="reveal-right card-lift" style={{ backgroundColor: "var(--ds-surface)", border: "2px solid var(--ds-border-success)", borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "12px 20px", backgroundColor: "var(--ds-background-success)", borderBottom: "1px solid var(--ds-border-success)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--ds-text-success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Voise output</span>
        <ScorePill score={91} size="sm" />
      </div>
      <div style={{ padding: 20 }}>
        <p style={{ fontSize: 14, color: "var(--ds-text)", lineHeight: 1.75, margin: "0 0 16px" }}>
          The biggest mistake I see founders make on LinkedIn isn&apos;t posting too little.<br /><br />
          It&apos;s posting what they think their audience wants to hear.<br /><br />
          Your real insights are already there - in your Slack messages, your client calls, your 2am thoughts. You just need a way to get them out consistently.<br /><br />
          What&apos;s the last thing you said out loud that you haven&apos;t written about yet?
        </p>
        <div style={{ padding: "10px 14px", backgroundColor: "var(--ds-background-success)", borderRadius: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ color: "var(--ds-icon-success)", flexShrink: 0, marginTop: 1 }}><Icon.Check /></span>
          <p style={{ margin: 0, fontSize: 12, color: "var(--ds-text-success)", fontWeight: 500, lineHeight: 1.5 }}>91% match - Hook, rhythm, vocabulary, and CTA all match your pattern. Ready to publish.</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reveal wrappers (avoid hooks-in-map by using wrapper components)
───────────────────────────────────────────────────────────────────────────── */

function Reveal({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal" style={style}>{children}</div>;
}

function RevealLeft({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal-left" style={style}>{children}</div>;
}

function RevealRight({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal-right" style={style}>{children}</div>;
}

function RevealFAQ({ children }: { children: React.ReactNode }) {
  const ref = useReveal();
  return <div ref={ref} className="reveal" style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ backgroundColor: "var(--ds-background-default)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav style={{ borderBottom: "1px solid var(--ds-border)", backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
          <VoiseLogo markSize={26} fontSize={15} fontWeight={800} letterSpacing="-0.03em" gap={8} />
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link href="/audit"   className="hidden sm:block" style={{ color: "var(--ds-text-subtle)", fontSize: 14, fontWeight: 500, padding: "6px 12px", borderRadius: 6, textDecoration: "none" }}>Free audit</Link>
            <Link href="/sign-in" className="hidden sm:block" style={{ color: "var(--ds-text-subtle)", fontSize: 14, fontWeight: 500, padding: "6px 12px", borderRadius: 6, textDecoration: "none" }}>Sign in</Link>
            <Link href="/sign-up" className="btn-shimmer" style={{ backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", fontSize: 14, fontWeight: 600, padding: "7px 16px", borderRadius: 6, textDecoration: "none", letterSpacing: "-0.01em" }}>
              <span className="hidden sm:inline">Get started free</span>
              <span className="sm:hidden">Start free</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", padding: "88px 24px 72px" }}>
        <DotGrid />
        <div aria-hidden style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 700, height: 600, background: "radial-gradient(circle, rgba(0,82,204,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 52, alignItems: "center", position: "relative" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24, backgroundColor: "var(--ds-background-brand-subtle)", color: "var(--ds-text-brand)", fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, letterSpacing: "0.1em", textTransform: "uppercase", animation: mounted ? "fadeInUp 0.5s 0.05s both" : "none" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--ds-background-brand-bold)", display: "inline-block", animation: "pulseDot 2s ease-in-out infinite" }} />
              LinkedIn AI writing
            </div>

            <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, color: "var(--ds-text)", lineHeight: 1.05, margin: "0 0 20px", letterSpacing: "-0.04em", animation: mounted ? "fadeInUp 0.55s 0.12s both" : "none" }}>
              The LinkedIn AI<br />that sounds<br />
              <span style={{ color: "var(--ds-text-brand)", position: "relative", display: "inline-block" }}>
                exactly like you.
                <svg aria-hidden style={{ position: "absolute", bottom: -4, left: 0, width: "100%", height: 6 }} viewBox="0 0 200 6" preserveAspectRatio="none">
                  <path d="M0 5 Q50 0 100 4 Q150 8 200 3" stroke="var(--ds-background-brand-bold)" strokeWidth="2.5" fill="none" strokeLinecap="round"
                    style={{ strokeDasharray: 220, strokeDashoffset: 220, animation: mounted ? "drawLine 0.9s 0.5s cubic-bezier(0.16,1,0.3,1) forwards" : "none" }} />
                </svg>
              </span>
            </h1>

            <p style={{ fontSize: 17, color: "var(--ds-text-subtle)", lineHeight: 1.75, maxWidth: 480, margin: "0 0 32px", animation: mounted ? "fadeInUp 0.55s 0.2s both" : "none" }}>
              Voise learns the 11 dimensions of how you write. Every post you generate is scored against your fingerprint - and every choice you make teaches it to match your voice more precisely over time.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, animation: mounted ? "fadeInUp 0.55s 0.28s both" : "none" }}>
              <PrimaryBtn href="/sign-up" large>Start free - no card required <Icon.ArrowRight /></PrimaryBtn>
              <GhostBtn href="/audit">Audit my voice first</GhostBtn>
            </div>

            <p style={{ fontSize: 12, color: "var(--ds-text-subtlest)", margin: 0, animation: mounted ? "fadeIn 0.6s 0.4s both" : "none" }}>
              14-day free trial · Full Growth access · Cancel any time
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <VoiceFingerprint />
          </div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid var(--ds-border)", borderBottom: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface)", padding: "20px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(24px, 6vw, 56px)", flexWrap: "wrap" }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--ds-text)", letterSpacing: "-0.04em", lineHeight: 1.1 }}>
                <AnimatedNumber target={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 12, color: "var(--ds-text-subtle)", marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Problem ──────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>The problem</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              You&apos;re stuck between two bad options.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 40 }}>
            <ProblemCard
              cls="reveal-left"
              badge="Option A" badgeBg="var(--ds-background-danger)" badgeClr="var(--ds-text-danger)"
              title="Generic AI content"
              icon={<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="var(--ds-background-danger)" /><path d="M12 20h16M12 14h16M12 26h10" stroke="var(--ds-icon-danger)" strokeWidth="2" strokeLinecap="round" /><circle cx="28" cy="26" r="6" fill="var(--ds-background-danger-bold)" /><path d="M26 26l2 2 3-3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              bullets={["Writes for everyone - sounds like no one", "Readers instantly spot AI-speak", "Engagement from bots, not buyers", "Your credibility takes a hit every post"]}
            />
            <ProblemCard
              cls="reveal-right"
              badge="Option B" badgeBg="var(--ds-background-warning)" badgeClr="var(--ds-text-warning)"
              title="Writing manually"
              icon={<svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="var(--ds-background-warning)" /><circle cx="20" cy="20" r="9" stroke="var(--ds-icon-warning)" strokeWidth="2" fill="none" /><path d="M20 14v6l3 3" stroke="var(--ds-icon-warning)" strokeWidth="2" strokeLinecap="round" /></svg>}
              bullets={["2–3 hours per post, every single week", "Inconsistent when life gets busy", "The blank page problem never goes away", "Posting stops the moment something urgent hits"]}
            />
          </div>

          <Reveal>
            <div style={{ textAlign: "center", padding: "28px 24px", backgroundColor: "var(--ds-background-brand-subtle)", borderRadius: 12, border: "1px solid var(--ds-border-brand)" }}>
              <p style={{ fontSize: 19, fontWeight: 700, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.02em" }}>
                There&apos;s a third option - fast <em>and</em> authentically you.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 11 dimensions ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1040, margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 52, alignItems: "start" }}>
          <RevealLeft>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>How Voise works</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Your writing has a fingerprint.<br />We map all 11 dimensions.
            </h2>
            <p style={{ fontSize: 15, color: "var(--ds-text-subtle)", lineHeight: 1.75, margin: "0 0 28px" }}>
              Generic AI tools write from averaged patterns across millions of users.
              Voise reads only <em>your</em> writing and builds a personal model.
              Every generated post is scored against this model - giving you a number, not a guess.
            </p>
            <PrimaryBtn href="/sign-up">Build my fingerprint <Icon.ArrowRight /></PrimaryBtn>
          </RevealLeft>

          <RevealRight>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {VOICE_DIMENSIONS.map((d, i) => (
                <div key={d.label} className="dim-card" style={{ padding: "14px", backgroundColor: "var(--ds-surface)", border: "1px solid var(--ds-border)", borderRadius: 10, animation: `fadeInUp 0.4s ${i * 35}ms both` }}>
                  <div style={{ color: "var(--ds-icon-brand)", marginBottom: 6 }}><d.Icon /></div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ds-text)", marginBottom: 3, letterSpacing: "-0.01em" }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ds-text-subtle)", lineHeight: 1.45 }}>{d.desc}</div>
                </div>
              ))}
            </div>
          </RevealRight>
        </div>
      </section>

      {/* ── Score demo ───────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>See it in action</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              The score tells you before you publish.
            </h2>
          </Reveal>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            <BadScoreCard />
            <GoodScoreCard />
          </div>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "var(--ds-text-subtlest)" }}>
            You regenerate until the score is high enough. Most users hit 80+ on their second or third variant.
          </p>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 940, margin: "0 auto", padding: "80px 24px" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Getting started</p>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Three steps. First post in under 5 minutes.
          </h2>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {HOW_IT_WORKS.map((step, i) => <StepCard key={step.n} step={step} delay={i * 90} />)}
        </div>
      </section>

      {/* ── Feedback loop ────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 940, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>The feedback loop</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: "0 0 14px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              The more you use it,<br />the better it knows you.
            </h2>
            <p style={{ fontSize: 15, color: "var(--ds-text-subtle)", margin: "0 auto", maxWidth: 520, lineHeight: 1.75 }}>
              Most AI tools are frozen at setup. Voise has a live feedback loop - every session makes the next one sharper.
            </p>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 40 }}>
            {FEEDBACK_FEATURES.map((f, i) => <FeedbackCard key={f.label} item={f} delay={i * 90} />)}
          </div>
          <Reveal>
            <div style={{ textAlign: "center", padding: "24px 28px", backgroundColor: "var(--ds-background-brand-subtle)", borderRadius: 12, border: "1px solid var(--ds-border-brand)" }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: "var(--ds-text)", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                Beta users go from 41% → 73% copy-without-edit rate in their first 30 posts.
              </p>
              <p style={{ fontSize: 13, color: "var(--ds-text-subtle)", margin: 0 }}>Voise tracks this trend so you can see your fingerprint sharpening over time.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1020, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>From beta users</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              People who&apos;ve actually posted with it.
            </h2>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {TESTIMONIALS.map((t, i) => <TestimonialCard key={t.initials} t={t} delay={i * 75} />)}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1020, margin: "0 auto", padding: "80px 24px" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>Pricing</p>
          <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Start free. Upgrade when you need to.
          </h2>
          <p style={{ fontSize: 15, color: "var(--ds-text-subtle)", margin: 0 }}>No contracts. No card to try it. Cancel any time.</p>
        </Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 }}>
          {PRICING.map((plan, i) => <PricingCard key={plan.name} plan={plan} delay={i * 75} />)}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "var(--ds-surface-sunken)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <Reveal style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-brand)", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "var(--ds-text)", margin: 0, letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              Questions worth asking.
            </h2>
          </Reveal>
          <RevealFAQ>
            {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </RevealFAQ>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden", backgroundColor: "var(--ds-background-brand-bold)", padding: "96px 24px" }}>
        <div aria-hidden style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, background: "radial-gradient(ellipse, rgba(255,255,255,0.09) 0%, transparent 70%)", pointerEvents: "none" }} />
        <Reveal style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <h2 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 900, color: "var(--ds-text-inverse)", margin: "0 0 16px", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Your voice is your brand.<br />Stop giving it away.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.8, margin: "0 0 36px" }}>
            Build your Voice DNA today. Every post you generate will be scored against your fingerprint - so the only thing you publish is content that sounds unmistakably like you.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            <Link href="/sign-up" className="btn-shimmer" style={{ display: "inline-flex", alignItems: "center", gap: 7, backgroundColor: "var(--ds-surface)", color: "var(--ds-text-brand)", padding: "14px 28px", borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: "none", letterSpacing: "-0.02em" }}>
              Start free - no card required <Icon.ArrowRight />
            </Link>
            <GhostBtn href="/audit" inverse>Try the free voice audit</GhostBtn>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>14-day free trial · Full Growth access · Cancel any time</p>
        </Reveal>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid var(--ds-border)", backgroundColor: "var(--ds-surface)", padding: "28px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <VoiseLogo markSize={22} fontSize={13} fontWeight={800} letterSpacing="-0.03em" gap={7} />
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {[{ href: "/audit", l: "Free voice audit" }, { href: "/sign-up", l: "Sign up" }, { href: "/sign-in", l: "Sign in" }].map((lk) => (
              <Link key={lk.href} href={lk.href} style={{ fontSize: 13, color: "var(--ds-text-subtle)", textDecoration: "none" }}>{lk.l}</Link>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "var(--ds-text-subtlest)" }}>© 2025 Voise</span>
        </div>
      </footer>
    </div>
  );
}

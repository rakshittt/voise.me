"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useInView,
  useScroll,
  useTransform,
  useMotionValue,
  animate,
  type Variants,
} from "framer-motion";
import Link from "next/link";
import {
  Clock, Bot, RefreshCw, ArrowRight, Check,
  BarChart3, Zap, MessageSquare, History, ChevronDown,
  Dna, Target,
} from "lucide-react";
import { VoiseLogo } from "@/components/ui/VoiseLogo";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { ParticleCanvas } from "@/components/ui/particle-canvas-1";

/* ══════════════════════════════════════════════════════════════════════════
   COLOR SYSTEM — Cohere-inspired light palette
   White canvas · Soft stone · Near-black ink · Indigo accent (sparse)
══════════════════════════════════════════════════════════════════════════ */
const C = {
  canvas:    "#ffffff",
  stone:     "#eeece7",       // Cohere soft-stone
  ink:       "#17171c",       // Cohere primary / near-black
  text:      "#212121",       // body text
  muted:     "#6b6b7b",
  faint:     "#93939f",       // Cohere muted
  hairline:  "#d9d9dd",       // Cohere hairline
  cardBdr:   "#e5e3dc",
  brand:     "#5856D6",       // indigo — used sparingly like Cohere coral
  brandDim:  "#f0effe",
  green:     "#1a7a4a",       // score success
  greenDim:  "#edfce9",       // Cohere pale-green
  red:       "#c0392b",
  redDim:    "#fff1f0",
  amber:     "#b45309",
  dark:      "#17171c",       // dark feature band bg
  darkText:  "#ffffff",
  darkMuted: "rgba(255,255,255,0.55)",
  darkBdr:   "rgba(255,255,255,0.10)",
} as const;

/* ══════════════════════════════════════════════════════════════════════════
   TYPOGRAPHY HELPERS
   Display → Space Grotesk (Cohere CohereText pattern)
   Body    → Inter
   Mono    → JetBrains Mono (Cohere CohereMono pattern)
══════════════════════════════════════════════════════════════════════════ */
const FONT = {
  display: "var(--font-display), 'Space Grotesk', sans-serif",
  body:    "var(--font-inter), Inter, sans-serif",
  mono:    "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

/* ══════════════════════════════════════════════════════════════════════════
   DATA
══════════════════════════════════════════════════════════════════════════ */
const COMPANIES = ["Notion", "Linear", "Intercom", "Loom", "Vercel", "Stripe", "Figma", "Rippling"];

const STATS = [
  { value: 500, suffix: "+", label: "Creators on Voise" },
  { value: 3,   suffix: "×", label: "More accurate than generic AI" },
  { value: 87,  suffix: "%", label: "Avg voice match score" },
  { value: 2,   suffix: "h", label: "Saved per post per week" },
];

const PROBLEMS = [
  { icon: Clock,    title: "It takes 2–3 hours per post",      desc: "Every time you sit down to write, you're starting from scratch. By the time it's done, you've spent your best thinking hours on one post." },
  { icon: Bot,      title: "Generic AI sounds like everyone",   desc: "ChatGPT, every AI writing tool — trained on the same internet. The output is averaged across millions of users. Your post ends up sounding like no one." },
  { icon: RefreshCw, title: "Consistency is the real problem", desc: "You post well for two weeks, then life happens. The algorithm punishes inconsistency. Your audience drifts. And every restart means building from zero again." },
];

const STEPS = [
  { n: "01", title: "Add your writing",      desc: "Paste your LinkedIn posts, drop a blog URL, or add a transcript. No posts yet? Answer 7 questions and we build your seed profile from scratch.", tag: "Setup · 5 min" },
  { n: "02", title: "We build your Voice DNA", desc: "Our model analyzes your writing across 11 dimensions — hook style, sentence rhythm, vocabulary, CTA patterns, belief stances, and more.", tag: "Automatic" },
  { n: "03", title: "Generate & score",       desc: "Describe your idea. Get 3 post variants, each scored 0–100 against your Voice DNA. Pick the one above 85%. Or refine in the AI chat.", tag: "~3 min per post" },
  { n: "04", title: "Publish with confidence", desc: "When the score clears your threshold, it genuinely sounds like you. Copy it, post it yourself. Your audience grows because your voice is consistent.", tag: "You're in control" },
];

const FEATURES = [
  { icon: Dna,          title: "Voice DNA",            sub: "11-dimension personal fingerprint", desc: "Hook style, sentence rhythm, vocabulary register, post structure, paragraph breaks, CTA style, epistemic stance, self-reference, emotional register, signature phrases, and belief stances.", large: true },
  { icon: Target,       title: "Voice Match Score",    sub: "0 to 100 on every draft",           desc: "Every generated post is scored before you see it. Above 85 = sounds like you. Below 60 = regenerate. The number removes the guesswork." },
  { icon: Zap,          title: "Idea Recommendations", sub: "Grounded in your patterns",         desc: "Surfaces ideas calibrated to your existing content, proven topics, and voice style — already aligned to your audience." },
  { icon: MessageSquare, title: "Refine with AI",      sub: "Real-time feedback loop",           desc: "Tell the AI what's wrong with a draft. The next variant incorporates your feedback in the same session." },
  { icon: History,      title: "History & Trend",       sub: "Watch your score improve",         desc: "Every post is saved. Voise tracks your average voice match score over time. The copy-without-edit rate improves as the model learns." },
  { icon: BarChart3,    title: "Usage Insights",        sub: "Cost-aware generation",            desc: "See exactly how many generations you've used, which posts scored highest, and where your voice is strongest." },
];

const FOR_WHO = [
  { label: "SaaS founders",     desc: "Build a personal brand that attracts talent and customers — without spending your best thinking hours on LinkedIn copy." },
  { label: "B2B consultants",   desc: "Your insights are your product. Voise helps you package them consistently without losing the voice that clients hired you for." },
  { label: "Executive coaches", desc: "You help people find their voice. Voise makes sure yours never gets diluted by generic AI on the way to the publish button." },
  { label: "Agency founders",   desc: "Post consistently while running a team. Describe the idea in 30 seconds, get a scored draft in 2 minutes. Stay visible." },
];

const TESTIMONIALS = [
  { quote: "I used to spend two hours per post. Now I describe the idea, get three variants with scores, pick the one above 85%, and I'm done in ten minutes. My team thinks I hired a ghostwriter.", author: "Marcus T.", role: "SaaS founder · 12k followers", score: 91 },
  { quote: "The score changed how I work. I stopped hitting publish at 60% and kept regenerating until I hit 85+. Engagement doubled in six weeks. The number makes it objective.", author: "Priya S.", role: "B2B consultant · 8k followers", score: 88 },
  { quote: "Every other tool sounds the same no matter who uses it. Voise is the first one that actually figured out how I write. There's a measurable difference and the score proves it.", author: "James K.", role: "Executive coach · 22k followers", score: 93 },
  { quote: "The refine loop is where it gets magical. I type 'this hook is too generic' and the next variant nails my actual voice. It's like the AI finally gets me.", author: "Sarah L.", role: "Agency founder · 5k followers", score: 89 },
  { quote: "I was skeptical about the score. Then I published a 91% post and a 55% post in the same week. The difference in engagement wasn't close. Now I don't publish below 80.", author: "David R.", role: "B2B consultant · 15k followers", score: 94 },
];

const FAQS = [
  { q: "How is Voise different from ChatGPT or other AI writing tools?", a: "ChatGPT writes from a prompt using patterns averaged across millions of users. Voise builds a private model from your specific writing, scores every generated draft against that model, and refines based on your real-time feedback. The output isn't just AI-generated text — it's text measured against your fingerprint." },
  { q: "What if I don't have many LinkedIn posts?", a: "If you have 15 or more posts, we build directly from those. If you're starting fresh, answer 7 questions about how you think and write — we build a seed profile from your responses and update it automatically as you generate and refine." },
  { q: "What counts as one generation?", a: "Each time you submit an idea, Voise produces 3 scored variants — that counts as 1 generation. Refining a variant in the AI chat does not count against your generation limit." },
  { q: "Can I try it before paying?", a: "Yes. The Starter plan is completely free — no credit card required. You get full Voice DNA setup, 20 generations per month, and 5 repurposes. The Growth plan comes with a 14-day free trial at full access." },
  { q: "Does Voise post to LinkedIn for me?", a: "No. Voise generates and scores the content. You copy it, review it, and post it yourself. You stay in full control of what goes live — we don't touch your LinkedIn account." },
];

/* ══════════════════════════════════════════════════════════════════════════
   ANIMATION PRIMITIVES
══════════════════════════════════════════════════════════════════════════ */
const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

function SC(s = 0.1): Variants {
  return { hidden: {}, show: { transition: { staggerChildren: s } } };
}

function InView({
  children, variants = fadeUp, delay = 0, style,
}: {
  children: React.ReactNode;
  variants?: Variants;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} variants={variants} initial="hidden"
      animate={inView ? "show" : "hidden"} transition={{ delay }} style={style}>
      {children}
    </motion.div>
  );
}

function InViewStagger({ children, stagger = 0.1, style }: {
  children: React.ReactNode; stagger?: number; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={SC(stagger)} initial="hidden"
      animate={inView ? "show" : "hidden"} style={style}>
      {children}
    </motion.div>
  );
}

/* ── Score gauge (for comparison section) ───────────────────────────────── */
function ScoreGauge({
  target, size = 44, color = C.green, trackColor = C.hairline, strokeW = 4,
}: {
  target: number; size?: number; color?: string; trackColor?: string; strokeW?: number;
}) {
  const count      = useMotionValue(0);
  const rounded    = useTransform(count, (v) => Math.round(v));
  const r          = (size - strokeW * 2) / 2;
  const circ       = 2 * Math.PI * r;
  const dashOffset = useTransform(count, [0, 100], [circ, 0]);
  const started    = useRef(false);
  const ref        = useRef<HTMLDivElement>(null);
  const inView     = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && !started.current) {
      started.current = true;
      animate(count, target, { duration: 1.6, ease: "easeOut" });
    }
  }, [inView, count, target]);

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeW} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={strokeW} strokeLinecap="round" strokeDasharray={circ}
          style={{ strokeDashoffset: dashOffset }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.span style={{ fontSize: size * 0.26, fontWeight: 500, color, fontFamily: FONT.mono, lineHeight: 1 }}>
          {rounded}
        </motion.span>
      </div>
    </div>
  );
}

/* ── Count-up ────────────────────────────────────────────────────────────── */
function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const count   = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const started = useRef(false);
  const ref     = useRef<HTMLSpanElement>(null);
  const inView  = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && !started.current) {
      started.current = true;
      animate(count, target, { duration: 1.5, ease: "easeOut" });
    }
  }, [inView, count, target]);

  return (
    <span ref={ref} style={{ fontVariantNumeric: "tabular-nums" }}>
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

/* ── FAQ item — Cohere research-table style: rule only, no card ─────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.hairline}` }}>
      <button onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", gap: 20 }}>
        <span style={{ fontFamily: FONT.body, fontSize: 16, fontWeight: 500, color: C.ink, lineHeight: 1.45, flex: 1 }}>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }}
          style={{ flexShrink: 0, color: C.faint, marginTop: 2, display: "flex" }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
            style={{ overflow: "hidden" }}>
            <p style={{ margin: 0, paddingBottom: 22, fontSize: 15, color: C.muted, lineHeight: 1.75 }}>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Testimonial marquee ─────────────────────────────────────────────────── */
function TestimonialMarquee() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS];
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div aria-hidden style={{
        position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none",
        background: `linear-gradient(90deg, ${C.canvas} 0%, transparent 8%, transparent 92%, ${C.canvas} 100%)`,
      }} />
      <div className="tm-track" style={{ display: "flex", gap: 14, width: "max-content" }}>
        {doubled.map((t, i) => (
          <div key={i} style={{
            width: 300, flexShrink: 0, backgroundColor: C.canvas,
            border: `1px solid ${C.cardBdr}`, borderRadius: 16, padding: 22,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            <div style={{ display: "flex", gap: 1 }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <span key={j} style={{ color: C.amber, fontSize: 11 }}>★</span>
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.7, flex: 1 }}>
              &ldquo;{t.quote}&rdquo;
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.hairline}` }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{t.author}</div>
                <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>{t.role}</div>
              </div>
              <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 500, color: C.green, backgroundColor: C.greenDim, borderRadius: 20, padding: "2px 10px" }}>
                {t.score}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Section label — Cohere mono-overline ────────────────────────────────── */
function SectionLabel({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p style={{
      margin: "0 0 16px",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontFamily: FONT.mono,
      fontSize: 11,
      fontWeight: 400,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: light ? "rgba(255,255,255,0.5)" : C.brand,
    }}>
      <span style={{ width: 16, height: 1.5, backgroundColor: light ? "rgba(255,255,255,0.4)" : C.brand, display: "inline-block" }} />
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ANNOUNCEMENT BAR — Cohere pattern: full-width near-black strip
══════════════════════════════════════════════════════════════════════════ */
function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div style={{
      backgroundColor: C.dark,
      height: 36,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      padding: "0 24px",
      position: "relative",
    }}>
      <p style={{ margin: 0, fontFamily: FONT.mono, fontSize: 11, color: "rgba(255,255,255,0.65)", letterSpacing: "0.04em" }}>
        New&nbsp;·&nbsp;
        <Link href="/features" style={{ color: "#fff", textDecoration: "underline", fontWeight: 500 }}>
          Voice match scoring
        </Link>
        &nbsp;on every draft — scores every post against your personal fingerprint
      </p>
      <button onClick={() => setVisible(false)}
        style={{ position: "absolute", right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}>
        ×
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAV — white canvas, scroll-aware border
══════════════════════════════════════════════════════════════════════════ */
function Nav() {
  const { scrollY } = useScroll();
  const bdr = useTransform(scrollY, [0, 40], ["rgba(217,217,221,0)", C.hairline]);

  return (
    <motion.nav style={{
      position: "sticky", top: 0, zIndex: 100,
      backgroundColor: C.canvas,
      borderBottom: `1px solid`,
      borderColor: bdr,
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <VoiseLogo markSize={24} fontSize={14} fontWeight={700} letterSpacing="-0.03em" gap={7} color={C.ink} />
        </Link>

        {/* Center links — Cohere body text links, no pill styling */}
        <div className="hidden-mobile" style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {[["Features", "/features"], ["Pricing", "/pricing"], ["Free audit", "/audit"]].map(([label, href]) => (
            <Link key={href} href={href}
              style={{ fontFamily: FONT.body, fontSize: 14, color: C.muted, padding: "6px 14px", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right — sign in + pill CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in" style={{ fontFamily: FONT.body, fontSize: 14, color: C.muted, textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/sign-up"
            style={{
              fontFamily: FONT.body, fontSize: 13, fontWeight: 500,
              backgroundColor: C.ink, color: "#fff",
              padding: "7px 18px", borderRadius: 32, textDecoration: "none",
            }}>
            Get started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TRUST STRIP — stone background, company names monochrome text
   Cohere: "quiet, no cards, no borders, just horizontal spacing"
══════════════════════════════════════════════════════════════════════════ */
function TrustStrip() {
  return (
    <div style={{ backgroundColor: C.stone, borderTop: `1px solid ${C.cardBdr}`, borderBottom: `1px solid ${C.cardBdr}`, padding: "36px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontFamily: FONT.mono, fontSize: 11, color: C.faint, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 20px" }}>
          Trusted by professionals at
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 32px", justifyContent: "center", alignItems: "center" }}>
          {COMPANIES.map((name) => (
            <span key={name} style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 500, color: C.faint, letterSpacing: "-0.01em" }}>
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STATS BAR — stone bg, count-up on scroll
══════════════════════════════════════════════════════════════════════════ */
function StatsBar() {
  return (
    <div style={{ backgroundColor: C.canvas, padding: "56px 24px", borderBottom: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexWrap: "wrap", gap: "36px 72px", justifyContent: "center" }}>
        {STATS.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, letterSpacing: "-0.04em", lineHeight: 1 }}>
              <CountUp target={s.value} suffix={s.suffix} />
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.faint, marginTop: 8, letterSpacing: "0.04em" }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PROBLEM SECTION — white canvas, capability cards (Cohere: top-rule only)
══════════════════════════════════════════════════════════════════════════ */
function ProblemSection() {
  return (
    <section style={{ backgroundColor: C.canvas, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <InView style={{ maxWidth: 520, marginBottom: 64 }}>
          <SectionLabel>The problem</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Writing on LinkedIn consistently is harder than it looks.
          </h2>
          <p style={{ fontSize: 16, color: C.muted, margin: 0, lineHeight: 1.7 }}>
            Most creators face three specific walls — and generic AI makes all three worse.
          </p>
        </InView>

        {/* Capability cards — Cohere style: top border only, thin-line icon, no box shadow */}
        <InViewStagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "0 32px" }}>
          {PROBLEMS.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.title} variants={fadeUp}
                style={{ borderTop: `2px solid ${C.ink}`, paddingTop: 28, paddingBottom: 28 }}>
                <Icon size={22} color={C.brand} strokeWidth={1.5} style={{ marginBottom: 20, display: "block" }} />
                <h3 style={{ fontFamily: FONT.display, fontSize: 20, fontWeight: 500, color: C.ink, margin: "0 0 12px", letterSpacing: "-0.015em", lineHeight: 1.25 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 15, color: C.muted, margin: 0, lineHeight: 1.7 }}>{card.desc}</p>
              </motion.div>
            );
          })}
        </InViewStagger>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   HOW IT WORKS — Cohere dark-feature-band: near-black, white text, timeline
══════════════════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  return (
    <section style={{ backgroundColor: C.dark, padding: "96px 24px" }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "56px 80px", alignItems: "start" }}>
        <InView variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: EASE } } }}>
          <SectionLabel light>How it works</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.darkText, margin: "0 0 20px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            From idea to publish-ready in under 10 minutes.
          </h2>
          <p style={{ fontSize: 16, color: C.darkMuted, lineHeight: 1.7, margin: "0 0 32px" }}>
            A four-step system that compounds. The longer you use it, the better it knows you.
          </p>
          <Link href="/features"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 500, color: C.darkText, textDecoration: "none" }}>
            See all features <ArrowRight size={14} />
          </Link>
        </InView>

        <div>
          {STEPS.map((step, i) => {
            const ref = useRef<HTMLDivElement>(null);
            const inView = useInView(ref, { once: true, margin: "-100px" });
            return (
              <motion.div key={step.n} ref={ref} variants={fadeUp} initial="hidden" animate={inView ? "show" : "hidden"}
                style={{ display: "flex", gap: 20, paddingBottom: i < STEPS.length - 1 ? 40 : 0, position: "relative" }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{ position: "absolute", left: 15, top: 36, bottom: 0, width: 1, backgroundColor: C.darkBdr }} />
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${inView ? C.brand : C.darkBdr}`,
                  backgroundColor: inView ? "rgba(88,86,214,0.15)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  transition: "border-color 0.4s, background-color 0.4s",
                }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 11, color: inView ? C.brand : C.darkMuted, fontWeight: 500 }}>{i + 1}</span>
                </div>
                <div style={{ paddingTop: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>{step.n}</span>
                    <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.brand, backgroundColor: "rgba(88,86,214,0.15)", borderRadius: 4, padding: "2px 8px", letterSpacing: "0.06em" }}>{step.tag}</span>
                  </div>
                  <h3 style={{ fontFamily: FONT.display, fontSize: 18, fontWeight: 500, color: C.darkText, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: C.darkMuted, margin: 0, lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FEATURES — stone background, Cohere product-card grid
══════════════════════════════════════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section style={{ backgroundColor: C.stone, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <InView style={{ marginBottom: 56, maxWidth: 520 }}>
          <SectionLabel>Features</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Five tools. One flywheel.
          </h2>
          <p style={{ fontSize: 16, color: C.muted, margin: 0, lineHeight: 1.7 }}>
            Everything you need to publish consistently in your voice.{" "}
            <Link href="/features" style={{ color: C.brand, fontWeight: 500, textDecoration: "none" }}>See all →</Link>
          </p>
        </InView>

        <InViewStagger style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <motion.div key={f.title} variants={fadeUp}
                className={f.large ? "feature-large" : ""}
                style={{
                  backgroundColor: C.canvas,
                  border: `1px solid ${C.cardBdr}`,
                  borderRadius: 8,                // Cohere sm radius
                  padding: 28,
                  gridColumn: f.large ? "span 2" : "span 1",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}>
                <Icon size={20} color={C.brand} strokeWidth={1.5} />
                <div>
                  <div style={{ fontFamily: FONT.display, fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: "-0.01em", marginBottom: 2 }}>{f.title}</div>
                  <div style={{ fontFamily: FONT.mono, fontSize: 11, color: C.faint, letterSpacing: "0.06em" }}>{f.sub}</div>
                </div>
                <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.7 }}>{f.desc}</p>
              </motion.div>
            );
          })}
        </InViewStagger>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SCORE COMPARISON — white canvas, toggle, Cohere bordered cards
══════════════════════════════════════════════════════════════════════════ */
function ScoreComparisonSection() {
  const [phase, setPhase] = useState<"prompt" | "outputs">("prompt");
  const advanced = useRef(false);
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (inView && !advanced.current) {
      advanced.current = true;
      const id = setTimeout(() => setPhase("outputs"), 1200);
      return () => clearTimeout(id);
    }
  }, [inView]);

  return (
    <section ref={sectionRef} style={{ backgroundColor: C.canvas, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <InView style={{ marginBottom: 48 }}>
          <SectionLabel>The score in action</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            You know before you publish.
            <br /><span style={{ color: C.muted, fontWeight: 400 }}>Not a feeling. A number.</span>
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: C.stone, border: `1px solid ${C.cardBdr}`, borderRadius: 8, padding: "10px 16px" }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.faint, letterSpacing: "0.08em", textTransform: "uppercase" }}>Idea</span>
              <span style={{ fontSize: 14, color: C.ink }}>
                &ldquo;Why founders stop posting consistently&rdquo;
              </span>
            </div>
            <button onClick={() => setPhase((p) => (p === "prompt" ? "outputs" : "prompt"))}
              style={{ fontFamily: FONT.body, fontSize: 13, fontWeight: 500, color: C.brand, background: "none", border: `1px solid ${C.brand}`, borderRadius: 32, padding: "7px 16px", cursor: "pointer" }}>
              {phase === "prompt" ? "See both outputs →" : "← Back"}
            </button>
          </div>
        </InView>

        <AnimatePresence mode="wait">
          {phase === "outputs" && (
            <motion.div key="outputs"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>

              {/* Generic AI card */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, ease: EASE }}
                style={{ border: `1.5px solid ${C.red}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ backgroundColor: C.redDim, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(192,57,43,0.15)` }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 500, color: C.red, letterSpacing: "0.08em", textTransform: "uppercase" }}>Generic AI</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScoreGauge target={34} size={36} color={C.red} trackColor={C.hairline} strokeW={3} />
                    <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 500, color: C.red }}>34%</span>
                  </div>
                </div>
                <div style={{ padding: 24, backgroundColor: C.canvas }}>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: "0 0 16px" }}>
                    In today&apos;s fast-paced digital landscape, it&apos;s more important than ever to leverage synergies and drive impactful outcomes aligned with your core value proposition.<br /><br />
                    As thought leaders, we must embrace innovation to unlock exponential growth. Are you ready to level up? 👇
                  </p>
                  <div style={{ backgroundColor: C.redDim, borderRadius: 6, padding: "9px 12px", fontSize: 12, color: C.red, fontWeight: 500 }}>
                    ✗ Hook, vocabulary, and rhythm don&apos;t match your pattern.
                  </div>
                </div>
              </motion.div>

              {/* Voise card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.08, ease: EASE }}
                style={{ border: `1.5px solid ${C.green}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ backgroundColor: C.greenDim, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid rgba(26,122,74,0.15)` }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 10, fontWeight: 500, color: C.green, letterSpacing: "0.08em", textTransform: "uppercase" }}>Voise output</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScoreGauge target={91} size={36} color={C.green} trackColor={C.hairline} strokeW={3} />
                    <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 500, color: C.green }}>91%</span>
                  </div>
                </div>
                <div style={{ padding: 24, backgroundColor: C.canvas }}>
                  <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, margin: "0 0 16px" }}>
                    The biggest mistake I see founders make on LinkedIn isn&apos;t posting too little.<br /><br />
                    It&apos;s posting what they think their audience wants to hear.<br /><br />
                    Your real insights are already there — in your Slack messages, client calls, 2am thoughts.
                  </p>
                  <div style={{ backgroundColor: C.greenDim, borderRadius: 6, padding: "9px 12px", fontSize: 12, color: C.green, fontWeight: 500 }}>
                    ✓ 91% — hook, rhythm, vocabulary all match. Ready to publish.
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   WHO IT'S FOR — stone bg, Cohere blog-filter-chip style labels
══════════════════════════════════════════════════════════════════════════ */
function WhoForSection() {
  return (
    <section style={{ backgroundColor: C.stone, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <InView style={{ marginBottom: 56 }}>
          <SectionLabel>Who it&apos;s for</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Built for professionals where voice is the product.
          </h2>
        </InView>
        <InViewStagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 1, backgroundColor: C.cardBdr }}>
          {FOR_WHO.map((card) => (
            <motion.div key={card.label} variants={fadeUp}
              style={{ backgroundColor: C.stone, padding: 28 }}>
              <div style={{
                display: "inline-block", marginBottom: 16,
                fontFamily: FONT.mono, fontSize: 11, fontWeight: 500, color: C.brand,
                border: `1px solid ${C.brand}`, borderRadius: 4,
                padding: "3px 10px", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                {card.label}
              </div>
              <p style={{ fontSize: 15, color: C.muted, margin: 0, lineHeight: 1.7 }}>{card.desc}</p>
            </motion.div>
          ))}
        </InViewStagger>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TESTIMONIALS — white canvas, infinite marquee
══════════════════════════════════════════════════════════════════════════ */
function TestimonialsSection() {
  return (
    <section style={{ backgroundColor: C.canvas, padding: "96px 0", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px", marginBottom: 44 }}>
        <InView>
          <SectionLabel>Real results</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            From people who&apos;ve actually posted with it.
          </h2>
        </InView>
      </div>
      <TestimonialMarquee />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRICING — stone bg, Cohere product-card pattern
══════════════════════════════════════════════════════════════════════════ */
function PricingSection() {
  const checks = {
    starter: ["Full Voice DNA setup", "20 generations / month", "5 repurposes / month", "Voice match score on every draft"],
    growth:  ["Everything in Starter", "Unlimited generations", "Unlimited repurposes", "Idea recommendations", "Priority support"],
  };
  return (
    <section style={{ backgroundColor: C.stone, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <InView style={{ marginBottom: 48 }}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: "0 0 12px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Start free. Upgrade when ready.
          </h2>
          <p style={{ fontSize: 15, color: C.muted, margin: 0 }}>
            No credit card to start.{" "}
            <Link href="/pricing" style={{ color: C.brand, fontWeight: 500, textDecoration: "none" }}>See full comparison →</Link>
          </p>
        </InView>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {/* Starter — white product card */}
          <InView>
            <div style={{ backgroundColor: C.canvas, border: `1px solid ${C.cardBdr}`, borderRadius: 8, padding: 32 }}>
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Starter</div>
              <div style={{ fontFamily: FONT.display, fontSize: 44, fontWeight: 500, color: C.ink, lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 6 }}>Free</div>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.5 }}>Build your Voice DNA and start generating.</p>
              <div style={{ height: 1, backgroundColor: C.hairline, marginBottom: 24 }} />
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                {checks.starter.map((feat) => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.muted }}>
                    <Check size={14} color={C.green} strokeWidth={2.5} />{feat}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up"
                style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: 32, border: `1.5px solid ${C.ink}`, color: C.ink, fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                Start free
              </Link>
            </div>
          </InView>

          {/* Growth — white card with indigo top accent */}
          <InView delay={0.1}>
            <div style={{ backgroundColor: C.canvas, border: `1px solid ${C.cardBdr}`, borderTop: `3px solid ${C.brand}`, borderRadius: 8, padding: 32, position: "relative" }}>
              <div style={{ position: "absolute", top: -1, left: 24, right: 24, height: 3, backgroundColor: C.brand, borderRadius: "0 0 4px 4px" }} />
              <div style={{ fontFamily: FONT.mono, fontSize: 10, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Growth</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 6 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 44, fontWeight: 500, color: C.ink, lineHeight: 1, letterSpacing: "-0.04em" }}>$29</span>
                <span style={{ fontSize: 14, color: C.faint }}>/mo</span>
              </div>
              <p style={{ fontSize: 13, color: C.muted, margin: "0 0 24px", lineHeight: 1.5 }}>For professionals posting every week without exception.</p>
              <div style={{ height: 1, backgroundColor: C.hairline, marginBottom: 24 }} />
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                {checks.growth.map((feat) => (
                  <li key={feat} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: C.muted }}>
                    <Check size={14} color={C.green} strokeWidth={2.5} />{feat}
                  </li>
                ))}
              </ul>
              <Link href="/sign-up"
                style={{ display: "block", textAlign: "center", padding: "11px", borderRadius: 32, backgroundColor: C.ink, color: "#fff", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
                Start 14-day free trial
              </Link>
            </div>
          </InView>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FAQ — white canvas, Cohere research-table: rules only, no cards
══════════════════════════════════════════════════════════════════════════ */
function FAQSection() {
  return (
    <section style={{ backgroundColor: C.canvas, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <InView style={{ marginBottom: 48 }}>
          <SectionLabel>FAQ</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Questions you probably have.
          </h2>
        </InView>
        {/* Rule at top before first item */}
        <div style={{ borderTop: `1px solid ${C.hairline}` }}>
          {FAQS.map((f) => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER CTA — Cohere dark feature band
══════════════════════════════════════════════════════════════════════════ */
function FooterCTA() {
  return (
    <section style={{ backgroundColor: C.dark, padding: "96px 24px" }}>
      <InView style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <SectionLabel light>Get started</SectionLabel>
        <h2 style={{
          fontFamily: FONT.display,
          fontSize: "clamp(36px, 5vw, 60px)",
          fontWeight: 500,
          color: C.darkText,
          margin: "0 0 20px",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
        }}>
          Your voice is your most valuable asset on LinkedIn.
        </h2>
        <p style={{ fontSize: 17, color: C.darkMuted, margin: "0 0 40px", lineHeight: 1.7 }}>
          Build your Voice DNA today. Every post is scored against your fingerprint — the only thing you publish sounds unmistakably like you.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/sign-up"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: C.darkText, color: C.ink,
              padding: "13px 28px", borderRadius: 32,
              fontSize: 14, fontWeight: 500, textDecoration: "none",
            }}>
            Build your Voice DNA — free
            <ArrowRight size={14} />
          </Link>
          <Link href="/pricing"
            style={{
              display: "inline-flex", alignItems: "center",
              color: C.darkText, border: `1px solid ${C.darkBdr}`,
              padding: "13px 22px", borderRadius: 32,
              fontSize: 14, fontWeight: 400, textDecoration: "none",
            }}>
            See pricing
          </Link>
        </div>
        <p style={{ fontFamily: FONT.mono, fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "20px 0 0", letterSpacing: "0.04em" }}>
          Free · No credit card · 14-day trial on Growth
        </p>
      </InView>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FOOTER — near-black, Cohere footer-newsletter pattern
══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  const COLS = [
    { heading: "Product",   links: [{ href: "/features", label: "Features" }, { href: "/pricing", label: "Pricing" }, { href: "/audit", label: "Free voice audit" }] },
    { heading: "Use cases", links: [{ href: "/features#founders", label: "Founders" }, { href: "/features#consultants", label: "Consultants" }, { href: "/features#coaches", label: "Coaches" }] },
    { heading: "Account",   links: [{ href: "/sign-up", label: "Create account" }, { href: "/sign-in", label: "Sign in" }, { href: "/dashboard", label: "Dashboard" }] },
  ];
  return (
    <footer style={{ backgroundColor: "#0f0f14", borderTop: `1px solid rgba(255,255,255,0.06)` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "56px 24px 32px" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <VoiseLogo markSize={24} fontSize={14} fontWeight={700} letterSpacing="-0.03em" gap={7} color="#ffffff" />
            <p style={{ margin: "16px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.7, maxWidth: 260 }}>
              AI-powered LinkedIn content scored against your personal voice fingerprint. Not generic. Unmistakably you.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.heading}>
              <p style={{ fontFamily: FONT.mono, fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 16px" }}>
                {col.heading}
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {col.links.map((l) => (
                  <li key={l.href}><Link href={l.href} style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 11, color: "rgba(255,255,255,0.25)", letterSpacing: "0.03em" }}>© 2026 Voise. All rights reserved.</span>
          <div style={{ display: "flex", gap: 24 }}>
            {[{ href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }].map((l) => (
              <Link key={l.href} href={l.href} style={{ fontFamily: FONT.mono, fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none", letterSpacing: "0.03em" }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <div style={{ backgroundColor: C.canvas }}>
      {/* Particle canvas — fixed overlay, subtle on white bg */}
      <div aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <ParticleCanvas maxParticles={180} particleSizeMin={1} particleSizeMax={2} speedScale={1.0} />
      </div>

      {/* All content above particle layer */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <AnnouncementBar />
        <Nav />
        <AnimatedHero />
        <TrustStrip />
        <StatsBar />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ScoreComparisonSection />
        <WhoForSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FooterCTA />
        <Footer />
      </div>
    </div>
  );
}

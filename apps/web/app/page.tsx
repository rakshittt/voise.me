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
  Dna, Target, Lock, EyeOff, Trash2, Download, Sparkles, Copy,
} from "lucide-react";
import { VoiseLogo } from "@/components/ui/VoiseLogo";
import { AnimatedHero } from "@/components/ui/animated-hero";
import { ParticleCanvas } from "@/components/ui/particle-canvas-1";

/* ══════════════════════════════════════════════════════════════════════════
   COLOR SYSTEM - Cohere-inspired light palette
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
  brand:     "#5856D6",       // indigo - used sparingly like Cohere coral
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
  { icon: Bot,      title: "Generic AI sounds like everyone",   desc: "ChatGPT, every AI writing tool - trained on the same internet. The output is averaged across millions of users. Your post ends up sounding like no one." },
  { icon: RefreshCw, title: "Consistency is the real problem", desc: "You post well for two weeks, then life happens. The algorithm punishes inconsistency. Your audience drifts. And every restart means building from zero again." },
];

const STEPS = [
  { n: "01", title: "Add your writing",      desc: "Paste your LinkedIn posts, drop a blog URL, or add a transcript. No posts yet? Answer 7 questions and we build your seed profile from scratch.", tag: "Setup · 5 min" },
  { n: "02", title: "We build your Voice DNA", desc: "Our model analyzes your writing across 11 dimensions - hook style, sentence rhythm, vocabulary, CTA patterns, belief stances, and more.", tag: "Automatic" },
  { n: "03", title: "Generate & score",       desc: "Describe your idea. Get 3 post variants, each scored 0–100 against your Voice DNA. Pick the one above 85%. Or refine in the AI chat.", tag: "~3 min per post" },
  { n: "04", title: "Publish with confidence", desc: "When the score clears your threshold, it genuinely sounds like you. Copy it, post it yourself. Your audience grows because your voice is consistent.", tag: "You're in control" },
];

const FEATURES = [
  { icon: Dna,          title: "Voice DNA",            sub: "11-dimension personal fingerprint", desc: "Hook style, sentence rhythm, vocabulary register, post structure, paragraph breaks, CTA style, epistemic stance, self-reference, emotional register, signature phrases, and belief stances.", large: true },
  { icon: Target,       title: "Voice Match Score",    sub: "0 to 100 on every draft",           desc: "Every generated post is scored before you see it. Above 85 = sounds like you. Below 60 = regenerate. The number removes the guesswork." },
  { icon: Zap,          title: "Idea Recommendations", sub: "Grounded in your patterns",         desc: "Surfaces ideas calibrated to your existing content, proven topics, and voice style - already aligned to your audience." },
  { icon: MessageSquare, title: "Refine with AI",      sub: "Real-time feedback loop",           desc: "Tell the AI what's wrong with a draft. The next variant incorporates your feedback in the same session." },
  { icon: History,      title: "History & Trend",       sub: "Watch your score improve",         desc: "Every post is saved. Voise tracks your average voice match score over time. The copy-without-edit rate improves as the model learns." },
  { icon: BarChart3,    title: "Usage Insights",        sub: "Cost-aware generation",            desc: "See exactly how many generations you've used, which posts scored highest, and where your voice is strongest." },
];

const FOR_WHO = [
  { label: "SaaS founders",     desc: "Build a personal brand that attracts talent and customers - without spending your best thinking hours on LinkedIn copy." },
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

const DIMENSIONS = [
  { label: "Hook style",        desc: "How you open every post",              value: 87 },
  { label: "Sentence rhythm",   desc: "Short bursts vs. flowing prose",        value: 72 },
  { label: "Vocabulary",        desc: "Technical depth vs. plain language",    value: 91 },
  { label: "Post structure",    desc: "List, narrative, or essay",             value: 65 },
  { label: "Paragraph breaks",  desc: "How you pace the reader's eye",         value: 78 },
  { label: "CTA style",         desc: "Direct ask, question, or none",         value: 83 },
  { label: "Epistemic stance",  desc: "How certain or hedged you sound",       value: 60 },
  { label: "Self-reference",    desc: "Personal vs. universal framing",        value: 94 },
  { label: "Emotional register", desc: "Calm, charged, or balanced tone",     value: 69 },
  { label: "Signature phrases", desc: "Recurring expressions you own",         value: 88 },
  { label: "Belief stances",    desc: "Convictions that define your POV",      value: 75 },
];

const DEMO_VARIANTS = [
  {
    score: 91, label: "Best match",
    content: `The reason most founders go quiet on LinkedIn isn't lack of ideas.\n\nIt's the 2-hour tax on every post.\n\nYou know what to say. The thinking is done. But translating it from head to published means sitting down, drafting, editing, hating it, starting again.\n\nSo you skip a week. Then two. By month three, posting feels like a goal instead of a habit.\n\nThe founders who stay visible solved one thing: the gap between idea and first draft.\n\nWhat does that gap look like for you?`,
  },
  {
    score: 78, label: "Variant B",
    content: `Most LinkedIn advice focuses on what to post.\n\nNobody talks about why founders stop.\n\nIt's not ideas - it's activation energy. Every post starts from zero. Two hours of thinking to produce 250 words. After a few rounds of that, the ROI math stops working.\n\nThe consistent creators I know have one thing in common: a system that makes the process lighter than the idea.\n\nThe content isn't the problem. The process is.`,
  },
  {
    score: 64, label: "Variant C",
    content: `LinkedIn consistency compounds in ways most founders underestimate.\n\nA founder who shows up every week for a year builds a different audience than one who posts occasionally. The algorithm rewards it. Your audience grows used to hearing from you.\n\nBut maintaining that when you're running a company is genuinely hard. The time cost per post is too high.\n\nWhat would change if you could go from idea to draft in 10 minutes?`,
  },
];

const COMPARE_ROWS = [
  { feat: "Trained on YOUR writing",           voise: true,  chatgpt: false, ghost: false },
  { feat: "Voice match score on every draft",  voise: true,  chatgpt: false, ghost: false },
  { feat: "Learns from your edits over time",  voise: true,  chatgpt: false, ghost: true  },
  { feat: "Output in under 3 minutes",         voise: true,  chatgpt: true,  ghost: false },
  { feat: "Zero access to your LinkedIn",      voise: true,  chatgpt: true,  ghost: true  },
  { feat: "Private model - not shared",        voise: true,  chatgpt: false, ghost: true  },
  { feat: "Affordable for solo creators",      voise: true,  chatgpt: true,  ghost: false },
];

const PRIVACY_POINTS = [
  { icon: Lock,     title: "Your writing stays private",     desc: "Your posts build your personal model and are never shared or used to train models for other users. Your voice fingerprint is yours alone." },
  { icon: EyeOff,   title: "We never post for you",          desc: "Voise generates content. You decide what goes live. We have zero access to your LinkedIn account - not even read access." },
  { icon: Trash2,   title: "Audio deleted in 60 seconds",    desc: "Voice notes are transcribed then permanently deleted. We never store audio recordings beyond the time it takes to convert to text." },
  { icon: Download, title: "You own your Voice DNA",          desc: "Export or delete your writing fingerprint at any time. Your profile belongs to you - you can take it or erase it whenever you want." },
];

const FAQS = [
  { q: "How is Voise different from ChatGPT or other AI writing tools?", a: "ChatGPT writes from a prompt using patterns averaged across millions of users. Voise builds a private model from your specific writing, scores every generated draft against that model, and refines based on your real-time feedback. The output isn't just AI-generated text - it's text measured against your fingerprint." },
  { q: "What if I don't have many LinkedIn posts?", a: "If you have 15 or more posts, we build directly from those. If you're starting fresh, answer 7 questions about how you think and write - we build a seed profile from your responses and update it automatically as you generate and refine." },
  { q: "What counts as one generation?", a: "Each time you submit an idea, Voise produces 3 scored variants - that counts as 1 generation. Refining a variant in the AI chat does not count against your generation limit." },
  { q: "Can I try it before paying?", a: "Yes. Every account starts with a 30-day free trial at full Growth access — no credit card required. The free plan gives you 30 generations and 20 repurposes per month. Upgrade to Growth for unlimited everything." },
  { q: "Does Voise post to LinkedIn for me?", a: "No. Voise generates and scores the content. You copy it, review it, and post it yourself. You stay in full control of what goes live - we don't touch your LinkedIn account." },
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

function InViewStagger({ children, stagger = 0.1, style, className }: {
  children: React.ReactNode; stagger?: number; style?: React.CSSProperties; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} variants={SC(stagger)} initial="hidden"
      animate={inView ? "show" : "hidden"} style={style} className={className}>
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

/* ── FAQ item - Cohere research-table style: rule only, no card ─────────── */
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

/* ── Section label - Cohere mono-overline ────────────────────────────────── */
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
   ANNOUNCEMENT BAR - Cohere pattern: full-width near-black strip
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
        &nbsp;on every draft - scores every post against your personal fingerprint
      </p>
      <button onClick={() => setVisible(false)}
        style={{ position: "absolute", right: 16, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 4 }}>
        ×
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   NAV - white canvas, scroll-aware border
══════════════════════════════════════════════════════════════════════════ */
function Nav() {
  const { scrollY } = useScroll();
  const bdr = useTransform(scrollY, [0, 40], ["rgba(217,217,221,0)", C.hairline]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const NAV_LINKS: [string, string][] = [["Features", "/features"], ["Pricing", "/pricing"]];

  return (
    <motion.nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: C.canvas, borderBottom: "1px solid", borderColor: bdr, backdropFilter: "blur(8px)" }}>
      <div style={{ maxWidth: 1320, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", flexShrink: 0 }}>
          <VoiseLogo markSize={24} fontSize={15} fontWeight={600} gap={7} />
        </Link>

        {/* Center links - hidden on mobile */}
        <div className="nav-links" style={{ display: "flex", alignItems: "center" }}>
          {NAV_LINKS.map(([label, href]) => (
            <Link key={href} href={href}
              style={{ fontFamily: FONT.body, fontSize: 14, color: C.muted, padding: "6px 14px", textDecoration: "none" }}>
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/sign-in" className="nav-signin"
            style={{ fontFamily: FONT.body, fontSize: 14, color: C.muted, textDecoration: "none" }}>
            Sign in
          </Link>
          <Link href="/sign-up"
            style={{ fontFamily: FONT.body, fontSize: 13, fontWeight: 500, backgroundColor: C.ink, color: "#fff", padding: "7px 18px", borderRadius: 32, textDecoration: "none" }}>
            Get started
          </Link>
          {/* Hamburger - shown only on mobile via CSS */}
          <button
            className="nav-burger"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 6, flexDirection: "column", gap: 5, alignItems: "center", justifyContent: "center", width: 36, height: 36 }}
          >
            <span style={{ display: "block", width: 20, height: 1.5, backgroundColor: C.ink, borderRadius: 2, transition: "transform 0.2s", transform: mobileOpen ? "translateY(3.25px) rotate(45deg)" : "none" }} />
            <span style={{ display: "block", width: 20, height: 1.5, backgroundColor: C.ink, borderRadius: 2, transition: "opacity 0.15s", opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ display: "block", width: 20, height: 1.5, backgroundColor: C.ink, borderRadius: 2, transition: "transform 0.2s", transform: mobileOpen ? "translateY(-3.25px) rotate(-45deg)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", borderTop: `1px solid ${C.hairline}`, backgroundColor: C.canvas }}
          >
            <div style={{ padding: "4px 24px 16px", display: "flex", flexDirection: "column" }}>
              {[...NAV_LINKS, ["Sign in", "/sign-in"] as [string, string]].map(([label, href]) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  style={{ fontFamily: FONT.body, fontSize: 15, color: C.text, padding: "13px 0", textDecoration: "none", borderBottom: `1px solid ${C.hairline}`, display: "block" }}>
                  {label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   TRUST STRIP - stone background, company names monochrome text
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
   STATS BAR - stone bg, count-up on scroll
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
   PROBLEM SECTION - white canvas, capability cards (Cohere: top-rule only)
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
            Most creators face three specific walls - and generic AI makes all three worse.
          </p>
        </InView>

        {/* Capability cards - Cohere style: top border only, thin-line icon, no box shadow */}
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
   HOW IT WORKS - Cohere dark-feature-band: near-black, white text, timeline
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
   FEATURES - stone background, Cohere product-card grid
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

        <InViewStagger className="features-bento" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
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
   SCORE COMPARISON - white canvas, toggle, Cohere bordered cards
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
                    Your real insights are already there - in your Slack messages, client calls, 2am thoughts.
                  </p>
                  <div style={{ backgroundColor: C.greenDim, borderRadius: 6, padding: "9px 12px", fontSize: 12, color: C.green, fontWeight: 500 }}>
                    ✓ 91% - hook, rhythm, vocabulary all match. Ready to publish.
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
   WHO IT'S FOR - stone bg, Cohere blog-filter-chip style labels
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
   TESTIMONIALS - white canvas, infinite marquee
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
   PRODUCT DEMO - interactive 3-step generation walkthrough
══════════════════════════════════════════════════════════════════════════ */
function ProductDemoSection() {
  const [phase, setPhase] = useState<"idle" | "generating" | "done">("idle");
  const [selected, setSelected] = useState(0);
  const [copied, setCopied] = useState(false);

  function runDemo() {
    setPhase("generating");
    setTimeout(() => setPhase("done"), 1900);
  }
  function reset() { setPhase("idle"); setSelected(0); setCopied(false); }
  function handleCopy() { setCopied(true); setTimeout(() => setCopied(false), 2000); }

  const v = DEMO_VARIANTS[selected];

  return (
    <section style={{ backgroundColor: C.stone, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <InView style={{ marginBottom: 48, maxWidth: 520 }}>
          <SectionLabel>See it work</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            From idea to scored draft in under 3 minutes.
          </h2>
          <p style={{ fontSize: 16, color: C.muted, margin: 0, lineHeight: 1.7 }}>
            Watch the real workflow. Describe your idea, get 3 variants scored against a real Voice DNA, copy the best one.
          </p>
        </InView>

        {/* Demo shell */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EASE }}
          style={{ backgroundColor: C.canvas, border: `1px solid ${C.cardBdr}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>

          {/* App chrome bar */}
          <div style={{ backgroundColor: C.ink, padding: "11px 18px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#FF5F57", "#FEBC2E", "#28C840"].map((bg) => (
                <span key={bg} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: bg }} />
              ))}
            </div>
            <span style={{ fontFamily: FONT.mono, fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.04em", marginLeft: 4 }}>
              Voise · Generate post
            </span>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", backgroundColor: "#fafaf8", borderBottom: `1px solid ${C.hairline}` }}>
            {[["1", "Describe idea"], ["2", "Review variants"], ["3", "Copy & post"]].map(([num, label], i) => {
              const active = (i === 0 && phase === "idle") || (i === 1 && (phase === "generating" || (phase === "done"))) || (i === 2 && copied);
              const done = (i === 0 && phase !== "idle") || (i === 1 && copied);
              return (
                <div key={num} style={{ flex: 1, padding: "10px 16px", display: "flex", alignItems: "center", gap: 7, borderRight: i < 2 ? `1px solid ${C.hairline}` : "none" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    backgroundColor: done ? C.green : active ? C.brand : C.hairline,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: (done || active) ? "#fff" : C.faint,
                    fontFamily: FONT.mono, transition: "background 0.3s",
                  }}>
                    {done ? "✓" : num}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: active ? C.ink : C.faint, fontFamily: FONT.body }}>{label}</span>
                </div>
              );
            })}
          </div>

          {/* Content area */}
          <div style={{ padding: 28, minHeight: 340 }}>
            <AnimatePresence mode="wait">

              {/* Phase: idle - idea input */}
              {phase === "idle" && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <p style={{ fontFamily: FONT.mono, fontSize: 10, color: C.faint, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 12px" }}>Your idea</p>
                  <div style={{ border: `1.5px solid ${C.brand}`, borderRadius: 10, padding: "14px 18px", backgroundColor: C.brandDim, marginBottom: 20 }}>
                    <p style={{ margin: 0, fontSize: 15, color: C.ink, fontFamily: FONT.body, lineHeight: 1.5 }}>
                      Why founders stop posting consistently on LinkedIn
                    </p>
                  </div>
                  <p style={{ fontSize: 13, color: C.faint, fontFamily: FONT.body, margin: "0 0 20px" }}>
                    Tone: Direct · Audience: B2B founders · Voice DNA: <span style={{ color: C.green, fontWeight: 500 }}>Active (87 avg score)</span>
                  </p>
                  <button
                    onClick={runDemo}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      backgroundColor: C.ink, color: "#fff",
                      padding: "11px 24px", borderRadius: 32,
                      fontFamily: FONT.body, fontSize: 14, fontWeight: 500,
                      border: "none", cursor: "pointer",
                    }}
                  >
                    <Sparkles size={14} />
                    Generate 3 variants
                  </button>
                </motion.div>
              )}

              {/* Phase: generating */}
              {phase === "generating" && (
                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 20 }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
                    <Sparkles size={28} color={C.brand} />
                  </motion.div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: C.ink, fontFamily: FONT.body }}>Generating 3 variants…</p>
                    <p style={{ margin: 0, fontSize: 13, color: C.faint, fontFamily: FONT.mono, letterSpacing: "0.04em" }}>Scoring against your Voice DNA</p>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0, 0.15, 0.3].map((d) => (
                      <motion.span key={d} style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: C.brand }}
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.9, repeat: Infinity, delay: d }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Phase: done - variant cards */}
              {phase === "done" && (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  {/* Score tabs */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                    {DEMO_VARIANTS.map((dv, i) => {
                      const scoreColor = dv.score >= 85 ? C.green : dv.score >= 70 ? "#b45309" : C.red;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelected(i)}
                          style={{
                            display: "flex", alignItems: "center", gap: 8,
                            padding: "8px 14px", borderRadius: 8, border: `1.5px solid ${selected === i ? scoreColor : C.hairline}`,
                            backgroundColor: selected === i ? (dv.score >= 85 ? C.greenDim : dv.score >= 70 ? "#fef3c7" : C.redDim) : C.canvas,
                            cursor: "pointer", fontFamily: FONT.body, transition: "border-color 0.15s, background 0.15s",
                          }}
                        >
                          <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 700, color: scoreColor }}>{dv.score}%</span>
                          <span style={{ fontSize: 12, color: C.muted, fontFamily: FONT.body }}>{dv.label}</span>
                        </button>
                      );
                    })}
                    <button onClick={reset} style={{ marginLeft: "auto", fontSize: 12, color: C.faint, background: "none", border: "none", cursor: "pointer", fontFamily: FONT.body, padding: "8px 4px" }}>
                      ← Try again
                    </button>
                  </div>

                  {/* Selected variant */}
                  {v && (
                    <motion.div key={selected} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                      <div style={{
                        border: `1.5px solid ${v.score >= 85 ? C.green : v.score >= 70 ? "#d97008" : C.red}`,
                        borderRadius: 10, overflow: "hidden",
                      }}>
                        <div style={{
                          padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                          backgroundColor: v.score >= 85 ? C.greenDim : v.score >= 70 ? "#fef3c7" : C.redDim,
                          borderBottom: `1px solid ${v.score >= 85 ? "rgba(26,122,74,0.15)" : v.score >= 70 ? "rgba(217,112,8,0.15)" : "rgba(192,57,43,0.15)"}`,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: FONT.mono, fontSize: 11, fontWeight: 700, color: v.score >= 85 ? C.green : v.score >= 70 ? C.amber : C.red, letterSpacing: "0.06em" }}>
                              {v.score}% VOICE MATCH
                            </span>
                            {v.score >= 85 && (
                              <span style={{ fontFamily: FONT.mono, fontSize: 10, color: C.green, backgroundColor: "rgba(26,122,74,0.12)", borderRadius: 20, padding: "2px 8px" }}>
                                ✓ Ready to publish
                              </span>
                            )}
                          </div>
                          <button
                            onClick={handleCopy}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 6,
                              padding: "5px 12px", borderRadius: 20, border: "none",
                              backgroundColor: C.ink, color: "#fff",
                              fontFamily: FONT.body, fontSize: 12, fontWeight: 500, cursor: "pointer",
                            }}
                          >
                            <Copy size={11} />
                            {copied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <div style={{ padding: "20px 20px", backgroundColor: C.canvas }}>
                          <p style={{ margin: 0, fontSize: 14, color: C.text, lineHeight: 1.75, fontFamily: FONT.body, whiteSpace: "pre-line" }}>
                            {v.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   VOICE DNA VISUAL - animated dimension bars
══════════════════════════════════════════════════════════════════════════ */
function DimBar({ label, value, index }: { label: string; value: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const barColor = value >= 80 ? C.green : value >= 65 ? C.brand : C.amber;
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 13, color: C.muted, fontFamily: FONT.body, width: 130, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: C.hairline, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${value}%` } : { width: 0 }}
          transition={{ duration: 0.9, delay: index * 0.05, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 2, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

function VoiceDNASection() {
  return (
    <section style={{ backgroundColor: C.canvas, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "56px 80px", alignItems: "center" }}>

          {/* Left */}
          <InView>
            <SectionLabel>Voice DNA</SectionLabel>
            <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(30px, 3.5vw, 44px)", fontWeight: 500, color: C.ink, margin: "0 0 18px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              Your writing has a fingerprint.<br />We map it.
            </h2>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: "0 0 24px", maxWidth: 400 }}>
              Voise learns <em>how</em> you write - hook style, sentence rhythm, vocabulary, CTA patterns - and uses that to generate content that sounds like no one else.
            </p>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["47", "posts analysed"], ["87%", "avg voice match"], ["2 days", "last updated"]].map(([val, lbl]) => (
                <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: 700, color: C.ink, letterSpacing: "-0.02em" }}>{val}</span>
                  <span style={{ fontSize: 11, color: C.faint, fontFamily: FONT.mono }}>{lbl}</span>
                </div>
              ))}
            </div>
          </InView>

          {/* Right: dimension bars */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            {DIMENSIONS.map((d, i) => (
              <DimBar key={d.label} label={d.label} value={d.value} index={i} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPARISON TABLE - Voise vs ChatGPT vs Ghostwriter
══════════════════════════════════════════════════════════════════════════ */
function ComparisonSection() {
  const cols = ["Voise", "ChatGPT", "Ghostwriter"];
  const colColors = [C.brand, C.faint, C.faint];

  return (
    <section style={{ backgroundColor: C.stone, padding: "96px 24px", borderTop: `1px solid ${C.cardBdr}` }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <InView style={{ marginBottom: 48, maxWidth: 520 }}>
          <SectionLabel>Why Voise</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 500, color: C.ink, margin: "0 0 16px", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Every AI tool can write.<br />Only one writes like you.
          </h2>
          <p style={{ fontSize: 16, color: C.muted, margin: 0, lineHeight: 1.7 }}>
            Generic AI averages across millions of users. Voise is built exclusively from your writing.
          </p>
        </InView>

        <InView>
          <div style={{ border: `1px solid ${C.cardBdr}`, borderRadius: 12, overflow: "hidden", backgroundColor: C.canvas }}>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", backgroundColor: C.ink }}>
              <div style={{ padding: "14px 24px" }} />
              {cols.map((col, i) => (
                <div key={col} style={{ padding: "14px 0", textAlign: "center" }}>
                  <span style={{
                    fontFamily: FONT.mono, fontSize: 11, fontWeight: 700,
                    color: i === 0 ? "#ffffff" : "rgba(255,255,255,0.4)",
                    letterSpacing: "0.06em", textTransform: "uppercase",
                  }}>
                    {col}
                  </span>
                </div>
              ))}
            </div>

            {/* Data rows */}
            {COMPARE_ROWS.map((row, ri) => (
              <div
                key={row.feat}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr",
                  borderBottom: ri < COMPARE_ROWS.length - 1 ? `1px solid ${C.hairline}` : "none",
                  backgroundColor: ri % 2 === 0 ? C.canvas : "#fafaf8",
                }}
              >
                <div style={{ padding: "14px 24px", fontSize: 14, color: C.text, fontFamily: FONT.body }}>{row.feat}</div>
                {[row.voise, row.chatgpt, row.ghost].map((val, ci) => (
                  <div key={ci} style={{ padding: "14px 0", textAlign: "center" }}>
                    {val ? (
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 22, height: 22, borderRadius: "50%",
                        backgroundColor: ci === 0 ? C.greenDim : "rgba(0,0,0,0.05)",
                      }}>
                        <Check size={12} color={ci === 0 ? C.green : C.faint} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span style={{ fontSize: 16, color: C.hairline, lineHeight: 1 }}>-</span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Price footer */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", backgroundColor: C.stone, borderTop: `1px solid ${C.cardBdr}` }}>
              <div style={{ padding: "14px 24px", fontFamily: FONT.mono, fontSize: 11, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase" }}>Price</div>
              {[["$0 – 29/mo", C.brand], ["$20/mo", C.faint], ["$3,000+/mo", C.faint]].map(([price, color]) => (
                <div key={price} style={{ padding: "14px 0", textAlign: "center", fontFamily: FONT.mono, fontSize: 12, fontWeight: 600, color }}>
                  {price}
                </div>
              ))}
            </div>
          </div>
        </InView>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRIVACY - dark band, 4 trust points
══════════════════════════════════════════════════════════════════════════ */
function PrivacySection() {
  return (
    <section style={{ backgroundColor: C.dark, padding: "80px 24px", borderTop: `1px solid rgba(255,255,255,0.06)` }}>
      <div style={{ maxWidth: 1060, margin: "0 auto" }}>
        <InView style={{ marginBottom: 48, textAlign: "center" }}>
          <SectionLabel light>Privacy & control</SectionLabel>
          <h2 style={{ fontFamily: FONT.display, fontSize: "clamp(26px, 3.5vw, 40px)", fontWeight: 500, color: C.darkText, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            Your voice. Your data. Your control.
          </h2>
        </InView>

        <InViewStagger style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          {PRIVACY_POINTS.map(({ icon: Icon, title, desc }) => (
            <motion.div key={title} variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(88,86,214,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={C.brand} strokeWidth={1.5} />
              </div>
              <div>
                <h3 style={{ fontFamily: FONT.display, fontSize: 16, fontWeight: 500, color: C.darkText, margin: "0 0 8px", letterSpacing: "-0.01em" }}>{title}</h3>
                <p style={{ fontSize: 14, color: C.darkMuted, margin: 0, lineHeight: 1.65 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </InViewStagger>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRICING - stone bg, Cohere product-card pattern
══════════════════════════════════════════════════════════════════════════ */
function PricingSection() {
  const checks = {
    starter: ["Full Voice DNA setup", "30 generations / month", "20 repurposes / month", "Voice match score on every draft"],
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
          {/* Starter - white product card */}
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

          {/* Growth - white card with indigo top accent */}
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
                Start 30-day free trial
              </Link>
            </div>
          </InView>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   FAQ - white canvas, Cohere research-table: rules only, no cards
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
   FOOTER CTA - Cohere dark feature band
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
          Build your Voice DNA today. Every post is scored against your fingerprint - the only thing you publish sounds unmistakably like you.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/sign-up"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              backgroundColor: C.darkText, color: C.ink,
              padding: "13px 28px", borderRadius: 32,
              fontSize: 14, fontWeight: 500, textDecoration: "none",
            }}>
            Build your Voice DNA - free
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
   FOOTER - near-black, Cohere footer-newsletter pattern
══════════════════════════════════════════════════════════════════════════ */
function Footer() {
  const COLS = [
    { heading: "Product",   links: [{ href: "/features", label: "Features" }, { href: "/pricing", label: "Pricing" }] },
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
      {/* Particle canvas - fixed overlay, subtle on white bg */}
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
        <ProductDemoSection />
        <VoiceDNASection />
        <FeaturesSection />
        <ComparisonSection />
        <ScoreComparisonSection />
        <WhoForSection />
        <TestimonialsSection />
        <PrivacySection />
        <FAQSection />
        <FooterCTA />
        <Footer />
      </div>
    </div>
  );
}

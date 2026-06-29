"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/* ── Palette ─────────────────────────────────────────────────────────────── */
const C = {
  canvas:   "#ffffff",
  stone:    "#eeece7",
  ink:      "#17171c",
  muted:    "#6b6b7b",
  faint:    "#93939f",
  hairline: "#d9d9dd",
  cardBdr:  "#e5e3dc",
  brand:    "#5856D6",
  green:    "#1a7a4a",
  greenDim: "#edfce9",
} as const;

/* LinkedIn card constants */
const LI = {
  ink:     "rgba(0,0,0,0.9)",
  sub:     "rgba(0,0,0,0.6)",
  faint:   "rgba(0,0,0,0.45)",
  blue:    "#0A66C2",
  divider: "rgba(0,0,0,0.08)",
  hover:   "rgba(0,0,0,0.05)",
  font:    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

const EASE = [0.16, 1, 0.3, 1] as const;

/* ── Inline pill button ──────────────────────────────────────────────────── */
function HeroButton({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5856D6] cursor-pointer text-[14px] rounded-[32px] px-6 py-3",
        variant === "primary"
          ? "bg-[#17171c] text-white hover:bg-[#2d2d35]"
          : "bg-transparent text-[#17171c] border border-[#d9d9dd] hover:border-[#17171c] hover:bg-[#f5f4f0]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/* ── Score gauge ─────────────────────────────────────────────────────────── */
function ScoreGauge({
  target, size = 100, color = C.green, trackColor = "#d9d9dd",
  strokeW = 7, delay = 0, autoStart = false,
}: {
  target: number; size?: number; color?: string; trackColor?: string;
  strokeW?: number; delay?: number; autoStart?: boolean;
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
    if ((autoStart || inView) && !started.current) {
      started.current = true;
      animate(count, target, { duration: 2.2, delay, ease: "easeOut" });
    }
  }, [inView, autoStart, count, delay, target]);

  return (
    <div ref={ref} style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeW} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
          strokeWidth={strokeW} strokeLinecap="round" strokeDasharray={circ}
          style={{ strokeDashoffset: dashOffset }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <motion.span style={{
          fontSize: size * 0.26,
          fontWeight: 500,
          color,
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          {rounded}
        </motion.span>
      </div>
    </div>
  );
}

/* ── Globe SVG ───────────────────────────────────────────────────────────── */
function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: LI.faint, flexShrink: 0 }}>
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm-.35 1.03A7 7 0 018 1c.12 0 .23 0 .35.01C7.67 1.5 7 2.84 6.56 4.5H4.27A6.99 6.99 0 017.65 1.03zM3.82 5.5H1.16A6.98 6.98 0 001 8c0 .86.15 1.69.42 2.45h2.65A14.4 14.4 0 013.5 8c0-.87.11-1.72.32-2.5zm.45 0H7.5A13.3 13.3 0 007.5 8c0 .87.1 1.72.27 2.5H4.31A13.3 13.3 0 014 8c0-.87.1-1.72.27-2.5zm4.23 0h2.95A13.3 13.3 0 009.73 8c0 .87-.1 1.72-.27 2.5H8.23A13.3 13.3 0 008.5 8c0-.87-.1-1.72-.23-2.5zm3.41 0H14.5c.21.78.32 1.63.32 2.5 0 .87-.11 1.72-.32 2.5h-2.65c.17-.78.27-1.63.27-2.5 0-.87-.1-1.72-.27-2.5zm-.26-1H9.44C9 2.84 8.33 1.5 7.65 1.03A6.99 6.99 0 0111.65 4.5zm-7.38 7H6.56C7 13.16 7.67 14.5 8.35 14.97A6.99 6.99 0 014.27 11.5zm7.46 0h-2.29C9 13.16 8.33 14.5 7.65 14.97A7 7 0 0011.73 11.5zm1.09 0h-.45A14.4 14.4 0 0012.5 10h2.08A6.99 6.99 0 0111.73 11.5z" />
    </svg>
  );
}

/* ── LinkedIn post mock (static, no auth needed on landing page) ─────────── */
function HeroLinkedInMock() {
  const [hoverBtn, setHoverBtn] = useState<string | null>(null);

  const actions = [
    {
      label: "Like",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 22V11M2 13v7a2 2 0 002 2h13.5a2 2 0 001.96-1.6l1.5-7A2 2 0 0019 11H14V6a2 2 0 00-2-2H11l-4 7z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Comment",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Repost",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Send",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 8,
      boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.07)",
      overflow: "hidden",
      fontFamily: LI.font,
    }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Avatar + in badge */}
        <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "linear-gradient(135deg, #5856D6 0%, #818CF8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 19, fontWeight: 700,
          }}>
            M
          </div>
          <span style={{
            position: "absolute", bottom: -2, right: -2,
            width: 18, height: 18, backgroundColor: LI.blue,
            border: "2px solid #ffffff", borderRadius: 3,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#ffffff", fontSize: 8, fontWeight: 900,
            userSelect: "none",
          }}>
            in
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: LI.ink, lineHeight: "1.2", marginBottom: 1 }}>
            Marcus T.
          </div>
          <div style={{ fontSize: 12, color: LI.sub, lineHeight: "1.3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>
            SaaS Founder · 12,400 followers
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12, color: LI.faint }}>Now</span>
            <span style={{ fontSize: 12, color: LI.faint }}>•</span>
            <GlobeIcon />
          </div>
        </div>

        <button style={{ background: "none", border: "none", padding: "4px 6px", cursor: "pointer", color: LI.sub, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
          ···
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "10px 16px 8px", fontSize: 14, color: LI.ink, lineHeight: "1.43", fontFamily: LI.font }}>
        <p style={{ margin: "0 0 8px" }}>
          The biggest mistake I see founders make on LinkedIn isn&apos;t posting too little.
        </p>
        <p style={{ margin: "0 0 8px" }}>
          It&apos;s posting what they <strong>think</strong> their audience wants to hear.
        </p>
        <p style={{ margin: 0, color: LI.sub }}>
          Your real insights are already there - in your Slack messages, client calls, 2am thoughts.{" "}
          <span style={{ color: LI.sub, fontWeight: 600, cursor: "pointer" }}>see more</span>
        </p>
      </div>

      {/* Reaction summary */}
      <div style={{ padding: "4px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", marginLeft: 4 }}>
            {[{ e: "👍", bg: "#0A66C2" }, { e: "❤️", bg: "#DF704D" }, { e: "💡", bg: "#F5BC00" }].map(({ e, bg }) => (
              <span key={e} style={{ width: 18, height: 18, borderRadius: "50%", backgroundColor: bg, border: "1.5px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, marginLeft: -4, position: "relative" }}>
                {e}
              </span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: LI.faint }}>148</span>
        </div>
        <span style={{ fontSize: 12, color: LI.faint }}>32 comments · 12 reposts</span>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "0 16px" }} />

      {/* Action bar */}
      <div style={{ padding: "4px 8px", display: "flex" }}>
        {actions.map(({ label, icon }) => (
          <button
            key={label}
            onMouseEnter={() => setHoverBtn(label)}
            onMouseLeave={() => setHoverBtn(null)}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              padding: "10px 4px",
              background: hoverBtn === label ? LI.hover : "transparent",
              border: "none", borderRadius: 4, cursor: "pointer",
              color: LI.sub, fontSize: 13, fontWeight: 600,
              fontFamily: LI.font, transition: "background 0.1s",
              whiteSpace: "nowrap",
            }}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ANIMATED HERO
══════════════════════════════════════════════════════════════════════════ */
export function AnimatedHero() {
  const [titleNumber, setTitleNumber] = useState(0);

  const titles = useMemo(
    () => [
      "unmistakably you.",
      "scored before you post.",
      "consistent every week.",
      "built on your voice DNA.",
      "never generic again.",
    ],
    []
  );

  useEffect(() => {
    const id = setTimeout(
      () => setTitleNumber((n) => (n === titles.length - 1 ? 0 : n + 1)),
      2500
    );
    return () => clearTimeout(id);
  }, [titleNumber, titles]);

  return (
    <section className="hero-section" style={{ backgroundColor: C.canvas, paddingTop: 80, paddingBottom: 100, overflow: "hidden" }}>
      {/* Wider container - 1320px so right card has room */}
      <div
        className="grid-hero"
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "0 32px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 64,
          alignItems: "center",
        }}
      >
        {/* ── Left copy ── */}
        <div>
          {/* Mono overline */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              margin: "0 0 28px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11,
              fontWeight: 400,
              letterSpacing: "0.08em",
              color: C.brand,
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: 20, height: 1.5, backgroundColor: C.brand, display: "inline-block", flexShrink: 0 }} />
            Voice match scoring on every draft
          </motion.p>

          {/* Headline - 3 stacked lines avoids any overflow issue */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            style={{
              margin: "0 0 28px",
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: "clamp(40px, 4.8vw, 64px)",
              fontWeight: 500,
              color: C.ink,
              letterSpacing: "-0.03em",
              lineHeight: 1.04,
            }}
          >
            <span style={{ display: "block" }}>LinkedIn content</span>
            <span style={{ display: "block" }}>that&apos;s</span>
            {/* Cycling phrase on its own full-width line - no overflow clip */}
            <span style={{
              display: "block",
              position: "relative",
              height: "1.08em",
              overflow: "hidden",
            }}>
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    color: C.brand,
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                  initial={{ opacity: 0, y: "100%" }}
                  transition={{ type: "spring", stiffness: 50, damping: 14 }}
                  animate={
                    titleNumber === index
                      ? { y: 0, opacity: 1 }
                      : { y: titleNumber > index ? "-100%" : "100%", opacity: 0 }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </motion.h1>

          {/* Body */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
            style={{ fontSize: 17, color: C.muted, lineHeight: 1.65, margin: "0 0 36px", maxWidth: 420 }}
          >
            Voise maps your writing across 11 dimensions and scores every
            AI-generated draft against your fingerprint. Publish when it
            clears&nbsp;85.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
            style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}
          >
            <Link href="/sign-up" style={{ textDecoration: "none" }}>
              <HeroButton variant="primary">
                Build your Voice DNA
                <ArrowRight size={14} />
              </HeroButton>
            </Link>
            <Link href="/sign-in"
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: "none" }}
            >
              <Phone size={13} />
              Jump on a call
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: C.faint, letterSpacing: "0.04em" }}
          >
            Free · No credit card · 30-day trial on Growth
          </motion.p>
        </div>

        {/* ── Right: LinkedIn post + score card ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.14, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {/* Real LinkedIn post format */}
          <HeroLinkedInMock />

          {/* Score readout */}
          <div style={{
            backgroundColor: C.stone,
            border: `1px solid ${C.cardBdr}`,
            borderRadius: 12,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: C.faint, marginBottom: 5,
              }}>
                Voice match
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, maxWidth: 170 }}>
                Hook, rhythm, and vocabulary all match your pattern.
              </div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.4, duration: 0.4 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
                  backgroundColor: C.greenDim, border: `1px solid rgba(26,122,74,0.2)`,
                  borderRadius: 32, padding: "4px 12px 4px 8px",
                  fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                  fontSize: 10, fontWeight: 500, color: C.green, letterSpacing: "0.07em",
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: C.green, flexShrink: 0 }} />
                READY TO PUBLISH
              </motion.div>
            </div>
            <ScoreGauge target={91} size={90} color={C.green} trackColor={C.hairline} strokeW={7} delay={0.8} autoStart />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

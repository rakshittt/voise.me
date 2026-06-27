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

/* ── Palette — matches page.tsx light C object ──────────────────────────── */
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

/* ── Score gauge ────────────────────────────────────────────────────────── */
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
    <section style={{ backgroundColor: C.canvas, paddingTop: 80, paddingBottom: 100, overflow: "hidden" }}>
      <div
        className="grid-hero"
        style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}
      >
        {/* ── Left copy ── */}
        <div>
          {/* Mono overline — Cohere pattern */}
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

          {/* Display headline — Space Grotesk, tight tracking */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.08, ease: EASE }}
            style={{
              margin: "0 0 28px",
              fontFamily: "var(--font-display), 'Space Grotesk', sans-serif",
              fontSize: "clamp(44px, 5.5vw, 72px)",
              fontWeight: 500,
              color: C.ink,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
            }}
          >
            <span style={{ display: "block" }}>LinkedIn content</span>
            <span style={{ display: "block" }}>
              that&apos;s&nbsp;
              {/* Animated cycling phrase */}
              <span style={{ position: "relative", display: "inline-flex", overflow: "hidden", verticalAlign: "bottom", minWidth: "clamp(220px, 30vw, 400px)", height: "1.06em" }}>
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    style={{ position: "absolute", left: 0, bottom: 0, color: C.brand, whiteSpace: "nowrap" }}
                    initial={{ opacity: 0, y: "-100%" }}
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
            </span>
          </motion.h1>

          {/* Body — Inter 18px, muted */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
            style={{ fontSize: 18, color: C.muted, lineHeight: 1.65, margin: "0 0 36px", maxWidth: 430 }}
          >
            Voise maps your writing across 11 dimensions and scores every
            AI-generated draft against your fingerprint. Publish when it
            clears&nbsp;85.
          </motion.p>

          {/* CTAs — near-black pill primary + text link secondary */}
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
            Free · No credit card · 14-day trial on Growth
          </motion.p>
        </div>

        {/* ── Right: score demo ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.14, ease: EASE }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* LinkedIn post card — Cohere hero-photo-card: lg radius, light shadow */}
          <div style={{
            backgroundColor: C.canvas,
            border: `1px solid ${C.cardBdr}`,
            borderRadius: 22,
            padding: 24,
            boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${C.brand} 0%, #818CF8 100%)` }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Marcus T.</div>
                <div style={{ fontSize: 12, color: C.faint }}>SaaS Founder · 12,400 followers</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.75, marginBottom: 14 }}>
              <p style={{ margin: "0 0 9px" }}>The biggest mistake I see founders make on LinkedIn isn&apos;t posting too little.</p>
              <p style={{ margin: "0 0 9px" }}>It&apos;s posting what they <span style={{ color: C.ink, fontWeight: 600 }}>think</span> their audience wants to hear.</p>
              <p style={{ margin: 0 }}>Your real insights are already there — in your Slack messages, client calls, 2am thoughts.</p>
            </div>
            <div style={{ fontSize: 12, color: C.faint, borderTop: `1px solid ${C.hairline}`, paddingTop: 10 }}>
              👍 148 &nbsp;&nbsp; 💬 32 &nbsp;&nbsp; ↗ 12
            </div>
          </div>

          {/* Score readout card — Cohere soft-stone surface */}
          <div style={{
            backgroundColor: C.stone,
            border: `1px solid ${C.cardBdr}`,
            borderRadius: 16,
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}>
            <div>
              <div style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: C.faint,
                marginBottom: 6,
              }}>
                Voice match
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, maxWidth: 180 }}>
                Hook, rhythm, and vocabulary all match your pattern.
              </div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.4, duration: 0.4 }}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 12,
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
            <ScoreGauge target={91} size={96} color={C.green} trackColor={C.hairline} strokeW={7} delay={0.8} autoStart />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

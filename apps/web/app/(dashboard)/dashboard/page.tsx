import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { QuickGenerate } from "@/components/dashboard/QuickGenerate";
import { SetupChecklist } from "@/components/dashboard/SetupChecklist";
import { VoiceStrengthWidget } from "@/components/voice-dna/VoiceStrengthWidget";
import { NextIdeaWidget } from "@/components/ideas/NextIdeaWidget";
import { Lozenge } from "@/components/ui/Lozenge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { GenerationHistoryItem } from "@/lib/types";
import { getVoiceProfileStatus, getUsageSummary } from "@/lib/server-data";

async function fetchHistory(token: string): Promise<GenerationHistoryItem[]> {
  const base = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/generate/history?limit=10&offset=0`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? res.json() : [];
  } catch {
    return [];
  }
}

async function fetchDashboardData(token: string) {
  // profile/usage are deduped via React cache() - OnboardingGuard already
  // triggered these fetches in the layout, so these calls are free.
  const [profile, history, usage] = await Promise.all([
    getVoiceProfileStatus(),
    fetchHistory(token),
    getUsageSummary(),
  ]);

  return { profile, history, usage };
}

/* ── Score helpers ─────────────────────────────────────────────────────────── */

function scoreColor(s: number | null) {
  if (s === null) return "var(--ds-text-subtlest)";
  if (s >= 80) return "#16a34a";
  if (s >= 60) return "#d97706";
  return "var(--ds-text-subtlest)";
}

function scoreBg(s: number | null) {
  if (s === null) return "transparent";
  if (s >= 80) return "rgba(22,163,74,0.1)";
  if (s >= 60) return "rgba(217,119,6,0.1)";
  return "var(--ds-background-neutral)";
}

function ScorePill({ value }: { value: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: "var(--ds-font-size-075)",
        fontWeight: "var(--ds-font-weight-semibold)",
        fontVariantNumeric: "tabular-nums",
        backgroundColor: scoreBg(value),
        color: scoreColor(value),
        lineHeight: "18px",
        flexShrink: 0,
      }}
    >
      {value}%
    </span>
  );
}

/* ── Voice Score computation ───────────────────────────────────────────────── */

function computeVoiceScore(history: GenerationHistoryItem[]) {
  const scores = history
    .map((g) => {
      const variants = g.variants ?? [];
      if (variants.length === 0) return null;
      return Math.max(...variants.map((v) => v.voice_match_score ?? 0));
    })
    .filter((s): s is number => s !== null);

  if (scores.length === 0) return { score: null, trend: null, sampleSize: 0 };

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  let trend: number | null = null;
  if (scores.length >= 4) {
    const half = Math.floor(scores.length / 2);
    const olderAvg = scores.slice(half).reduce((a, b) => a + b, 0) / (scores.length - half);
    const newerAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half;
    trend = Math.round(newerAvg - olderAvg);
  }

  return { score: avg, trend, sampleSize: scores.length };
}

function computeInsight(history: GenerationHistoryItem[], score: number | null): string | null {
  if (history.length < 2 || score === null) return null;
  if (score >= 82) return "Exceptional match - your AI posts are indistinguishable from your own writing.";
  if (score >= 72) return "Strong voice consistency. Your fingerprint is well-calibrated.";
  if (score < 60) return "Generate more posts - voice scores improve as your fingerprint gets more signal.";
  return "Your voice is consistent. Keep generating to strengthen the fingerprint.";
}

function scoreLabel(s: number | null) {
  if (s === null) return null;
  if (s >= 80) return "Excellent";
  if (s >= 65) return "Good";
  if (s >= 50) return "Building";
  return "Developing";
}

/* ── Voice Score ring ──────────────────────────────────────────────────────── */

function VoiceRing({ score, color }: { score: number | null; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const fill = score !== null ? (score / 100) * circ : 0;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="var(--ds-border)" strokeWidth="3.5" />
      <circle
        cx="24" cy="24" r={r}
        fill="none"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${circ}`}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill={score !== null ? color : "var(--ds-text-subtlest)"} fontFamily="inherit">
        {score ?? "-"}
      </text>
    </svg>
  );
}

/* ── Idea card (Taplio-style: content first, score+date in footer) ─────────── */

function IdeaCard({ gen, placeholder }: { gen?: GenerationHistoryItem; placeholder?: string }) {
  const topScore = gen?.variants?.length
    ? Math.max(...gen.variants.map((v) => v.voice_match_score ?? 0))
    : null;

  const href = gen
    ? `/dashboard/write?idea=${encodeURIComponent(gen.input_text)}`
    : `/dashboard/write?idea=${encodeURIComponent(placeholder ?? "")}`;

  const dateStr = gen
    ? new Date(gen.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: "var(--ds-radius-200)",
        backgroundColor: "var(--ds-surface)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Body */}
      <div style={{ padding: "var(--ds-space-200)", flex: 1 }}>
        <p
          className="line-clamp-4"
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-100)",
            color: gen ? "var(--ds-text)" : "var(--ds-text-subtle)",
            lineHeight: "var(--ds-line-height-300)",
          }}
        >
          {gen ? gen.input_text : placeholder}
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--ds-border)",
          padding: "10px var(--ds-space-200)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--ds-space-100)",
        }}
      >
        <Link
          href={href}
          style={{
            fontSize: "var(--ds-font-size-075)",
            fontWeight: "var(--ds-font-weight-medium)",
            color: "var(--ds-link)",
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {gen ? "Generate again" : "Generate post"} →
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
          {dateStr && (
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
              {dateStr}
            </span>
          )}
          {topScore !== null && <ScorePill value={topScore} />}
        </div>
      </div>
    </div>
  );
}

/* ── Section title ─────────────────────────────────────────────────────────── */

function SectionTitle({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--ds-space-200)" }}>
      <h2
        style={{
          margin: 0,
          fontSize: "var(--ds-font-size-200)",
          fontWeight: "var(--ds-font-weight-semibold)",
          color: "var(--ds-text)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
      {href && linkLabel && (
        <Link
          href={href}
          style={{
            fontSize: "var(--ds-font-size-075)",
            color: "var(--ds-link)",
            textDecoration: "none",
            fontWeight: "var(--ds-font-weight-medium)",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

/* ── Stat box (flat, like Taplio's follower stats) ─────────────────────────── */

function StatBox({
  label,
  children,
  sub,
}: {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--ds-border)",
        borderRadius: "var(--ds-radius-200)",
        backgroundColor: "var(--ds-surface)",
        padding: "var(--ds-space-250) var(--ds-space-300)",
      }}
    >
      <p
        style={{
          margin: "0 0 var(--ds-space-075)",
          fontSize: 11,
          fontWeight: "var(--ds-font-weight-semibold)",
          color: "var(--ds-text-subtle)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {label}
      </p>
      {children}
      {sub && (
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/* ── Sidebar block ─────────────────────────────────────────────────────────── */

function SideBlock({ label, children, noPad }: { label: string; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div
      style={{
        borderRadius: "var(--ds-radius-200)",
        border: "1px solid var(--ds-border)",
        backgroundColor: "var(--ds-surface)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px var(--ds-space-200)",
          borderBottom: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-surface-sunken)",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text-subtle)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {label}
        </span>
      </div>
      <div style={noPad ? {} : { padding: "var(--ds-space-200)" }}>
        {children}
      </div>
    </div>
  );
}

/* ── Post row (history list) ───────────────────────────────────────────────── */

function PostRow({ gen, last }: { gen: GenerationHistoryItem; last: boolean }) {
  const top = gen.variants?.length
    ? Math.max(...gen.variants.map((v) => v.voice_match_score ?? 0))
    : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--ds-space-200)",
        padding: "var(--ds-space-150) var(--ds-space-250)",
        borderBottom: last ? "none" : "1px solid var(--ds-border)",
      }}
    >
      <div
        style={{
          width: 3,
          height: 32,
          borderRadius: 2,
          backgroundColor: scoreColor(top),
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-100)",
            color: "var(--ds-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: "var(--ds-font-weight-medium)",
          }}
        >
          {gen.input_text}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)", marginTop: 2 }}>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            {new Date(gen.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        </div>
      </div>
      <ScorePill value={top} />
    </div>
  );
}

/* ── New user view ─────────────────────────────────────────────────────────── */

function NewUserView() {
  const STEPS = [
    {
      step: "01",
      href: "/onboarding/build-profile",
      title: "Build your Voice DNA",
      desc: "Paste 10+ LinkedIn posts. We analyse your hook style, rhythm, vocabulary and tone.",
      cta: "Start building",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
        </svg>
      ),
    },
    {
      step: "02",
      href: "/dashboard/write",
      title: "Generate your first post",
      desc: "Give us an idea. Get 3 variants, each scored against your voice fingerprint.",
      cta: "Generate a post",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6" style={{ alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

        {/* Hero */}
        <div
          style={{
            borderRadius: "var(--ds-radius-200)",
            border: "1px solid var(--ds-border-brand)",
            backgroundColor: "var(--ds-background-brand-subtle)",
            padding: "var(--ds-space-400)",
          }}
        >
          <p
            style={{
              margin: "0 0 var(--ds-space-075)",
              fontSize: 11,
              fontWeight: "var(--ds-font-weight-semibold)",
              color: "var(--ds-text-brand)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Get started
          </p>
          <h2
            style={{
              margin: "0 0 var(--ds-space-100)",
              fontSize: "var(--ds-font-size-400)",
              fontWeight: "var(--ds-font-weight-bold)",
              color: "var(--ds-text)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            Build your Voice DNA first
          </h2>
          <p
            style={{
              margin: "0 0 var(--ds-space-250)",
              fontSize: "var(--ds-font-size-100)",
              color: "var(--ds-text-subtle)",
              lineHeight: "var(--ds-line-height-300)",
              maxWidth: 480,
            }}
          >
            Paste 10+ of your LinkedIn posts. Voise analyses your hook style, sentence rhythm, vocabulary and tone - then uses that fingerprint in every post it generates.
          </p>
          <Link
            href="/onboarding/build-profile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--ds-space-075)",
              padding: "10px 20px",
              backgroundColor: "var(--ds-background-brand-bold)",
              color: "var(--ds-text-inverse)",
              borderRadius: "var(--ds-radius-100)",
              fontWeight: "var(--ds-font-weight-semibold)",
              fontSize: "var(--ds-font-size-100)",
              textDecoration: "none",
            }}
          >
            Build my Voice DNA →
          </Link>
        </div>

        {/* Steps */}
        <div>
          <SectionTitle title="How it works" />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-100)" }}>
            {STEPS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "var(--ds-space-200)",
                  padding: "var(--ds-space-175) var(--ds-space-200)",
                  borderRadius: "var(--ds-radius-200)",
                  border: "1px solid var(--ds-border)",
                  backgroundColor: "var(--ds-surface)",
                  textDecoration: "none",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--ds-radius-100)",
                    backgroundColor: "var(--ds-background-brand-subtle)",
                    border: "1px solid var(--ds-border-brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ds-icon-brand)",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginBottom: "var(--ds-space-025)" }}>
                    <span style={{ fontSize: 10, fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
                      Step {s.step}
                    </span>
                  </div>
                  <p style={{ margin: "0 0 2px", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)" }}>
                    {s.title}
                  </p>
                  <p style={{ margin: "0 0 var(--ds-space-075)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-200)" }}>
                    {s.desc}
                  </p>
                  <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-link)" }}>
                    {s.cta} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Right */}
      <SetupChecklist profileReady={false} hasGenerations={false} />
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export default async function DashboardPage() {
  const [{ getToken }, user] = await Promise.all([auth(), currentUser()]);
  const token = await getToken();
  const firstName = user?.firstName ?? null;

  const { profile, history, usage } = token
    ? await fetchDashboardData(token)
    : { profile: null, history: [], usage: null };

  const profileReady = profile?.status === "ready";

  /* ── Page header (shared) ──────────────────────────────────────────────── */
  const PageHeader = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--ds-space-300)", flexWrap: "wrap" }}>
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "var(--ds-font-size-500)",
            fontWeight: "var(--ds-font-weight-bold)",
            color: "var(--ds-text)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        </h1>
      </div>
      <Link
        href="/dashboard/write"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--ds-space-075)",
          padding: "10px 20px",
          backgroundColor: "var(--ds-background-brand-bold)",
          color: "var(--ds-text-inverse)",
          borderRadius: "var(--ds-radius-100)",
          fontWeight: "var(--ds-font-weight-semibold)",
          fontSize: "var(--ds-font-size-100)",
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        ✦ Write a post
      </Link>
    </div>
  );

  if (!profileReady) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
        {PageHeader}
        <NewUserView />
      </div>
    );
  }

  /* ── Active user ─────────────────────────────────────────────────────────── */

  const { score: vsScore, trend: vsTrend, sampleSize: vsSampleSize } = computeVoiceScore(history);
  const vsInsight = computeInsight(history, vsScore);
  const vsColor = scoreColor(vsScore);
  const vsLabel = scoreLabel(vsScore);

  const SEED_IDEAS = [
    "Share a lesson you learned the hard way in your career.",
    "What's one common mistake you see in your industry?",
    "Describe a moment that changed how you think about your work.",
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      {PageHeader}

      {/* Insight line */}
      {vsInsight && (
        <p style={{ margin: "-var(--ds-space-200) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          {vsInsight}
        </p>
      )}

      {/* Stats row - flat, Taplio-style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Voice Score */}
        <StatBox
          label="✦ Voice Score"
          sub={
            vsSampleSize > 0
              ? `${vsSampleSize} post${vsSampleSize !== 1 ? "s" : ""} analysed`
              : "Generate posts to get a score"
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-200)", marginTop: "var(--ds-space-050)" }}>
            <VoiceRing score={vsScore} color={vsColor} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: vsScore !== null ? vsColor : "var(--ds-text-subtlest)",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.03em",
                }}
              >
                {vsScore !== null ? `${vsScore}%` : "-"}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
                {vsLabel && (
                  <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-medium)", color: vsColor }}>
                    {vsLabel}
                  </span>
                )}
                {vsTrend !== null && (
                  <span
                    style={{
                      fontSize: "var(--ds-font-size-075)",
                      fontWeight: "var(--ds-font-weight-semibold)",
                      color: vsTrend >= 0 ? "#16a34a" : "#ef4444",
                    }}
                  >
                    {vsTrend >= 0 ? "↑" : "↓"}{Math.abs(vsTrend)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </StatBox>

        {/* Posts generated */}
        <StatBox
          label="Posts generated"
          sub={
            usage && usage.generates_limit > 0
              ? `${Math.max(0, usage.generates_limit - usage.generates_used)} remaining this month`
              : "Unlimited this month"
          }
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--ds-space-050)", marginTop: "var(--ds-space-050)" }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--ds-text)", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>
              {usage?.generates_used ?? 0}
            </span>
            {usage && usage.generates_limit > 0 && (
              <span style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtlest)" }}>
                /{usage.generates_limit}
              </span>
            )}
          </div>
          {usage && usage.generates_limit > 0 && (
            <div style={{ marginTop: "var(--ds-space-100)" }}>
              <ProgressBar value={Math.min(1, usage.generates_used / usage.generates_limit)} />
            </div>
          )}
        </StatBox>

      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6" style={{ alignItems: "start" }}>

        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)", minWidth: 0 }}>

          {/* Idea cards */}
          <section>
            <SectionTitle
              title={history.length > 0 ? "Recent ideas" : "Post ideas for you"}
              href={history.length > 0 ? "/dashboard/history" : "/dashboard/ideas"}
              linkLabel={history.length > 0 ? "View all" : "New ideas"}
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ alignItems: "stretch" }}>
              {history.length > 0
                ? history.slice(0, 3).map((gen) => <IdeaCard key={gen.id} gen={gen} />)
                : SEED_IDEAS.map((s) => <IdeaCard key={s} placeholder={s} />)
              }
            </div>
          </section>

          {/* Quick generate */}
          <section>
            <SectionTitle title="Quick generate" />
            <div
              style={{
                borderRadius: "var(--ds-radius-200)",
                border: "1px solid var(--ds-border)",
                backgroundColor: "var(--ds-surface)",
                padding: "var(--ds-space-250)",
              }}
            >
              <p style={{ margin: "0 0 var(--ds-space-175)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
                Describe your idea below and we&apos;ll generate 3 LinkedIn posts scored against your voice fingerprint.
              </p>
              <QuickGenerate />
            </div>
          </section>

          {/* More posts */}
          {history.length > 3 && (
            <section>
              <SectionTitle title="More recent posts" href="/dashboard/history" linkLabel="View all" />
              <div
                style={{
                  borderRadius: "var(--ds-radius-200)",
                  border: "1px solid var(--ds-border)",
                  backgroundColor: "var(--ds-surface)",
                  overflow: "hidden",
                }}
              >
                {history.slice(3).map((gen, i, arr) => (
                  <PostRow key={gen.id} gen={gen} last={i === arr.length - 1} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>

          {/* Voice DNA */}
          <SideBlock label="✦ Your Voice DNA">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Lozenge
                  appearance={
                    profile?.confidence_level === "high" ? "success"
                    : profile?.confidence_level === "medium" ? "inprogress"
                    : profile?.confidence_level === "provisional" ? "moved"
                    : "default"
                  }
                >
                  {profile?.confidence_level === "provisional"
                    ? "Starter profile"
                    : `${(profile?.confidence_level ?? "none")} confidence`}
                </Lozenge>
                <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
                  {profile?.post_count ?? 0} posts
                </span>
              </div>
              <div style={{ height: 1, backgroundColor: "var(--ds-border)" }} />
              <Link
                href="/dashboard/voice-dna"
                style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-link)", textDecoration: "none" }}
              >
                View your profile →
              </Link>
            </div>
          </SideBlock>

          {/* Voice Strength - seed profiles only */}
          {profile?.profile_type === "seed" && <VoiceStrengthWidget />}

          {/* Next idea recommendation - only for extracted profiles with real signal */}
          {profile?.profile_type !== "seed" && <NextIdeaWidget />}

          {/* Checklist */}
          <SetupChecklist
            profileReady={true}
            hasGenerations={history.length > 0}
          />

          {/* Tools */}
          <SideBlock label="Tools" noPad>
            <div>
              {[
                {
                  href: "/dashboard/ideas",
                  label: "Idea Generator",
                  desc: "5 ideas tailored to your voice",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                  ),
                },
                {
                  href: "/dashboard/repurpose",
                  label: "Repurpose",
                  desc: "Article or transcript → post",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  ),
                },
                {
                  href: "/dashboard/dna-match",
                  label: "DNA Match",
                  desc: "Score any draft against your voice",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  ),
                },
                {
                  href: "/dashboard/voice-dna",
                  label: "Voice DNA",
                  desc: "View & rebuild your fingerprint",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                  ),
                },
              ].map(({ href, icon, label, desc }, i, arr) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--ds-space-150)",
                    padding: "var(--ds-space-150) var(--ds-space-200)",
                    textDecoration: "none",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--ds-border)" : "none",
                  }}
                  className="hover:bg-[var(--ds-background-neutral-subtle)]"
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "var(--ds-radius-100)",
                      border: "1px solid var(--ds-border)",
                      backgroundColor: "var(--ds-surface-sunken)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--ds-icon-subtle)",
                      flexShrink: 0,
                    }}
                  >
                    {icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
                      {label}
                    </p>
                    <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </SideBlock>

          {/* Usage */}
          {usage && (
            <SideBlock label="Usage · this month">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-175)" }}>
                {[
                  { label: "Generations", used: usage.generates_used, limit: usage.generates_limit },
                  { label: "Repurposes", used: usage.repurposes_used, limit: usage.repurposes_limit },
                ].map(({ label, used, limit }) => (
                  <div key={label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "var(--ds-space-075)" }}>
                      <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", fontWeight: "var(--ds-font-weight-medium)" }}>
                        {label}
                      </span>
                      <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", fontVariantNumeric: "tabular-nums" }}>
                        {used}
                        {limit > 0 && (
                          <span style={{ color: "var(--ds-text-subtlest)", fontWeight: "var(--ds-font-weight-regular)" }}>/{limit}</span>
                        )}
                      </span>
                    </div>
                    {limit > 0
                      ? <ProgressBar value={Math.min(1, used / limit)} />
                      : <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>Unlimited</p>
                    }
                  </div>
                ))}
              </div>
            </SideBlock>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

/* ── Static question data ───────────────────────────────────────────────────── */

const CONTENT_TYPES = [
  { value: "story", label: "Story-led", desc: "Personal experiences and lessons learned" },
  { value: "framework", label: "Frameworks", desc: "Systems, methods, and structured breakdowns" },
  { value: "hot_take", label: "Hot Takes", desc: "Bold opinions and contrarian perspectives" },
];

const REGISTERS = [
  { value: "formal", label: "Formal", desc: "Structured and professional" },
  { value: "conversational", label: "Conversational", desc: "Natural, like talking to a colleague" },
  { value: "casual", label: "Casual", desc: "Relaxed and direct - no filler" },
];

const GOALS = [
  { value: "thought_leadership", label: "Thought Leadership", desc: "Build authority in my field" },
  { value: "job_seeking", label: "Job Seeking", desc: "Attract opportunities and recruiters" },
  { value: "business_leads", label: "Business Development", desc: "Generate leads and showcase my work" },
  { value: "learning_in_public", label: "Learning in Public", desc: "Document my journey and grow with others" },
];

const STYLE_ANCHORS = [
  {
    key: "A",
    label: "Direct & Experience-based",
    preview:
      "I've made this mistake 3 times and it cost me each time.\n\nWhen I started out, I thought the goal was to look like I had all the answers.\n\nIt took years to realize: the people others actually trust are the ones who admit what they're still figuring out.\n\nHere's what changed when I stopped pretending:",
  },
  {
    key: "B",
    label: "Structured & Insight-led",
    preview:
      "Most people get this backwards.\n\nThe research consistently shows one thing: the approach that feels most natural is often the least effective.\n\nHere's what the data actually says - and why it changes how you should work:",
  },
  {
    key: "C",
    label: "Narrative & Relatable",
    preview:
      "Six months ago, I was stuck.\n\nNot in a dramatic way. Just quietly spinning, wondering if I was headed in the right direction.\n\nThen one conversation changed everything.\n\nThis is what I learned:",
  },
];

const TONE_OPTIONS = [
  "Authentic", "Bold", "Empathetic", "Analytical", "Witty",
  "Concise", "Thoughtful", "Practical", "Inspiring", "Direct",
  "Vulnerable", "Strategic",
];

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function QuestionLabel({ number, label }: { number: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginBottom: "var(--ds-space-200)" }}>
      <span
        style={{
          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
          background: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)",
        }}
      >
        {number}
      </span>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-200)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)" }}>
        {label}
      </p>
    </div>
  );
}

function RadioCard({
  label, desc, selected, onClick,
}: { label: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1, minWidth: 140, textAlign: "left", cursor: "pointer",
        padding: "var(--ds-space-200)", borderRadius: "var(--ds-radius-100)",
        border: selected ? "2px solid var(--ds-border-brand)" : "1.5px solid var(--ds-border)",
        background: selected ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)",
        display: "flex", flexDirection: "column", gap: "var(--ds-space-050)",
        transition: "border-color 0.1s",
      }}
    >
      <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: selected ? "var(--ds-text-brand)" : "var(--ds-text)" }}>
        {label}
      </span>
      {desc && (
        <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: 1.45 }}>
          {desc}
        </span>
      )}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */

export function SeedQuestionnaireStep() {
  const router = useRouter();

  const [contentType, setContentType] = useState("");
  const [writingRegister, setWritingRegister] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [styleAnchor, setStyleAnchor] = useState("");
  const [postingGoal, setPostingGoal] = useState("");
  const [toneWords, setToneWords] = useState<string[]>([]);
  const [aboutYourself, setAboutYourself] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    contentType !== "" &&
    writingRegister !== "" &&
    targetAudience.trim().length >= 3 &&
    styleAnchor !== "" &&
    postingGoal !== "" &&
    aboutYourself.trim().length >= 30;

  function toggleToneWord(word: string) {
    setToneWords((prev) => {
      if (prev.includes(word)) return prev.filter((w) => w !== word);
      if (prev.length >= 3) return prev;
      return [...prev, word];
    });
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding/seed-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType,
          writing_register: writingRegister,
          target_audience: targetAudience.trim(),
          style_anchor: styleAnchor,
          posting_goal: postingGoal,
          tone_words: toneWords,
          about_yourself: aboutYourself.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { detail?: string };
        throw new Error(data.detail ?? "Something went wrong. Please try again.");
      }

      router.push("/onboarding/your-dna");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
      <StepIndicator current={2} total={4} />

      <div>
        <h1 style={{ margin: "0 0 var(--ds-space-100)", fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", lineHeight: 1.2 }}>
          Tell us about your voice
        </h1>
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Seven quick questions. Your profile refines automatically as you write.
        </p>
      </div>

      {/* Q1: Content type */}
      <div>
        <QuestionLabel number={1} label="What type of content do you want to create?" />
        <div style={{ display: "flex", gap: "var(--ds-space-150)", flexWrap: "wrap" }}>
          {CONTENT_TYPES.map((opt) => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              desc={opt.desc}
              selected={contentType === opt.value}
              onClick={() => setContentType(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Q2: Register */}
      <div>
        <QuestionLabel number={2} label="How do you naturally communicate?" />
        <div style={{ display: "flex", gap: "var(--ds-space-150)", flexWrap: "wrap" }}>
          {REGISTERS.map((opt) => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              desc={opt.desc}
              selected={writingRegister === opt.value}
              onClick={() => setWritingRegister(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Q3: Target audience */}
      <div>
        <QuestionLabel number={3} label="Who do you write for?" />
        <input
          type="text"
          placeholder="e.g. Early-stage founders, mid-career engineers, marketing leads..."
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          maxLength={200}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "var(--ds-space-150) var(--ds-space-200)",
            borderRadius: "var(--ds-radius-100)",
            border: "1.5px solid var(--ds-border)",
            fontSize: "var(--ds-font-size-100)",
            color: "var(--ds-text)",
            background: "var(--ds-surface)",
            outline: "none",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-brand)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
        />
      </div>

      {/* Q4: Style anchor */}
      <div>
        <QuestionLabel number={4} label="Which of these feels most like your voice?" />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
          {STYLE_ANCHORS.map((anchor) => (
            <button
              key={anchor.key}
              type="button"
              onClick={() => setStyleAnchor(anchor.key)}
              style={{
                textAlign: "left", cursor: "pointer", width: "100%",
                padding: "var(--ds-space-200)", borderRadius: "var(--ds-radius-100)",
                border: styleAnchor === anchor.key ? "2px solid var(--ds-border-brand)" : "1.5px solid var(--ds-border)",
                background: styleAnchor === anchor.key ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)",
                display: "flex", gap: "var(--ds-space-200)", alignItems: "flex-start",
                transition: "border-color 0.1s",
              }}
            >
              <span
                style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)",
                  background: styleAnchor === anchor.key ? "var(--ds-background-brand-bold)" : "var(--ds-background-neutral)",
                  color: styleAnchor === anchor.key ? "var(--ds-text-inverse)" : "var(--ds-text-subtle)",
                }}
              >
                {anchor.key}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: "0 0 var(--ds-space-075)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: styleAnchor === anchor.key ? "var(--ds-text-brand)" : "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {anchor.label}
                </p>
                <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", lineHeight: "var(--ds-line-height-300)", whiteSpace: "pre-line" }}>
                  {anchor.preview}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Q5: Posting goal */}
      <div>
        <QuestionLabel number={5} label="What's your primary goal on LinkedIn?" />
        <div style={{ display: "flex", gap: "var(--ds-space-150)", flexWrap: "wrap" }}>
          {GOALS.map((opt) => (
            <RadioCard
              key={opt.value}
              label={opt.label}
              desc={opt.desc}
              selected={postingGoal === opt.value}
              onClick={() => setPostingGoal(opt.value)}
            />
          ))}
        </div>
      </div>

      {/* Q6: Tone words (optional) */}
      <div>
        <QuestionLabel number={6} label="How would you describe your tone? (optional, pick up to 3)" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--ds-space-100)" }}>
          {TONE_OPTIONS.map((word) => {
            const selected = toneWords.includes(word);
            const maxed = toneWords.length >= 3 && !selected;
            return (
              <button
                key={word}
                type="button"
                disabled={maxed}
                onClick={() => toggleToneWord(word)}
                style={{
                  padding: "6px 14px", borderRadius: 999, cursor: maxed ? "not-allowed" : "pointer",
                  border: selected ? "1.5px solid var(--ds-border-brand)" : "1.5px solid var(--ds-border)",
                  background: selected ? "var(--ds-background-brand-subtle)" : "var(--ds-surface)",
                  fontSize: "var(--ds-font-size-075)",
                  fontWeight: selected ? "var(--ds-font-weight-semibold)" : "var(--ds-font-weight-regular)",
                  color: selected ? "var(--ds-text-brand)" : maxed ? "var(--ds-text-subtlest)" : "var(--ds-text-subtle)",
                  opacity: maxed ? 0.5 : 1,
                  transition: "all 0.1s",
                }}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Q7: About yourself */}
      <div>
        <QuestionLabel number={7} label="Write about yourself" />
        <p style={{ margin: "0 0 var(--ds-space-150)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: 1.5 }}>
          Tell us who you are, what you do, and what you care about - in your own words. This is the seed your voice is built from.
        </p>
        <textarea
          placeholder="e.g. I'm a product designer who left consulting to build in public. I care about making complex systems feel simple, and I write for people who are figuring out how to do meaningful work without burning out..."
          value={aboutYourself}
          onChange={(e) => setAboutYourself(e.target.value)}
          maxLength={1000}
          rows={5}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "var(--ds-space-150) var(--ds-space-200)",
            borderRadius: "var(--ds-radius-100)",
            border: "1.5px solid var(--ds-border)",
            fontSize: "var(--ds-font-size-100)",
            color: "var(--ds-text)",
            background: "var(--ds-surface)",
            outline: "none",
            resize: "vertical",
            lineHeight: "var(--ds-line-height-300)",
            fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--ds-border-brand)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "var(--ds-border)"; }}
        />
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-075)", color: aboutYourself.trim().length < 30 && aboutYourself.length > 0 ? "var(--ds-text-warning)" : "var(--ds-text-subtlest)", textAlign: "right" }}>
          {aboutYourself.length}/1000{aboutYourself.trim().length < 30 && aboutYourself.length > 0 ? " - keep going, at least 30 characters" : ""}
        </p>
      </div>

      {/* Error */}
      {error && (
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-danger)", padding: "var(--ds-space-150)", background: "var(--ds-background-danger-subtle)", borderRadius: "var(--ds-radius-100)", border: "1px solid var(--ds-border-danger)" }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="button"
        disabled={!canSubmit || loading}
        onClick={handleSubmit}
        style={{
          width: "100%", padding: "var(--ds-space-175) var(--ds-space-300)",
          borderRadius: "var(--ds-radius-100)", border: "none",
          background: canSubmit && !loading ? "var(--ds-background-brand-bold)" : "var(--ds-background-neutral)",
          color: canSubmit && !loading ? "var(--ds-text-inverse)" : "var(--ds-text-subtlest)",
          fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)",
          cursor: canSubmit && !loading ? "pointer" : "not-allowed",
          transition: "background 0.15s, color 0.15s",
        }}
      >
        {loading ? "Building your profile…" : "Create my starter profile →"}
      </button>
    </div>
  );
}

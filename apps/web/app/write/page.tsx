"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { VoiseLogo } from "@/components/ui/VoiseLogo";
import { LinkedInPreview } from "@/components/generation/LinkedInPreview";

/* ── Brand tokens ───────────────────────────────────────────────────────── */
const C = {
  canvas:   "#ffffff",
  stone:    "#f5f4f0",
  ink:      "#17171c",
  text:     "#212121",
  muted:    "#6b6b7b",
  faint:    "#93939f",
  hairline: "#e2e0da",
  brand:    "#1B3A5F",
  brandDim: "#eef2f7",
  green:    "#1a7a4a",
} as const;

const FONT = {
  body: "var(--font-inter), Inter, sans-serif",
  display: "var(--font-display), 'Space Grotesk', sans-serif",
  mono: "var(--font-mono), 'JetBrains Mono', monospace",
} as const;

const MAX_CHARS = 3000;

/* ── Unicode formatters ─────────────────────────────────────────────────── */
function toUnicodeBold(text: string): string {
  return [...text].map(char => {
    const c = char.codePointAt(0)!;
    if (c >= 65 && c <= 90)  return String.fromCodePoint(c - 65 + 0x1D5D4); // A-Z
    if (c >= 97 && c <= 122) return String.fromCodePoint(c - 97 + 0x1D5EE); // a-z
    if (c >= 48 && c <= 57)  return String.fromCodePoint(c - 48 + 0x1D7EC); // 0-9
    return char;
  }).join("");
}

function toUnicodeItalic(text: string): string {
  return [...text].map(char => {
    const c = char.codePointAt(0)!;
    if (c >= 65 && c <= 90)  return String.fromCodePoint(c - 65 + 0x1D608); // A-Z
    if (c >= 97 && c <= 122) return String.fromCodePoint(c - 97 + 0x1D622); // a-z
    return char;
  }).join("");
}

/* ── Emoji palette ──────────────────────────────────────────────────────── */
const EMOJIS = [
  "🚀","💡","✅","🎯","💪","🔥","📈","💼","🤝","👇",
  "⚡","🌟","🏆","👋","🙌","💰","📊","🎉","✨","💬",
  "📌","🔑","💎","🧠","👀","📣","🎁","⏰","🔍","💫",
];

/* ── Toolbar button ─────────────────────────────────────────────────────── */
function ToolBtn({
  label,
  title,
  onClick,
  active,
  mono,
}: {
  label: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  mono?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        minWidth: 32,
        height: 32,
        padding: "0 8px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 6,
        border: `1px solid ${active ? C.brand : hover ? C.hairline : "transparent"}`,
        backgroundColor: active ? C.brandDim : hover ? C.stone : "transparent",
        color: active ? C.brand : C.text,
        fontSize: mono ? 13 : 14,
        fontWeight: mono ? 400 : 700,
        fontFamily: mono ? FONT.mono : FONT.body,
        cursor: "pointer",
        transition: "all 0.1s",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {label}
    </button>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function WritePage() {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  const charCount = [...content].length; // counts Unicode surrogate pairs correctly

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.max(280, el.scrollHeight) + "px";
  }, [content]);

  /* Close emoji panel on outside click */
  useEffect(() => {
    if (!showEmoji) return;
    function handler(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmoji]);

  /* Insert text at cursor */
  const insertAtCursor = useCallback((insert: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.slice(0, start) + insert + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + insert.length, start + insert.length);
    });
  }, [content]);

  /* Transform selected text */
  const transformSelection = useCallback((transform: (s: string) => string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.slice(start, end);
    if (!selected) return;
    const transformed = transform(selected);
    const next = content.slice(0, start) + transformed + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start, start + [...transformed].length);
    });
  }, [content]);

  /* Bullet / numbered list on selected lines */
  const prefixLines = useCallback((prefix: string | ((i: number) => string)) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = content.slice(0, start);
    const selected = content.slice(start, end) || content.slice(
      content.lastIndexOf("\n", start - 1) + 1,
      content.indexOf("\n", start) === -1 ? content.length : content.indexOf("\n", start)
    );
    const lines = selected.split("\n");
    const prefixed = lines.map((line, i) =>
      (typeof prefix === "function" ? prefix(i + 1) : prefix) + line
    ).join("\n");
    const actualStart = content.slice(0, start).lastIndexOf("\n") + 1;
    const actualEnd = end || content.indexOf("\n", start) === -1 ? content.length : content.indexOf("\n", start);
    const next = content.slice(0, actualStart) + prefixed + content.slice(actualEnd);
    setContent(next);
  }, [content]);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const overLimit = charCount > MAX_CHARS;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.canvas, fontFamily: FONT.body }}>

      {/* ── Sticky header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${C.hairline}`,
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <VoiseLogo markSize={22} fontSize={14} gap={7} />
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user ? (
              <Link
                href="/dashboard"
                style={{ fontSize: 13, fontWeight: 500, color: C.brand, textDecoration: "none", padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${C.brand}` }}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link href="/sign-in" style={{ fontSize: 13, color: C.muted, textDecoration: "none", padding: "6px 12px" }}>
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  style={{ fontSize: 13, fontWeight: 600, color: "#fff", backgroundColor: C.brand, textDecoration: "none", padding: "7px 16px", borderRadius: 20 }}
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Page hero ── */}
      <div style={{ backgroundColor: C.stone, borderBottom: `1px solid ${C.hairline}`, padding: "40px 24px 36px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: C.brand, fontFamily: FONT.mono }}>
            Free tool
          </p>
          <h1 style={{ margin: "0 0 10px", fontFamily: FONT.display, fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 600, color: C.ink, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            LinkedIn Post Writer & Preview
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: C.muted, lineHeight: 1.65, maxWidth: 540 }}>
            Write and format your post, see exactly how it looks on LinkedIn, then copy and publish. No account needed.
          </p>
        </div>
      </div>

      {/* ── Main: editor + preview ── */}
      <div className="write-grid" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

        {/* LEFT: Editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <div style={{ border: `1.5px solid ${C.hairline}`, borderRadius: 12, overflow: "hidden", backgroundColor: C.canvas, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>

            {/* Toolbar */}
            <div style={{
              display: "flex", alignItems: "center", gap: 2, padding: "8px 12px",
              borderBottom: `1px solid ${C.hairline}`, backgroundColor: C.stone, flexWrap: "wrap",
            }}>
              <ToolBtn label="B" title="Bold (select text first)" onClick={() => transformSelection(toUnicodeBold)} />
              <ToolBtn label={<em>I</em>} title="Italic (select text first)" onClick={() => transformSelection(toUnicodeItalic)} />

              {/* Divider */}
              <div style={{ width: 1, height: 20, backgroundColor: C.hairline, margin: "0 4px" }} />

              <ToolBtn label="•" title="Bullet point" mono onClick={() => insertAtCursor("\n• ")} />
              <ToolBtn label="1." title="Numbered list" mono onClick={() => prefixLines((i) => `${i}. `)} />
              <ToolBtn label="—" title="Divider line" mono onClick={() => insertAtCursor("\n\n——————————————\n\n")} />

              {/* Divider */}
              <div style={{ width: 1, height: 20, backgroundColor: C.hairline, margin: "0 4px" }} />

              {/* Emoji */}
              <div ref={emojiRef} style={{ position: "relative" }}>
                <ToolBtn label="😊" title="Insert emoji" onClick={() => setShowEmoji(v => !v)} active={showEmoji} />
                {showEmoji && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
                    backgroundColor: C.canvas, border: `1px solid ${C.hairline}`, borderRadius: 10,
                    padding: 10, display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 2,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
                    width: 220,
                  }}>
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => { insertAtCursor(e); setShowEmoji(false); }}
                        style={{
                          fontSize: 20, padding: "4px 2px", background: "none", border: "none",
                          cursor: "pointer", borderRadius: 6, lineHeight: 1,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={ev => { (ev.currentTarget as HTMLElement).style.background = C.stone; }}
                        onMouseLeave={ev => { (ev.currentTarget as HTMLElement).style.background = "none"; }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              <ToolBtn
                label="Clear"
                title="Clear all content"
                mono
                onClick={() => { setContent(""); textareaRef.current?.focus(); }}
              />
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing your LinkedIn post…&#10;&#10;Tip: Select text and click B or I to format it. Use • for bullets."
              style={{
                display: "block",
                width: "100%",
                minHeight: 280,
                padding: "20px",
                fontSize: 15,
                lineHeight: 1.65,
                color: C.text,
                fontFamily: FONT.body,
                border: "none",
                outline: "none",
                resize: "none",
                backgroundColor: C.canvas,
                boxSizing: "border-box",
                overflowY: "hidden",
              }}
            />

            {/* Footer bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", borderTop: `1px solid ${C.hairline}`, backgroundColor: C.stone,
              gap: 12,
            }}>
              <span style={{
                fontFamily: FONT.mono, fontSize: 11,
                color: overLimit ? "#c0392b" : charCount > MAX_CHARS * 0.8 ? "#b45309" : C.faint,
                letterSpacing: "0.04em",
              }}>
                {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
              <button
                onClick={handleCopy}
                disabled={!content.trim()}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 18px", borderRadius: 20,
                  border: "none", cursor: content.trim() ? "pointer" : "not-allowed",
                  backgroundColor: copied ? C.green : C.brand,
                  color: "#fff",
                  fontFamily: FONT.body, fontSize: 13, fontWeight: 600,
                  opacity: content.trim() ? 1 : 0.45,
                  transition: "background 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy post"}
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          <p style={{ margin: "10px 0 0", fontSize: 11, color: C.faint, fontFamily: FONT.mono, letterSpacing: "0.03em" }}>
            Select text → click B or I to apply Unicode formatting that renders on LinkedIn.
          </p>
        </div>

        {/* RIGHT: Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase", color: C.faint, fontFamily: FONT.mono }}>
              LinkedIn preview
            </p>
            {!user && (
              <p style={{ margin: 0, fontSize: 11, color: C.faint, fontFamily: FONT.mono }}>
                <Link href="/sign-in" style={{ color: C.brand, textDecoration: "none" }}>Sign in</Link> to see your profile
              </p>
            )}
          </div>

          {content.trim() ? (
            <LinkedInPreview content={content} />
          ) : (
            <div style={{
              border: `1.5px dashed ${C.hairline}`, borderRadius: 8,
              padding: "60px 32px", textAlign: "center",
              backgroundColor: C.stone,
            }}>
              <p style={{ margin: "0 0 6px", fontSize: 14, color: C.muted, fontFamily: FONT.body }}>
                Your preview will appear here
              </p>
              <p style={{ margin: 0, fontSize: 12, color: C.faint, fontFamily: FONT.mono }}>
                Start typing on the left →
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom CTA for unauthenticated users ── */}
      {!user && (
        <div style={{ backgroundColor: C.brand, padding: "48px 24px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px", fontFamily: FONT.mono, fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Want posts that score 85%+ in your voice?
            </p>
            <h2 style={{ margin: "0 0 12px", fontFamily: FONT.display, fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 600, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Voise learns how you write.<br />Then generates posts that sound like you.
            </h2>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
              30-day free trial. No credit card required.
            </p>
            <Link
              href="/sign-up"
              style={{
                display: "inline-block", padding: "13px 32px", borderRadius: 32,
                backgroundColor: "#fff", color: C.brand,
                fontFamily: FONT.body, fontSize: 15, fontWeight: 700,
                textDecoration: "none", letterSpacing: "-0.01em",
              }}
            >
              Get started free →
            </Link>
          </div>
        </div>
      )}

      {/* ── Minimal footer ── */}
      <div style={{ borderTop: `1px solid ${C.hairline}`, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <VoiseLogo markSize={18} fontSize={12} gap={6} />
        </Link>
        <p style={{ margin: 0, fontSize: 11, color: C.faint, fontFamily: FONT.mono }}>
          Free LinkedIn post preview tool by Voise
        </p>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .write-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

/* ── LinkedIn-accurate color constants ──────────────────────────────────── */
const LI = {
  bg:       "#ffffff",
  border:   "rgba(0,0,0,0.08)",
  shadow:   "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
  ink:      "rgba(0,0,0,0.9)",
  sub:      "rgba(0,0,0,0.6)",
  faint:    "rgba(0,0,0,0.45)",
  blue:     "#0A66C2",
  blueBg:   "rgba(10,102,194,0.08)",
  divider:  "rgba(0,0,0,0.08)",
  actionBg: "rgba(0,0,0,0.05)",
  font:     "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
} as const;

/* ── Globe SVG (LinkedIn's exact icon) ─────────────────────────────────── */
function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" style={{ color: LI.faint, flexShrink: 0 }}>
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm-.35 1.03A7 7 0 018 1c.12 0 .23 0 .35.01C7.67 1.5 7 2.84 6.56 4.5H4.27A6.99 6.99 0 017.65 1.03zM3.82 5.5H1.16A6.98 6.98 0 001 8c0 .86.15 1.69.42 2.45h2.65A14.4 14.4 0 013.5 8c0-.87.11-1.72.32-2.5zm.45 0H7.5A13.3 13.3 0 007.5 8c0 .87.1 1.72.27 2.5H4.31A13.3 13.3 0 014 8c0-.87.1-1.72.27-2.5zm4.23 0h2.95A13.3 13.3 0 009.73 8c0 .87-.1 1.72-.27 2.5H8.23A13.3 13.3 0 008.5 8c0-.87-.1-1.72-.23-2.5zm3.41 0H14.5c.21.78.32 1.63.32 2.5 0 .87-.11 1.72-.32 2.5h-2.65c.17-.78.27-1.63.27-2.5 0-.87-.1-1.72-.27-2.5zm-.26-1H9.44C9 2.84 8.33 1.5 7.65 1.03A6.99 6.99 0 0111.65 4.5zm-7.38 7H6.56C7 13.16 7.67 14.5 8.35 14.97A6.99 6.99 0 014.27 11.5zm7.46 0h-2.29C9 13.16 8.33 14.5 7.65 14.97A7 7 0 0011.73 11.5zm1.09 0h-.45A14.4 14.4 0 0012.5 10h2.08A6.99 6.99 0 0111.73 11.5z" />
    </svg>
  );
}

/* ── Avatar with LinkedIn badge ─────────────────────────────────────────── */
export function LinkedInAvatar({
  imageUrl,
  initials,
  size = "lg",
}: {
  imageUrl?: string;
  initials: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? 48 : 32;
  return (
    <div style={{ position: "relative", flexShrink: 0, width: dim, height: dim }}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          style={{ width: dim, height: dim, borderRadius: "50%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div
          style={{
            width: dim,
            height: dim,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0A66C2 0%, #0077B5 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: size === "lg" ? 16 : 11,
            fontWeight: 700,
            fontFamily: LI.font,
          }}
        >
          {initials || "Y"}
        </div>
      )}
      {size === "lg" && (
        <span
          style={{
            position: "absolute",
            bottom: -2,
            right: -2,
            width: 18,
            height: 18,
            backgroundColor: LI.blue,
            border: "2px solid #ffffff",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 8,
            fontWeight: 900,
            lineHeight: 1,
            fontFamily: LI.font,
            userSelect: "none",
          }}
        >
          in
        </span>
      )}
    </div>
  );
}

/* ── Action bar button ──────────────────────────────────────────────────── */
function ActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        padding: "10px 4px",
        background: hover ? LI.actionBg : "transparent",
        border: "none",
        borderRadius: 4,
        cursor: "pointer",
        color: LI.sub,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: LI.font,
        transition: "background 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

/* ── Like SVG icon ─────────────────────────────────────────────────────── */
function LikeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 22V11M2 13v7a2 2 0 002 2h13.5a2 2 0 001.96-1.6l1.5-7A2 2 0 0019 11H14V6a2 2 0 00-2-2H11l-4 7z" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function RepostIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <line x1="22" y1="2" x2="11" y2="13" strokeLinecap="round" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Reaction bubble ────────────────────────────────────────────────────── */
function ReactionBubble({ emoji, bg }: { emoji: string; bg: string }) {
  return (
    <span
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        backgroundColor: bg,
        border: "1.5px solid #ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        lineHeight: 1,
        marginLeft: -4,
        position: "relative",
      }}
    >
      {emoji}
    </span>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function LinkedInPreview({
  content,
  editing = false,
  onContentChange,
  createdAt,
}: {
  content: string;
  editing?: boolean;
  onContentChange?: (v: string) => void;
  createdAt?: string;
}) {
  const { user } = useUser();
  const [expanded, setExpanded] = useState(false);

  const TRUNCATE_AT = 280;
  const shouldTruncate = !editing && content.length > TRUNCATE_AT;
  const displayText = shouldTruncate && !expanded ? content.slice(0, TRUNCATE_AT) : content;

  const name = user?.fullName ?? user?.firstName ?? "You";
  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");
  const avatarUrl = user?.imageUrl;
  const headline = (user?.publicMetadata?.headline as string | undefined) ?? "LinkedIn Member";

  const timestamp = (() => {
    if (!createdAt) return "Now";
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return (
    <div
      style={{
        backgroundColor: LI.bg,
        border: `1px solid ${LI.border}`,
        borderRadius: 8,
        boxShadow: LI.shadow,
        overflow: "hidden",
        fontFamily: LI.font,
      }}
    >
      {/* ── Header ── */}
      <div style={{ padding: "12px 16px 0", display: "flex", alignItems: "flex-start", gap: 8 }}>
        <LinkedInAvatar imageUrl={avatarUrl} initials={initials} size="lg" />

        <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: LI.ink, lineHeight: "1.2", marginBottom: 1 }}>
            {name}
          </div>
          <div style={{
            fontSize: 12,
            color: LI.sub,
            lineHeight: "1.3",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            maxWidth: "100%",
            marginBottom: 2,
          }}>
            {headline}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12, color: LI.faint }}>{timestamp}</span>
            <span style={{ fontSize: 12, color: LI.faint }}>•</span>
            <GlobeIcon />
          </div>
        </div>

        {/* Three-dot menu */}
        <button
          style={{
            background: "none",
            border: "none",
            padding: "4px 8px",
            cursor: "pointer",
            color: LI.sub,
            fontSize: 18,
            lineHeight: 1,
            borderRadius: 4,
            flexShrink: 0,
          }}
          aria-label="More options"
        >
          ···
        </button>
      </div>

      {/* ── Post body ── */}
      <div style={{ padding: "10px 16px 8px" }}>
        {editing ? (
          <textarea
            style={{
              width: "100%",
              minHeight: 200,
              fontSize: 14,
              color: LI.ink,
              lineHeight: "1.43",
              resize: "none",
              outline: "none",
              border: "none",
              background: "transparent",
              fontFamily: LI.font,
              boxSizing: "border-box",
              padding: 0,
            }}
            value={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            autoFocus
          />
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: LI.ink, whiteSpace: "pre-wrap", lineHeight: "1.43" }}>
            {displayText}
            {shouldTruncate && !expanded && (
              <>
                {"... "}
                <button
                  onClick={() => setExpanded(true)}
                  style={{
                    color: LI.sub,
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontSize: 14,
                    fontFamily: LI.font,
                  }}
                >
                  see more
                </button>
              </>
            )}
          </p>
        )}
      </div>

      {/* ── Reaction summary ── */}
      {!editing && (
        <div style={{
          padding: "4px 16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", marginLeft: 4 }}>
              <ReactionBubble emoji="👍" bg="#0A66C2" />
              <ReactionBubble emoji="❤️" bg="#DF704D" />
              <ReactionBubble emoji="💡" bg="#F5BC00" />
            </div>
            <span style={{ fontSize: 12, color: LI.faint }}>Be the first to react</span>
          </div>
          <span style={{ fontSize: 12, color: LI.faint }}>0 comments</span>
        </div>
      )}

      {/* ── Divider ── */}
      {!editing && (
        <div style={{ borderTop: `1px solid ${LI.divider}`, margin: "0 16px" }} />
      )}

      {/* ── Action bar ── */}
      {!editing && (
        <div style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 0 }}>
          <ActionBtn icon={<LikeIcon />} label="Like" />
          <ActionBtn icon={<CommentIcon />} label="Comment" />
          <ActionBtn icon={<RepostIcon />} label="Repost" />
          <ActionBtn icon={<SendIcon />} label="Send" />
        </div>
      )}
    </div>
  );
}

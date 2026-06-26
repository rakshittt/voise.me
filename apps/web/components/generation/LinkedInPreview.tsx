"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export function LinkedInAvatar({
  imageUrl,
  initials,
  size = "lg",
}: {
  imageUrl?: string;
  initials: string;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? 48 : 28;
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        style={{ width: dim, height: dim, borderRadius: "50%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        backgroundColor: "var(--ds-background-brand-bold)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ds-text-inverse)",
        fontSize: size === "lg" ? "var(--ds-font-size-100)" : "9px",
        fontWeight: "var(--ds-font-weight-bold)",
        flexShrink: 0,
      }}
    >
      {initials || "Y"}
    </div>
  );
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "Just now";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

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
  const PREVIEW_CHARS = 300;
  const shouldTruncate = !editing && content.length > PREVIEW_CHARS;
  const displayText = shouldTruncate && !expanded ? content.slice(0, PREVIEW_CHARS) : content;

  const name = user?.fullName ?? user?.firstName ?? "You";
  const initials = (user?.firstName?.[0] ?? "") + (user?.lastName?.[0] ?? "");
  const avatarUrl = user?.imageUrl;

  return (
    <div
      style={{
        border: `1px solid var(--ds-border)`,
        borderRadius: "var(--ds-radius-200)",
        overflow: "hidden",
        background: "var(--ds-surface)",
        boxShadow: "var(--ds-shadow-raised)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-100)", display: "flex", alignItems: "flex-start", gap: "var(--ds-space-150)" }}>
        <div style={{ position: "relative", flexShrink: 0 }}>
          <LinkedInAvatar imageUrl={avatarUrl} initials={initials} size="lg" />
          <span
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 18,
              height: 18,
              backgroundColor: "#0A66C2",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 9,
              fontWeight: 900,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            in
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-050)", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text)", lineHeight: 1.2 }}>{name}</span>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)", lineHeight: 1.2 }}>· You</span>
          </div>
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {(user?.publicMetadata?.headline as string | undefined) ?? "Sharing insights on LinkedIn"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-075)", marginTop: 2 }}>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{relativeTime(createdAt)}</span>
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-border)" }}>·</span>
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ color: "var(--ds-text-subtlest)" }}>
              <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm-.35 1.03A7 7 0 018 1c.12 0 .23 0 .35.01C7.67 1.5 7 2.84 6.56 4.5H4.27A6.99 6.99 0 017.65 1.03zM3.82 5.5H1.16A6.98 6.98 0 011 8c0 .86.15 1.69.42 2.45h2.65A14.4 14.4 0 013.5 8c0-.87.11-1.72.32-2.5zm.45 0H7.5A13.3 13.3 0 007.5 8c0 .87.1 1.72.27 2.5H4.31A13.3 13.3 0 014 8c0-.87.1-1.72.27-2.5zm4.23 0h2.95A13.3 13.3 0 019.73 8c0 .87-.1 1.72-.27 2.5H8.23A13.3 13.3 0 008.5 8c0-.87-.1-1.72-.23-2.5zm3.41 0H14.5c.21.78.32 1.63.32 2.5 0 .87-.11 1.72-.32 2.5h-2.65c.17-.78.27-1.63.27-2.5 0-.87-.1-1.72-.27-2.5zm-.26-1H9.44C9 2.84 8.33 1.5 7.65 1.03A6.99 6.99 0 0111.65 4.5zm-7.38 7H6.56C7 13.16 7.67 14.5 8.35 14.97A6.99 6.99 0 014.27 11.5zm7.46 0h-2.29C9 13.16 8.33 14.5 7.65 14.97A7 7 0 0011.73 11.5zm1.09 0h-.45A14.4 14.4 0 0112.5 10h2.08A6.99 6.99 0 0111.73 11.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Post text */}
      <div style={{ padding: "0 var(--ds-space-200) var(--ds-space-150)" }}>
        {editing ? (
          <textarea
            style={{
              width: "100%",
              minHeight: 200,
              fontSize: "var(--ds-font-size-100)",
              color: "var(--ds-text)",
              resize: "none",
              outline: "none",
              border: "none",
              lineHeight: "var(--ds-line-height-300)",
              fontFamily: "var(--ds-font-family-sans)",
              background: "transparent",
            }}
            value={content}
            onChange={(e) => onContentChange?.(e.target.value)}
            autoFocus
          />
        ) : (
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text)", whiteSpace: "pre-wrap", lineHeight: "var(--ds-line-height-300)" }}>
            {displayText}
            {shouldTruncate && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                style={{ color: "var(--ds-text-subtle)", fontWeight: "var(--ds-font-weight-semibold)", background: "none", border: "none", cursor: "pointer", marginLeft: 2, padding: 0 }}
              >
                …see more
              </button>
            )}
          </p>
        )}
      </div>

      {/* Reaction row */}
      {!editing && (
        <div style={{ padding: "0 var(--ds-space-200) var(--ds-space-100)", display: "flex", alignItems: "center", gap: "var(--ds-space-075)" }}>
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "#0A66C2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              lineHeight: 1,
            }}
          >
            👍
          </span>
          <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>Be the first to react</span>
        </div>
      )}

      {!editing && (
        <hr style={{ borderColor: "var(--ds-border)", margin: "0 var(--ds-space-200)", borderTop: "1px solid", borderBottom: "none" }} />
      )}

      {/* Action bar */}
      {!editing && (
        <div style={{ padding: "var(--ds-space-075) var(--ds-space-150)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-025)" }}>
            <LinkedInAvatar imageUrl={avatarUrl} initials={initials} size="sm" />
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20" style={{ color: "var(--ds-text-subtlest)" }}>
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          {[
            { icon: "👍", label: "Like" },
            { icon: "💬", label: "Comment" },
            { icon: "🔁", label: "Repost" },
            { icon: "➤", label: "Send" },
          ].map(({ icon, label }) => (
            <span
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--ds-space-050)",
                fontSize: "var(--ds-font-size-075)",
                fontWeight: "var(--ds-font-weight-semibold)",
                color: "var(--ds-text-subtlest)",
                opacity: 0.5,
                userSelect: "none",
                padding: "var(--ds-space-050) var(--ds-space-100)",
              }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </span>
          ))}
        </div>
      )}

    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { SectionMessage } from "@/components/ui/SectionMessage";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Lozenge } from "@/components/ui/Lozenge";

const MIN_WORDS = 30;

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function truncate(text: string, chars = 110) {
  return text.length <= chars ? text : text.slice(0, chars).trimEnd() + "…";
}

function confidenceAppearance(count: number): { appearance: "success" | "moved" | "removed"; label: string } | null {
  if (count >= 50) return { appearance: "success", label: "High confidence" };
  if (count >= 30) return { appearance: "moved", label: "Medium confidence" };
  if (count >= 15) return { appearance: "removed", label: "Low confidence" };
  return null;
}

interface Props {
  initialPosts?: string[];
  onReady: (posts: string[]) => void;
}

export function CardBasedPostInput({ initialPosts = [], onReady }: Props) {
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState<string[]>(initialPosts);
  const [draftError, setDraftError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const draftWords = wordCount(draft);

  const addPost = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    const wc = wordCount(trimmed);
    if (wc < MIN_WORDS) {
      setDraftError(`This post has ${wc} words - minimum is ${MIN_WORDS}. Add more content or paste a longer post.`);
      return;
    }

    setDraftError(null);
    setPosts((prev) => [...prev, trimmed]);
    setDraft("");
    textareaRef.current?.focus();
  };

  const removePost = (index: number) => {
    setPosts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      addPost();
    }
  };

  const count = posts.length;
  const conf = confidenceAppearance(count);
  const isReady = count >= 1;
  const progressValue = Math.min(count / 50, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-250)" }}>
      {/* Progress */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "var(--ds-font-size-100)", fontWeight: "var(--ds-font-weight-semibold)", color: conf ? "var(--ds-text)" : "var(--ds-text-subtle)" }}>
            {count} {count === 1 ? "post" : "posts"} added
          </span>
          {conf ? (
            <Lozenge appearance={conf.appearance}>{conf.label}</Lozenge>
          ) : (
            <span style={{ fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
              {count === 0 ? "Add as many as you have" : `${15 - count} more for better results`}
            </span>
          )}
        </div>
        <ProgressBar value={progressValue} />
        {count > 0 && count < 50 && (
          <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>
            {count < 15
              ? `${15 - count} more post${15 - count !== 1 ? "s" : ""} unlocks Medium confidence - 50+ gives the strongest results`
              : "50+ posts gives the strongest results"}
          </p>
        )}
      </div>

      {/* Input area */}
      <div
        style={{
          background: "var(--ds-surface)",
          borderRadius: "var(--ds-radius-200)",
          border: `1px solid var(--ds-border)`,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "var(--ds-space-150)" }}>
          <TextArea
            ref={textareaRef}
            value={draft}
            onChange={(e) => { setDraft(e.target.value); setDraftError(null); }}
            onKeyDown={handleKeyDown}
            placeholder="Paste one LinkedIn post here…"
            minimumRows={5}
            resize="none"
          />
        </div>
        <div
          style={{
            borderTop: `1px solid var(--ds-border)`,
            padding: "var(--ds-space-075) var(--ds-space-150)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--ds-background-neutral-subtle)",
          }}
        >
          <span style={{ fontSize: "var(--ds-font-size-075)", color: draftWords >= MIN_WORDS ? "var(--ds-text-success)" : "var(--ds-text-subtlest)" }}>
            {draftWords > 0
              ? `${draftWords} words${draftWords < MIN_WORDS ? ` - need ${MIN_WORDS}` : ""}`
              : "⌘ Enter to add"}
          </span>
          <Button
            appearance="primary"
            spacing="compact"
            isDisabled={!draft.trim()}
            onClick={addPost}
          >
            Add post
          </Button>
        </div>
      </div>

      {draftError && (
        <SectionMessage appearance="warning" title="Post too short">{draftError}</SectionMessage>
      )}

      {/* Post cards */}
      {posts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-075)" }}>
          {posts.map((post, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--ds-space-150)",
                background: "var(--ds-surface)",
                border: `1px solid var(--ds-border)`,
                borderRadius: "var(--ds-radius-100)",
                padding: "var(--ds-space-100) var(--ds-space-150)",
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: 20,
                  height: 20,
                  marginTop: 1,
                  borderRadius: "50%",
                  backgroundColor: "var(--ds-background-brand-subtle)",
                  color: "var(--ds-text-brand)",
                  fontSize: "var(--ds-font-size-075)",
                  fontWeight: "var(--ds-font-weight-bold)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {i + 1}
              </span>
              <p style={{ flex: 1, margin: 0, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)", lineHeight: "var(--ds-line-height-300)" }}>
                {truncate(post)}
              </p>
              <button
                onClick={() => removePost(i)}
                style={{
                  flexShrink: 0,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--ds-text-subtlest)",
                  fontSize: "var(--ds-font-size-100)",
                  lineHeight: 1,
                  marginTop: 1,
                  padding: 2,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ds-text-danger)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ds-text-subtlest)"; }}
                aria-label="Remove post"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {isReady && (
        <Button appearance="primary" shouldFitContainer onClick={() => onReady(posts)}>
          Build my Voice DNA with {count} posts →
        </Button>
      )}
    </div>
  );
}

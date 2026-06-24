"use client";

import { useRef, useState } from "react";
import { Lozenge, scoreToAppearance } from "@/components/ui/Lozenge";

type UserMessage = { role: "user"; text: string };
type AssistantMessage = { role: "assistant"; content: string; score: number; wordCount: number };
type ChatMessage = UserMessage | AssistantMessage;

interface RefinementChatProps {
  generationId: string;
  initialContent: string;
  initialScore: number;
  onClose: () => void;
  onApply?: (content: string, score: number) => void;
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <Lozenge appearance={scoreToAppearance(score)}>
      {score}% match
    </Lozenge>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      style={{
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        border: "1px solid var(--ds-border)",
        borderRadius: 6,
        background: "var(--ds-surface)",
        color: "var(--ds-text)",
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function RefinementChat({ generationId, initialContent, initialScore, onClose, onApply }: RefinementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Always the latest version of the post (starts at the original variant)
  const currentContent = messages.reduceRight<string>((found, m) => {
    if (found) return found;
    return m.role === "assistant" ? m.content : "";
  }, "") || initialContent;

  // Last 2 user instructions for backend context
  const priorInstructions = messages
    .filter((m): m is UserMessage => m.role === "user")
    .slice(-2)
    .map((m) => m.text);

  const submit = async () => {
    const instruction = input.trim();
    if (!instruction || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text: instruction }]);
    setLoading(true);

    try {
      const res = await fetch(`/api/generate/${generationId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_content: currentContent,
          instruction,
          prior_instructions: priorInstructions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }

      const data = await res.json() as { refined_content: string; voice_match_score: number; word_count: number };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.refined_content, score: data.voice_match_score, wordCount: data.word_count },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      // Remove the user message so they can retry
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div style={{ borderTop: "1px solid var(--ds-border-brand)", background: "var(--ds-background-neutral-subtle)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px var(--ds-space-200)",
        borderBottom: "1px solid var(--ds-border)",
        background: "var(--ds-surface)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ds-text)", letterSpacing: "-0.01em" }}>
            ✦ Refine with AI
          </span>
          <span style={{ fontSize: 12, color: "var(--ds-text-subtle)" }}>
            Tell me what to change - voice fingerprint stays locked.
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ds-text-subtle)", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}
          aria-label="Close refinement chat"
        >
          ×
        </button>
      </div>

      {/* Chat body */}
      <div style={{ padding: "var(--ds-space-150) var(--ds-space-200)", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)", maxHeight: 480, overflowY: "auto" }}>

        {/* Seed message: the original variant */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Current version</span>
            <ScoreBadge score={initialScore} />
            <span style={{ fontSize: 11, color: "var(--ds-text-subtlest)" }}>{initialContent.split(/\s+/).length}w</span>
            <CopyButton text={initialContent} />
          </div>
          <div style={{
            padding: "var(--ds-space-150)",
            background: "var(--ds-surface)",
            borderRadius: 8,
            border: "1px solid var(--ds-border)",
            fontSize: 13,
            color: "var(--ds-text)",
            lineHeight: 1.7,
            whiteSpace: "pre-wrap",
          }}>
            {initialContent}
          </div>
        </div>

        {/* Conversation turns */}
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                maxWidth: "80%",
                padding: "8px 14px",
                background: "var(--ds-background-brand-bold)",
                color: "var(--ds-text-inverse)",
                borderRadius: "12px 12px 2px 12px",
                fontSize: 13,
                lineHeight: 1.5,
              }}>
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ds-text-subtlest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Refined
                </span>
                <ScoreBadge score={msg.score} />
                <span style={{ fontSize: 11, color: "var(--ds-text-subtlest)" }}>{msg.wordCount}w</span>
                <CopyButton text={msg.content} />
                {onApply && (
                  <button
                    onClick={() => { onApply(msg.content, msg.score); onClose(); }}
                    style={{
                      padding: "4px 12px",
                      fontSize: 12,
                      fontWeight: 600,
                      border: "1px solid var(--ds-border-brand)",
                      borderRadius: 6,
                      background: "var(--ds-background-brand-subtle)",
                      color: "var(--ds-text-brand)",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Apply
                  </button>
                )}
              </div>
              <div style={{
                padding: "var(--ds-space-150)",
                background: "var(--ds-surface)",
                borderRadius: 8,
                border: `1px solid ${msg.score >= 80 ? "var(--ds-border-success)" : "var(--ds-border)"}`,
                fontSize: 13,
                color: "var(--ds-text)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}>
                {msg.content}
              </div>
            </div>
          )
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ds-text-subtle)", fontSize: 13 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
            Refining…
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: "var(--ds-text-danger)", padding: "8px 12px", background: "var(--ds-background-danger)", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "var(--ds-space-150) var(--ds-space-200)",
        borderTop: "1px solid var(--ds-border)",
        background: "var(--ds-surface)",
        display: "flex",
        gap: "var(--ds-space-100)",
        alignItems: "flex-end",
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "Make the hook a bold claim" · "Cut it to 180 words" · "Add a personal story"'
          disabled={loading}
          rows={2}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid var(--ds-border)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            color: "var(--ds-text)",
            background: "var(--ds-background-input)",
            outline: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={submit}
          disabled={!input.trim() || loading}
          style={{
            padding: "9px 18px",
            background: !input.trim() || loading ? "var(--ds-background-neutral)" : "var(--ds-background-brand-bold)",
            color: !input.trim() || loading ? "var(--ds-text-disabled)" : "var(--ds-text-inverse)",
            border: "none",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            flexShrink: 0,
            height: 38,
            alignSelf: "flex-end",
          }}
        >
          Send →
        </button>
      </div>
    </div>
  );
}

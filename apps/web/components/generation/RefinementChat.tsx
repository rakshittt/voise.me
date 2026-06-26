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
  /** Pass true when the post content is already visible above the panel - prevents showing it twice. */
  hideCurrentDraft?: boolean;
}

const QUICK_CHIPS = [
  "Make the hook bolder",
  "Cut it by half",
  "Add a personal story",
  "More direct and punchy",
  "Add a concrete stat",
  "Remove the jargon",
];

function ScoreDelta({ from, to }: { from: number; to: number }) {
  const delta = to - from;
  if (delta === 0) return <span style={{ fontSize: 11, color: "#666" }}>= same</span>;
  const positive = delta > 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: positive ? "#057642" : "#c0392b" }}>
      {positive ? "+" : ""}{delta}%
    </span>
  );
}

function CopyButton({ text, compact }: { text: string; compact?: boolean }) {
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
        padding: compact ? "3px 10px" : "5px 14px",
        fontSize: 12,
        fontWeight: 600,
        border: "1px solid #d0d0d0",
        borderRadius: 20,
        background: copied ? "#e6f4ea" : "#fff",
        color: copied ? "#057642" : "#555",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
        letterSpacing: "-0.01em",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function PostCard({
  content,
  score,
  initialScore,
  label,
  showApply,
  onApply,
  onClose,
}: {
  content: string;
  score: number;
  initialScore: number;
  label: string;
  showApply?: boolean;
  onApply?: () => void;
  onClose?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 320;
  const shouldTruncate = content.length > LIMIT && !expanded;
  const displayText = shouldTruncate ? content.slice(0, LIMIT) : content;

  return (
    <div style={{
      border: "1px solid #e0e0e0",
      borderRadius: 12,
      background: "#fff",
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      {/* Label row */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 14px",
        borderBottom: "1px solid #eee",
        background: "#fafafa",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            {label}
          </span>
          <Lozenge appearance={scoreToAppearance(score)}>{score}% match</Lozenge>
          {score !== initialScore && <ScoreDelta from={initialScore} to={score} />}
          <span style={{ fontSize: 11, color: "#999" }}>
            {content.split(/\s+/).filter(Boolean).length}w
          </span>
        </div>
        <CopyButton text={content} compact />
      </div>

      {/* Post text */}
      <div style={{ padding: "12px 14px" }}>
        <p style={{
          margin: 0,
          fontSize: 13.5,
          color: "#1d2226",
          lineHeight: 1.65,
          whiteSpace: "pre-wrap",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}>
          {displayText}
          {shouldTruncate && (
            <button
              onClick={() => setExpanded(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#555", fontWeight: 600, padding: 0, marginLeft: 4, fontSize: 13 }}
            >
              …see more
            </button>
          )}
        </p>
      </div>

      {/* Apply footer */}
      {showApply && onApply && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "8px 14px",
          borderTop: "1px solid #eee",
          gap: 8,
        }}>
          <button
            onClick={() => { onApply(); onClose?.(); }}
            style={{
              padding: "6px 18px",
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 20,
              border: "none",
              background: "#0A66C2",
              color: "#fff",
              cursor: "pointer",
              letterSpacing: "-0.01em",
            }}
          >
            Apply this version
          </button>
        </div>
      )}
    </div>
  );
}

export function RefinementChat({ generationId, initialContent, initialScore, onClose, onApply, hideCurrentDraft = false }: RefinementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentContent = messages.reduceRight<string>((found, m) => {
    if (found) return found;
    return m.role === "assistant" ? m.content : "";
  }, "") || initialContent;

  const priorInstructions = messages
    .filter((m): m is UserMessage => m.role === "user")
    .slice(-2)
    .map((m) => m.text);

  const submit = async (instruction?: string) => {
    const text = (instruction ?? input).trim();
    if (!text || loading) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setLoading(true);

    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`/api/generate/${generationId}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_content: currentContent,
          instruction: text,
          prior_instructions: priorInstructions,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { detail?: string }).detail ?? `Error ${res.status}`);
      }

      const data = await res.json() as { refined_content: string; voice_match_score: number; word_count: number };
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.refined_content, score: data.voice_match_score, wordCount: data.word_count },
      ]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
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

  const hasMessages = messages.length > 0;

  return (
    <div style={{ borderTop: "2px solid #0A66C2", background: "#f3f2ef" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        background: "#fff",
        borderBottom: "1px solid #e0e0e0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0A66C2, #0284c7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 13,
            flexShrink: 0,
          }}>
            ✦
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1d2226", letterSpacing: "-0.01em" }}>
              Refine with AI
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 1 }}>
              Voice fingerprint stays locked - only the phrasing changes
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "none",
            border: "1px solid #d0d0d0",
            borderRadius: "50%",
            cursor: "pointer",
            color: "#666",
            fontSize: 18,
            lineHeight: 1,
          }}
          aria-label="Close refinement panel"
        >
          ×
        </button>
      </div>

      {/* Scrollable chat area */}
      <div style={{
        maxHeight: 520,
        overflowY: "auto",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}>
        {/* Current draft - only shown when the post isn't already visible above */}
        {!hideCurrentDraft && (
          <PostCard
            content={initialContent}
            score={initialScore}
            initialScore={initialScore}
            label="Current draft"
          />
        )}

        {/* Conversation */}
        {messages.map((msg, i) =>
          msg.role === "user" ? (
            <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{
                maxWidth: "78%",
                padding: "9px 14px",
                background: "#0A66C2",
                color: "#fff",
                borderRadius: "18px 18px 4px 18px",
                fontSize: 13,
                lineHeight: 1.5,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                boxShadow: "0 1px 3px rgba(10,102,194,0.25)",
              }}>
                {msg.text}
              </div>
            </div>
          ) : (
            <PostCard
              key={i}
              content={msg.content}
              score={msg.score}
              initialScore={initialScore}
              label="Refined version"
              showApply={!!onApply}
              onApply={() => onApply?.(msg.content, msg.score)}
              onClose={onClose}
            />
          )
        )}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              color: "#0A66C2",
              flexShrink: 0,
            }}>
              ✦
            </div>
            <div style={{
              padding: "10px 14px",
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "4px 18px 18px 18px",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}>
              {[0, 1, 2].map((j) => (
                <span key={j} style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#0A66C2",
                  display: "inline-block",
                  animation: `rfBounce 1.2s ease-in-out ${j * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{
            fontSize: 12,
            color: "#b91c1c",
            padding: "8px 12px",
            background: "#fef2f2",
            borderRadius: 8,
            border: "1px solid #fecaca",
          }}>
            {error} - try again
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick suggestion chips */}
      {!hasMessages && !loading && (
        <div style={{
          padding: "0 16px 12px",
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
        }}>
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => submit(chip)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid #b0c4de",
                borderRadius: 20,
                background: "#fff",
                color: "#0A66C2",
                cursor: "pointer",
                letterSpacing: "-0.01em",
                transition: "background 0.1s, border-color 0.1s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e8f0fe";
                e.currentTarget.style.borderColor = "#0A66C2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "#b0c4de";
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Composer bar */}
      <div style={{
        padding: "10px 16px 14px",
        borderTop: "1px solid #e0e0e0",
        background: "#fff",
        display: "flex",
        gap: 10,
        alignItems: "flex-end",
      }}>
        <div style={{
          flex: 1,
          border: "1px solid #b0c4de",
          borderRadius: 24,
          padding: "8px 14px",
          background: "#f8f9fa",
          display: "flex",
          alignItems: "flex-end",
        }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#0A66C2"; }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#b0c4de"; }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what to change…"
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              resize: "none",
              border: "none",
              outline: "none",
              fontSize: 13,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              color: "#1d2226",
              background: "transparent",
              lineHeight: 1.5,
              maxHeight: 120,
              overflowY: "auto",
            }}
          />
        </div>
        <button
          onClick={() => submit()}
          disabled={!input.trim() || loading}
          aria-label="Send"
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: "none",
            background: !input.trim() || loading ? "#c0ccd6" : "#0A66C2",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: !input.trim() || loading ? "not-allowed" : "pointer",
            flexShrink: 0,
            transition: "background 0.15s",
            fontSize: 15,
          }}
        >
          ➤
        </button>
      </div>

      <style>{`
        @keyframes rfBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

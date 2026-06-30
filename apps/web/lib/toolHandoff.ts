// Carries content a visitor typed into a free public tool across signup +
// onboarding so their first dashboard action continues what they started,
// instead of dropping them on a blank screen.

export type ToolHandoffKind = "idea" | "posts";

export interface ToolHandoff {
  content: string;
  source: string;
  kind: ToolHandoffKind;
  savedAt: number;
}

const KEY = "voise_handoff";
const TTL_MS = 60 * 60 * 1000; // expire after 1 hour so stale content never resurfaces

export function saveToolHandoff(content: string, source: string, kind: ToolHandoffKind): void {
  if (typeof window === "undefined" || !content.trim()) return;
  const payload: ToolHandoff = { content, source, kind, savedAt: Date.now() };
  window.localStorage.setItem(KEY, JSON.stringify(payload));
}

export function getToolHandoff(): ToolHandoff | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ToolHandoff;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(KEY);
    return null;
  }
}

export function clearToolHandoff(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

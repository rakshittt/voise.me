export interface HookCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface HookCheckResult {
  score: number; // 0-100
  rating: "strong" | "fair" | "weak";
  hook: string;
  checks: HookCheck[];
}

const CLICHE_OPENERS = [
  "i am excited to announce",
  "i'm excited to announce",
  "i am thrilled to share",
  "i'm thrilled to share",
  "i am happy to share",
  "i'm happy to share",
  "i am pleased to announce",
  "humbled and honored",
];

const PATTERN_INTERRUPT_MARKERS = [
  "but", "stopped", "wrong", "unpopular opinion", "nobody tells you",
  "here's the truth", "truth is", "everyone thinks", "most people",
  "i used to think", "turns out", "here's what", "the real reason",
];

function extractHook(post: string): string {
  const normalized = post.trim().replace(/\r\n/g, "\n");
  const firstBreak = normalized.indexOf("\n");
  const firstLine = firstBreak === -1 ? normalized : normalized.slice(0, firstBreak);
  return firstLine.trim();
}

export function checkHook(post: string): HookCheckResult {
  const hook = extractHook(post);
  const lower = hook.toLowerCase();
  const checks: HookCheck[] = [];
  let score = 50;

  // Length
  const len = [...hook].length;
  if (len > 0 && len <= 100) {
    checks.push({ id: "length", label: "Hook is short and scannable", passed: true, detail: `${len} characters - fits in one glance` });
    score += 12;
  } else if (len > 100) {
    checks.push({ id: "length", label: "Hook is short and scannable", passed: false, detail: `${len} characters - trim it down so it reads in under a second` });
    score -= 10;
  } else {
    checks.push({ id: "length", label: "Hook is short and scannable", passed: false, detail: "No standalone first line detected" });
    score -= 15;
  }

  // Link in hook
  const hasLink = /(https?:\/\/|www\.)\S+/i.test(hook);
  if (hasLink) {
    checks.push({ id: "link", label: "No link in the opening line", passed: false, detail: "A link this early can suppress reach - move it to the first comment" });
    score -= 20;
  } else {
    checks.push({ id: "link", label: "No link in the opening line", passed: true, detail: "Good - no link competing with the hook" });
    score += 8;
  }

  // Cliché opener
  const isCliche = CLICHE_OPENERS.some((c) => lower.startsWith(c) || lower.includes(c));
  if (isCliche) {
    checks.push({ id: "cliche", label: "Avoids generic announcement openers", passed: false, detail: "\"Excited to announce\"-style openers blend in - lead with the insight instead" });
    score -= 15;
  } else {
    checks.push({ id: "cliche", label: "Avoids generic announcement openers", passed: true, detail: "No cliché opener detected" });
    score += 5;
  }

  // Curiosity / specificity signals
  const startsWithNumber = /^\d/.test(hook.trim());
  const isQuestion = hook.trim().endsWith("?");
  const hasPatternInterrupt = PATTERN_INTERRUPT_MARKERS.some((m) => lower.includes(m));
  const hasPersonalAngle = /\bi\b|\bwe\b|\bmy\b|\bour\b/i.test(hook);

  const hookSignals = [startsWithNumber, isQuestion, hasPatternInterrupt, hasPersonalAngle].filter(Boolean).length;
  if (hookSignals > 0) {
    checks.push({
      id: "curiosity",
      label: "Creates a curiosity gap or personal stake",
      passed: true,
      detail: [
        startsWithNumber && "opens with a number",
        isQuestion && "opens with a question",
        hasPatternInterrupt && "uses a pattern-interrupt phrase",
        hasPersonalAngle && "personal/first-person angle",
      ].filter(Boolean).join(", "),
    });
    score += hookSignals * 6;
  } else {
    checks.push({ id: "curiosity", label: "Creates a curiosity gap or personal stake", passed: false, detail: "Try a number, a question, or a contrarian angle to earn the click on \"see more\"" });
    score -= 8;
  }

  // Shouting
  const capsWords = hook.split(/\s+/).filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 2) {
    checks.push({ id: "caps", label: "No excessive caps", passed: false, detail: "Multiple ALL-CAPS words read as shouting" });
    score -= 10;
  } else {
    checks.push({ id: "caps", label: "No excessive caps", passed: true, detail: "Tone reads as normal text" });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating: HookCheckResult["rating"] = score >= 75 ? "strong" : score >= 50 ? "fair" : "weak";

  return { score, rating, hook, checks };
}

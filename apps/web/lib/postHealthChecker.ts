export type PostHealthSeverity = "pass" | "warn" | "fail";

export interface PostHealthCheck {
  id: string;
  label: string;
  severity: PostHealthSeverity;
  detail: string;
}

export interface PostHealthResult {
  score: number; // 0-100
  rating: "strong" | "fair" | "weak";
  checks: PostHealthCheck[];
}

const ENGAGEMENT_BAIT_PHRASES = [
  "comment yes", "comment \"yes\"", "tag someone who", "like if you agree",
  "repost if", "share if you agree", "drop a", "type \"me\" in the comments",
  "follow for more", "double tap",
];

function countEmoji(text: string): number {
  const matches = text.match(/\p{Extended_Pictographic}/gu);
  return matches ? matches.length : 0;
}

export function checkPostHealth(post: string): PostHealthResult {
  const text = post.trim();
  const checks: PostHealthCheck[] = [];
  let score = 100;

  if (!text) {
    return { score: 0, rating: "weak", checks: [{ id: "empty", label: "Paste a post to check", severity: "fail", detail: "" }] };
  }

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = [...text].length;

  // Link placement
  const linkMatches = [...text.matchAll(/(https?:\/\/|www\.)\S+/gi)];
  const first200 = text.slice(0, 200);
  const earlyLink = /(https?:\/\/|www\.)\S+/i.test(first200);
  if (earlyLink) {
    checks.push({ id: "early_link", label: "Link placement", severity: "fail", detail: "External link appears in the first 200 characters - LinkedIn tends to suppress reach on posts with early outbound links. Move it to the first comment." });
    score -= 20;
  } else if (linkMatches.length > 0) {
    checks.push({ id: "early_link", label: "Link placement", severity: "warn", detail: `${linkMatches.length} external link(s) found later in the post - consider moving links to the first comment instead.` });
    score -= 8;
  } else {
    checks.push({ id: "early_link", label: "Link placement", severity: "pass", detail: "No external links competing with reach." });
  }

  // Hashtags
  const hashtags = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  if (hashtags.length === 0) {
    checks.push({ id: "hashtags", label: "Hashtag usage", severity: "warn", detail: "No hashtags - 3-5 relevant hashtags help discoverability." });
    score -= 5;
  } else if (hashtags.length <= 5) {
    checks.push({ id: "hashtags", label: "Hashtag usage", severity: "pass", detail: `${hashtags.length} hashtag(s) - good range.` });
  } else {
    checks.push({ id: "hashtags", label: "Hashtag usage", severity: "warn", detail: `${hashtags.length} hashtags - more than ~5 can read as spammy. Trim to your most relevant tags.` });
    score -= 12;
  }

  // Wall of text
  const firstBreak = text.indexOf("\n");
  const firstChunk = firstBreak === -1 ? text : text.slice(0, firstBreak);
  if (firstChunk.length > 220) {
    checks.push({ id: "wall_of_text", label: "Line breaks", severity: "warn", detail: "No line break in the first 220+ characters - this can look like a wall of text in feed. Break up your opening." });
    score -= 12;
  } else {
    checks.push({ id: "wall_of_text", label: "Line breaks", severity: "pass", detail: "Opening is broken into readable chunks." });
  }

  // Shouting
  const capsWords = text.split(/\s+/).filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 4) {
    checks.push({ id: "caps", label: "Caps usage", severity: "warn", detail: `${capsWords.length} ALL-CAPS words - heavy caps usage can read as shouting.` });
    score -= 8;
  } else {
    checks.push({ id: "caps", label: "Caps usage", severity: "pass", detail: "Caps usage is reasonable." });
  }

  // Emoji density
  const emojiCount = countEmoji(text);
  const emojiRatio = wordCount > 0 ? emojiCount / wordCount : 0;
  if (emojiCount > 15 || emojiRatio > 0.15) {
    checks.push({ id: "emoji", label: "Emoji density", severity: "warn", detail: `${emojiCount} emoji - heavy emoji use can crowd out the message. A handful for emphasis usually reads best.` });
    score -= 8;
  } else {
    checks.push({ id: "emoji", label: "Emoji density", severity: "pass", detail: emojiCount > 0 ? `${emojiCount} emoji - reasonable.` : "No emoji - fine either way." });
  }

  // Engagement bait
  const lower = text.toLowerCase();
  const baitHit = ENGAGEMENT_BAIT_PHRASES.find((p) => lower.includes(p));
  if (baitHit) {
    checks.push({ id: "bait", label: "Engagement-bait phrasing", severity: "fail", detail: `Found a phrase similar to "${baitHit}" - LinkedIn actively down-ranks engagement-bait posts. Ask a genuine question instead.` });
    score -= 20;
  } else {
    checks.push({ id: "bait", label: "Engagement-bait phrasing", severity: "pass", detail: "No engagement-bait phrasing detected." });
  }

  // Length sanity
  if (charCount < 150) {
    checks.push({ id: "length", label: "Post length", severity: "warn", detail: `${charCount} characters - quite short. Posts with more context tend to hold attention longer.` });
    score -= 6;
  } else if (charCount > 3000) {
    checks.push({ id: "length", label: "Post length", severity: "fail", detail: `${charCount} characters - over LinkedIn's 3,000 character post limit. Trim it down.` });
    score -= 15;
  } else {
    checks.push({ id: "length", label: "Post length", severity: "pass", detail: `${charCount} characters - within range.` });
  }

  // Excess punctuation
  if (/[!?]{3,}/.test(text)) {
    checks.push({ id: "punctuation", label: "Punctuation", severity: "warn", detail: "Repeated \"!!!\" or \"???\" can read as low-effort or spammy." });
    score -= 5;
  } else {
    checks.push({ id: "punctuation", label: "Punctuation", severity: "pass", detail: "Punctuation looks clean." });
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  const rating: PostHealthResult["rating"] = score >= 80 ? "strong" : score >= 55 ? "fair" : "weak";

  return { score, rating, checks };
}

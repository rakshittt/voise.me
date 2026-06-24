const MAX_LEN = 500;

/**
 * Bounded character-level edit distance (Levenshtein).
 * Inputs longer than MAX_LEN chars are truncated before comparison so the
 * O(m×n) DP stays bounded. The result is an approximation for very long posts
 * but good enough for signal weighting purposes.
 */
export function editDistance(a: string, b: string): number {
  const s = a.slice(0, MAX_LEN);
  const t = b.slice(0, MAX_LEN);
  const m = s.length;
  const n = t.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

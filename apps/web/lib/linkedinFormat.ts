// LinkedIn doesn't render markdown/HTML, so "bold"/"italic" is done by mapping
// ASCII letters/digits to Unicode Mathematical Alphanumeric Symbols.
export function toUnicodeBold(text: string): string {
  return [...text]
    .map((char) => {
      const c = char.codePointAt(0)!;
      if (c >= 65 && c <= 90) return String.fromCodePoint(c - 65 + 0x1d5d4); // A-Z
      if (c >= 97 && c <= 122) return String.fromCodePoint(c - 97 + 0x1d5ee); // a-z
      if (c >= 48 && c <= 57) return String.fromCodePoint(c - 48 + 0x1d7ec); // 0-9
      return char;
    })
    .join("");
}

export function toUnicodeItalic(text: string): string {
  return [...text]
    .map((char) => {
      const c = char.codePointAt(0)!;
      if (c >= 65 && c <= 90) return String.fromCodePoint(c - 65 + 0x1d608); // A-Z
      if (c >= 97 && c <= 122) return String.fromCodePoint(c - 97 + 0x1d622); // a-z
      return char;
    })
    .join("");
}

export const LINKEDIN_FORMAT_EMOJIS = [
  "🚀", "💡", "✅", "🎯", "💪", "🔥", "📈", "💼", "🤝", "👇",
  "⚡", "🌟", "🏆", "👋", "🙌", "💰", "📊", "🎉", "✨", "💬",
  "📌", "🔑", "💎", "🧠", "👀", "📣", "🎁", "⏰", "🔍", "💫",
];

/**
 * Voise logo - standalone waveform bars + "Voise" wordmark.
 * Brand: #1B3A5F navy (on light), #ffffff (on dark).
 * Typeface: Outfit Semibold 600.
 *
 * VoiseMark  = icon only (no background square)
 * VoiseLogo  = icon + wordmark
 */

interface MarkProps {
  size?: number;
  color?: string;
}

export function VoiseMark({ size = 24, color = "#1B3A5F" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0, display: "block" }}
    >
      {/*
        5-bar symmetric waveform - all bars centred at y=10 on 20×20 canvas.
        Heights: 17 | 12 | 6 | 12 | 17   (outer bars tallest, inner short)
        Bar width 2.5, gap 1.5, start 0.75 → ends at 19.25
      */}
      <rect x="0.75"  y="1.5" width="2.5" height="17" rx="1.25" fill={color} />
      <rect x="4.75"  y="4"   width="2.5" height="12" rx="1.25" fill={color} />
      <rect x="8.75"  y="7"   width="2.5" height="6"  rx="1.25" fill={color} />
      <rect x="12.75" y="4"   width="2.5" height="12" rx="1.25" fill={color} />
      <rect x="16.75" y="1.5" width="2.5" height="17" rx="1.25" fill={color} />
    </svg>
  );
}

interface LogoProps {
  markSize?: number;
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
  letterSpacing?: string;
  gap?: number;
}

export function VoiseLogo({
  markSize = 24,
  fontSize = 15,
  fontWeight = 600,
  color = "#1B3A5F",
  letterSpacing = "-0.02em",
  gap = 8,
}: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <VoiseMark size={markSize} color={color} />
      <span
        style={{
          fontFamily: "var(--font-outfit), 'Outfit', 'Space Grotesk', sans-serif",
          fontWeight,
          fontSize,
          color,
          letterSpacing,
          lineHeight: 1,
        }}
      >
        Voise
      </span>
    </div>
  );
}

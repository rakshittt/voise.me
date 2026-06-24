/**
 * Voise logo mark - 5-bar voice waveform on a rounded brand-blue square.
 *
 * VoiseMark   = icon only (square + bars)
 * VoiseLogo   = icon + "Voise" wordmark side by side
 */

interface MarkProps {
  size?: number;
}

export function VoiseMark({ size = 28 }: MarkProps) {
  const r = Math.round(size * 0.25);
  const innerSize = Math.round(size * 0.72);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        backgroundColor: "var(--ds-background-brand-bold)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/*
        5-bar waveform on a 20×20 canvas.
        Bar width: 2.5  |  gap: 1  |  total span: 16.5  |  start x: 1.75
        Heights (bell curve): 5, 9, 14, 9, 5 - all vertically centred.
      */}
      <svg width={innerSize} height={innerSize} viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="1.75"  y="7.5" width="2.5" height="5"  rx="1.25" fill="white" />
        <rect x="5.25"  y="5.5" width="2.5" height="9"  rx="1.25" fill="white" />
        <rect x="8.75"  y="3"   width="2.5" height="14" rx="1.25" fill="white" />
        <rect x="12.25" y="5.5" width="2.5" height="9"  rx="1.25" fill="white" />
        <rect x="15.75" y="7.5" width="2.5" height="5"  rx="1.25" fill="white" />
      </svg>
    </div>
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
  markSize = 28,
  fontSize = 15,
  fontWeight = 800,
  color = "var(--ds-text)",
  letterSpacing = "-0.03em",
  gap = 8,
}: LogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap }}>
      <VoiseMark size={markSize} />
      <span style={{ fontWeight, fontSize, color, letterSpacing, lineHeight: 1 }}>
        Voise
      </span>
    </div>
  );
}

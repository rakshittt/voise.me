"use client";

export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", justifyContent: "center" }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--ds-font-size-075)",
              fontWeight: "var(--ds-font-weight-bold)",
              backgroundColor: s <= current ? "var(--ds-background-brand-bold)" : "var(--ds-background-neutral)",
              color: s <= current ? "var(--ds-text-inverse)" : "var(--ds-text-subtlest)",
              transition: "background-color 0.2s, color 0.2s",
            }}
          >
            {s < current ? "✓" : s}
          </div>
          {s < total && (
            <div style={{ width: 32, height: 2, backgroundColor: s < current ? "var(--ds-background-brand-bold)" : "var(--ds-background-neutral)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

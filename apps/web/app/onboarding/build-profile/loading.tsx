import { Spinner } from "@/components/ui/Spinner";
import { StepIndicator } from "@/components/onboarding/StepIndicator";

export default function Loading() {
  return (
    <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ds-space-300)" }}>
      <StepIndicator current={2} total={4} />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--ds-space-150)", padding: "var(--ds-space-600) 0" }}>
        <Spinner size="large" />
        <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
          Loading…
        </p>
      </div>
    </div>
  );
}

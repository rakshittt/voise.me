import { VoiseLogo } from "@/components/ui/VoiseLogo";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--ds-background-neutral-subtle)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "var(--ds-space-150) var(--ds-space-300)", borderBottom: `1px solid var(--ds-border)`, background: "var(--ds-surface)" }}>
        <VoiseLogo markSize={24} fontSize={14} fontWeight={800} letterSpacing="-0.03em" gap={7} />
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--ds-space-200)" }}>
        {children}
      </div>
    </div>
  );
}

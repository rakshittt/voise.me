import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { OnboardingGuard } from "./dashboard/onboarding-guard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "var(--ds-surface-sunken)",
      }}
    >
      <OnboardingGuard />
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
        {/* Mobile top bar */}
        <header
          className="md:hidden flex items-center justify-between"
          style={{
            height: "var(--ads-topbar-height)",
            padding: "0 var(--ds-space-200)",
            backgroundColor: "var(--ds-surface)",
            borderBottom: "1px solid var(--ds-border)",
          }}
        >
          <span
            style={{
              fontWeight: "var(--ds-font-weight-bold)",
              fontSize: "var(--ds-font-size-200)",
              color: "var(--ds-text)",
            }}
          >
            Voise
          </span>
          <UserButton />
        </header>

        {/* Desktop top bar (user button only) */}
        <div
          className="hidden md:flex items-center justify-end"
          style={{
            height: "var(--ads-topbar-height)",
            padding: "0 var(--ds-space-300)",
            backgroundColor: "var(--ds-surface)",
            borderBottom: "1px solid var(--ds-border)",
          }}
        >
          <UserButton />
        </div>

        {/* Trial banner (renders when in trial) */}
        <TrialBanner />

        {/* Page content */}
        <main
          className="px-4 pt-6 pb-24 md:px-8 md:pt-8"
          style={{ flex: 1, width: "100%" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

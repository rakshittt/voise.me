import { Sidebar } from "@/components/dashboard/Sidebar";
import { TrialBanner } from "@/components/dashboard/TrialBanner";
import { OnboardingGuard } from "./dashboard/onboarding-guard";
import { getUsageSummary } from "@/lib/server-data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Deduped via React cache() - the page below reuses this same fetch.
  const usage = await getUsageSummary();

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
        {/* Mobile top bar - wordmark only; user info lives in the sidebar */}
        <header
          className="md:hidden flex items-center"
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
        </header>

        {/* Trial banner (renders when in trial) */}
        <TrialBanner
          initialInTrial={usage?.in_trial ?? false}
          initialDaysLeft={usage?.in_trial ? usage.trial_days_remaining : null}
        />

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

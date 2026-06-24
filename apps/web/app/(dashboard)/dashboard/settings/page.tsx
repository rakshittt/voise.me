import { SettingsPage } from "@/components/dashboard/SettingsPage";

export default function SettingsRoute() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
          Manage your account, plan, and billing.
        </p>
      </div>
      <SettingsPage />
    </div>
  );
}

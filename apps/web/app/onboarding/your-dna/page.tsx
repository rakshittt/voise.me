import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VoiseDisplay } from "@/components/voice-dna/VoiseDisplay";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import type { VoiceProfile } from "@/lib/types";

async function fetchProfile(): Promise<VoiceProfile | null> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.API_URL}/voice-profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function YourDNAPage() {
  const profile = await fetchProfile();

  if (!profile || profile.status !== "ready") {
    redirect("/onboarding/build-profile");
  }

  const isSeed = profile.profile_type === "seed";

  return (
    <div style={{ maxWidth: 680, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-400)", padding: "var(--ds-space-400) 0" }}>
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "var(--ds-space-150)" }}>
        <StepIndicator current={3} total={4} />
        <p style={{ margin: 0, fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text-success)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {isSeed ? "✦ Your starter profile is ready" : "✦ Your Voice DNA is ready"}
        </p>
        <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)" }}>
          {isSeed ? "Here’s your starting point" : "Here’s how you write"}
        </h1>
        <p style={{ margin: 0, color: "var(--ds-text-subtle)", fontSize: "var(--ds-font-size-100)" }}>
          {isSeed
            ? "Based on your answers, we’ve mapped your communication style. Your voice sharpens automatically as you write and edit."
            : "We mapped 11 dimensions of your writing style. Every post you generate will be scored against this fingerprint."}
        </p>
      </div>

      {isSeed && (
        <div style={{ padding: "var(--ds-space-150) var(--ds-space-200)", background: "var(--ds-background-warning-subtle)", border: "1px solid var(--ds-border-warning)", borderRadius: "var(--ds-radius-100)", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-warning)", lineHeight: 1.5 }}>
          <strong>Starter profile</strong> - these settings are based on your answers, not real writing data. Add writing samples in Sources to build a full fingerprint.
        </div>
      )}

      <VoiseDisplay profile={profile} />

      <Link
        href="/onboarding/first-post"
        style={{ display: "block", width: "100%", textAlign: "center", padding: "var(--ds-space-150) var(--ds-space-300)", background: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", textDecoration: "none", boxSizing: "border-box" }}
      >
        Generate your first post →
      </Link>
    </div>
  );
}

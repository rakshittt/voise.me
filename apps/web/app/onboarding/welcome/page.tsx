import { redirect } from "next/navigation";
import { WelcomeStep } from "@/components/onboarding/WelcomeStep";
import { getVoiceProfileStatus } from "@/lib/server-data";

export default async function WelcomePage() {
  const profile = await getVoiceProfileStatus();
  // Already onboarded or mid-build - don't make a returning user redo this.
  // Catches anyone who lands here via a stale link/bookmark/back-button, not
  // just the auth-aware Nav CTA fixed alongside this guard.
  if (profile?.status === "ready") redirect("/dashboard");
  if (profile?.status === "building") redirect("/onboarding/build-profile");

  return <WelcomeStep />;
}

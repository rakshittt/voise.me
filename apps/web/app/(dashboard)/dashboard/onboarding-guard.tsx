import { redirect } from "next/navigation";
import { getVoiceProfileStatus } from "@/lib/server-data";

export async function OnboardingGuard() {
  const profile = await getVoiceProfileStatus();
  if (!profile) return null;

  if (profile.status === "not_started") {
    redirect("/onboarding/welcome");
  }
  if (profile.status === "building") {
    redirect("/onboarding/build-profile");
  }

  return null;
}

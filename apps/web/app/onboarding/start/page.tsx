import { redirect } from "next/navigation";
import { PathSelectorStep } from "@/components/onboarding/PathSelectorStep";
import { getVoiceProfileStatus } from "@/lib/server-data";

export default async function StartPage() {
  const profile = await getVoiceProfileStatus();
  if (profile?.status === "ready") redirect("/dashboard");
  if (profile?.status === "building") redirect("/onboarding/build-profile");

  return <PathSelectorStep />;
}

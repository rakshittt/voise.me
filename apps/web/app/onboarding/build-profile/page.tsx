import { redirect } from "next/navigation";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { BuildProfileForm } from "@/components/voice-dna/BuildProfileForm";
import { getVoiceProfileStatus } from "@/lib/server-data";

export default async function BuildProfilePage() {
  const profile = await getVoiceProfileStatus();

  if (profile?.status === "ready") {
    redirect("/onboarding/your-dna");
  }

  const resumeBuilding = profile?.status === "building";

  return (
    <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <StepIndicator current={2} total={4} />
      <BuildProfileForm resumeBuilding={resumeBuilding} initialPostCount={profile?.post_count} />
    </div>
  );
}

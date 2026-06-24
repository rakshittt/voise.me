import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { BuildProfileForm } from "@/components/voice-dna/BuildProfileForm";

async function getProfileStatus(): Promise<string | null> {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/voice-profile/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.status ?? null;
  } catch {
    return null;
  }
}

export default async function BuildProfilePage() {
  const status = await getProfileStatus();

  if (status === "ready") {
    redirect("/onboarding/your-dna");
  }

  return (
    <div style={{ maxWidth: 640, width: "100%", display: "flex", flexDirection: "column", gap: "var(--ds-space-300)" }}>
      <StepIndicator current={2} total={4} />
      <BuildProfileForm />
    </div>
  );
}

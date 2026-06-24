import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FirstGenStep } from "@/components/onboarding/FirstGenStep";

async function hasReadyProfile(token: string): Promise<boolean> {
  const base = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/voice-profile/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ready";
  } catch {
    return false;
  }
}

export default async function FirstPostPage() {
  const { getToken } = await auth();
  const token = await getToken();

  if (!token || !(await hasReadyProfile(token))) {
    redirect("/onboarding/build-profile");
  }

  return <FirstGenStep />;
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function OnboardingGuard() {
  const { getToken } = await auth();
  const token = await getToken();
  if (!token) return null;

  const base = process.env.API_URL ?? "http://localhost:8000";
  try {
    const res = await fetch(`${base}/voice-profile/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!res.ok) {
      redirect("/onboarding/welcome");
    }

    const data = await res.json();
    if (data.status === "not_started") {
      redirect("/onboarding/welcome");
    }
    if (data.status === "building") {
      redirect("/onboarding/build-profile");
    }
  } catch {
    // If API is down, don't block the user - let them through
  }

  return null;
}

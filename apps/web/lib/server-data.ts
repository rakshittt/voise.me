import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import type { VoiceProfileStatus } from "@/lib/types";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export interface UsageSummary {
  plan: string;
  in_trial: boolean;
  trial_days_remaining: number;
  generates_used: number;
  generates_limit: number;
  generates_unlimited: boolean;
  repurposes_used: number;
  repurposes_limit: number;
  repurposes_unlimited: boolean;
  billing_period_start: string;
}

async function getAuthToken(): Promise<string | null> {
  const { getToken } = await auth();
  return getToken();
}

/**
 * Deduped per-request: React's cache() ensures this only hits FastAPI once
 * per server render even though the layout, OnboardingGuard, and page all
 * need this value. Do not call fetch() for these endpoints anywhere else -
 * call these instead so the dedup actually applies.
 */
export const getVoiceProfileStatus = cache(async (): Promise<VoiceProfileStatus | null> => {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/voice-profile/status`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});

export const getUsageSummary = cache(async (): Promise<UsageSummary | null> => {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/usage/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { VoiseDisplay } from "@/components/voice-dna/VoiseDisplay";
import { VoiceStrengthWidget } from "@/components/voice-dna/VoiceStrengthWidget";
import { RebuildButton } from "@/components/voice-dna/RebuildButton";
import { Lozenge } from "@/components/ui/Lozenge";
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

function InfoBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-200)", backgroundColor: "var(--ds-surface)", padding: "var(--ds-space-200) var(--ds-space-250)" }}>
      <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-subtle)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.01em" }}>
        {value}
      </p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtlest)" }}>{sub}</p>}
    </div>
  );
}

export default async function VoisePage() {
  const profile = await fetchProfile();

  /* ── Not built ─────────────────────────────────────────────────────────── */
  if (!profile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            Voice DNA
          </h1>
          <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
            Your personal writing fingerprint
          </p>
        </div>

        <div
          style={{
            border: "1px solid var(--ds-border-brand)",
            borderRadius: "var(--ds-radius-200)",
            backgroundColor: "var(--ds-background-brand-subtle)",
            padding: "var(--ds-space-500)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-200)",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 40 }}>⚡</div>
          <div>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-300)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.01em" }}>
              Your Voice DNA hasn&apos;t been built yet
            </p>
            <p style={{ margin: "var(--ds-space-075) 0 0", fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", maxWidth: 400 }}>
              Paste 10+ of your LinkedIn posts and we&apos;ll extract your unique writing fingerprint across 11 dimensions.
            </p>
          </div>
          <Link
            href="/onboarding/build-profile"
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--ds-space-075)", padding: "10px 20px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontWeight: "var(--ds-font-weight-semibold)", fontSize: "var(--ds-font-size-100)", textDecoration: "none" }}
          >
            Build my Voice DNA →
          </Link>
        </div>
      </div>
    );
  }

  if (profile.status === "building") {
    redirect("/onboarding/build-profile");
  }

  /* ── Built ─────────────────────────────────────────────────────────────── */

  const isSeed = profile.profile_type === "seed";

  const confidenceAppearance =
    profile.confidence_level === "high"
      ? "success"
      : profile.confidence_level === "medium"
        ? "inprogress"
        : profile.confidence_level === "provisional"
          ? "moved"
          : "default";

  const confidenceLabel =
    profile.confidence_level === "provisional"
      ? "Starter profile"
      : `${(profile.confidence_level ?? "none").charAt(0).toUpperCase()}${(profile.confidence_level ?? "none").slice(1)} confidence`;

  const confidenceSub =
    profile.confidence_level === "provisional"
      ? "Built from questionnaire - add posts to train"
      : profile.confidence_level === "high"
        ? "50+ posts - strong fingerprint"
        : profile.confidence_level === "medium"
          ? "30–49 posts - good fingerprint"
          : "Under 30 posts - add more for accuracy";

  const lastBuilt = profile.last_built_at
    ? new Date(profile.last_built_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : "-";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-400)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--ds-space-300)", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--ds-font-size-500)", fontWeight: "var(--ds-font-weight-bold)", color: "var(--ds-text)", letterSpacing: "-0.02em" }}>
            {isSeed ? "Your Voice Profile" : "Your Voice DNA"}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)", marginTop: "var(--ds-space-075)" }}>
            <p style={{ margin: 0, fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)" }}>
              {isSeed ? "Starter settings - refines as you write and edit" : "Your personal writing fingerprint"}
            </p>
            <Lozenge appearance={confidenceAppearance}>
              {confidenceLabel}
            </Lozenge>
          </div>
        </div>
        <div style={{ display: "flex", gap: "var(--ds-space-100)" }}>
          {isSeed ? (
            <Link
              href="/dashboard/sources"
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 16px", backgroundColor: "var(--ds-background-brand-bold)", color: "var(--ds-text-inverse)", borderRadius: "var(--ds-radius-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", textDecoration: "none" }}
            >
              Add writing samples →
            </Link>
          ) : (
            <>
              <Link
                href="/onboarding/build-profile"
                style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 16px", border: "1px solid var(--ds-border)", borderRadius: "var(--ds-radius-100)", fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-medium)", color: "var(--ds-text)", textDecoration: "none", backgroundColor: "var(--ds-surface)" }}
              >
                Add more posts
              </Link>
              <RebuildButton />
            </>
          )}
        </div>
      </div>

      {/* Improvement banner — prompts rebuild after algorithm upgrade */}
      {!isSeed && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px", background: "var(--ds-background-discovery)", border: "1px solid var(--ds-border-discovery)", borderRadius: 8, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: "var(--ds-font-size-075)", fontWeight: "var(--ds-font-weight-semibold)", color: "var(--ds-text-discovery)" }}>
              ✦ Voice analysis engine upgraded
            </span>
            <span style={{ marginLeft: 8, fontSize: "var(--ds-font-size-075)", color: "var(--ds-text-subtle)" }}>
              Sentence rhythm, paragraph structure, and hook detection are now computed exactly from your posts. Rebuild to apply.
            </span>
          </div>
          <RebuildButton />
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <InfoBox
          label="Posts analysed"
          value={String(profile.post_count ?? 0)}
          sub={isSeed ? "No writing samples yet - add some in Sources" : "Writing samples in your fingerprint"}
        />
        <InfoBox label="Confidence" value={confidenceLabel} sub={confidenceSub} />
        <InfoBox label="Last built" value={lastBuilt} sub={isSeed ? "Profile built from questionnaire" : "Rebuild after adding new posts"} />
      </div>

      {/* Voice Strength - seed profiles only */}
      {isSeed && <VoiceStrengthWidget />}

      {/* DNA Display */}
      <VoiseDisplay profile={profile} />

    </div>
  );
}

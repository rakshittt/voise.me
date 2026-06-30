"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TRIAL_EXTENDED_EVENT } from "@/lib/trialEvents";

interface TrialBannerProps {
  initialInTrial: boolean;
  initialDaysLeft: number | null;
}

export function TrialBanner({ initialInTrial, initialDaysLeft }: TrialBannerProps) {
  const [daysLeft, setDaysLeft] = useState<number | null>(initialInTrial ? initialDaysLeft : null);
  const [justExtended, setJustExtended] = useState(false);

  useEffect(() => {
    // Initial value comes from the server (layout already fetched it) - only
    // re-fetch here when the trial is actually extended client-side.
    const onTrialExtended = () => {
      setJustExtended(true);
      fetch("/api/usage")
        .then((r) => r.json())
        .then((d) => {
          if (d.in_trial && typeof d.trial_days_remaining === "number") {
            setDaysLeft(d.trial_days_remaining);
          }
        })
        .catch(() => {});
      setTimeout(() => setJustExtended(false), 4000);
    };
    window.addEventListener(TRIAL_EXTENDED_EVENT, onTrialExtended);
    return () => window.removeEventListener(TRIAL_EXTENDED_EVENT, onTrialExtended);
  }, []);

  if (daysLeft === null) return null;

  const urgent = daysLeft <= 3;

  return (
    <div
      role="banner"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "var(--ds-space-100)",
        padding: "var(--ds-space-100) var(--ds-space-300)",
        backgroundColor: urgent ? "var(--ds-background-warning)" : "var(--ds-background-information)",
        borderBottom: `1px solid ${urgent ? "var(--ds-border-warning)" : "var(--ds-border-information)"}`,
        fontSize: "var(--ds-font-size-100)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--ds-space-100)" }}>
        {/* Status icon */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            color: urgent ? "var(--ds-icon-warning)" : "var(--ds-icon-information)",
          }}
        >
          {urgent ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span style={{ color: urgent ? "var(--ds-text-warning)" : "var(--ds-text-information)" }}>
          {daysLeft === 0
            ? "Your free trial ends today."
            : `Free trial: ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining - you have full Growth plan access.`}
        </span>

        {justExtended && (
          <span
            style={{
              fontWeight: "var(--ds-font-weight-semibold)",
              color: "var(--ds-text-success)",
            }}
          >
            +1 day for posting today
          </span>
        )}
      </div>

      <Link
        href="/dashboard/settings?upgrade=true"
        style={{
          display: "inline-block",
          padding: "var(--ds-space-025) var(--ds-space-150)",
          borderRadius: "var(--ds-radius-100)",
          fontSize: "var(--ds-font-size-075)",
          fontWeight: "var(--ds-font-weight-semibold)",
          backgroundColor: urgent
            ? "var(--ds-background-warning-bold)"
            : "var(--ds-background-brand-bold)",
          color: urgent ? "var(--ds-text-warning-inverse)" : "var(--ds-text-inverse)",
          textDecoration: "none",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        Upgrade
      </Link>
    </div>
  );
}

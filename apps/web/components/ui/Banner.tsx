"use client";

import AtlasBanner from "@atlaskit/banner";
import type { ReactNode } from "react";

type BannerAppearance = "announcement" | "error" | "warning";

interface BannerProps {
  children: ReactNode;
  appearance?: BannerAppearance;
  testId?: string;
}

/* Inline SVG icons styled to match ADS icon size */
const WarningIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H2.645c-1.73 0-2.813-1.874-1.948-3.374L10.05 3.378c.866-1.5 3.032-1.5 3.898 0l7.355 12.748zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const AnnouncementIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

const iconMap: Record<BannerAppearance, React.ReactElement> = {
  warning: <WarningIcon />,
  error: <ErrorIcon />,
  announcement: <AnnouncementIcon />,
};

export function Banner({ children, appearance = "announcement", testId }: BannerProps) {
  return (
    <AtlasBanner
      appearance={appearance}
      icon={iconMap[appearance]}
      testId={testId}
    >
      {children}
    </AtlasBanner>
  );
}

export default Banner;

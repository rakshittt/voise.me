"use client";

import AtlasProgressBar from "@atlaskit/progress-bar";

interface ProgressBarProps {
  value: number;
  isIndeterminate?: boolean;
  ariaLabel?: string;
  testId?: string;
}

export function ProgressBar({ value, isIndeterminate, ariaLabel, testId }: ProgressBarProps) {
  return (
    <AtlasProgressBar
      value={value}
      isIndeterminate={isIndeterminate}
      ariaLabel={ariaLabel ?? "Progress"}
      testId={testId}
    />
  );
}

export default ProgressBar;

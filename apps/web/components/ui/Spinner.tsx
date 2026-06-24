"use client";

import AtlasSpinner from "@atlaskit/spinner";

interface SpinnerProps {
  size?: "xsmall" | "small" | "medium" | "large" | "xlarge" | number;
  label?: string;
  delay?: number;
  appearance?: "inherit" | "invert";
  testId?: string;
}

export function Spinner({ size = "medium", label = "Loading", delay, appearance, testId }: SpinnerProps) {
  return (
    <AtlasSpinner
      size={size}
      label={label}
      delay={delay}
      appearance={appearance}
      testId={testId}
    />
  );
}

export default Spinner;

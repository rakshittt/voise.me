"use client";

import AtlasLozenge from "@atlaskit/lozenge";
import type { ReactNode } from "react";

type LozengeAppearance =
  | "default"
  | "inprogress"
  | "moved"
  | "new"
  | "removed"
  | "success";

interface LozengeProps {
  children: ReactNode;
  appearance?: LozengeAppearance;
  isBold?: boolean;
  maxWidth?: number | string;
  testId?: string;
}

/**
 * Maps semantic score levels to Lozenge appearances.
 * high → success, medium → moved (yellow), low → removed (red)
 */
export function scoreToAppearance(score: number): LozengeAppearance {
  if (score >= 85) return "success";
  if (score >= 70) return "inprogress";
  if (score >= 55) return "moved";
  return "removed";
}

export function Lozenge({ children, appearance = "default", isBold, maxWidth, testId }: LozengeProps) {
  return (
    <AtlasLozenge
      appearance={appearance}
      isBold={isBold}
      maxWidth={maxWidth}
      testId={testId}
    >
      {children}
    </AtlasLozenge>
  );
}

export default Lozenge;

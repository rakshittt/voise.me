"use client";

import AtlasBadge from "@atlaskit/badge";
import AtlasTag from "@atlaskit/tag";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  appearance?: "default" | "primary" | "important" | "added" | "removed";
  max?: number;
  testId?: string;
}

export function Badge({ children, appearance = "default", max, testId }: BadgeProps) {
  return (
    <AtlasBadge appearance={appearance} max={max} testId={testId}>
      {children}
    </AtlasBadge>
  );
}

interface TagProps {
  text: string;
  color?: "standard" | "blue" | "grey" | "red" | "yellow" | "teal" | "purple" | "green";
  isRemovable?: boolean;
  onBeforeRemoveAction?: () => boolean;
  href?: string;
  testId?: string;
}

export function Tag({ text, color = "standard", isRemovable, onBeforeRemoveAction, href, testId }: TagProps) {
  return (
    <AtlasTag
      text={text}
      color={color}
      isRemovable={isRemovable}
      onBeforeRemoveAction={onBeforeRemoveAction}
      href={href}
      testId={testId}
    />
  );
}

export default Badge;

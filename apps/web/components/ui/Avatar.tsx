"use client";

import AtlasAvatar from "@atlaskit/avatar";
import type { ReactNode } from "react";

type AvatarSize = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";
type AvatarAppearance = "circle" | "square";

interface AvatarProps {
  src?: string;
  name?: string;
  size?: AvatarSize;
  appearance?: AvatarAppearance;
  label?: string;
  presence?: "online" | "busy" | "focus" | "offline";
  status?: "approved" | "declined" | "locked";
  isDisabled?: boolean;
  children?: ReactNode;
  testId?: string;
}

export function Avatar({
  src,
  name,
  size = "medium",
  appearance = "circle",
  label,
  presence,
  status,
  isDisabled,
  testId,
}: AvatarProps) {
  return (
    <AtlasAvatar
      src={src}
      name={name}
      size={size}
      appearance={appearance}
      label={label ?? name}
      presence={presence}
      status={status}
      isDisabled={isDisabled}
      testId={testId}
    />
  );
}

export default Avatar;

"use client";

import AtlasButton from "@atlaskit/button";
import type { ReactNode, MouseEvent } from "react";

type Appearance = "primary" | "default" | "subtle" | "subtle-link" | "link" | "warning" | "danger";
type Spacing = "default" | "compact" | "none";

interface ButtonProps {
  children?: ReactNode;
  appearance?: Appearance;
  spacing?: Spacing;
  isDisabled?: boolean;
  isSelected?: boolean;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  shouldFitContainer?: boolean;
  autoFocus?: boolean;
  testId?: string;
  target?: string;
  overlay?: ReactNode;
}

export function Button({
  children,
  appearance = "default",
  spacing = "default",
  isDisabled,
  isSelected,
  iconBefore,
  iconAfter,
  href,
  type = "button",
  onClick,
  shouldFitContainer,
  autoFocus,
  testId,
  target,
  overlay,
}: ButtonProps) {
  const handleClick = onClick
    ? (e: MouseEvent<HTMLElement>) => onClick(e)
    : undefined;

  return (
    <AtlasButton
      appearance={appearance}
      spacing={spacing}
      isDisabled={isDisabled}
      isSelected={isSelected}
      iconBefore={iconBefore}
      iconAfter={iconAfter}
      href={href}
      type={type}
      onClick={handleClick}
      shouldFitContainer={shouldFitContainer}
      autoFocus={autoFocus}
      testId={testId}
      target={target}
      overlay={overlay}
    >
      {children}
    </AtlasButton>
  );
}

export default Button;

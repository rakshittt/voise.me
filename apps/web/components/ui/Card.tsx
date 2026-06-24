import type { ReactNode } from "react";

type CardElevation = "flat" | "raised" | "overlay";

interface CardProps {
  children: ReactNode;
  elevation?: CardElevation;
  padding?: "none" | "compact" | "default" | "comfortable";
  className?: string;
  testId?: string;
}

const paddingMap = {
  none: "",
  compact: "p-3",
  default: "p-5",
  comfortable: "p-6",
};

const elevationMap: Record<CardElevation, string> = {
  flat: "border border-[var(--ds-border)] bg-[var(--ds-surface)]",
  raised: "border border-[var(--ds-border)] bg-[var(--ds-surface-raised)] shadow-[var(--ds-shadow-raised)]",
  overlay: "border border-[var(--ds-border)] bg-[var(--ds-surface-overlay)] shadow-[var(--ds-shadow-overlay)]",
};

export function Card({
  children,
  elevation = "flat",
  padding = "default",
  className = "",
  testId,
}: CardProps) {
  return (
    <div
      data-testid={testId}
      className={`rounded-[var(--ds-radius-200)] ${elevationMap[elevation]} ${paddingMap[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

export default Card;

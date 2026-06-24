"use client";

import AtlasSectionMessage, {
  SectionMessageAction,
} from "@atlaskit/section-message";
import type { ReactNode } from "react";

type SectionMessageAppearance = "information" | "warning" | "error" | "success" | "discovery";

interface Action {
  text: string;
  onClick?: () => void;
  href?: string;
}

interface SectionMessageProps {
  title?: string;
  children: ReactNode;
  appearance?: SectionMessageAppearance;
  actions?: Action[];
  testId?: string;
}

export function SectionMessage({
  title,
  children,
  appearance = "information",
  actions,
  testId,
}: SectionMessageProps) {
  const actionElements = actions?.map((a) => (
    <SectionMessageAction
      key={a.text}
      onClick={a.onClick}
      href={a.href}
    >
      {a.text}
    </SectionMessageAction>
  ));

  return (
    <AtlasSectionMessage
      title={title}
      appearance={appearance}
      actions={actionElements}
      testId={testId}
    >
      {children}
    </AtlasSectionMessage>
  );
}

export default SectionMessage;

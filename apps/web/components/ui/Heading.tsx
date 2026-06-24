"use client";

import AtlasHeading from "@atlaskit/heading";
import type { ReactNode } from "react";

type HeadingSize = "xxlarge" | "xlarge" | "large" | "medium" | "small" | "xsmall" | "xxsmall";
type HeadingAs = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div" | "span";
/* Only 3 colors are supported by Atlaskit Heading - others must use inline style */
type HeadingColor = "color.text" | "color.text.inverse" | "color.text.warning.inverse";

interface HeadingProps {
  children: ReactNode;
  size?: HeadingSize;
  as?: HeadingAs;
  color?: HeadingColor;
  id?: string;
  testId?: string;
}

export function Heading({ children, size = "large", as, color, id, testId }: HeadingProps) {
  return (
    <AtlasHeading size={size} as={as} color={color} id={id} testId={testId}>
      {children}
    </AtlasHeading>
  );
}

export default Heading;

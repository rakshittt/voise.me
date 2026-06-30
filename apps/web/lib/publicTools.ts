export interface PublicTool {
  href: string;
  /** Short label for navbar/footer links */
  navLabel: string;
  /** Card / page heading */
  title: string;
  /** Card description, reused as the page meta description */
  description: string;
}

export const PUBLIC_TOOLS: PublicTool[] = [
  {
    href: "/write",
    navLabel: "Post Writer",
    title: "Post writer & preview",
    description:
      "Write and format your post with Bold/Italic, bullets, and emoji, then preview exactly how it looks on LinkedIn.",
  },
  {
    href: "/hook-checker",
    navLabel: "Hook Checker",
    title: "Hook checker",
    description: "Score your opening line against the patterns that earn the click on \"see more.\"",
  },
  {
    href: "/post-checker",
    navLabel: "Post Health Checker",
    title: "Post health checker",
    description:
      "Flag the common reach-killers - early links, hashtag overload, engagement bait - before you publish.",
  },
  {
    href: "/character-counter",
    navLabel: "Character Counter",
    title: "Character counter",
    description: "Track every LinkedIn field limit and preview where \"see more\" cuts off your post.",
  },
  {
    href: "/audit",
    navLabel: "Voice Audit",
    title: "Voice audit",
    description: "Paste a handful of your posts and get an instant snapshot of your hook style, structure, and tone.",
  },
];

export function getRelatedTools(currentHref: string): PublicTool[] {
  return PUBLIC_TOOLS.filter((tool) => tool.href !== currentHref);
}

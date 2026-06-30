export interface LinkedInFieldLimit {
  id: string;
  label: string;
  limit: number;
  description: string;
  /** Approximate "...see more" truncation point - LinkedIn doesn't publish exact thresholds and they vary by device/feed. */
  truncateAt?: number;
}

export const LINKEDIN_FIELD_LIMITS: LinkedInFieldLimit[] = [
  {
    id: "post",
    label: "Post",
    limit: 3000,
    description: "Main feed post body",
    truncateAt: 210,
  },
  {
    id: "headline",
    label: "Headline",
    limit: 220,
    description: "Profile headline under your name",
  },
  {
    id: "about",
    label: "About / Summary",
    limit: 2600,
    description: "Profile About section",
  },
  {
    id: "comment",
    label: "Comment",
    limit: 1250,
    description: "Comment on a post",
  },
  {
    id: "connection_note",
    label: "Connection request note",
    limit: 300,
    description: "Personalized note sent with a connection request",
  },
  {
    id: "article_title",
    label: "Article title",
    limit: 100,
    description: "Title for a published LinkedIn article",
  },
];

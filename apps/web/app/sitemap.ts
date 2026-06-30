import type { MetadataRoute } from "next";
import { PUBLIC_TOOLS } from "@/lib/publicTools";

const BASE_URL = "https://voise.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...PUBLIC_TOOLS.map((tool) => ({
      url: `${BASE_URL}${tool.href}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

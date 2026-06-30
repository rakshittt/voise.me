import type { Metadata } from "next";
import { WritePageClient } from "./WritePageClient";

export const metadata: Metadata = {
  title: "Free LinkedIn Post Writer & Preview | Voise",
  description:
    "Write and format your LinkedIn post with Bold/Italic, bullets, and emoji, then preview exactly how it looks before you publish. Free, no account needed.",
};

export default function WritePage() {
  return <WritePageClient />;
}

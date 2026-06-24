import { proxyPost } from "@/lib/api-client";

export async function POST() {
  return proxyPost("/voice-profile/rebuild", {});
}

import { proxyPost } from "@/lib/api-client";

export async function POST() {
  return proxyPost("/billing/portal", {});
}

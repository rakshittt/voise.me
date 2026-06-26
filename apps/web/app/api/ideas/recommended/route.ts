import { proxyGet } from "@/lib/api-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const refresh = searchParams.get("refresh") === "true";
  return proxyGet(`/ideas/recommended${refresh ? "?refresh=true" : ""}`);
}

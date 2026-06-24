import { proxyGet } from "@/lib/api-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit") ?? "20";
  const offset = searchParams.get("offset") ?? "0";
  return proxyGet(`/generate/history?limit=${limit}&offset=${offset}`);
}

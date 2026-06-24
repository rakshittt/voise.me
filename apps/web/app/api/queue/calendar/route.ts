import { proxyGet } from "@/lib/api-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";
  return proxyGet(`/queue/calendar?from=${from}&to=${to}`);
}

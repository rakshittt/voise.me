import { proxyGet, proxyPost } from "@/lib/api-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const unplannedOnly = searchParams.get("unplanned_only") ?? "false";
  return proxyGet(`/queue?unplanned_only=${unplannedOnly}`);
}

export async function POST(req: Request) {
  const body = await req.json();
  return proxyPost("/queue", body);
}

import { proxyGet } from "@/lib/api-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = searchParams.get("days") ?? "30";
  return proxyGet(`/admin/usage?days=${days}`);
}

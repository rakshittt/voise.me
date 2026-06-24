import { proxyGet } from "@/lib/api-client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const qs = searchParams.toString();
  return proxyGet(`/admin/users${qs ? `?${qs}` : ""}`);
}

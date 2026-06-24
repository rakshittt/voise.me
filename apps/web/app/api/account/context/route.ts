import { proxyGet, proxyPut } from "@/lib/api-client";

export async function GET() {
  return proxyGet("/account/context");
}

export async function PUT(req: Request) {
  const body = await req.json();
  return proxyPut("/account/context", body);
}

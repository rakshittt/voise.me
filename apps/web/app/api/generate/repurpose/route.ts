import { proxyPost } from "@/lib/api-client";

export async function POST(req: Request) {
  const body = await req.json();
  return proxyPost("/generate/repurpose", body);
}

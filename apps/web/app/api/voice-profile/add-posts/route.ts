import { proxyPut } from "@/lib/api-client";

export async function PUT(req: Request) {
  const body = await req.json();
  return proxyPut("/voice-profile/add-posts", body);
}

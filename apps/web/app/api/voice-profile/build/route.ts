import { proxyPost } from "@/lib/api-client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return proxyPost("/voice-profile/build", body);
  } catch {
    return Response.json({ detail: "Service temporarily unavailable" }, { status: 503 });
  }
}

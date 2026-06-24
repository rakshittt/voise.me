import { auth } from "@clerk/nextjs/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const { getToken } = await auth();
  const token = await getToken();

  // Forward multipart form data directly - do NOT set Content-Type;
  // the browser adds it automatically with the correct boundary.
  const formData = await req.formData();

  try {
    const res = await fetch(`${API_URL}/voice-profile/parse-linkedin-export`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json().catch(() => ({ detail: res.statusText }));
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json({ detail: "Service temporarily unavailable" }, { status: 503 });
  }
}

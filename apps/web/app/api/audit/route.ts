const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const res = await fetch(`${API_URL}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    return Response.json(data ?? { detail: res.statusText }, { status: res.status });
  } catch {
    return Response.json({ detail: "Service temporarily unavailable" }, { status: 503 });
  }
}

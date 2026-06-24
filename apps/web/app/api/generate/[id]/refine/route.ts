import { proxyPost } from "@/lib/api-client";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyPost(`/generate/${id}/refine`, body);
}

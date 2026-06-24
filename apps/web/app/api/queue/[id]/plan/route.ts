import { proxyPatch } from "@/lib/api-client";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  return proxyPatch(`/queue/${id}/plan`, body);
}

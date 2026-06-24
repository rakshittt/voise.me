import { proxyDelete } from "@/lib/api-client";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyDelete(`/queue/${id}`);
}

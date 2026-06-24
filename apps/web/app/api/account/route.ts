import { proxyDelete } from "@/lib/api-client";

export async function DELETE() {
  return proxyDelete("/account");
}

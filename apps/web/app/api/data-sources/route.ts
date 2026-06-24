import { proxyGet } from "@/lib/api-client";

export async function GET() {
  return proxyGet("/data-sources");
}

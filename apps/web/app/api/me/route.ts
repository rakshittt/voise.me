import { currentUser } from "@clerk/nextjs/server";
import { apiClient } from "@/lib/api-client";

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Trigger user creation in our DB by calling any protected endpoint
  // We get plan info from the usage summary
  let usage = null;
  try {
    usage = await apiClient.get("/usage/summary");
  } catch {
    // Not fatal
  }

  return Response.json({
    name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    email: user.emailAddresses[0]?.emailAddress ?? "",
    ...((usage as Record<string, unknown>) ?? {}),
  });
}

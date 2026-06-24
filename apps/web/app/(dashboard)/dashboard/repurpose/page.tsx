import { redirect } from "next/navigation";

export default function RepurposePage() {
  redirect("/dashboard/write?mode=repurpose");
}

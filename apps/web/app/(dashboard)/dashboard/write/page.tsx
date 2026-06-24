import { Suspense } from "react";
import { WritePage } from "@/components/generation/WritePage";
import { Spinner } from "@/components/ui/Spinner";

export default function WritePageRoute() {
  return (
    <Suspense fallback={<div style={{ display: "flex", justifyContent: "center", padding: "var(--ds-space-800)" }}><Spinner size="large" /></div>}>
      <WritePage />
    </Suspense>
  );
}

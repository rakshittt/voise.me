"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function QuickGenerate() {
  const router = useRouter();
  const [idea, setIdea] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (idea.trim().length < 10) return;
    const params = new URLSearchParams({ idea: idea.trim() });
    router.push(`/dashboard/write?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "var(--ds-space-100)", alignItems: "flex-end" }}>
      <div style={{ flex: 1 }}>
        <TextField
          placeholder="Describe your post idea..."
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          maxLength={500}
        />
      </div>
      <Button
        type="submit"
        appearance="primary"
        isDisabled={idea.trim().length < 10}
      >
        Generate
      </Button>
    </form>
  );
}

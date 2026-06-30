"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { VoiseLogo } from "@/components/ui/VoiseLogo";
import { PUBLIC_TOOLS } from "@/lib/publicTools";

function ToolsDropdown() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ds-space-050)",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--ds-font-size-100)",
          color: "var(--ds-text-subtle)",
          padding: 0,
          fontFamily: "inherit",
        }}
      >
        Free tools
        <span style={{ fontSize: 10, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.1s" }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            left: 0,
            zIndex: 50,
            width: 260,
            background: "var(--ds-surface)",
            border: "1px solid var(--ds-border)",
            borderRadius: "var(--ds-radius-200)",
            boxShadow: "var(--ds-shadow-overlay, 0 4px 20px rgba(0,0,0,0.10))",
            padding: "var(--ds-space-100)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--ds-space-025)",
          }}
        >
          {PUBLIC_TOOLS.map((tool) => {
            const active = pathname === tool.href;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "var(--ds-space-100) var(--ds-space-150)",
                  borderRadius: "var(--ds-radius-100)",
                  textDecoration: "none",
                  fontSize: "var(--ds-font-size-100)",
                  fontWeight: active ? "var(--ds-font-weight-semibold)" : "normal",
                  color: active ? "var(--ds-text-brand)" : "var(--ds-text)",
                  background: active ? "var(--ds-background-brand-subtle)" : "transparent",
                }}
              >
                {tool.navLabel}
              </Link>
            );
          })}
          <div style={{ borderTop: "1px solid var(--ds-border)", margin: "var(--ds-space-050) 0" }} />
          <Link
            href="/tools"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              padding: "var(--ds-space-100) var(--ds-space-150)",
              borderRadius: "var(--ds-radius-100)",
              textDecoration: "none",
              fontSize: "var(--ds-font-size-075)",
              color: "var(--ds-text-subtlest)",
            }}
          >
            View all free tools →
          </Link>
        </div>
      )}
    </div>
  );
}

export function PublicToolHeader() {
  const { user } = useUser();

  return (
    <header
      style={{
        background: "var(--ds-surface)",
        borderBottom: "1px solid var(--ds-border)",
        padding: "var(--ds-space-150) var(--ds-space-300)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link href="/" style={{ textDecoration: "none" }}>
        <VoiseLogo markSize={24} fontSize={14} fontWeight={800} letterSpacing="-0.03em" gap={7} />
      </Link>
      <div style={{ display: "flex", gap: "var(--ds-space-300)", alignItems: "center" }}>
        <ToolsDropdown />
        {user ? (
          <Link
            href="/dashboard"
            style={{
              fontSize: "var(--ds-font-size-100)",
              padding: "var(--ds-space-075) var(--ds-space-200)",
              background: "var(--ds-background-brand-bold)",
              color: "var(--ds-text-inverse)",
              fontWeight: "var(--ds-font-weight-semibold)",
              borderRadius: "var(--ds-radius-100)",
              textDecoration: "none",
            }}
          >
            Dashboard →
          </Link>
        ) : (
          <div style={{ display: "flex", gap: "var(--ds-space-150)", alignItems: "center" }}>
            <Link href="/sign-in" style={{ fontSize: "var(--ds-font-size-100)", color: "var(--ds-text-subtle)", textDecoration: "none" }}>
              Sign in
            </Link>
            <Link
              href="/sign-up"
              style={{
                fontSize: "var(--ds-font-size-100)",
                padding: "var(--ds-space-075) var(--ds-space-200)",
                background: "var(--ds-background-brand-bold)",
                color: "var(--ds-text-inverse)",
                fontWeight: "var(--ds-font-weight-semibold)",
                borderRadius: "var(--ds-radius-100)",
                textDecoration: "none",
              }}
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Avatar } from "@/components/ui/Avatar";
import { VoiseLogo } from "@/components/ui/VoiseLogo";

/* ── Icon set - ADS icon style ────────────────────────────────────────────── */

function HomeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
    </svg>
  );
}

function RepurposeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function DNAMatchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
    </svg>
  );
}

function VoiseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function IdeasIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SourcesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h16M4 18h7" />
      <circle cx="18" cy="18" r="3" />
      <path d="M18 15v3M15 18h3" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

/* ── Navigation config ─────────────────────────────────────────────────────── */

type NavItem = {
  href: string;
  label: string;
  Icon: () => React.ReactElement;
};

const MAIN_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
];

const CREATE_ITEMS: NavItem[] = [
  { href: "/dashboard/write", label: "Write", Icon: GenerateIcon },
];

const LIBRARY_ITEMS: NavItem[] = [
  { href: "/dashboard/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/dashboard/ideas", label: "Ideas", Icon: IdeasIcon },
  { href: "/dashboard/history", label: "History", Icon: HistoryIcon },
];

const VOICE_ITEMS: NavItem[] = [
  { href: "/dashboard/voice-dna", label: "Voice DNA", Icon: VoiseIcon },
  { href: "/dashboard/sources", label: "Sources", Icon: SourcesIcon },
  { href: "/dashboard/profile", label: "Profile", Icon: ProfileIcon },
];

const MOBILE_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", Icon: HomeIcon },
  { href: "/dashboard/write", label: "Write", Icon: GenerateIcon },
  { href: "/dashboard/calendar", label: "Calendar", Icon: CalendarIcon },
  { href: "/dashboard/ideas", label: "Ideas", Icon: IdeasIcon },
  { href: "/dashboard/voice-dna", label: "Voice", Icon: VoiseIcon },
];

/* ── Sub-components ────────────────────────────────────────────────────────── */

function NavSection({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: "var(--ds-space-200) var(--ds-space-150) var(--ds-space-050)",
        fontSize: "var(--ds-font-size-075)",
        fontWeight: "var(--ds-font-weight-semibold)",
        color: "var(--ds-text-subtlest)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        userSelect: "none",
      }}
    >
      {label}
    </div>
  );
}

function NavLink({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--ds-space-100)",
        padding: "var(--ds-space-075) var(--ds-space-150)",
        borderRadius: "var(--ds-radius-100)",
        fontSize: "var(--ds-font-size-100)",
        fontWeight: active ? "var(--ds-font-weight-semibold)" : "var(--ds-font-weight-regular)",
        color: active ? "var(--ds-text-selected)" : "var(--ds-text-subtle)",
        backgroundColor: active ? "var(--ds-background-selected)" : "transparent",
        textDecoration: "none",
        transition: "background-color 0.1s, color 0.1s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "var(--ds-background-neutral-hovered)";
          (e.currentTarget as HTMLElement).style.color = "var(--ds-text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--ds-text-subtle)";
        }
      }}
    >
      {/* Selected indicator */}
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "var(--ds-space-050)",
            bottom: "var(--ds-space-050)",
            width: 3,
            borderRadius: "0 var(--ds-radius-050) var(--ds-radius-050) 0",
            backgroundColor: "var(--ds-background-brand-bold)",
          }}
        />
      )}
      <span style={{ color: active ? "var(--ds-icon-selected)" : "var(--ds-icon-subtle)", display: "flex" }}>
        <Icon />
      </span>
      <span>{label}</span>
    </Link>
  );
}

function UserSection() {
  const { user } = useUser();
  if (!user) return null;

  const name = user.fullName ?? user.firstName ?? "You";
  const plan = (user.publicMetadata?.plan as string | undefined) ?? "Free trial";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--ds-space-100)",
        padding: "var(--ds-space-150)",
        borderRadius: "var(--ds-radius-100)",
        backgroundColor: "var(--ds-surface-sunken)",
        border: "1px solid var(--ds-border)",
      }}
    >
      <Avatar src={user.imageUrl} name={name} size="small" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "var(--ds-font-size-100)",
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontSize: "var(--ds-font-size-075)",
            color: "var(--ds-text-subtle)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {plan}
        </p>
      </div>
    </div>
  );
}

/* ── Sidebar component ─────────────────────────────────────────────────────── */

export function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    // Write covers both /dashboard/write (idea mode) and the old /generate /repurpose paths
    if (href === "/dashboard/write") {
      return pathname.startsWith("/dashboard/write") ||
        pathname.startsWith("/dashboard/generate") ||
        pathname.startsWith("/dashboard/repurpose");
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside
        className="hidden md:flex flex-col"
        style={{
          width: "var(--ads-nav-width)",
          flexShrink: 0,
          borderRight: "1px solid var(--ds-border)",
          backgroundColor: "var(--ds-surface)",
          height: "100vh",
          overflowY: "auto",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "var(--ds-space-200) var(--ds-space-200) var(--ds-space-150)",
            borderBottom: "1px solid var(--ds-border)",
          }}
        >
          <VoiseLogo markSize={28} fontSize="var(--ds-font-size-200)" fontWeight="var(--ds-font-weight-bold)" letterSpacing="-0.02em" gap={8} />
        </div>

        {/* Navigation items */}
        <nav style={{ flex: 1, padding: "var(--ds-space-100)" }}>
          {MAIN_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}

          <NavSection label="Create" />
          {CREATE_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}

          <NavSection label="Library" />
          {LIBRARY_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}

          <NavSection label="Voice" />
          {VOICE_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </nav>

        {/* Bottom: Settings + User */}
        <div style={{ padding: "var(--ds-space-100)", borderTop: "1px solid var(--ds-border)" }}>
          <NavLink href="/dashboard/settings" label="Settings" Icon={SettingsIcon} active={isActive("/dashboard/settings")} />
          <div style={{ marginTop: "var(--ds-space-100)" }}>
            <UserSection />
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar ────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex items-center justify-around"
        style={{
          height: 56,
          backgroundColor: "var(--ds-surface)",
          borderTop: "1px solid var(--ds-border)",
          zIndex: 200,
          padding: "0 var(--ds-space-050)",
        }}
      >
        {MOBILE_ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "var(--ds-space-025)",
                padding: "var(--ds-space-100) var(--ds-space-100)",
                borderRadius: "var(--ds-radius-100)",
                color: active ? "var(--ds-text-selected)" : "var(--ds-icon-subtle)",
                textDecoration: "none",
                minWidth: 52,
              }}
            >
              <span style={{ display: "flex" }}><Icon /></span>
              <span style={{ fontSize: "var(--ds-font-size-050)", fontWeight: active ? "var(--ds-font-weight-semibold)" : "var(--ds-font-weight-regular)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

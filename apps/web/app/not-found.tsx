import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
        backgroundColor: "var(--ds-background-neutral-subtle)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <span style={{ fontSize: 72, fontWeight: 900, color: "var(--ds-text-subtlest)", letterSpacing: "-0.05em", lineHeight: 1 }}>404</span>
        </div>
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 800, color: "var(--ds-text)", letterSpacing: "-0.03em" }}>
            Page not found
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "var(--ds-text-subtle)", lineHeight: 1.6 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/dashboard"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              backgroundColor: "var(--ds-background-brand-bold)",
              color: "var(--ds-text-inverse)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Go to dashboard
          </Link>
          <Link
            href="/"
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1.5px solid var(--ds-border)",
              color: "var(--ds-text)",
              fontWeight: 600,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

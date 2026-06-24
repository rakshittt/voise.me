import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--ds-background-neutral-subtle)" }}>
      <SignUp forceRedirectUrl="/onboarding/welcome" />
    </div>
  );
}

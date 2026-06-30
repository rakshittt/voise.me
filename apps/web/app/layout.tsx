import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

// Display / headline font - maps to Cohere's CohereText aesthetic
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Brand logo wordmark
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Technical / score labels - maps to Cohere's CohereMono
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://voise.me"),
  title: {
    default: "Voise - LinkedIn content that sounds like you",
    template: "%s",
  },
  description:
    "Learn your voice fingerprint. Generate posts that are indistinguishable from your authentic writing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`h-full antialiased ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${outfit.variable}`}>
        <body
          className="min-h-full flex flex-col"
          style={{ fontFamily: "var(--font-inter), Inter, sans-serif" }}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

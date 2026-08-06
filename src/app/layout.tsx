import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Derive a valid metadataBase URL from environment variables.
 * Handles empty strings, undefined, and missing values gracefully.
 * Vercel sets VERCEL_URL automatically during builds.
 */
function resolveMetadataBase(): URL {
  const appUrl = process.env.APP_URL;
  if (appUrl && appUrl.length > 0) return new URL(appUrl);

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && vercelUrl.length > 0) return new URL(`https://${vercelUrl}`);

  return new URL("http://localhost:3000");
}

/**
 * Root metadata — environment-safe, complete, no private data.
 *
 * - Title template: "%s — RescueLoop" for route-specific titles
 * - Default title uses the canonical category line (not "revenue-recovery")
 * - metadataBase derived from APP_URL env var (safe for preview/local)
 * - OG and Twitter images point to canonical brand assets
 * - No private company/student/course data in share metadata
 */
export const metadata: Metadata = {
  title: {
    default: "RescueLoop — Activation rescue for Whop creators",
    template: "%s — RescueLoop",
  },
  description:
    "Find paying members who never started, approve respectful outreach, and see what changed.",
  metadataBase: resolveMetadataBase(),
  openGraph: {
    title: "RescueLoop — Activation rescue for Whop creators",
    description:
      "Find paying members who never started, approve respectful outreach, and see what changed.",
    type: "website",
    siteName: "RescueLoop",
    images: [
      {
        url: "/brand/og-default-1200x630.png",
        width: 1200,
        height: 630,
        alt: "RescueLoop — Activation rescue for Whop creators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RescueLoop — Activation rescue for Whop creators",
    description:
      "Find paying members who never started, approve respectful outreach, and see what changed.",
    images: [
      {
        url: "/brand/twitter-default-1200x630.png",
        alt: "RescueLoop — Activation rescue for Whop creators",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/brand/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/brand-manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

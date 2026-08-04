import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RescueLoop — Recover more value from the members you already have",
  description:
    "RescueLoop helps Whop course creators detect members who never started, stopped progressing, or may cancel — and send respectful, high-signal recovery interventions.",
  keywords: [
    "RescueLoop",
    "Whop",
    "course creators",
    "student success",
    "retention",
    "revenue recovery",
  ],
  authors: [{ name: "RescueLoop" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

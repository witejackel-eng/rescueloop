import type { Metadata } from "next";

/**
 * Student layout — quiet brand identity, noindex, student-safe language.
 *
 * Student-facing surfaces must never expose private record details
 * in metadata, and must never be indexed by search engines.
 */
export const metadata: Metadata = {
  title: "Continue",
  description: "Pick up where you left off.",
  robots: { index: false, follow: false },
};

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-[var(--canvas)]">
      {children}
    </div>
  );
}

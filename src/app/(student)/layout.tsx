import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Continue — RescueLoop",
  description: "Pick up where you left off.",
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

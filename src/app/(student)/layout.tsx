import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Continue learning — Agency Growth System",
  description: "Pick up where you left off. Your progress is always saved.",
};

/**
 * Student-facing layout.
 *
 * Intentionally minimal and calm — NO app header, NO navigation,
 * NO notifications, NO dashboard chrome. Just a clean centered
 * column with breathing room and a quiet footer.
 *
 * The background (#F8F8F5) is warmer and softer than the dashboard
 * surface (#F4F4F1) so the experience feels distinct and friendly.
 */
export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen flex-col bg-[#F8F8F5] text-[#171A17]"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-8 sm:px-6">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-md px-5 pb-8 sm:px-6">
        <div className="flex items-center justify-center gap-2 text-center">
          <span className="text-[13px] text-[#6A706A]">
            Part of Agency Growth System
          </span>
          <span className="text-[#E3E5DF]" aria-hidden>
            ·
          </span>
          <span className="text-[13px] font-medium tracking-tight text-[#147D68]">
            RescueLoop
          </span>
        </div>
      </footer>
    </div>
  );
}

import { InternalAuthGate } from "@/components/internal/internal-auth-gate";
import { InternalSidebar } from "@/components/internal/internal-sidebar";
import { MobileNav } from "@/components/internal/mobile-nav";

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <InternalAuthGate>
      <div className="min-h-screen bg-background">
        <InternalSidebar />
        {/* Mobile top bar */}
        <div className="md:hidden flex h-14 items-center border-b px-4 gap-2">
          <MobileNav />
        </div>
        <main className="md:pl-64">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </InternalAuthGate>
  );
}

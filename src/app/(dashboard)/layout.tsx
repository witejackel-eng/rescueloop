import { AppShell } from "@/components/layout/app-shell";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      {children}
      <Sonner position="bottom-right" richColors closeButton />
    </AppShell>
  );
}

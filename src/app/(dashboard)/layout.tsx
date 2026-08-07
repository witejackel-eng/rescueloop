import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell>
      {children}
      <Sonner position="bottom-right" />
    </WorkspaceShell>
  );
}

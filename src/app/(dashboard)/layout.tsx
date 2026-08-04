import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { CommandPalette } from "@/components/interaction/command-palette";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkspaceShell>
      {children}
      <CommandPalette />
      <Sonner position="bottom-right" />
    </WorkspaceShell>
  );
}

import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { CommandPalette } from "@/components/interaction/command-palette";
import { Toaster as Sonner } from "@/components/ui/sonner";

/**
 * Dashboard layout — demo workspace, noindex.
 *
 * Demo and connected workspace surfaces must not be indexed.
 * They contain private company and student data that must not
 * appear in search results.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

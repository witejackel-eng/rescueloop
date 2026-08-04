// Shared layout for Whop company dashboard routes.
//
// These routes live at /companies/[companyId]/... and are database-backed
// (real Whop auth + Prisma). They reuse the WorkspaceShell from the demo
// dashboard so the visual language stays consistent.
//
// Note: the WorkspaceShell's nav links point at the demo routes (/overview,
// /rescue-queue, etc.) which remain untouched per the brief. Company-scoped
// routes are reached directly via their URLs.

import { WorkspaceShell } from "@/components/shell/workspace-shell";
import { CommandPalette } from "@/components/interaction/command-palette";
import { Toaster as Sonner } from "@/components/ui/sonner";

export default function CompanyLayout({
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

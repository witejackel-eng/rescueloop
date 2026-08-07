"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RescueLoopMark } from "@/components/brand/logo";
import {
  LayoutDashboard,
  Building2,
  RefreshCw,
  Clock,
  MailWarning,
  Webhook,
  Users,
  Gauge,
  FileDown,
  ShieldCheck,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/internal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/internal/organisations", label: "Organisations", icon: Building2 },
  { href: "/internal/sync", label: "Sync Failures", icon: RefreshCw },
  { href: "/internal/jobs", label: "Jobs", icon: Clock },
  { href: "/internal/dead-letters", label: "Dead Letters", icon: MailWarning },
  { href: "/internal/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/internal/pilots", label: "Pilot Applications", icon: Users },
  { href: "/internal/usage", label: "Usage", icon: Gauge },
  { href: "/internal/data-requests", label: "Data Requests", icon: FileDown },
] as const;

export function InternalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-muted/30">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <RescueLoopMark size={20} decorative />
        <span className="font-semibold text-sm">RescueLoop</span>
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider bg-amber-100 text-amber-800">Internal</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/internal"
                ? pathname === "/internal"
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

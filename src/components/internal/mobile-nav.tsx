"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Menu,
  LayoutDashboard,
  Building2,
  RefreshCw,
  Clock,
  MailWarning,
  Webhook,
  Users,
  Gauge,
  FileDown,
} from "lucide-react";

const MOBILE_NAV = [
  { href: "/internal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/internal/organisations", label: "Organisations", icon: Building2 },
  { href: "/internal/sync", label: "Sync", icon: RefreshCw },
  { href: "/internal/jobs", label: "Jobs", icon: Clock },
  { href: "/internal/dead-letters", label: "Dead Letters", icon: MailWarning },
  { href: "/internal/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/internal/pilots", label: "Pilots", icon: Users },
  { href: "/internal/usage", label: "Usage", icon: Gauge },
  { href: "/internal/data-requests", label: "Data Requests", icon: FileDown },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <nav className="mt-6 space-y-1">
          {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/internal"
                ? pathname === "/internal"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

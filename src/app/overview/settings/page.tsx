// /overview/settings — public demo of the settings view.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Renders a simulated settings overview.

import "server-only";
import Link from "next/link";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bell, Zap, Users, ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

const SETTINGS_SECTIONS = [
  { label: "Workspace", icon: Settings, description: "General workspace preferences and display options." },
  { label: "Automation", icon: Zap, description: "Approval mode, quiet hours, cooldowns." },
  { label: "Notifications", icon: Bell, description: "When and how you receive alerts." },
  { label: "Team", icon: Users, description: "Invite team members and manage roles." },
  { label: "Safety & Data", icon: ShieldCheck, description: "Student opt-out, data retention, export." },
] as const;

export default function OverviewSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Settings · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated settings view. No changes are persisted.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SETTINGS_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 font-serif text-base">
                  <Icon className="size-4 text-[var(--ink-muted)]" />
                  {s.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-[13px] text-[var(--ink-secondary)]">
                {s.description}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6">
        <Link
          href="/overview/settings/health"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--recovery-green)] hover:underline"
        >
          View system health demo <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

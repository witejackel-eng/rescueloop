// /overview/settings/health — public demo of the system health view.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Uses the client-side health store with demo data.

import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { SystemHealthPage } from "@/components/rescueloop/health/system-health-page";

export const dynamic = "force-dynamic";

export default function OverviewSettingsHealthPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          System Health · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated system health dashboard. Status indicators are
          illustrative and do not reflect real infrastructure.
        </p>
      </div>

      <SystemHealthPage />
    </div>
  );
}

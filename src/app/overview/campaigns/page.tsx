// /overview/campaigns — public demo of the campaigns view.
//
// Same isolation invariants as /overview: no auth, no DB, no API calls,
// no mutations. Reads from fixture providers.

import "server-only";
import { DemoDisclosureBanner } from "@/components/rescueloop/overview/demo-disclosure-banner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

// Illustrative demo campaigns — not from a real API.
const DEMO_CAMPAIGNS = [
  { id: "camp_1", name: "Activation Rescue", type: "activation_rescue", status: "active", sent: 12, responses: 3 },
  { id: "camp_2", name: "Mid-Course Nudge", type: "mid_course_rescue", status: "paused", sent: 8, responses: 1 },
  { id: "camp_3", name: "Near-Finish Encouragement", type: "near_finish_rescue", status: "draft", sent: 0, responses: 0 },
] as const;

export default function OverviewCampaignsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <DemoDisclosureBanner />

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-serif text-3xl text-[var(--ink-primary)]">
          Campaigns · Demo
        </h1>
        <p className="text-[14px] text-[var(--ink-secondary)]">
          A simulated campaign list. No messages are sent — these are
          illustrative campaign configurations.
        </p>
      </div>

      <div className="grid gap-4">
        {DEMO_CAMPAIGNS.map((c) => (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-serif text-base">
                <Megaphone className="size-4 text-[var(--ink-muted)]" />
                {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">Type</span>
                <span className="font-mono text-[var(--ink-primary)]">{c.type.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">Status</span>
                <span className="font-mono text-[var(--ink-primary)]">{c.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">Simulated sends</span>
                <span className="font-mono tabular-nums text-[var(--ink-primary)]">{c.sent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--ink-secondary)]">Simulated responses</span>
                <span className="font-mono tabular-nums text-[var(--ink-primary)]">{c.responses}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

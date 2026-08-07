"use client";

// ─────────────────────────────────────────────────────────────
// PX05 — Rate Card Viewer
// Display current + historical rate card versions.
// ─────────────────────────────────────────────────────────────

import { useState, type FC } from "react";
import { RATE_CARD, getVersionEntry } from "@/lib/cost/rate-card";
import type { RateCardVersion } from "@/lib/types/cost";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function RateVersionCard({ version, isCurrent }: { version: RateCardVersion; isCurrent: boolean }) {
  const r = version.rates;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-[var(--ink-primary)]">
          v{version.version}
        </span>
        <span className="text-[11px] text-[var(--ink-muted)]">
          Effective {version.effectiveDate}
        </span>
        {isCurrent && <Badge variant="default" className="text-[9px]">Current</Badge>}
      </div>
      <p className="text-[11px] text-[var(--ink-secondary)]">{version.description}</p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-[11px]">
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Per member/mo</span>
          <span className="font-mono tabular-nums">${r.costPerMember.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Per 1K events</span>
          <span className="font-mono tabular-nums">${r.costPerThousandEvents.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Per job</span>
          <span className="font-mono tabular-nums">${r.costPerJob.toFixed(3)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Per provider call</span>
          <span className="font-mono tabular-nums">${r.costPerProviderCall.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Payment rate</span>
          <span className="font-mono tabular-nums">{(r.paymentProcessingRate * 100).toFixed(1)}% + ${r.paymentProcessingFixed.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Base infra/mo</span>
          <span className="font-mono tabular-nums">${r.baseInfrastructureCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Support/member/mo</span>
          <span className="font-mono tabular-nums">${r.supportCostPerMember.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ink-muted)]">Est. txns/mo</span>
          <span className="font-mono tabular-nums">{r.estimatedTransactionsPerMonth}</span>
        </div>
      </div>
    </div>
  );
}

export const RateCardViewer: FC = () => {
  const [selectedVersion, setSelectedVersion] = useState<number>(RATE_CARD.current.version);

  const selected = getVersionEntry(selectedVersion) ?? RATE_CARD.current;

  return (
    <Card className="border border-[var(--hairline)]">
      <CardHeader>
        <CardTitle className="text-[13px] font-semibold">Rate Card Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={String(selectedVersion)}
          onValueChange={(v) => setSelectedVersion(Number(v))}
        >
          <TabsList className="mb-3">
            {RATE_CARD.history.map((v) => (
              <TabsTrigger key={v.version} value={String(v.version)} className="text-[11px]">
                v{v.version}
              </TabsTrigger>
            ))}
          </TabsList>

          {RATE_CARD.history.map((v) => (
            <TabsContent key={v.version} value={String(v.version)}>
              <RateVersionCard
                version={v}
                isCurrent={v.version === RATE_CARD.current.version}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* Always show selected version details */}
        {RATE_CARD.history.every((v) => v.version !== selectedVersion) && (
          <RateVersionCard version={selected} isCurrent={true} />
        )}
      </CardContent>
    </Card>
  );
};

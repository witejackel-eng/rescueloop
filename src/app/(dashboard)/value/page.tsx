import {
  Clock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  OutcomeCard,
  PageHeader,
  SectionHeader,
} from "@/components/shared/layout-primitives";
import { KPIS } from "@/lib/mock-data";

import { ValueSummaryCards } from "@/components/rescueloop/value/value-summary-cards";
import { RoiCard } from "@/components/rescueloop/value/roi-card";
import { LedgerTable } from "@/components/rescueloop/value/ledger-table";
import { AttributionMethodology } from "@/components/rescueloop/value/attribution-methodology";

export default function ValueLedgerPage() {
  return (
    <>
      {/* 1. Page header */}
      <PageHeader
        title="Value Ledger"
        description="Recovered revenue, clearly attributed"
      />

      {/* 2. Three-tier value summary (the most important section) */}
      <ValueSummaryCards />

      {/* 3. ROI card (confirmed value only) */}
      <div className="mt-6">
        <SectionHeader
          title="Return on plan cost"
          description="Based on confirmed recovered value only"
        />
        <RoiCard />
      </div>

      {/* 4. Additional metrics row */}
      <div className="mt-6">
        <SectionHeader
          title="Outcome metrics"
          description="Headline outcomes behind the recovered revenue"
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OutcomeCard
            label="Students re-engaged"
            value={KPIS.studentsReengaged}
            icon={ShieldCheck}
            accent="success"
            sublabel="Returned after an intervention"
          />
          <OutcomeCard
            label="First-time activations"
            value={KPIS.firstTimeActivations}
            icon={Sparkles}
            accent="info"
            sublabel="First lesson completed"
          />
          <OutcomeCard
            label="Cancellations reversed"
            value={KPIS.cancellationsReversed}
            icon={RotateCcw}
            accent="teal"
            sublabel="After a cancellation-rescue message"
          />
          <OutcomeCard
            label="Creator actions avoided"
            value={KPIS.creatorActionsAvoided}
            icon={Clock}
            accent="warning"
            sublabel="Manual checks automated away"
          />
        </div>
      </div>

      {/* 5. Value ledger table */}
      <div className="mt-8">
        <SectionHeader
          title="Value ledger"
          description="Every value event with its attribution level and evidence"
        />
        <LedgerTable />
      </div>

      {/* 6. Attribution methodology */}
      <div className="mt-6">
        <AttributionMethodology />
      </div>
    </>
  );
}

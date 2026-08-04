import { AlertCircle, DollarSign, ShieldCheck, Zap } from "lucide-react";
import {
  PageHeader,
  OutcomeCard,
  SectionHeader,
} from "@/components/shared/layout-primitives";
import { AutomationStatePill } from "@/components/shared/status-pills";
import { KPIS, AUTOMATION_STATE, COURSE } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/format";

import { RecoveryFunnel } from "@/components/rescueloop/overview/recovery-funnel";
import { RiskSegments } from "@/components/rescueloop/overview/risk-segments";
import { FrictionFindingCard } from "@/components/rescueloop/overview/friction-finding-card";
import { AttentionPanel } from "@/components/rescueloop/overview/attention-panel";
import { ActivityFeed } from "@/components/rescueloop/overview/activity-feed";
import { WeeklyTrendChart } from "@/components/rescueloop/overview/weekly-trend-chart";

export default function OverviewPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 lg:px-6 lg:py-8">
      {/* 1. Page header */}
      <PageHeader
        title="Overview"
        description={`Recovery performance for ${COURSE.name}`}
        actions={
          <AutomationStatePill state={AUTOMATION_STATE} />
        }
      />

      {/* 2. Four primary outcome cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OutcomeCard
          label="Confirmed value recovered"
          value={formatCurrency(KPIS.confirmedRecoveredRevenue)}
          icon={DollarSign}
          accent="teal"
          trend="↑ $79 this week"
          trendDirection="up"
          sublabel="Confirmed recoveries only"
        />
        <OutcomeCard
          label="Students rescued"
          value={KPIS.studentsReengaged}
          icon={ShieldCheck}
          accent="success"
          trend="↑ 4 this week"
          trendDirection="up"
          sublabel="Returned after intervention"
        />
        <OutcomeCard
          label="Activated members"
          value={KPIS.firstTimeActivations}
          icon={Zap}
          accent="info"
          trend="↑ 2 this week"
          trendDirection="up"
          sublabel="First-time lesson completions"
        />
        <OutcomeCard
          label="Creator attention required"
          value={KPIS.creatorActionRequests}
          icon={AlertCircle}
          accent="warning"
          sublabel="Awaiting your review"
        />
      </div>

      {/* 3. Two-column layout (lg:grid-cols-3, main spans 2) */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (lg:col-span-2) */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* 3a. Recovery funnel */}
          <RecoveryFunnel />

          {/* 3b. Risk segment cards */}
          <div>
            <SectionHeader
              title="Where students are struggling"
              description="Active risk segments and their rescue performance"
            />
            <RiskSegments />
          </div>

          {/* 3c. Friction finding card */}
          <FrictionFindingCard />
        </div>

        {/* Right column (lg:col-span-1) */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* 3d. Needs your attention */}
          <AttentionPanel />

          {/* 3e. Live recovery activity feed */}
          <ActivityFeed />
        </div>
      </div>

      {/* 4. Weekly recovery trend chart (full width) */}
      <div className="mt-6">
        <WeeklyTrendChart />
      </div>
    </div>
  );
}

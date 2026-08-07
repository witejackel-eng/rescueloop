"use client";

// Insights page client — fetches from the Course Intelligence API and renders
// the course funnel, friction map, blocker explorer, recommendations,
// with sample size/date range on every chart and threshold warnings.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Clock,
  RefreshCw,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseFunnel } from "@/components/rescueloop/insights/course-funnel";
import { CourseMap } from "@/components/rescueloop/insights/course-map";
import { BlockerExplorer } from "@/components/rescueloop/insights/blocker-explorer";
import { RecommendationWorkflow } from "@/components/rescueloop/insights/recommendation-workflow";
import { AnimatedCounter } from "@/components/interaction/animated-counter";

// ─── API response types ────────────────────────────────────────

interface FunnelStage {
  stage: string;
  count: number;
}

interface FunnelData {
  stages: FunnelStage[];
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
}

interface FrictionPoint {
  lessonIndex: number;
  lessonTitle: string;
  stallRate: number;
  affectedCount: number;
  reportsCount: number;
  courseAverageStallRate: number;
}

interface FrictionMapData {
  points: FrictionPoint[];
  courseAverageStallRate: number;
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
  missingDataCaveat: string | null;
}

interface BlockerDistributionItem {
  blocker: string;
  count: number;
  percent: number;
}

interface BlockerData {
  distribution: BlockerDistributionItem[];
  totalResponses: number;
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
}

interface TimingMetric {
  medianHours: number | null;
  meanHours: number | null;
  sampleSize: number;
  belowThreshold: boolean;
}

interface IssueCluster {
  blockerType: string;
  lessonIndices: number[];
  affectedCount: number;
  repeatedCount: number;
}

interface Recommendation {
  id: string;
  lessonIndex: number;
  lessonTitle: string;
  text: string;
  evidence: string;
  status: "new" | "investigating" | "planned" | "implemented" | "measuring" | "resolved";
  isSuggestion: true;
}

interface InsightsApiResponse {
  ok: boolean;
  data: {
    startFunnel: FunnelData;
    frictionMap: FrictionMapData;
    blockerData: BlockerData;
    timeToFirstAction: TimingMetric;
    returnAfterSupport: TimingMetric;
    issueClusters: IssueCluster[];
    recommendations: Recommendation[];
  };
  meta: {
    minimumSampleThreshold: number;
    dateRange: { from: string; to: string };
    lookbackDays: number;
    courseId: string | null;
    caveats: string[];
  };
}

// ─── Component ─────────────────────────────────────────────────

interface InsightsPageClientProps {
  companyId: string;
}

export function InsightsPageClient({ companyId }: InsightsPageClientProps) {
  const [data, setData] = useState<InsightsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState(0);

  // Fetch insights data on mount
  const fetchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/dashboard/${companyId}/insights?lookbackDays=30`);
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Failed to fetch insights data (${res.status})`);
        }
        const json: InsightsApiResponse = await res.json();
        if (cancelled) return;
        setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load insights data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    fetchRef.current = () => {
      load();
    };

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const fetchData = useCallback(() => {
    fetchRef.current?.();
  }, []);

  // ─── Loading state ─────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="flex flex-col gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="flex animate-pulse flex-col gap-3">
                <div className="h-4 w-48 bg-[var(--hairline-subtle)]" />
                <div className="h-8 w-32 bg-[var(--hairline-subtle)]" />
                <div className="h-3 w-64 bg-[var(--hairline-subtle)]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <AlertTriangle className="size-8 text-[var(--critical)]" />
          <p className="text-[15px] font-medium text-[var(--ink-primary)]">
            Unable to load insights data
          </p>
          <p className="max-w-sm text-[13px] leading-relaxed text-[var(--ink-secondary)]">
            {error}
          </p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="mr-2 size-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { startFunnel, frictionMap, blockerData, timeToFirstAction, returnAfterSupport, issueClusters } = data.data;
  const { meta } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Caveat banner ──────────────────────────────────────────── */}
      {meta.caveats.length > 0 && (
        <div className="flex flex-col gap-1 border border-[var(--warning)]/30 bg-[var(--warning-light)] px-4 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-3.5 text-[var(--warning)]" />
            <span className="text-[12px] font-medium text-[var(--warning)]">Data caveats</span>
          </div>
          <ul className="ml-5 flex flex-col gap-0.5">
            {meta.caveats.map((caveat, i) => (
              <li key={i} className="text-[11px] text-[var(--ink-secondary)]">
                {caveat}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Timing metrics ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TimingCard
          title="Time to first action"
          metric={timeToFirstAction}
          icon={Clock}
        />
        <TimingCard
          title="Return after support"
          metric={returnAfterSupport}
          icon={Users}
        />
        <Card>
          <CardContent className="flex flex-col gap-1 p-4">
            <span className="text-[11px] text-[var(--ink-muted)]">Repeated issue clusters</span>
            <span className="font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
              {issueClusters.length}
            </span>
            <span className="text-[10px] text-[var(--ink-muted)]">
              {meta.dateRange.from} → {meta.dateRange.to}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* ── Course Funnel ──────────────────────────────────────────── */}
      <div className="relative">
        <CourseFunnel />
        <SampleSizeFooter
          sampleSize={startFunnel.sampleSize}
          dateRange={startFunnel.dateRange}
          belowThreshold={startFunnel.belowThreshold}
          threshold={meta.minimumSampleThreshold}
        />
      </div>

      {/* ── Friction Map + Blocker Explorer ────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="relative">
          <CourseMap
            selectedLesson={selectedLesson}
            onSelectLesson={setSelectedLesson}
          />
          <SampleSizeFooter
            sampleSize={frictionMap.sampleSize}
            dateRange={frictionMap.dateRange}
            belowThreshold={frictionMap.belowThreshold}
            threshold={meta.minimumSampleThreshold}
            caveat={frictionMap.missingDataCaveat}
          />
        </div>
        <div className="relative">
          <BlockerExplorer selectedLesson={selectedLesson} />
          <SampleSizeFooter
            sampleSize={blockerData.sampleSize}
            dateRange={blockerData.dateRange}
            belowThreshold={blockerData.belowThreshold}
            threshold={meta.minimumSampleThreshold}
          />
        </div>
      </div>

      {/* ── Recommendation Workflow ────────────────────────────────── */}
      <div className="relative">
        <RecommendationWorkflow
          selectedLesson={selectedLesson}
          onSelectLesson={setSelectedLesson}
        />
        <div className="mt-2 flex items-center gap-2 px-5 text-[10px] text-[var(--ink-muted)]">
          <AlertTriangle className="size-3" />
          <span>
            Recommendations are suggestions only — RescueLoop never makes autonomous course edits.
          </span>
        </div>
      </div>

      {/* ── Issue Clusters ─────────────────────────────────────────── */}
      {issueClusters.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ink-secondary)]">
              Repeated issue clusters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {issueClusters.map((cluster, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 border-l-2 border-[var(--warning)]/40 pl-3"
                >
                  <div>
                    <p className="text-[12px] font-medium text-[var(--ink-primary)]">
                      {cluster.blockerType}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {cluster.affectedCount} affected · {cluster.repeatedCount} repeated ·
                      lessons {cluster.lessonIndices.join(", ")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Timing Card ───────────────────────────────────────────────

function TimingCard({
  title,
  metric,
  icon: Icon,
}: {
  title: string;
  metric: TimingMetric;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-1.5">
          <Icon className="size-3.5 text-[var(--ink-secondary)]" />
          <span className="text-[11px] text-[var(--ink-muted)]">{title}</span>
        </div>
        {metric.medianHours !== null ? (
          <>
            <p className="font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
              <AnimatedCounter value={metric.medianHours} decimals={1} />
              <span className="ml-1 text-[12px] font-normal text-[var(--ink-muted)]">hrs median</span>
            </p>
            <p className="text-[10px] text-[var(--ink-muted)]">
              Mean: {metric.meanHours?.toFixed(1)} hrs · n={metric.sampleSize}
            </p>
          </>
        ) : (
          <p className="text-[13px] text-[var(--ink-muted)]">No data yet</p>
        )}
        {metric.belowThreshold && (
          <p className="text-[10px] text-[var(--warning)]">
            ⚠ Sample below threshold
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Sample Size Footer ────────────────────────────────────────

function SampleSizeFooter({
  sampleSize,
  dateRange,
  belowThreshold,
  threshold,
  caveat,
}: {
  sampleSize: number;
  dateRange: { from: string; to: string };
  belowThreshold: boolean;
  threshold: number;
  caveat?: string | null;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 px-5 text-[10px] text-[var(--ink-muted)]">
      <span className="font-mono tabular-nums">n = {sampleSize}</span>
      <span>
        {dateRange.from} → {dateRange.to}
      </span>
      {belowThreshold && (
        <span className="flex items-center gap-1 font-medium text-[var(--warning)]">
          <AlertTriangle className="size-3" />
          Below min. sample ({threshold})
        </span>
      )}
      {caveat && (
        <span className="text-[var(--warning)]">{caveat}</span>
      )}
    </div>
  );
}

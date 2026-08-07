"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  RefreshCw,
  BarChart3,
  Users,
  DollarSign,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useCompanyDataBundle } from "@/hooks/use-company-data";
import { CardSkeleton } from "@/components/shared/card-skeleton";
import { TimeRangeSelector } from "@/components/shared/time-range-selector";
import { ExportDataButton } from "@/components/shared/export-data-button";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import type { TimeRange } from "@/components/shared/time-range-selector";

// ── Design system colors ─────────────────────────────────────
const COLORS = {
  recoveryGreen: "#147D68",
  recoveryLight: "#DCEDE7",
  warning: "#C68A1E",
  warningLight: "#F5E8C9",
  critical: "#B83D34",
  criticalLight: "#F0D5D2",
  info: "#3D6B8C",
  inkMuted: "#8D8A82",
  inkSecondary: "#5F5D57",
  hairline: "rgba(17,17,15,0.12)",
  canvas: "#F4F1EA",
  surface: "#FCFBF7",
};

// ── Stagger animation variants ───────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ── Mock data generators ─────────────────────────────────────
function generateRecoveryTrend(range: TimeRange) {
  const points = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 120;
  const data = [];
  const baseRate = 42;
  for (let i = 0; i < points; i++) {
    const trend = (i / points) * 18;
    const noise = Math.sin(i * 0.8) * 4 + Math.cos(i * 1.3) * 2;
    const rate = Math.min(95, Math.max(20, baseRate + trend + noise));
    const date = new Date();
    date.setDate(date.getDate() - (points - i));
    data.push({
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      rate: Math.round(rate * 10) / 10,
    });
  }
  return data;
}

function generateRevenueImpact() {
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return months.map((month, i) => ({
    month,
    atRisk: Math.round(2800 + Math.sin(i) * 600 + i * 200),
    saved: Math.round(1200 + i * 280 + Math.cos(i * 0.7) * 300),
  }));
}

const FUNNEL_STAGES = [
  { stage: "Detected", count: 248, color: COLORS.critical },
  { stage: "Reviewed", count: 186, color: COLORS.warning },
  { stage: "Contacted", count: 124, color: COLORS.info },
  { stage: "Responded", count: 82, color: "#5A7D6A" },
  { stage: "Recovered", count: 54, color: COLORS.recoveryGreen },
];

const COHORT_DATA = [
  { month: "Oct 2024", atRisk: 42, contacted: 38, responseRate: 62, recoveryRate: 48, revenueSaved: "$4,820" },
  { month: "Nov 2024", atRisk: 38, contacted: 35, responseRate: 68, recoveryRate: 55, revenueSaved: "$5,640" },
  { month: "Dec 2024", atRisk: 51, contacted: 44, responseRate: 54, recoveryRate: 38, revenueSaved: "$3,920" },
  { month: "Jan 2025", atRisk: 45, contacted: 41, responseRate: 71, recoveryRate: 62, revenueSaved: "$7,180" },
  { month: "Feb 2025", atRisk: 36, contacted: 34, responseRate: 76, recoveryRate: 68, revenueSaved: "$7,920" },
  { month: "Mar 2025", atRisk: 29, contacted: 27, responseRate: 81, recoveryRate: 74, revenueSaved: "$8,460" },
];

const RISK_DISTRIBUTION = [
  { name: "Low Risk", range: "0–30", value: 38, color: COLORS.recoveryGreen },
  { name: "Medium", range: "30–60", value: 27, color: COLORS.warning },
  { name: "High", range: "60–80", value: 22, color: COLORS.info },
  { name: "Critical", range: "80–100", value: 13, color: COLORS.critical },
];

// ── Custom tooltip ───────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 shadow-lg">
      <p className="mb-1 text-[11px] font-medium text-[var(--ink-muted)]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[var(--ink-secondary)]">{p.name}:</span>
          <span className="font-mono font-medium text-[var(--ink-primary)]">
            {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Custom pie tooltip ───────────────────────────────────────
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { range: string; color: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-[8px] border border-[var(--hairline)] bg-[var(--surface)] px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: d.payload.color }} />
        <span className="text-[var(--ink-secondary)]">{d.name} ({d.payload.range})</span>
      </div>
      <p className="mt-0.5 font-mono text-[14px] font-medium text-[var(--ink-primary)]">{d.value} members</p>
    </div>
  );
}

// ── Recovery rate color helper ───────────────────────────────
function recoveryRateColor(rate: number): string {
  if (rate < 30) return "text-[var(--critical)]";
  if (rate < 60) return "text-[var(--warning)]";
  return "text-[var(--recovery-green)]";
}

function recoveryRateBg(rate: number): string {
  if (rate < 30) return "bg-[var(--critical)]/10";
  if (rate < 60) return "bg-[var(--warning)]/10";
  return "bg-[var(--recovery-green)]/10";
}

// ── Main page ────────────────────────────────────────────────
export default function AnalyticsPage() {
  const params = useParams<{ companyId: string }>();
  const { data: bundle, loading, error, refetch } = useCompanyDataBundle(params.companyId);
  const reducedMotion = useReducedMotion();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [refreshing, setRefreshing] = useState(false);

  const recoveryTrend = useMemo(() => generateRecoveryTrend(timeRange), [timeRange]);
  const revenueImpact = useMemo(() => generateRevenueImpact(), []);
  const funnelMax = useMemo(() => Math.max(...FUNNEL_STAGES.map((s) => s.count)), []);

  // Derived summary metrics from bundle data
  const members = bundle?.members ?? [];
  const outcomes = bundle?.outcomes ?? [];
  const summaryMetrics = useMemo(() => {
    const totalMembers = members.length || 100;
    const atRisk = members.filter((m) => m.status === "needs_attention").length || 29;
    const recoveryRate = outcomes.length ? Math.round((outcomes.filter((o) => o.classification === "confirmed_recovered").length / outcomes.length) * 100) : 54;
    const revenueSaved = outcomes.reduce((sum, o) => sum + (o.revenue ?? 0), 0) || 38940;
    return { totalMembers, atRisk, recoveryRate, revenueSaved };
  }, [members, outcomes]);

  function handleRefresh() {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 800);
  }

  // Export handlers
  function exportCSV(): string {
    const headers = "Month,Members At Risk,Contacted,Response Rate,Recovery Rate,Revenue Saved\n";
    const rows = COHORT_DATA.map((r) =>
      `${r.month},${r.atRisk},${r.contacted},${r.responseRate}%,${r.recoveryRate}%,${r.revenueSaved}`
    ).join("\n");
    return headers + rows;
  }

  function exportJSON(): string {
    return JSON.stringify({ cohorts: COHORT_DATA, funnel: FUNNEL_STAGES, riskDistribution: RISK_DISTRIBUTION, recoveryTrend }, null, 2);
  }

  const animProps = reducedMotion
    ? { initial: {}, animate: {}, transition: {} }
    : { initial: "hidden" as const, animate: "visible" as const, variants: containerVariants };

  return (
    <div className="space-y-5">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-serif text-[24px] text-[var(--ink-primary)]">Analytics & Reporting</h1>
          <p className="mt-1 text-[13px] text-[var(--ink-secondary)]">
            Recovery performance, cohort analysis, and revenue impact
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <ExportDataButton onExportCSV={exportCSV} onExportJSON={exportJSON} pageLabel="Analytics" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 rounded-[6px] px-2 text-[11px] text-[var(--ink-muted)]"
            aria-label="Refresh analytics"
          >
            <RefreshCw className={cn("mr-1 size-3", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────── */}
      {error && (
        <Card className="border-[var(--critical)]/30 bg-[var(--critical-light)]/30 p-4">
          <div className="flex items-center gap-2 text-[12px] text-[var(--critical)]">
            <AlertTriangle className="size-4" />
            <span>Failed to load analytics: {error}</span>
            <Button variant="ghost" size="sm" onClick={handleRefresh} className="ml-auto h-6 rounded-[4px] px-2 text-[11px] text-[var(--critical)]">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* ── Summary Metric Cards ────────────────────────────── */}
      <motion.div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        {...animProps}
      >
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} showHeader={false} rows={1} className="p-4" />
          ))
        ) : (
          <>
            <motion.div variants={itemVariants}>
              <MetricCard
                icon={Users}
                label="Total Members"
                value={summaryMetrics.totalMembers.toLocaleString()}
                trend="+8%"
                trendUp
                color={COLORS.info}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                icon={AlertTriangle}
                label="At Risk"
                value={summaryMetrics.atRisk.toString()}
                trend="-12%"
                trendUp={false}
                color={COLORS.critical}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                icon={TrendingUp}
                label="Recovery Rate"
                value={`${summaryMetrics.recoveryRate}%`}
                trend="+6%"
                trendUp
                color={COLORS.recoveryGreen}
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <MetricCard
                icon={DollarSign}
                label="Revenue Saved"
                value={`$${(summaryMetrics.revenueSaved / 1000).toFixed(1)}k`}
                trend="+18%"
                trendUp
                color={COLORS.recoveryGreen}
              />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* ── Charts Row 1: Recovery Trend + Risk Distribution ── */}
      <motion.div
        className="grid gap-5 lg:grid-cols-3"
        {...animProps}
      >
        {/* Recovery Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">Recovery Trend</h2>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  {timeRange === "7d" ? "Last 7 days" : timeRange === "30d" ? "Last 30 days" : timeRange === "90d" ? "Last 90 days" : "All time"} recovery rate
                </p>
              </div>
              <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--recovery-green)]/30 text-[var(--recovery-green)]">
                <TrendingUp className="mr-1 size-3" />
                +6.2%
              </Badge>
            </div>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={recoveryTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="recoveryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.recoveryGreen} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.recoveryGreen} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.hairline} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: COLORS.inkMuted }}
                    axisLine={{ stroke: COLORS.hairline }}
                    tickLine={false}
                    interval={timeRange === "7d" ? 0 : Math.floor(recoveryTrend.length / 6)}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: COLORS.inkMuted }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    name="Recovery rate"
                    stroke={COLORS.recoveryGreen}
                    strokeWidth={2.5}
                    fill="url(#recoveryGradient)"
                    dot={false}
                    activeDot={{ r: 4, stroke: COLORS.recoveryGreen, strokeWidth: 2, fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Risk Distribution Pie Chart */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] p-5">
            <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">Risk Distribution</h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">Members by risk score</p>
            <div className="mt-3 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={RISK_DISTRIBUTION}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {RISK_DISTRIBUTION.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="mt-2 space-y-1.5">
              {RISK_DISTRIBUTION.map((seg) => (
                <div key={seg.name} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="text-[var(--ink-secondary)]">{seg.name}</span>
                    <span className="text-[var(--ink-muted)]">({seg.range})</span>
                  </div>
                  <span className="font-mono font-medium text-[var(--ink-primary)]">{seg.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Charts Row 2: Rescue Funnel + Revenue Impact ────── */}
      <motion.div
        className="grid gap-5 lg:grid-cols-2"
        {...animProps}
      >
        {/* Rescue Funnel */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] p-5">
            <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">Rescue Funnel</h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">Pipeline from detection to recovery</p>
            <div className="mt-5 space-y-3">
              {FUNNEL_STAGES.map((stage, i) => {
                const widthPct = (stage.count / funnelMax) * 100;
                const conversionPct = i === 0 ? 100 : Math.round((stage.count / FUNNEL_STAGES[i - 1].count) * 100);
                return (
                  <div key={stage.stage}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="font-medium text-[var(--ink-secondary)]">{stage.stage}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-[var(--ink-primary)]">{stage.count}</span>
                        <span className="text-[var(--ink-muted)]">
                          {i === 0 ? "" : `${conversionPct}%`}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-7 rounded-[4px] bg-[var(--canvas)]">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-[4px]"
                        style={{ backgroundColor: stage.color, opacity: 0.85 }}
                        initial={reducedMotion ? { width: `${widthPct}%` } : { width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
                      />
                      <span className="absolute inset-y-0 left-3 flex items-center font-mono text-[10px] font-medium text-white">
                        {Math.round((stage.count / FUNNEL_STAGES[0].count) * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-[var(--recovery-green)]/20 bg-[var(--recovery-light)]/30 px-3 py-2">
              <TrendingUp className="size-3.5 text-[var(--recovery-green)]" />
              <span className="text-[11px] text-[var(--recovery-green)]">
                <span className="font-semibold">21.8%</span> overall recovery rate
              </span>
            </div>
          </Card>
        </motion.div>

        {/* Revenue Impact Chart */}
        <motion.div variants={itemVariants}>
          <Card className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] p-5">
            <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">Revenue Impact</h2>
            <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">Monthly revenue at risk vs. saved</p>
            <div className="mt-4 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueImpact} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.hairline} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: COLORS.inkMuted }}
                    axisLine={{ stroke: COLORS.hairline }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: COLORS.inkMuted }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value: string) => (
                      <span className="text-[var(--ink-secondary)]">{value}</span>
                    )}
                  />
                  <Bar
                    dataKey="atRisk"
                    name="At risk"
                    fill={COLORS.critical}
                    radius={[3, 3, 0, 0]}
                    barSize={18}
                  />
                  <Bar
                    dataKey="saved"
                    name="Saved"
                    fill={COLORS.recoveryGreen}
                    radius={[3, 3, 0, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--recovery-green)]" />
                <span className="text-[var(--ink-muted)]">Saved this quarter:</span>
                <span className="font-mono font-medium text-[var(--recovery-green)]">$31.2k</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-[var(--critical)]" />
                <span className="text-[var(--ink-muted)]">At risk:</span>
                <span className="font-mono font-medium text-[var(--critical)]">$16.8k</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* ── Cohort Analysis Table ────────────────────────────── */}
      <motion.div {...animProps}>
        <motion.div variants={itemVariants}>
          <Card className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[20px] text-[var(--ink-primary)]">Cohort Analysis</h2>
                <p className="mt-0.5 text-[11px] text-[var(--ink-muted)]">
                  Monthly cohort recovery performance
                </p>
              </div>
              <Badge variant="outline" className="rounded-[3px] text-[10px] border-[var(--info)]/30 text-[var(--info)]">
                <BarChart3 className="mr-1 size-3" />
                6 months
              </Badge>
            </div>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[var(--hairline)] hover:bg-transparent">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">Month</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)] text-right">At Risk</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)] text-right">Contacted</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)] text-right">Response %</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)] text-right">Recovery %</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)] text-right">Revenue Saved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {COHORT_DATA.map((row) => (
                    <TableRow
                      key={row.month}
                      className="border-b border-[var(--hairline)] hover:bg-[var(--canvas-elevated)]/50"
                    >
                      <TableCell className="text-[12px] font-medium text-[var(--ink-primary)]">{row.month}</TableCell>
                      <TableCell className="text-right font-mono text-[12px] text-[var(--ink-secondary)]">{row.atRisk}</TableCell>
                      <TableCell className="text-right font-mono text-[12px] text-[var(--ink-secondary)]">{row.contacted}</TableCell>
                      <TableCell className="text-right font-mono text-[12px] text-[var(--ink-secondary)]">{row.responseRate}%</TableCell>
                      <TableCell className="text-right">
                        <span className={cn("inline-flex items-center rounded-[3px] px-1.5 py-0.5 font-mono text-[11px] font-medium", recoveryRateColor(row.recoveryRate), recoveryRateBg(row.recoveryRate))}>
                          {row.recoveryRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-[12px] font-medium text-[var(--recovery-green)]">{row.revenueSaved}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Cohort trend summary */}
            <div className="mt-4 flex items-center gap-4 border-t border-[var(--hairline)] pt-3 text-[11px]">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="size-3 text-[var(--recovery-green)]" />
                <span className="text-[var(--ink-muted)]">Recovery rate trending up</span>
                <span className="font-mono font-medium text-[var(--recovery-green)]">+26pp</span>
                <span className="text-[var(--ink-muted)]">over 6 months</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowDownRight className="size-3 text-[var(--recovery-green)]" />
                <span className="text-[var(--ink-muted)]">At-risk members declining</span>
                <span className="font-mono font-medium text-[var(--recovery-green)]">-31%</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Metric Card sub-component ────────────────────────────────
function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendUp,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  color: string;
}) {
  return (
    <Card className="bg-[var(--surface)] border border-[var(--hairline)] rounded-[10px] p-4">
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-[6px]" style={{ backgroundColor: `${color}12` }}>
          <Icon className="size-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-muted)]">
          {label}
        </span>
      </div>
      <div className="mt-2 font-serif text-[28px] font-semibold leading-none tabular-nums text-[var(--ink-primary)]">
        {value}
      </div>
      <div className="mt-1.5 flex items-center gap-1 text-[11px]">
        {trendUp ? (
          <ArrowUpRight className="size-3 text-[var(--recovery-green)]" />
        ) : (
          <ArrowDownRight className="size-3 text-[var(--critical)]" />
        )}
        <span className={trendUp ? "font-medium text-[var(--recovery-green)]" : "font-medium text-[var(--critical)]"}>
          {trend}
        </span>
        <span className="text-[var(--ink-muted)]">vs last period</span>
      </div>
    </Card>
  );
}

"use client";

// ─────────────────────────────────────────────────────────────
// PX07 — Funnel Visualization
// Step chart showing activation funnel with drop-off.
// Uses Recharts BarChart.
// ─────────────────────────────────────────────────────────────

import type { FC } from "react";
import type { FunnelAnalysis } from "@/lib/types/growth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface FunnelVisualizationProps {
  analysis: FunnelAnalysis;
}

const STEP_COLORS = [
  "#147D68", // recovery-green
  "#1A8D76",
  "#219E84",
  "#28AF92",
  "#30BFA0",
  "#4EC7AC",
  "#6CCFB8",
  "#8AD7C4",
  "#A8DFD0",
  "#C0E7DC",
  "#D8EFE8",
];

export const FunnelVisualization: FC<FunnelVisualizationProps> = ({ analysis }) => {
  const data = analysis.steps.map((step, i) => ({
    name: step.label,
    count: step.count,
    conversion: step.conversionRate,
    dropoff: step.dropoffRate,
    fill: STEP_COLORS[i % STEP_COLORS.length],
  }));

  return (
    <div className="flex flex-col gap-4">
      {/* Overall metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Top of funnel
          </span>
          <p className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
            {analysis.totalAtTop}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Activated
          </span>
          <p className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-[var(--recovery-green)]">
            {analysis.totalAtBottom}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--hairline)] bg-[var(--surface)] p-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--ink-muted)]">
            Overall conversion
          </span>
          <p className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-[var(--ink-primary)]">
            {analysis.overallConversion.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 40, bottom: 4, left: 4 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 11, fill: "#5F5D57" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                if (name === "count") return [`${value} tenants`, "Count"];
                return [value, name];
              }}
              contentStyle={{
                fontSize: 11,
                borderRadius: 6,
                border: "1px solid rgba(17,17,15,0.12)",
                backgroundColor: "#FCFBF7",
              }}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
              <LabelList
                dataKey="count"
                position="right"
                style={{ fontSize: 10, fontFamily: "monospace", fill: "#11110F" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Drop-off table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--hairline)] text-[9px] uppercase tracking-wider text-[var(--ink-muted)]">
              <th className="py-2 text-left font-medium">Step</th>
              <th className="py-2 text-right font-medium">Count</th>
              <th className="py-2 text-right font-medium">Conversion</th>
              <th className="py-2 text-right font-medium">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {analysis.steps.map((step, i) => (
              <tr
                key={step.step}
                className="border-b border-[var(--hairline-subtle)]"
              >
                <td className="py-1.5 text-[var(--ink-primary)]">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: STEP_COLORS[i % STEP_COLORS.length] }}
                    />
                    {step.label}
                  </div>
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums">
                  {step.count}
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums text-[var(--recovery-green)]">
                  {step.conversionRate.toFixed(1)}%
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums text-[var(--critical)]">
                  {i > 0 ? `${step.dropoffRate.toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

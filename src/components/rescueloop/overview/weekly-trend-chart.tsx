"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WEEKLY_RECOVERY } from "@/lib/mock-data";

const SERIES = [
  {
    key: "detected",
    label: "Detected",
    color: "#147D68",
    gradientId: "gradDetected",
  },
  {
    key: "contacted",
    label: "Contacted",
    color: "#4C7ECF",
    gradientId: "gradContacted",
  },
  {
    key: "resumed",
    label: "Resumed",
    color: "#27966A",
    gradientId: "gradResumed",
  },
] as const;

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-[#E3E5DF] bg-white px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-[#171A17]">{label}</p>
      <div className="flex flex-col gap-1">
        {payload.map((entry) => {
          const series = SERIES.find((s) => s.key === entry.dataKey);
          if (!series) return null;
          return (
            <div
              key={entry.dataKey}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <span className="flex items-center gap-1.5 text-[#6A706A]">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </span>
              <span className="tabular-mono font-medium text-[#171A17]">
                {entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Weekly recovery trend chart — Recharts AreaChart with three series.
 * Client component (Recharts requires it).
 */
export function WeeklyTrendChart() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-[#171A17]">
              Weekly recovery trend
            </CardTitle>
            <p className="mt-0.5 text-sm text-[#6A706A]">
              Detected risk signals, interventions delivered, and resumed students
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6A706A]">
            {SERIES.map((s) => (
              <span key={s.key} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-5">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={WEEKLY_RECOVERY}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <defs>
                {SERIES.map((s) => (
                  <linearGradient
                    key={s.gradientId}
                    id={s.gradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E3E5DF"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#6A706A", fontSize: 12 }}
                axisLine={{ stroke: "#E3E5DF" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6A706A", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
                allowDecimals={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "#E3E5DF", strokeWidth: 1 }}
              />
              <Legend wrapperStyle={{ display: "none" }} />
              {SERIES.map((s) => (
                <Area
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#${s.gradientId})`}
                  dot={{ r: 2.5, fill: s.color, strokeWidth: 0 }}
                  activeDot={{ r: 4, fill: s.color, strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={400}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

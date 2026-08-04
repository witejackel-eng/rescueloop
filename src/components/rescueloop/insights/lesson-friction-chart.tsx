"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COURSE_AVERAGE_STALL_RATE,
  LESSON_FRICTION,
} from "@/lib/mock-data";

interface FrictionDatum {
  lesson: string;
  stallRate: number;
  affected: number;
}

function barColor(stallRate: number): string {
  if (stallRate <= COURSE_AVERAGE_STALL_RATE) return "#147D68";
  if (stallRate <= 15) return "#D89222";
  return "#C64D45";
}

function ChartTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0]?.payload as FrictionDatum | undefined;
  if (!data) return null;
  return (
    <div className="rounded-lg border border-[#E3E5DF] bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#171A17]">{data.lesson}</p>
      <div className="mt-1.5 flex flex-col gap-0.5 text-xs text-[#6A706A]">
        <span>
          Stall rate:{" "}
          <span
            className="font-medium text-[#171A17]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {data.stallRate}%
          </span>
        </span>
        <span>
          Affected:{" "}
          <span
            className="font-medium text-[#171A17]"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {data.affected} students
          </span>
        </span>
        <span>
          vs. course avg:{" "}
          <span
            className="font-medium"
            style={{
              color: barColor(data.stallRate),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {(data.stallRate / COURSE_AVERAGE_STALL_RATE).toFixed(1)}&times;
          </span>
        </span>
      </div>
    </div>
  );
}

function renderBarLabel(props: any) {
  const { x, y, width, height, value, payload } = props;
  if (
    x == null ||
    y == null ||
    width == null ||
    height == null ||
    value == null ||
    !payload
  ) {
    return null;
  }
  const cy = y + height / 2;
  return (
    <g>
      <text
        x={x + width + 6}
        y={cy}
        dy={4}
        fontSize={11}
        fontWeight={600}
        fill="#171A17"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}%
      </text>
      <text
        x={x + width + 44}
        y={cy}
        dy={4}
        fontSize={11}
        fill="#6A706A"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {payload.affected} affected
      </text>
    </g>
  );
}

/**
 * Lesson friction map — Recharts horizontal BarChart with per-bar coloring
 * based on stall rate severity and a vertical ReferenceLine at the course
 * average. Client component because Recharts requires client-side rendering.
 */
export function LessonFrictionChart() {
  const maxY = Math.max(...LESSON_FRICTION.map((d) => d.stallRate));
  const domainMax = Math.max(30, Math.ceil((maxY + 4) / 5) * 5);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <CardTitle className="text-base font-semibold text-[#171A17]">
          Lesson friction map
        </CardTitle>
        <p className="mt-0.5 text-sm text-[#6A706A]">
          Stall rate per lesson &mdash; bars colored by severity
        </p>
      </CardHeader>
      <CardContent className="px-2 pb-5 sm:px-5">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={LESSON_FRICTION as FrictionDatum[]}
              layout="vertical"
              margin={{ top: 6, right: 110, left: 8, bottom: 6 }}
              barCategoryGap="22%"
            >
              <XAxis
                type="number"
                domain={[0, domainMax]}
                tick={{ fill: "#6A706A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <YAxis
                type="category"
                dataKey="lesson"
                width={200}
                tick={{ fill: "#6A706A", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "rgba(20,125,104,0.06)" }}
              />
              <ReferenceLine
                x={COURSE_AVERAGE_STALL_RATE}
                stroke="#D89222"
                strokeDasharray="4 4"
                label={{
                  value: `Course avg ${COURSE_AVERAGE_STALL_RATE}%`,
                  position: "insideTopRight",
                  fill: "#D89222",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <Bar
                dataKey="stallRate"
                radius={[0, 4, 4, 0]}
                barSize={22}
                isAnimationActive
                animationDuration={300}
              >
                {LESSON_FRICTION.map((d) => (
                  <Cell key={d.lesson} fill={barColor(d.stallRate)} />
                ))}
                <LabelList dataKey="stallRate" position="right" content={renderBarLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E5DF] pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#6A706A]">
            <span className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: "#147D68" }}
              />
              &le;{COURSE_AVERAGE_STALL_RATE}%
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: "#D89222" }}
              />
              11&ndash;15%
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-sm"
                style={{ backgroundColor: "#C64D45" }}
              />
              &gt;15%
            </span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#FEF3E2] px-2 py-0.5 text-[#D89222]">
            <AlertTriangle className="size-3.5" />
            <span>
              Lesson 7 &mdash;{" "}
              <span
                className="font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                24%
              </span>{" "}
              stall,{" "}
              <span
                className="font-semibold"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                18
              </span>{" "}
              affected
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

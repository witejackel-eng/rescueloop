import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-[#171A17]">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-sm text-[#6A706A]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function OutcomeCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection,
  sublabel,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "flat";
  sublabel?: string;
  accent?: "teal" | "success" | "warning" | "critical" | "info";
}) {
  const accentMap = {
    teal: "bg-[#E8F5EF] text-[#147D68]",
    success: "bg-[#E8F5EF] text-[#27966A]",
    warning: "bg-[#FEF3E2] text-[#D89222]",
    critical: "bg-[#F4E8E6] text-[#C64D45]",
    info: "bg-[#E8F0FE] text-[#4C7ECF]",
  };
  const trendColor =
    trendDirection === "up"
      ? "text-[#27966A]"
      : trendDirection === "down"
        ? "text-[#C64D45]"
        : "text-[#6A706A]";

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "flex size-9 items-center justify-center rounded-lg",
              accentMap[accent ?? "teal"],
            )}
          >
            <Icon className="size-4.5" />
          </div>
          {trend && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                trendColor,
              )}
            >
              {trendDirection === "up" && <ArrowUpRight className="size-3" />}
              {trendDirection === "down" && <ArrowDownRight className="size-3" />}
              {trendDirection === "flat" && <Minus className="size-3" />}
              {trend}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-[#6A706A]">{label}</p>
        <p className="tabular-mono mt-1 text-2xl font-semibold text-[#171A17]">
          {value}
        </p>
        {sublabel && (
          <p className="mt-1 text-xs text-[#6A706A]">{sublabel}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-[#171A17] sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-[#6A706A]">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

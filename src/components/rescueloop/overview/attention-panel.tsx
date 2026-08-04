import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ATTENTION_ITEMS } from "@/lib/mock-data";

const severityDot: Record<"warning" | "critical", string> = {
  warning: "bg-[#D89222]",
  critical: "bg-[#C64D45]",
};

const severityRing: Record<"warning" | "critical", string> = {
  warning: "bg-[#FEF3E2] text-[#D89222]",
  critical: "bg-[#F4E8E6] text-[#C64D45]",
};

/**
 * "Needs your attention" panel — summary of the 4 attention items,
 * with a total badge at the top. Links each item to its href.
 * Server component.
 */
export function AttentionPanel() {
  const total = ATTENTION_ITEMS.reduce((sum, i) => sum + i.count, 0);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold text-[#171A17]">
              Needs your attention
            </CardTitle>
            <p className="mt-0.5 text-sm text-[#6A706A]">
              Items awaiting creator review
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3E2] px-2.5 py-1 text-xs font-medium text-[#D89222]">
            <span className="size-1.5 rounded-full bg-[#D89222]" />
            <span className="tabular-mono">{total}</span>
            <span>items</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="flex flex-col gap-1">
          {ATTENTION_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-[#F8F8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147D68]"
            >
              <span
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${severityRing[item.severity]}`}
              >
                <span
                  className={`size-2 rounded-full ${severityDot[item.severity]}`}
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#171A17]">
                  {item.label}
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="tabular-mono text-sm font-semibold text-[#171A17]">
                  {item.count}
                </span>
                <ChevronRight className="size-4 text-[#6A706A] transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

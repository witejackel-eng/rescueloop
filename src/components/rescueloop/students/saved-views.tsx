"use client";

import { cn } from "@/lib/utils";
import type { SavedViewId } from "@/lib/students-directory";

export interface SavedViewPill {
  id: SavedViewId;
  label: string;
  count: number;
}

/**
 * Horizontal scrollable row of saved view pills. Active pill gets the
 * teal RescueLoop primary; inactive pills use the warm light surface.
 */
export function SavedViews({
  views,
  activeView,
  onSelect,
}: {
  views: SavedViewPill[];
  activeView: SavedViewId;
  onSelect: (id: SavedViewId) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {views.map((view) => {
        const active = view.id === activeView;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onSelect(view.id)}
            aria-pressed={active}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              active
                ? "border-[#147D68] bg-[#147D68] text-white"
                : "border-[#E3E5DF] bg-white text-[#171A17] hover:bg-[#F8F8F5]",
            )}
          >
            <span>{view.label}</span>
            <span
              className={cn(
                "tabular-mono rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                active
                  ? "bg-white/20 text-white"
                  : "bg-[#F0F2EC] text-[#6A706A]",
              )}
            >
              {view.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

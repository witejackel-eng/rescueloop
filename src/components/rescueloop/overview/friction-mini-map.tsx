import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  COURSE_AVERAGE_STALL_RATE,
  LESSON_FRICTION,
} from "@/lib/mock-data";

/**
 * Course friction signal — compact mini-map of the 9 lessons in
 * LESSON_FRICTION, with Lesson 7 highlighted in amber.
 *
 * Not a bordered card. Just a label row of small horizontal bars plus a
 * single summary line that links to /insights.
 */
export function FrictionMiniMap() {
  const max = Math.max(...LESSON_FRICTION.map((l) => l.stallRate));
  const lesson7 = LESSON_FRICTION.find((l) => l.lesson.startsWith("L7"));
  const multiple = lesson7
    ? (lesson7.stallRate / COURSE_AVERAGE_STALL_RATE).toFixed(1)
    : "—";

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-[18px] text-[var(--ink-primary)]">
          Course friction signal
        </h3>
        <Link
          href="/insights"
          className="flex items-center gap-1 text-[12px] text-[var(--ink-secondary)] transition-colors hover:text-[var(--recovery-green)]"
        >
          View
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="bg-transparent p-1">
        <div className="flex h-16 items-end gap-1.5">
          {LESSON_FRICTION.map((l) => {
            const isL7 = l.lesson.startsWith("L7");
            const heightPct = (l.stallRate / max) * 100;
            const label = l.lesson.split(":")[0];
            return (
              <div
                key={l.lesson}
                className="flex flex-1 flex-col items-center justify-end gap-1.5"
                title={`${label} · ${l.stallRate}% stall rate`}
              >
                <div className="flex w-full items-end justify-center" style={{ height: "100%" }}>
                  <div
                    className={`w-full transition-colors ${
                      isL7 ? "bg-[var(--warning)]" : "bg-[var(--ink-primary)]/15"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span
                  className={`font-mono text-[9px] tabular-nums ${
                    isL7 ? "text-[var(--warning)]" : "text-[var(--ink-muted)]"
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 border-t border-[var(--hairline)] pt-3">
          <p className="text-[12px] leading-relaxed text-[var(--ink-secondary)]">
            Lesson 7 stall rate{" "}
            <span className="font-mono tabular-nums text-[var(--warning)]">24%</span>{" "}
            —{" "}
            <span className="font-mono tabular-nums text-[var(--ink-primary)]">
              {multiple}×
            </span>{" "}
            course average
          </p>
          <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
            Course average stall rate {COURSE_AVERAGE_STALL_RATE}%.{" "}
            <span className="text-[var(--ink-secondary)]">18 students affected.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

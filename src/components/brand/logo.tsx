import { cn } from "@/lib/utils";

export function RescueLoopMark({
  className,
  size = 24,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-[var(--ink-primary)]", className)}
      aria-hidden="true"
    >
      {/* Recovery orbit — a loop that returns */}
      <circle
        cx="16"
        cy="16"
        r="13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        opacity="0.35"
      />
      <path
        d="M9 20C9 20 11 14 16 14C21 14 23 20 23 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 12C9 12 11 18 16 18C21 18 23 12 23 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function RescueLoopWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[1.35rem] leading-none tracking-tight", className)}>
      RescueLoop
    </span>
  );
}

export function RescueLoopLogo({
  className,
  markSize = 24,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <RescueLoopMark size={markSize} />
      <RescueLoopWordmark />
    </div>
  );
}

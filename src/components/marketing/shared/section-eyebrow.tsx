import { cn } from "@/lib/utils";

interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export function SectionEyebrow({ children, className, dark = false }: SectionEyebrowProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 font-mono text-[12px] tracking-wide",
        dark ? "text-[var(--dark-secondary)]" : "text-[var(--ink-muted)]",
        className,
      )}
    >
      <span className={cn("h-px w-8", dark ? "bg-[var(--dark-hairline)]" : "bg-[var(--hairline-strong)]")} />
      {children}
    </span>
  );
}

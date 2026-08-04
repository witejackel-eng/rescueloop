// RescueLoop typography scale and helpers.
// Fonts: Instrument Serif (display/marketing), Instrument Sans (interface),
// JetBrains Mono (analytical values).

export const TYPE = {
  // Marketing hero — Instrument Serif
  hero: "font-serif text-[clamp(2.75rem,7vw,7rem)] leading-[0.95] tracking-[-0.03em]",
  // Large dashboard outcome number
  outcomeNumber: "font-serif text-[clamp(2.5rem,5vw,4rem)] leading-none tracking-[-0.02em]",
  // Page heading
  pageHeading: "font-sans text-[1.75rem] leading-tight tracking-[-0.02em] font-medium",
  // Section heading
  sectionHeading: "font-sans text-[1.25rem] leading-tight tracking-[-0.01em] font-medium",
  // Interface body
  body: "font-sans text-sm leading-relaxed",
  // Metadata — never below 12px
  metadata: "font-sans text-xs leading-normal text-[var(--ink-secondary)]",
  // Mono analytical
  mono: "font-mono tabular-nums tracking-[-0.01em]",
  // Display serif statement (medium)
  statement: "font-serif text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em]",
} as const;

export function mono(value: string | number): string {
  return String(value);
}

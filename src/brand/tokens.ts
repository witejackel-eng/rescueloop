/**
 * RescueLoop brand tokens — typed semantic exports mapped to CSS variables.
 *
 * These tokens consolidate the existing palette from globals.css into
 * typed TypeScript constants. They do NOT create a competing CSS token layer;
 * they provide type-safe access for React components and scripts.
 *
 * The actual CSS custom properties are defined in src/app/globals.css.
 */

export const colors = {
  // Canvas
  canvas: "var(--canvas)" as const,
  canvasElevated: "var(--canvas-elevated)" as const,
  surface: "var(--surface)" as const,
  surfaceHover: "var(--surface-hover)" as const,

  // Ink
  inkPrimary: "var(--ink-primary)" as const,
  inkSecondary: "var(--ink-secondary)" as const,
  inkMuted: "var(--ink-muted)" as const,

  // Semantic
  recoveryGreen: "var(--recovery-green)" as const,
  recoveryLight: "var(--recovery-light)" as const,
  signalAmber: "var(--warning)" as const,
  signalLight: "var(--warning-light)" as const,
  critical: "var(--critical)" as const,
  criticalLight: "var(--critical-light)" as const,
  information: "var(--info)" as const,

  // Dark section
  darkSection: "var(--dark-section)" as const,
  darkElevated: "var(--dark-elevated)" as const,
} as const;

/** Hex values for use in SVGs and non-CSS contexts (brand assets, export scripts). */
export const hex = {
  canvas: "#F4F1EA",
  canvasElevated: "#F8F6F0",
  surface: "#FCFBF7",
  inkPrimary: "#11110F",
  inkSecondary: "#5F5D57",
  inkMuted: "#8D8A82",
  recoveryGreen: "#147D68",
  recoveryLight: "#DCEDE7",
  signalAmber: "#C68A1E",
  signalLight: "#F5E8C9",
  critical: "#B83D34",
  criticalLight: "#F0D5D2",
  information: "#3D6B8C",
} as const;

export const fonts = {
  interface: "var(--font-instrument-sans)" as const,
  editorial: "var(--font-instrument-serif)" as const,
  data: "var(--font-jetbrains-mono)" as const,
} as const;

/** Canonical spacing scale (px values). */
export const spacing = [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] as const;

/** Canonical radius values (px). */
export const radius = {
  control: 6,
  card: 8,
  editorialMax: 14,
} as const;

/** Semantic color usage rules — for reference and enforcement. */
export const colorUsage = {
  green: "approval, progress, return, healthy connection, confirmed success",
  amber: "attention or stalled state — not failure",
  red: "destructive action, denied access, failed operation, data-loss risk",
  blue: "neutral information only",
} as const;

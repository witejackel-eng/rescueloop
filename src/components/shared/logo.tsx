/**
 * Backward-compatible re-export from the canonical brand logo component.
 *
 * The old shared/logo.tsx used a different API (showWordmark prop, old mark geometry).
 * This module re-exports from the canonical Closing Signal logo system.
 *
 * Migration note: Update imports to use @/components/brand/logo directly.
 * This file will be removed once all consumers are migrated.
 */

export { RescueLoopLogo } from "@/components/brand/logo";

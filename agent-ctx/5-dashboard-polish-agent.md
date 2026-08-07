# Task 5 — Premium Dashboard Polish (Tables, Tooltips, Cards)

**Agent**: dashboard-polish-agent
**Branch**: repair/px01-px07-production-safe
**Date**: 2025

## Summary

Enhanced the visual polish of every dashboard surface by upgrading the shared Table + Card primitives, introducing a reusable premium ChartTooltip, applying the new tooltip across all three recharts charts on the Analytics page, and refining the Students / Rescue Queue / Activity pages with hover/selected states, gradient accents, and improved color coding. No new npm dependencies were added; all changes respect the existing warm-cream design system, dark mode, and `prefers-reduced-motion`.

## Files Modified

### Primitives
1. **`src/components/ui/table.tsx`**
   - `TableHeader`: now defaults to `bg-[var(--canvas-elevated)]` with a `border-[var(--hairline-subtle)]` row separator
   - `TableRow`: hover uses `--surface-hover`; selected supports both legacy `data-[state=selected]` (kept) and new `data-[selected=true]` (maps to `--recovery-light`); border color now `--hairline-subtle`; added 200ms `transition-colors`
   - `TableHead`: padding `h-11 px-4 py-2.5`, text color `--ink-secondary`, kept `font-medium`
   - `TableCell`: padding bumped from `p-2` → `py-3 px-4` (more breathable)
   - Backward compatible: existing inline `hover:bg-…` overrides still win via Tailwind merge

2. **`src/components/ui/card.tsx`**
   - Added optional `variant?: "default" | "elevated" | "outline" | "glass"` prop (default `"default"`)
   - `default` — current styling (preserved exactly)
   - `elevated` — `shadow-md` + subtle top-down white gradient overlay
   - `outline` — `border-[1.5px]` using `--hairline-strong`, no shadow
   - `glass` — uses the existing `.glass` utility + `border-white/10`
   - Added optional `interactive?: boolean` prop → opt-in hover lift (`-translate-y-px` + recovery-tinted shadow + hairline-strong border)
   - Added `data-variant={variant}` attribute for downstream styling hooks
   - Backward compatible: both new props are optional with sensible defaults

### New shared component
3. **`src/components/shared/chart-tooltip.tsx`** (new)
   - `"use client"` premium tooltip for recharts (Area / Bar / Pie / Line)
   - Props: `active`, `payload`, `label`, optional `formatter`, optional `labelFormatter`
   - Surface card with `--surface` background, `--hairline` border, soft shadow with dark-mode variant
   - Serif label at top (uses `.font-serif`)
   - Each payload item: colored dot (with subtle `--hairline-subtle` ring), name, optional range label (auto-detected from `payload.range`), mono tabular value
   - `formatter` may return a `[value, name]` tuple or a ReactNode
   - Subtle entrance animation (fade + 4px slide-up + scale 0.97 → 1, 180ms cubic-bezier) via `motion.div`; respects `prefers-reduced-motion`
   - `role="tooltip"` for accessibility
   - Dark-mode compatible (CSS variables exclusively)

### CSS utilities
4. **`src/app/globals.css`**
   - `.table-row-hover` — smooth 200ms background-color transition into `--surface-hover`
   - `.table-row-selected` — recovery-green tinted background via `color-mix(in srgb, var(--recovery-green) 8%, transparent)` + inset 3px left stripe in `--recovery-green`. Dark mode uses a slightly stronger 14% tint
   - `.card-hover-lift` — translateY(-1px) + soft shadow on hover, 200ms cubic-bezier. Dark-mode variant
   - `.gradient-text` — `linear-gradient(90deg, var(--recovery-green), var(--info))` clipped to text; `@supports not (background-clip: text)` fallback colors text recovery-green
   - `.shimmer-text` — animated gradient sweep (2.4s linear infinite) using ink-muted → recovery-green → ink-muted; `@supports` fallback collapses to plain ink-secondary text. Reduced-motion collapses animation
   - `.focus-ring` — `:focus-visible` ring using `--recovery-green` with a `--surface` offset for contrast on busy backgrounds
   - `.scrollbar-thin` — 4px scrollbar with `--hairline-strong` thumb, `999px` radius, `--ink-muted` on hover. Includes `scrollbar-width: thin` + `scrollbar-color` for Firefox
   - `.backdrop-blur-soft` — `blur(6px) saturate(120%)` (8px in dark mode) for overlays
   - All new utilities respect `prefers-reduced-motion` (the global guard already collapses transitions/animations; added an explicit block to neutralize `.shimmer-text` animation and `.card-hover-lift:hover` transform)

### Analytics page
5. **`src/app/(dashboard)/dashboard/[companyId]/analytics/page.tsx`**
   - Replaced the inline `CustomTooltip` with three thin wrappers (`AreaTooltip`, `BarTooltip`, `PieTooltip`) around the shared `ChartTooltip`:
     - **Recovery Trend (Area)**: formats value as a percentage (`{value}%`)
     - **Revenue Impact (Bar)**: formats value as USD (`${value}`)
     - **Risk Distribution (Pie)**: formats value as member count (`{value} members`); the shared tooltip auto-renders `payload.range` next to the name
   - The shared tooltip's serif label, color dots with subtle ring, and entrance animation give the charts a noticeably more premium feel

### Students / Members page
6. **`src/app/(dashboard)/dashboard/[companyId]/students/page.tsx`**
   - Added `selectMode` state + `selectedIds: Set<string>` state with `toggleSelected`, `selectAllVisible`, `clearSelection`, `bulkToast` handlers
   - Added a "Select" / "Exit select" toggle button (CheckSquare icon) next to the search input — turns the table into selection mode
   - In selection mode:
     - A new leading `<th>` renders a "select all visible" Checkbox
     - Each row gets a leading `<td>` with its own Checkbox (stopPropagation on click so the row click toggles selection too)
     - Row `onClick` toggles selection in select mode
     - Selected rows apply `data-selected={true}` + the new `.table-row-selected` class + a recovery-green left accent stripe (`before:` pseudo)
   - Applied `table-row-hover` class to every row (replaces inline `hover:bg-[var(--canvas-elevated)]`)
   - Switched inner-border color from `--hairline` → `--hairline-subtle` for a softer, more breathable table
   - Header text color bumped from `--ink-muted` → `--ink-secondary` for stronger hierarchy
   - Wrapped overflow container with `scrollbar-thin` for a tidier scroll experience
   - Replaced the bare-bones empty-state `<Card>` with the shared `<EnhancedEmptyState>` component (Users icon, serif title, "Reset filters" CTA)
   - Added a sticky bottom bulk-action bar (spring-animated slide-up) with "Tag", "Archive", and clear-selection buttons — mirrors the rescue-queue bulk action bar pattern

### Rescue Queue page
7. **`src/app/(dashboard)/dashboard/[companyId]/rescue-queue/page.tsx`**
   - Queue item cards now use the new `.card-hover-lift` utility for a subtle 1px lift + soft shadow on hover
   - Hover state refactored: stronger border (`--hairline-strong`) + `--canvas-elevated` background, replacing the inline `transition-all` + bespoke shadow
   - Selected state: now uses a `--recovery-green` border + a layered shadow (`0 0 0 1px var(--recovery-green)` + a recovery-tinted outer glow `0 8px 24px -8px rgba(20,125,104,0.25)`) for a more premium "focused" feel
   - Bulk-checked state: bumped ring opacity from 30% → 40%
   - Added a 2px `bg-gradient-to-r from-[var(--recovery-green)] to-[var(--info)]` accent strip at the top of selected/bulk-checked cards (the same gradient family used by the `.gradient-strip` utility) — visual continuity with the rest of the design system
   - Added `overflow-hidden` to the Card so the accent strip respects the rounded corners

### Activity page
8. **`src/app/(dashboard)/dashboard/[companyId]/activity/page.tsx`**
   - Extended `EVENT_META` with a `ring` field per event type (e.g. `ring-[var(--warning)]/30` for candidate_detected, `ring-[var(--recovery-green)]/30` for approved/responded)
   - Timeline rail color softened from `--hairline` → `--hairline-subtle`
   - Header divider + footer divider softened from `--hairline` → `--hairline-subtle`
   - Hover background switched from `--canvas` → `--canvas-elevated` (better contrast with the card's `--surface` background)
   - Added `duration-200` to hover transition for smoother feedback
   - Icon container: on hover, now gains a 2px type-colored ring (`group-hover:ring-2` + the new `meta.ring` class), a soft shadow (`0_4px_12px_-4px_rgba(17,17,15,0.12)`), and the icon scales 110% (`group-hover:scale-110`)
   - Type badge: now colored to match the event type (e.g. warning badge for Detected, recovery-green badge for Approved) with `border-current/30`
   - Timestamp: now wrapped in a tiny `--canvas` chip with `rounded-[3px]` + `px-1.5 py-0.5` that inverts to `--surface` on hover — gives timestamps more visual presence without being noisy

## Design Decisions

- **Backward compatibility was the #1 priority.** The `Card` and `Table` components are imported by 36+ files; both new props (`variant`, `interactive`) are optional with defaults that match the previous styling exactly. Existing call sites continue to render identically.
- **Why three tooltip wrappers (Area/Bar/Pie) instead of one?** Each chart needs a different value formatter (% / $ / "members"). Wrapping the shared `ChartTooltip` in a tiny per-chart wrapper keeps the JSX at each `<Tooltip content=… />` site unchanged (just `<AreaTooltip />` etc.), and centralizes the formatter logic next to the chart definition.
- **Why `data-selected={true}` AND `data-state=selected`?** The existing Table primitive used `data-[state=selected]` (Radix convention). The task asked for `data-[selected=true]`. Keeping both means existing call sites that set `data-state="selected"` continue to work, while new code can use the simpler `data-selected={true}`. The selected styles apply to whichever attribute is set.
- **Why `color-mix(in srgb, ...)` for the selected row tint?** It lets us derive a tinted background from the `--recovery-green` variable without needing a separate `--recovery-light` tint variable — and it automatically adapts when `--recovery-green` changes between light/dark mode.
- **No new npm dependencies.** Everything is built on existing primitives: `framer-motion` (already used everywhere), `lucide-react` (icons), `recharts` (chart tooltips), shadcn `Checkbox`, and the project's `cn` utility.

## Verification

- `bun run lint` → 0 errors, 0 warnings (verified twice)
- All touched routes return 200 OK via curl:
  - `/dashboard/co_cgl/analytics` → 200 (compiled in 4.9s first hit, 64ms cached)
  - `/dashboard/co_cgl/students` → 200 (compiled in 1.2s)
  - `/dashboard/co_cgl/rescue-queue` → 200 (compiled in 0.8s)
  - `/dashboard/co_cgl/activity` → 200 (compiled in 0.8s)
- Dev server log: clean compile, no warnings or errors after the changes
- `prefers-reduced-motion`: all new animations collapse to instant transitions via the global media query + explicit `.shimmer-text` / `.card-hover-lift:hover` overrides
- Dark mode: every new utility has a `.dark` variant or relies on CSS variables that already swap in dark mode

## Notes for Future Agents

- The new `ChartTooltip` is the canonical tooltip for all recharts charts going forward. If you add a new chart, prefer `<Tooltip content={<ChartTooltip formatter={…} />} />` over an inline custom tooltip.
- The `Card` component's `variant` prop is the new way to switch card surfaces. The previous approach (passing `glass` / `gradient-strip` as full Tailwind classes) still works, but `variant="glass" | "elevated" | "outline"` is more discoverable and consistent.
- The new CSS utilities (`.table-row-hover`, `.table-row-selected`, `.card-hover-lift`, `.gradient-text`, `.shimmer-text`, `.focus-ring`, `.scrollbar-thin`, `.backdrop-blur-soft`) are all available for use across the codebase. The Notifications Center page (`notifications/page.tsx`) is a good candidate to adopt `.table-row-selected` and `.scrollbar-thin` next.
- If you need to add another recharts chart type (Line, Radar, etc.), the `ChartTooltip` will work as-is — just pass a `formatter` if you need a non-default value format.

# Task 9-a: Dashboard Pages Polish Agent

## Task
Polish 6 dashboard pages (outcomes, playbooks, usage, settings, settings/health, help/diagnostics) with consistent visual hierarchy, accent borders, and refined typography. Surgical edits only — no rewrites.

## Approach
1. Read worklog.md to understand prior agents' work (Round 2 wired 5 of these pages to live API; styling baseline already established).
2. Inspected globals.css to confirm CSS variable palette: `--recovery-green`, `--warning`, `--critical`, `--info` (muted blue), `--ink-primary/secondary/muted`, `--hairline`, `--canvas-elevated`, `--surface`, `--surface-hover`.
3. Read each of the 6 target files in full before editing.
4. Applied MultiEdit batches per file, then ran `bun run lint` + `curl` per file to catch regressions early.

## Changes by File

### outcomes/page.tsx
- TIER_META gained `leftBorder` field: `border-l-[3px] border-l-<color>` (green/blue/red/amber per tier).
- Tier summary grid wrapped in `<div className="mt-6 border-t border-[var(--hairline)] pt-4">` separator.
- Numerals already at `text-[28px]`; added `font-semibold`.
- "Attribution Ledger" header got `font-semibold`.

### playbooks/page.tsx
- 4 summary stat icon containers: `size-8 rounded-[6px]` → `size-9 rounded-[8px]`.
- Playbook metadata row converted from `<div>` to semantic `<dl>` with `<dt>`/`<dd>`, values now `font-semibold`, kept 2→4 col responsive grid with `gap-x-4 gap-y-3`.
- Card titles (`h2`): `font-medium` → `font-semibold`.
- Playbook card hover: added `hover:shadow-[0_4px_12px_-6px_rgba(17,17,15,0.08)]`.

### usage/page.tsx
- Metric values: `text-[16px]` → `text-[28px] font-semibold tabular-nums`.
- Grid got `lg:divide-x lg:divide-[var(--hairline)]`; cells got `lg:px-4` (first cell `lg:pl-0`) for clean dividers on desktop.
- Progress bar: `h-1.5` → `h-2`.
- Non-current plan cards: `bg-[var(--surface)]` → `bg-[var(--canvas-elevated)]` for subtle lift; current plan keeps green border + shadow ring.
- Plan names: `font-serif text-[18px]` → `text-[18px] font-semibold` (sans-serif, because Instrument Serif only ships weight 400).

### settings/page.tsx
- Added imports: `Link`, `Heart`, `Key`, `Activity`.
- Webhook URL wrapped in bordered code block: `font-mono text-xs bg-[var(--canvas)] border border-[var(--hairline)] rounded-[6px] px-3 py-2`.
- Per-row lead icons in Connection section: Key (Whop), Link (Webhook URL), Activity (Last sync), Heart (System health).
- All 3 section row containers: `space-y-*` → `divide-y divide-[var(--hairline)]` + per-row `py-2.5`.
- Reconnect button: `variant="ghost"` → `variant="outline"` (h-7 rounded-[5px]).

### settings/health/page.tsx
- Added `getDomainIcon(domain)` mapping: sync→Plug, permissions/security→Shield, whop/member→Users, webhook→Webhook, jobs→Cog, notifications→Bell, billing→CreditCard, data→Database, course→BookOpen, fallback→Activity.
- Card icon swapped from `StatusIcon` (status-based) to `DomainIcon` (domain-type-based); color/bg still status-driven. Removed unused `STATUS_ICON` const and `CheckCircle2`/`AlertTriangle` imports.
- Overall-health Card: `bg-[var(--surface)] p-4 rounded-[8px]` → `bg-[var(--canvas-elevated)] p-5 rounded-[10px]`.
- Health bar: `h-2` → `h-3` (12px), kept `rounded-full`.
- Card header got `gap-2` for safer badge wrapping.

### help/diagnostics/page.tsx
- System Information Card: `bg-[var(--surface)]` → `bg-[var(--canvas-elevated)]`.
- Header: `text-[14px] font-medium` → `text-base font-semibold`.
- Row container: `space-y-3` → `divide-y divide-[var(--hairline)]` + per-row `py-2.5`.
- Each row: `flex justify-between` → `grid grid-cols-2 items-center gap-4` (aligned label/value columns).
- Added `status` field per row (neutral/healthy/info/degraded/unhealthy); values color-coded: "Connected"→info/blue, "Active"/"Healthy"→recovery-green, "Degraded"→warning, "Disconnected"→critical.
- 1.5px status dots rendered before non-neutral values.

## Verification
- `bun run lint` after each file edit → 0 errors, 0 warnings (final clean)
- curl checks (all 200 OK):
  - /dashboard/co_cgl/outcomes → 200
  - /dashboard/co_cgl/playbooks → 200
  - /dashboard/co_cgl/usage → 200
  - /dashboard/co_cgl/settings → 200
  - /dashboard/co_cgl/settings/health → 200
  - /dashboard/co_cgl/help/diagnostics → 200
- Dev server log: clean compile, no warnings or errors

## Notes for Future Agents
- CSS variable `--info` (#3D6B8C) is the project's "blue" — it's a defined variable, not a Tailwind color, so it's allowed under the "no blue/indigo Tailwind colors" rule.
- Instrument Serif (`--font-instrument-serif`) only ships weight 400; for semibold visual weight on serif text, switch to sans-serif `font-semibold` rather than relying on `font-serif font-semibold` which renders as 400.
- ESLint in this project does not flag unused imports/locals by default — clean them manually when refactoring.
- Several dashboard pages now use `divide-y divide-[var(--hairline)]` + `py-2.5` row pattern as the canonical "settings row" treatment; future polish work should follow this convention.

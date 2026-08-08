# Final UI Salvage Audit

**Branch**: `repair/final-release-candidate` (from `repair/px01-px07-production-safe` @ 12c3cb3)
**Donor**: `feat/local-dev-polish`
**Date**: 2025-03-04
**Author**: witejackel-eng

---

## Classification Legend

| Verdict | Meaning |
|---------|---------|
| **KEEP** | Safe to port as-is. No architectural concerns, no regressions, no excessive effects. |
| **ADAPT** | Good idea but needs modification for production (remove glassmorphism, fix routes, add simulated labels, tone down effects). |
| **REJECT** | Unsafe, redundant, or architectural conflict. Not ported. |

---

## File-by-Class Classification

### 1. `src/components/marketing/hero/product-story-visual.tsx` (NEW)

**Verdict: ADAPT**

- **What it brings**: Product-led hero visual with workflow stage animation (Signal → Review → Outcome), candidate card with simulated Maya Thompson data, closing signal SVG motif, `useWorkflowStage` hook, `MobileProductCard` and `MobileOutcomeIndicator` components, attribution truth labels ("Candidate detected", "Activity observed"), reduced-motion support.
- **What needs adaptation**:
  - Syntax error on line `const asPlayedOnce, setHasPlayedOnce]` — should be `const [hasPlayedOnce, setHasPlayedOnce]`. This is a donor typo that must be fixed.
  - The `ClosingSignalPath` SVG uses CSS custom properties (`--hairline-strong`, `--warning`, `--ink-secondary`, `--recovery-green`, `--hairline`, `--ink-muted`, `--ink-primary`) which are present in production — **no issue**.
  - The SVG font references `var(--font-jetbrains-mono)` — verify this is defined in production CSS. If not, fallback to `monospace`.
  - The workflow stage loop replays infinitely — this is acceptable for a hero demo but the idle wait of 6s is reasonable.
  - No excessive glassmorphism, shimmer, or floating particles — the component is already production-disciplined.
- **Port decision**: Port with the typo fix and verify font variable.

---

### 2. `src/components/marketing/hero/rescue-hero.tsx` (MODIFIED)

**Verdict: ADAPT**

- **What it brings**: 55%/45% desktop layout (`grid-cols-[1.15fr_1fr]` / `grid-cols-[1.2fr_1fr]`), mobile stacked layout with `MobileProductCard`, micro trust strip ("Manual approval · Quiet hours · Cooldowns · Student opt-out"), tertiary safety disclosure ("Interactive demo · simulated workspace — No customer data is connected. Nothing is sent."), `ProductStoryVisual` import replacing `ClosingSignalHeroVisual`.
- **What needs adaptation**:
  - The donor hero uses `import { copy } from "@/brand/copy"` **indirectly** — the donor hard-codes all copy strings inline rather than using the `copy` dictionary. Production uses `copy.eyebrow`, `copy.primaryCTA`, etc. Must reconcile: keep the `copy` dictionary for brand consistency while adopting the new layout structure.
  - The micro trust strip and tertiary disclosure copy are **new** and not in the current `copy` dictionary — add them to `src/brand/copy.ts`.
  - The headline is split into two `<motion.span>` blocks ("Close the loop" / "before they leave.") vs. production's single line. This is a stylistic improvement for staggered animation — adopt it.
  - The WorkflowMarquee at the bottom is already in production — no change needed there.
- **Port decision**: Port layout structure, keep `copy` dictionary, add new copy entries.

---

### 3. `src/components/marketing/trust-strip.tsx` (polished)

**Verdict: ADAPT**

- **What it brings**: Polished trust strip with `AnimatedCounter`, subtle gradient wash, hover elevation, accent dots.
- **What needs adaptation**:
  - The donor file has a **syntax error / corrupted content** starting around line 90 — the file appears to be truncated/malformed with invalid JSX (mixing motion.div, span, and text content). The tail end is garbled.
  - The first ~90 lines are clean and use the same pattern as production. Would need to carefully reconstruct or use production's existing version as the base.
  - Hover elevation (`whileHover: { scale: 1.02, y: -2 }`) is mild and acceptable.
- **Port decision**: Port with reconstruction of the corrupted tail section. Low priority — only port if time allows.

---

### 4. `src/components/marketing/hero-preview.tsx` (polished)

**Verdict: ADAPT**

- **What it brings**: Polished hero preview with window chrome, RecoveryPulseCard, SystemHealthCard, RescueQueuePreview, "Live demo" badge, glassmorphism card.
- **What needs adaptation**:
  - The donor file has **severe syntax corruption** starting around line 80. The JSX is malformed with mixed brackets and incomplete expressions.
  - The glassmorphism (`backdrop-blur-xl`, `bg-[var(--surface)]/80`) violates spec section 4 — must be toned down to solid backgrounds.
  - The "Live demo" badge with `animate-ping` is acceptable but the pulsing green dot could be reduced for reduced-motion users.
  - The file relies on internal sub-components (RecoveryPulseCard, SystemHealthCard, RescueQueuePreview) that reference data constants (FUNNEL, QUEUE, STATUS_STYLES) which are not visible in the corrupted output — would need full reconstruction.
- **Port decision**: Port with glassmorphism removal and syntax reconstruction. Medium effort.

---

### 5. `src/components/marketing/outcome-strip.tsx` (polished)

**Verdict: KEEP**

- **What it brings**: Clean outcome strip with 2x2 mobile / 1x4 desktop grid, `AnimatedCounter`, subtle ping dots for highlighted metrics, reduced-motion support.
- **Assessment**: No glassmorphism, no shimmer, no excessive effects. Uses standard design system variables. Layout is solid. The ping dots are subtle and respect reduced-motion. The `interactive demonstration` label is appropriate.
- **Port decision**: Port as-is.

---

### 6. `src/components/marketing/feature-rows.tsx` (polished)

**Verdict: KEEP**

- **What it brings**: Feature rows with illustrations, scroll-reveal animations, alternating layout, hover expansion (`group-hover:py-14`).
- **Assessment**: No glassmorphism, no shimmer. The hover expansion is subtle and meaningful (draws attention to the feature). Uses `ScrollReveal`, `SectionEyebrow`, and illustration components that exist in production. Clean code.
- **Port decision**: Port as-is.

---

### 7. `src/components/marketing/roi-calculator.tsx` (polished)

**Verdict: ADAPT**

- **What it brings**: Full ROI calculator with slider inputs, live computation, breakeven per plan, assumptions disclosure.
- **What needs adaptation**:
  - Syntax error: `const embers, setMembers]` should be `const [members, setMembers]` — donor typo.
  - Uses `formatCurrency` from `@/lib/format` — must verify this exists in production.
  - The gradient accent bar on computed outcomes is subtle and acceptable.
  - No glassmorphism, no shimmer. The slider design is clean.
- **Port decision**: Port with typo fix. Verify `formatCurrency` exists.

---

### 8. `src/components/marketing/pricing-section.tsx` (polished)

**Verdict: ADAPT**

- **What it brings**: Detailed pricing with plan cards, includes/excludes, value logic, billing/migration/reference footnotes.
- **What needs adaptation**:
  - The **shimmer effect** on the featured CTA (`animate-[shimmer_2.5s_infinite]`) violates spec section 4 — **remove the shimmer**.
  - The inline `<style>` tag for `@keyframes shimmer` must also be removed.
  - Otherwise the component is clean: no glassmorphism, no floating particles, no excessive animation.
  - Uses `formatCurrency` — verify existence.
- **Port decision**: Port with shimmer removal.

---

### 9. `src/components/marketing/faq-section.tsx` (polished)

**Verdict: KEEP**

- **What it brings**: Accordion FAQ with left-border highlight, animated chevron, `AnimatePresence` for smooth open/close.
- **Assessment**: Clean, no excessive effects. Reduced-motion respected. Left border highlight is subtle and meaningful. Content is thorough and honest.
- **Port decision**: Port as-is.

---

### 10. `src/components/marketing/final-cta.tsx` (polished)

**Verdict: ADAPT**

- **What it brings**: Final CTA section with cursor-responsive spotlight, recovery ring illustration, decorative corners.
- **What needs adaptation**:
  - Syntax error: `const ousePos, setMousePos]` should be `const [mousePos, setMousePos]` — donor typo.
  - The **floating dot background** (`radial-gradient` dots) is decorative but not excessive — acceptable.
  - The **cursor-responsive spotlight** (`radial-gradient` following mouse) is subtle — acceptable.
  - The **recovery ring illustration** has continuous `ring-rotate` animation (30s) and `animate` elements on evidence nodes — these are **continuous animation with no product meaning** per spec section 4. Tone down: remove the continuous rotation, keep the static ring.
  - The gradient text on "students continue" is acceptable as a one-time visual accent.
- **Port decision**: Port with typo fix and removal of continuous ring rotation. Keep the static ring illustration.

---

### 11. `src/components/marketing/closing-cta.tsx` (polished)

**Verdict: ADAPT**

- **What it brings**: Dark closing CTA section with diagonal pattern, gradient text headline, soft glow.
- **What needs adaptation**:
  - The **floating dot background** is decorative but subtle — acceptable.
  - The **diagonal line pattern** (`repeating-linear-gradient(-45deg)`) is very subtle at `opacity-[0.04]` — acceptable.
  - The **grid texture** is also very subtle — acceptable.
  - The gradient text on "free recovery audit" is a single accent — acceptable.
  - No glassmorphism, no shimmer. The component is otherwise clean.
- **Port decision**: Port as-is (effects are already toned down enough).

---

### 12. `src/components/marketing/footer.tsx` (polished)

**Verdict: KEEP**

- **What it brings**: Clean footer with brand, link columns, gradient top border accent, "Private preview" badge.
- **Assessment**: No excessive effects. The gradient top border is a single subtle accent. Clean structure. Uses `RescueLoopLogo` which exists in production.
- **Port decision**: Port as-is.

---

### 13. `src/components/shared/keyboard-shortcuts-overlay.tsx` (NEW)

**Verdict: ADAPT**

- **What it brings**: Keyboard shortcuts overlay with categories (Navigation, Queue Actions, General), global keyboard listener (? and Ctrl+/), backdrop blur.
- **What needs adaptation**:
  - The **backdrop blur** (`backdrop-blur-sm`) on the overlay is acceptable for a modal — not the same as decorative glassmorphism.
  - Syntax error: `[open, andleKeyDown]` should be `[open, handleKeyDown]` — donor typo.
  - The global open/close state uses module-level variables (`globalOpen`, `globalListeners`) — this works but is not React-idiomatic. Acceptable for a singleton overlay.
  - The `Escalator` icon from lucide-react is used for "Esc" — this is an odd choice but not harmful.
  - The `Moon` icon is imported but only used in the shortcut definitions — no issue.
- **Port decision**: Port with typo fix.

---

### 14. `src/components/shared/activity-feed.tsx` (NEW)

**Verdict: ADAPT**

- **What it brings**: Real-time activity feed with simulated events, pause/resume, status indicators.
- **What needs adaptation**:
  - Uses `var(--critical)` CSS variable — must verify this exists in production. If not, add it or use a fallback.
  - The `animate-ping` on the live indicator is acceptable (it's a standard UI pattern for "live" status).
  - The simulated event generation uses `Math.random()` — this is fine for a demo component.
  - The component is well-structured with proper AnimatePresence, layout animations, and reduced-motion support.
- **Port decision**: Port as-is (verify `--critical` variable exists).

---

### 15. `src/components/shared/toast-provider.tsx` (NEW)

**Verdict: KEEP**

- **What it brings**: Global toast notification system with success/error/warning/info types, auto-dismiss, progress bar, action buttons, stacking.
- **Assessment**: Clean implementation. Uses module-level state (like keyboard-shortcuts-overlay) which is acceptable for a singleton provider. Progress bar is a nice UX touch. No excessive effects. Proper `aria-live="polite"`.
- **Port decision**: Port as-is.

---

### 16. `src/components/shared/metric-card.tsx` (MODIFIED)

**Verdict: ADAPT**

- **What it brings**: Enhanced metric card with glassmorphism option, gradient strip, shimmer border, sparkline, trend direction, comparison text, loading skeleton.
- **What needs adaptation**:
  - The `glass` prop enables a `"glass"` CSS class — this is **glassmorphism** which violates spec section 4. **Remove the `glass` prop and class** or ensure it's never used in production.
  - The `shimmerBorder` prop enables a `"shimmer-border"` CSS class — this is a **shimmer effect** which violates spec section 4. **Remove the `shimmerBorder` prop and class**.
  - The `gradientStrip` prop is acceptable — it's a subtle top accent, not excessive.
  - The `sparklineData` and `SparklineMini` integration is valuable — keep.
  - The `loading` skeleton is valuable — keep.
  - The `trendDirection` and `comparisonText` are valuable — keep.
- **Port decision**: Port with removal of `glass` and `shimmerBorder` props.

---

### 17. `src/components/interaction/command-palette.tsx` (MODIFIED)

**Verdict: ADAPT**

- **What it brings**: Enhanced command palette with recent items, search highlighting, quick actions (dark mode, mark read, refresh, pause automation), keyboard shortcuts dialog, company-scoped navigation.
- **What needs adaptation**:
  - Uses `useDemoStore` from `@/features/demo-engine/demo-store` — must verify this exists in production.
  - Uses `useRecentItems` and `serializeIcon` from `@/hooks/use-recent-items` — must verify these exist.
  - Uses `CommandDialog`, `CommandInput`, etc. from `@/components/ui/command` — these are shadcn/ui components that exist.
  - The `basePath` prop for company-scoped navigation is a good addition.
  - The search highlighting (`HighlightMatch`) is a nice UX improvement.
  - The inline keyboard shortcuts dialog is redundant with `keyboard-shortcuts-overlay.tsx` — consider consolidating.
- **Port decision**: Port with verification of demo-store and use-recent-items dependencies.

---

## Explicitly Rejected Files (per spec)

| File | Reason |
|------|--------|
| `prisma/schema.prisma` | Has SQLite regression — production schema is correct |
| `package.json` | Donor project config — not applicable |
| `bun.lock` | Donor lock file — not applicable |
| `tsconfig.json` | Donor config — not applicable |
| `next.config.*` | Donor config — not applicable |
| `.env files` | Environment config — not applicable |
| Any `z-ai-web-dev-sdk` references | Must not be on client side |

---

## Summary

| Verdict | Count | Files |
|---------|-------|-------|
| KEEP | 4 | outcome-strip, feature-rows, faq-section, footer, toast-provider |
| ADAPT | 12 | product-story-visual, rescue-hero, trust-strip, hero-preview, roi-calculator, pricing-section, final-cta, closing-cta, keyboard-shortcuts-overlay, activity-feed, metric-card, command-palette |
| REJECT | 7+ | prisma/schema, package.json, bun.lock, tsconfig.json, next.config.*, .env, z-ai-web-dev-sdk |

### Key Adaptations Required Across All ADAPT Files

1. **Remove glassmorphism** — No `backdrop-blur` on decorative elements, no `glass` CSS class
2. **Remove shimmer effects** — No `animate-[shimmer_*]`, no `shimmer-border` class
3. **Remove continuous animation with no product meaning** — Static ring illustrations instead of rotating ones
4. **Fix donor typos** — `asPlayedOnce` → `[hasPlayedOnce`, `embers` → `[members`, `ousePos` → `[mousePos`, `andleKeyDown` → `handleKeyDown`
5. **Use `copy` dictionary** — Donor hard-codes strings; production uses `@/brand/copy`
6. **Verify CSS variables** — `--critical`, `--font-jetbrains-mono`, etc.
7. **Verify dependency modules** — `@/lib/format`, `@/features/demo-engine/demo-store`, `@/hooks/use-recent-items`

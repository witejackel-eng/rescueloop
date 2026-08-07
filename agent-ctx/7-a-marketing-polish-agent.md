# Task 7-a — Marketing Page Polish

## Summary
Applied targeted visual polish to the RescueLoop marketing landing page at `/` — added 3 new components (TrustStrip, HeroPreview, ClosingCta), improved the dark Recovery Process section contrast/accents, and strengthened the footer border. All work uses existing CSS variables (no blue/indigo colors), existing shadcn/ui components, framer-motion, and Lucide icons. No new dependencies added.

## Files Created

### `src/components/marketing/trust-strip.tsx`
- 3 stat cards rendered as a responsive 1→3 column grid with vertical dividers
- Stats: 1,247 students rescued, $89K revenue recovered, 42% avg recovery rate
- Uses `AnimatedCounter` for the numbers, serif font for the display value
- Per-stat accent dot (recovery-green / ink-primary / info) for visual variety
- Subtitle row: "as reported by creators in private preview" with green dot
- framer-motion fade-up with staggered delays, respects reduced motion

### `src/components/marketing/hero-preview.tsx`
- Stylized non-interactive dashboard preview card below the hero
- Floating "Live demo" badge (pulsing green dot) in top-right corner
- Window chrome header (3 traffic dots + "rescueloop · creator dashboard" + overview tab badge)
- 2-column grid:
  - **Recovery Pulse card** — 4 animated funnel bars (Detected 23 → Reviewed 18 → Approved 12 → Returned 7) with staggered width animations, footer with green check + "7 of 23 confirmed returned · 30% recovery rate"
  - **System Health card** — 4 healthy domain rows (Whop sync, Webhook, Attribution, Notifications) + Operational pill
  - **Rescue Queue preview** (full-width) — 3 fake students (Maya Chen / Devon Park / Sara Reyes) with avatar initials, course subtitle, and status pills colored with warning/info/recovery-green
- Rounded-[10px] cards, rounded-[8px] inner elements, soft shadow stack
- Subtle gradient wash + radial green glow backdrop
- Caption: "Static preview · numbers shown are illustrative sample data"
- Lucide icons used: Users, AlertTriangle, CheckCircle2, TrendingUp, Activity
- All framer-motion fade-up with staggered delays

### `src/components/marketing/closing-cta.tsx`
- Dark CTA banner placed before the footer (after FinalCta)
- Background: `bg-[var(--dark-section)]` (near-black)
- Textures: diagonal pattern overlay + soft radial green glow at top + grid lines
- Eyebrow: "Private preview · no card required" with green dot
- Headline: "Start your free **free recovery audit.**" with green italic emphasis
- Subtitle explaining the value (full workflow walkthrough, simulated, nothing sent)
- Two CTAs:
  - Primary: white bg, dark text → "Explore the demo" → `/overview` (ArrowRight icon)
  - Secondary: outline with dark-hairline border → "See student experience" → `/student-rescue` (User icon)
- Footnote: "Interactive demonstration · simulated workspace · no real customer data"
- framer-motion fade-up staggered

## Files Modified

### `src/components/marketing/process/recovery-process-section.tsx`
- Step titles switched from `font-serif` (only weight 400) to `font-sans font-semibold tracking-[-0.01em]` for real visual weight on the dark background (kept `text-white`)
- Step descriptions changed from `text-[var(--dark-secondary)]` to `text-[var(--dark-secondary)]/85` for slightly better readability
- Roman numerals now transition to `text-[var(--recovery-green)]` when step is active (was static dark-secondary)
- Added green left-border accent on each step row when active (absolute-positioned 2px-wide, 60%-height vertical bar, rounded-full, opacity-transitioned over 500ms)
- Added `pl-5 lg:pl-6` padding on step rows to accommodate the accent bar without overlapping the Roman numeral
- Reduced desktop title font-size from 28px to 26px for visual balance with the heavier weight
- Made step button `group relative` so the accent can be positioned absolutely

### `src/components/marketing/footer.tsx`
- Strengthened top border from `border-t border-[var(--hairline)]` to `border-t-[1.5px] border-[var(--hairline-strong)]` for cleaner visual separation from the dark ClosingCta banner above

### `src/app/(marketing)/page.tsx`
- Imported 3 new components (TrustStrip, HeroPreview, ClosingCta)
- Inserted `TrustStrip` and `HeroPreview` between `RescueHero` and `OutcomeStrip`
- Inserted `ClosingCta` between `FinalCta` and `MarketingFooter`

## Final Page Flow
FloatingNav → RescueHero → **TrustStrip** → **HeroPreview** → OutcomeStrip → FeatureRows → RevenueLeakageSection → RecoveryProcessSection → WorkflowShowcase → CourseIntelligenceSection → SafetySection → RoiCalculator → PricingSection → FaqSection → FinalCta → **ClosingCta** → MarketingFooter

## Design Constraints Honored
- Used only existing CSS variables (no blue/indigo Tailwind colors)
- Used `rounded-[10px]` / `rounded-[8px]` for cards
- All animations use framer-motion with subtle transitions
- Used existing Lucide icons (Users, AlertTriangle, CheckCircle2, TrendingUp, Activity, ArrowRight, User)
- Used existing `AnimatedCounter` and `useReducedMotion` utilities
- Respects `prefers-reduced-motion` throughout

## Verification
- `curl http://localhost:3000/` → 200 ✅
- `curl http://localhost:3000/overview` → 200 ✅
- `bun run lint` → 0 errors, 0 warnings ✅
- `tail dev.log` → clean compilation, no errors ✅
- agent-browser read confirms all new sections render with expected content ✅

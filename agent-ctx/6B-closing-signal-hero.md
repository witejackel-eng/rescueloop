# Task 6B — ClosingSignalHeroVisual

## What was done
- Created `src/components/marketing/hero/closing-signal-visual.tsx` — a product-meaningful SVG animation replacing RecoveryLoopCanvas
- Updated `src/components/marketing/hero/rescue-hero.tsx` — swapped RecoveryLoopCanvas for ClosingSignalHeroVisual, adjusted sizing for 1366×768

## Animation story
1. Open arc draws in (pathLength animation)
2. Signal node activates → pulse dot appears
3. Pulse travels to Review → Review activates
4. Pulse travels to Support → Support activates
5. Pulse travels to Return → Return activates
6. Loop closes (green segment fills the gap)
7. Evidence badge appears in center (checkmark + label)
8. Cycle resets after ~9s

## Reduced motion
- All stages immediately active
- Loop fully closed
- Evidence badge visible
- No glow rings, no pulse dot, no motion

## Hero copy (verified)
- Eyebrow: "Activation rescue for Whop creators"
- Headline: "Close the loop before they leave."
- Support: "Find who needs help. Approve the right message. See what changed."
- Trust: "Nothing sends without your approval."
- Primary CTA: "Explore the interactive demo"
- Secondary CTA: "See the student experience"
- Disclosure: "Interactive demonstration. No messages are sent and no customer data is connected."

## Key decisions
- Used SVG paths (not canvas) for better framer-motion integration and accessibility
- rAF-driven animation hook with `computeState()` pure function for testability
- Lint-compliant: setState only called from rAF callbacks (async), not synchronously in effects
- Brand tokens: --warning (amber) for signal, --ink-secondary for review, --info for support, --recovery-green for return

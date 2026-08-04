# RescueLoop

**Recover more value from the members you already have.**

RescueLoop is a student-success and recurring-revenue recovery platform for Whop course creators. It detects paying members who never started, students who stopped progressing, and members approaching cancellation — then sends respectful, high-signal recovery interventions that bring them back.

---

## The problem

Course creators on Whop lose significant revenue to silent churn: members who pay but never start, stall mid-course, or cancel without ever reaching their goal. Existing tools show dashboards and metrics, but none close the loop between detection and respectful, timely re-engagement. Creators are left guessing who needs help and manually messaging students one by one — if they message them at all.

## What RescueLoop does

RescueLoop runs a continuous recovery loop:

1. **Detects** at-risk members across four risk segments (never started, early stall, mid-course stall, near completion) plus cancellation and renewal signals.
2. **Reviews** each candidate in an operational queue where the creator approves, edits, schedules, or dismisses every intervention.
3. **Intervenes** with templated, safety-controlled messages sent through the right campaign at the right time.
4. **Observes** whether the student returns, completes a lesson, or reverses a cancellation.
5. **Attributes** the outcome as confirmed, strongly associated, or estimated — never combining them into one exaggerated number.
6. **Improves** the course by surfacing lesson-level friction points and blocker patterns backed by real student feedback.

## Core workflow

```
Detect → Review → Intervene → Observe → Attribute → Improve
```

Every step respects a single principle: **nothing is sent automatically until the creator is ready.** The default automation state is *Manual approval*, meaning every recovery message is reviewed by a human before it reaches a student.

## Main features

- **Overview dashboard** — four primary outcome cards (confirmed value, students rescued, activations, creator attention required), a recovery funnel, risk-segment cards, a live activity feed, and a course-friction finding card.
- **Rescue Queue** — a tabbed operational queue (Awaiting review, Approved, Scheduled, Sent, Responded, Recovered, Dismissed) with search, filters, sorting, row selection, bulk actions, and a detailed right-side student drawer.
- **Student drawer** — identity, course and membership, progress timeline, why-flagged evidence, recommended action, message preview, send timing, cooldown, previous interventions, and attribution evidence.
- **Campaigns** — five campaign types (Activation, Early Progress, Mid-Course, Near-Finish, Cancellation Rescue) each with a rule builder, safety controls, and a live message preview. Cancellation Rescue defaults to manual approval.
- **Students directory** — searchable member directory with saved views (All members, Needs attention, Never started, Inactive 7+ days, Renewing this week, Cancellation pending, Previously rescued) and momentum classification (Accelerating, Steady, Slowing, Stopped, Recovered).
- **Insights** — course progression funnel, lesson friction map, blocker analysis, and evidence-backed recommendation cards with actions (Mark planned, Mark completed, Dismiss, View affected students).
- **Value Ledger** — three-tier attribution (Confirmed, Strongly associated, Estimated) with a ledger table, ROI card, and a clear methodology that never combines tiers into one number.
- **Student-facing rescue experience** — a separate, mobile-first, calm interface where students report what's blocking them without ever seeing revenue, churn, or risk terminology.
- **Notification drawer** — unresolved creator actions (help requests, cancellation detections, recoveries, friction findings, sync problems, plan limits) with a badge that counts only unresolved items.
- **Polished empty, loading, and error states** — every view handles the absence of data gracefully with descriptive, process-oriented messaging.

## Screens and routes

| Route | Description |
|-------|-------------|
| `/` | Demo entry — choose to view the demo dashboard or start onboarding |
| `/onboarding` | Five-step onboarding flow (introduction → select course → confirm mapping → audit → results) |
| `/overview` | Main dashboard with outcome cards, funnel, risk segments, activity feed |
| `/rescue-queue` | Operational queue with tabs, table, filters, and student drawer |
| `/students` | Searchable member directory with saved views and momentum |
| `/campaigns` | Campaign list with five campaign types |
| `/campaigns/[campaignId]` | Campaign editor with rule builder, safety controls, and message preview |
| `/insights` | Course funnel, lesson friction, blocker analysis, recommendations |
| `/value` | Value ledger with three-tier attribution and ROI |
| `/settings` | General, automation, Whop connection, notifications, plan, data, danger zone |
| `/student-rescue` | Student-facing rescue screen (mobile-first, no dashboard chrome) |
| `/student-rescue/blocker` | Student-facing blocker selection and confirmation |

## Technology stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **UI components:** shadcn/ui (New York style) with Lucide icons
- **Charts:** Recharts
- **Animation:** Framer Motion (restrained, 180–250ms transitions, `prefers-reduced-motion` respected)
- **Fonts:** Geist (interface) and JetBrains Mono (revenue, percentages, counts)
- **State:** React hooks (`useState`, `useMemo`) — no external state library needed for this phase
- **Notifications:** Sonner toasts
- **Code quality:** ESLint with Next.js rules

## Architecture

The application is structured around clear boundaries that will survive the transition from mock data to a real backend:

```
src/
├── app/
│   ├── layout.tsx              # Root layout (fonts, toaster)
│   ├── page.tsx                # Demo entry (/)
│   ├── onboarding/             # Five-step onboarding flow
│   ├── (dashboard)/            # Route group wrapped in AppShell
│   │   ├── layout.tsx          # AppShell + Sonner toaster
│   │   ├── overview/
│   │   ├── rescue-queue/
│   │   ├── students/
│   │   ├── campaigns/
│   │   │   └── [campaignId]/
│   │   ├── insights/
│   │   ├── value/
│   │   └── settings/
│   └── (student)/              # Route group for student-facing experience
│       ├── layout.tsx          # Minimal calm layout (no dashboard chrome)
│       └── student-rescue/
│           └── blocker/
├── components/
│   ├── ui/                     # shadcn/ui primitives
│   ├── shared/                 # Cross-cutting: logo, status pills, layout primitives
│   ├── layout/                 # App shell, header, notification drawer
│   └── rescueloop/             # Feature components grouped by page
│       ├── overview/
│       ├── rescue-queue/
│       ├── campaigns/
│       ├── students/
│       ├── insights/
│       ├── value/
│       └── settings/
└── lib/
    ├── types.ts                # Typed domain models
    ├── mock-data.ts            # Coherent demo dataset
    ├── format.ts               # Formatting + status metadata maps
    └── utils.ts                # cn() utility
```

**Server Components by default.** Client Components (`"use client"`) are used only where interactivity is required: tabs, tables, drawers, filters, charts, forms, and animations.

**Typed domain models** (`src/lib/types.ts`) define every entity: `Company`, `Course`, `Product`, `Membership`, `Student`, `StudentCourseState`, `Campaign`, `Intervention`, `BlockerResponse`, `ValueEvent`, `Notification`, `FrictionFinding`, and more. Mock data conforms to these types so the real backend can replace `mock-data.ts` without touching UI code.

## Visual system and animation

The landing page uses a premium editorial visual system inspired by the Optimus reference, translated into RescueLoop's student-success context.

### Signature hero

The hero uses a full-viewport composition with:
- **Kinetic headline** — the final word cycles through `start → continue → finish → stay` with character-by-character blur-to-sharp reveal animation (2.8s per word, pauses when tab hidden, respects reduced motion)
- **Recovery Loop Canvas** — an original ASCII orbit illustration where student signals travel along a circular loop representing Signal → Review → Support → Return. Stalled nodes are amber; recovered nodes turn green. Uses `requestAnimationFrame`, pauses when offscreen, scales particle count by viewport
- **Technical grid** — extremely low-contrast 12×8 grid with a radial mask that fades near the headline for readability
- **Subtle noise texture** at 0.025 opacity
- **Workflow marquee** — an infinite horizontal rail of truthful product concepts (Detect → Review → Approve → Respond → Resume → Attribute → Improve) using CSS transforms, pausing on hover

### Motion tokens

All animation uses a central motion configuration (`src/design-system/motion.ts`):
- 160–240ms for controls and micro-interactions
- 600ms for scroll reveals
- 900ms for hero entrances
- 2.8s for kinetic word cycling
- 5.5s for process-section auto-advance
- 32s for marquee loops
- Springs (stiffness 260, damping 28) for layout animations

### Animated feature illustrations

Four original inline-SVG illustrations with sequential CSS/Framer Motion animation:
1. **Signal Detection** — progress timeline with lesson dots, fading momentum line, detection pulse, evidence card
2. **Rescue Queue** — student rows entering a queue, one selected, inspector content revealing in sequence, manual-approval badge
3. **Student Support** — mobile card with calm options, one highlighting, branch to a resumed outcome
4. **Honest Attribution** — three separated evidence tiers (Confirmed / Associated / Estimated), outcome event moving into the correct tier

### Dark process section

A high-contrast dark section ("From lost momentum to renewed progress") with four steps (Detect → Review → Support → Measure). Auto-advances every 5.5s with a progress bar, pauses on manual interaction. A sticky visual panel reveals content line-by-line with blur-to-sharp transitions, showing a different RescueLoop-specific operational panel per step.

### Final CTA

A cursor-responsive panel with a radial spotlight that follows the mouse, plus an animated recovery-ring SVG with orbiting evidence nodes and flowing dashed arcs.

### Demo honesty

All demo surfaces are clearly labeled "Interactive demo · simulated workspace". Sync status reads "Demo sync" rather than implying real-time data. Recovered value is labeled "Illustrative" rather than "Confirmed" in the dashboard. No fake testimonials, customer logos, security certifications, or real-time claims.

## Design principles

1. **Calm, not flashy.** The product feels like a trustworthy command centre, not a trading terminal or cybersecurity interface.
2. **Numbers are honest.** Confirmed, strongly associated, and estimated value are always separated. ROI uses confirmed value only.
3. **The creator is in control.** The default state is *Manual approval*. There is no "message everyone immediately" button.
4. **Interventions are respectful.** Cooldowns, quiet hours, max-message limits, and stop-after-response/progress safeguards are built into every campaign.
5. **The student experience is separate.** Students never see revenue, churn, risk, or cancellation terminology. Their interface is friendly and non-judgmental.
6. **Accessibility is foundational.** Keyboard navigation, visible focus states, semantic HTML, ARIA labels, sufficient contrast, and `prefers-reduced-motion` support throughout.
7. **Restraint in motion.** 180–250ms transitions for functional movement only. No cinematic intros, floating decorations, or permanent animation.

## Mock data

All demo data lives in `src/lib/mock-data.ts` and represents one coherent account:

| Field | Value |
|-------|-------|
| Company | Creator Growth Lab |
| Product | Agency Accelerator ($79/month) |
| Course | Agency Growth System (29 lessons, 742 students) |
| At-risk students | 118 |
| Interventions sent | 78 |
| Students re-engaged | 31 |
| First-time activations | 9 |
| Cancellations reversed | 3 |
| Confirmed recovered revenue | $237 |
| Estimated 90-day retained value | $711 |
| Creator action requests | 11 |
| Plan cost | $29/month |
| Confirmed value-to-cost | 8.2× |

These figures are consistent across every page, chart, table, and report. Twelve named students with realistic progress histories, memberships, renewal dates, blockers, and intervention states power the queue, directory, and drawer. The dataset is structured so that replacing `mock-data.ts` with real API calls requires no UI changes.

## Local installation

```bash
# Clone the repository
git clone https://github.com/witejackel-eng/rescueloop.git
cd rescueloop

# Install dependencies
bun install

# Start the development server
bun run dev
```

The application runs at `http://localhost:3000`.

## Development commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start the development server (port 3000) |
| `bun run lint` | Run ESLint to check code quality |
| `bun run build` | Create a production build |
| `bun run start` | Start the production server |
| `bun run db:push` | Push Prisma schema to the database (future use) |
| `bun run db:generate` | Generate Prisma client (future use) |

## Environment variables

**None are currently required.** The frontend phase uses only local typed mock data. When the Whop integration and backend are added, a `.env.example` file will document the required variables (Whop API key, database URL, etc.). For now, no `.env` file is needed to run the application.

## Production build

```bash
bun install
bun run build
bun run start
```

The build compiles all routes, type-checks the codebase, and produces an optimized production bundle.

## Testing and validation

- **ESLint:** `bun run lint` passes with zero errors and zero warnings.
- **TypeScript:** Strict mode enabled; all types resolve correctly.
- **Browser verification:** Every route was opened and verified in a headless browser — no console errors, no hydration mismatches, no broken interactions.
- **Responsive:** Layouts tested at mobile (375px), tablet (768px), and desktop (1440px) widths.
- **Accessibility:** Semantic HTML, keyboard-navigable tabs and drawers, visible focus states, ARIA labels on interactive elements, and `prefers-reduced-motion` support.
- **Data consistency:** All demo figures verified consistent across the overview, rescue queue, campaigns, students, insights, and value ledger pages.

## Planned Whop integration

The next phase will connect RescueLoop to the Whop platform:

- **Whop Memberships API** — sync active, trialing, and cancelling memberships with renewal dates and payment status.
- **Whop Products API** — map products to courses and confirm access relationships.
- **Course progress sync** — integrate with the course platform's progress data (Lessons API or LMS webhook).
- **Outbound messaging** — send interventions through Whop's messaging channel or email.
- **OAuth** — let creators connect their Whop account with a single click; no API keys to manage.

The mock data layer (`src/lib/mock-data.ts`) and typed domain models (`src/lib/types.ts`) are structured so that each mock function maps to a future API call. The UI will not change.

## Planned backend architecture

```
Whop API ──→ Sync Service ──→ PostgreSQL
                               │
                               ├── Detection Engine (risk signals, cooldowns, eligibility)
                               ├── Campaign Runner (scheduling, safety checks, quiet hours)
                               ├── Attribution Service (confirmed / associated / estimated)
                               └── Notification Service (creator actions, student replies)
                                       │
                               Next.js API Routes (App Router)
                                       │
                               RescueLoop Frontend (this repo)
```

- **Database:** PostgreSQL via Prisma ORM (schema already scaffolded).
- **Sync:** Periodic Whop membership and progress sync with incremental updates.
- **Detection:** Rule-based engine evaluating progress, inactivity, renewal proximity, and cancellation signals against campaign rules.
- **Attribution:** Time-windowed causal analysis linking interventions to student returns, with explicit confidence tiers.
- **Real-time:** WebSocket updates for the activity feed and notification badge.

## Roadmap

1. **Whop OAuth + membership sync** — connect creator accounts and sync members.
2. **Course progress integration** — ingest lesson completion data.
3. **Live intervention sending** — deliver approved messages through Whop.
4. **Attribution engine** — compute confirmed/associated/estimated value in real time.
5. **Blocker feedback loop** — route student blocker responses to insights and creator notifications.
6. **A/B message testing** — compare message templates within a campaign.
7. **Multi-course support** — manage recovery across multiple products and courses.
8. **Team collaboration** — multiple reviewers, role-based approval workflows.

## Privacy and ethical-intervention principles

- **Students are never labeled "at risk" in any student-facing surface.** Risk terminology exists only in the creator dashboard.
- **No countdown timers, false urgency, or manipulative language** in student-facing messages.
- **Every intervention has a cooldown** — a student will never receive repeated messages in a short window.
- **Quiet hours are enforced** — messages are not sent during configured quiet hours.
- **Students can stop automation** — if a student responds, resumes progress, or ends their membership, automation stops for them.
- **Cancellation Rescue requires manual approval** — there is no automatic cancellation-recovery flow.
- **Data is never sold or shared** — student data is used solely to improve their own course experience.
- **Estimated value is clearly labeled** — projected figures are never presented as confirmed revenue.

## Repository ownership

- **Owner:** `witejackel-eng`
- **Repository:** `rescueloop`
- **Visibility:** Private
- **All commits authored by:** `witejackel-eng`

## License status

Proprietary. All rights reserved. This software and its source code are the property of the repository owner. No license is granted for use, modification, or distribution beyond the repository owner's explicit written consent.

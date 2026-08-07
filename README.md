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
- **Rescue Queue** — a tabbed operational queue (Awaiting review, Approved, Scheduled, Dispatched, Responded, Recovered, Dismissed) with search, filters, sorting, row selection, bulk actions, and a detailed right-side student drawer.
- **Student drawer** — identity, course and membership, progress timeline, why-flagged evidence, recommended action, message preview, send timing, cooldown, previous interventions, and attribution evidence.
- **Campaigns** — five campaign types (Activation, Early Progress, Mid-Course, Near-Finish, Cancellation Rescue) each with a rule builder, safety controls, and a live message preview. Cancellation Rescue defaults to manual approval.
- **Students directory** — searchable member directory with saved views (All members, Needs attention, Never started, Inactive 7+ days, Renewing this week, Cancellation pending, Previously rescued) and momentum classification (Accelerating, Steady, Slowing, Stopped, Recovered).
- **Insights** — course progression funnel, lesson friction map, blocker analysis, and evidence-backed recommendation cards with actions (Mark planned, Mark completed, Dismiss, View affected students).
- **Value Ledger** — three-tier attribution (Confirmed, Strongly associated, Estimated) with a ledger table, ROI card, and a clear methodology that never combines tiers into one number.
- **Student-facing rescue experience** — a separate, mobile-first, calm interface where students report what's blocking them without ever seeing revenue, churn, or risk terminology.
- **Notification drawer** — unresolved creator actions (help requests, cancellation detections, recoveries, friction findings, sync problems, plan limits) with a badge that counts only unresolved items.
- **Polished empty, loading, and error states** — every view handles the absence of data gracefully with descriptive, process-oriented messaging.

## Screens and routes

### Demo routes (fixture data, no backend required)

| Route | Data source | Description |
|-------|-------------|-------------|
| `/` | Fixture | Landing page — marketing hero, features, pricing, CTA |
| `/overview` | Fixture | Dashboard with outcome cards, funnel, risk segments, activity feed |
| `/rescue-queue` | Fixture | Operational queue with tabs, table, filters, and student drawer |
| `/students` | Fixture | Searchable member directory with saved views and momentum |
| `/campaigns` | Fixture | Campaign list with five campaign types |
| `/campaigns/[campaignId]` | Fixture | Campaign editor with rule builder, safety controls, and message preview |
| `/insights` | Fixture | Course funnel, lesson friction, blocker analysis, recommendations |
| `/value` | Fixture | Value ledger with three-tier attribution and ROI |
| `/settings` | Fixture | General, automation, Whop connection, notifications, plan, data, danger zone |
| `/onboarding` | Fixture | Five-step onboarding flow |
| `/student-rescue` | Fixture | Student-facing rescue screen (mobile-first, no dashboard chrome) |
| `/student-rescue/blocker` | Fixture | Student-facing blocker selection and confirmation |
| `/legal/*` | Static | Terms, privacy, security, data-processing |

### Connected workspace routes (real database, Whop auth)

| Route | Data source | Description |
|-------|-------------|-------------|
| `/companies/[companyId]/overview` | PostgreSQL | Real overview with live intervention counts |
| `/companies/[companyId]/queue` | PostgreSQL | Real rescue queue with approve/dismiss/schedule/suppress |
| `/companies/[companyId]/students` | PostgreSQL | Real student directory |
| `/companies/[companyId]/campaigns` | PostgreSQL | Real campaign management |
| `/companies/[companyId]/insights` | PostgreSQL | Real insights and friction findings |
| `/companies/[companyId]/value` | PostgreSQL | Real value ledger and attribution |
| `/companies/[companyId]/settings` | PostgreSQL | Real org settings with pause/resume |
| `/companies/[companyId]/audit` | PostgreSQL | Real audit trail |
| `/companies/[companyId]/sync` | PostgreSQL | Sync status and manual trigger |
| `/companies/[companyId]/usage` | PostgreSQL | Plan usage and limits |
| `/companies/[companyId]/onboarding` | PostgreSQL + Whop | Onboarding with real Whop course/product data |
| `/companies/[companyId]/responses` | PostgreSQL | Student response center |

### Student experience routes

| Route | Data source | Description |
|-------|-------------|-------------|
| `/experiences/[experienceId]/rescue/[token]` | PostgreSQL | Student rescue screen (token-authenticated) |

### Internal operations workspace (internal auth)

| Route | Data source | Description |
|-------|-------------|-------------|
| `/internal` | PostgreSQL | Internal dashboard |
| `/internal/pilots` | PostgreSQL | Pilot application review |
| `/internal/sync` | PostgreSQL | Cross-org sync status |
| `/internal/jobs` | PostgreSQL | Job queue monitoring |
| `/internal/webhooks` | PostgreSQL | Webhook receipt log |
| `/internal/dead-letters` | PostgreSQL | Dead letter event review and re-queue |
| `/internal/usage` | PostgreSQL | Usage counter and plan enforcement |
| `/internal/organisations` | PostgreSQL | Organisation management |
| `/internal/data-requests` | PostgreSQL | Data export/deletion requests |

### API routes

| Route | Description |
|-------|-------------|
| `POST /api/webhooks/whop` | Whop webhook ingestion (Standard Webhooks verification) |
| `GET/POST /api/inngest` | Inngest job function execution |
| `POST /api/private-pilot` | Pilot application submission |
| `POST /api/companies/[companyId]/queue/[interventionId]/approve` | Approve intervention |
| `POST /api/companies/[companyId]/queue/[interventionId]/dismiss` | Dismiss intervention |
| `POST /api/companies/[companyId]/queue/[interventionId]/schedule` | Schedule intervention |
| `POST /api/companies/[companyId]/queue/[interventionId]/suppress` | Suppress intervention |
| `POST /api/companies/[companyId]/settings/pause` | Pause/resume organisation |
| `POST /api/companies/[companyId]/onboarding` | Complete onboarding mapping |
| `POST /api/companies/[companyId]/data-export` | Request data export |
| `POST /api/companies/[companyId]/data-deletion` | Request data deletion |
| `POST /api/experiences/[experienceId]/rescue/[token]/respond` | Student response submission |

## Current integration status

| Integration | Status | Notes |
|-------------|--------|-------|
| Whop webhook ingestion | **Implemented** | Standard Webhooks verification, idempotent receipt storage |
| Whop API data fetching | **Implemented** | Courses, products, experiences for onboarding |
| Whop notification sending | **Implemented** | `notifications.create` for approved interventions |
| Whop auth (company routes) | **Implemented** | `verifyUserToken` + `checkAccess` via official SDK |
| PostgreSQL database | **Implemented** | Full Prisma schema, migrations, all tables |
| Inngest job processing | **Implemented** | Durable functions for webhook processing, sync, eligibility, delivery |
| Outbox pattern | **Implemented** | Atomic claiming, bounded retry, dead-letter queue |
| Sync engine | **Implemented** | Checkpointed, batched, resumable synchronization |
| Attribution engine | **Implemented** | Three-tier confirmed/associated/estimated |
| Data lifecycle | **Implemented** | Export and deletion with grace period |
| Rate limiting | **Implemented** | Redis-backed sliding window |
| PostHog analytics | **Scaffolded** | Allowlist defined; SDK not wired (env vars optional) |
| Sentry error tracking | **Scaffolded** | DSN documented; SDK not wired (env vars optional) |
| Vercel preview deploys | **Active** | CI splits into separate verification jobs |
| E2E tests (Playwright) | **Written** | Marketing, private-pilot, connected-workspace, demo-workflow, student-experience, internal-ops, visual-regression specs |
| Integration tests | **Written** | PostgreSQL-backed: tenant-isolation, outbox-integrity, concurrency, sync-resilience, data-lifecycle |
| Contract tests | **Written** | Provider contract verification against fixture and Whop implementations |

## Provider architecture

RescueLoop uses a **provider pattern** with two implementations:

1. **Fixture provider** — serves deterministic demo data for the `(dashboard)` route group. No backend required.
2. **Whop provider** — wraps the Whop SDK for the `companies/[companyId]` routes. Requires real Whop credentials.

Both providers implement the same contracts (`IdentityProvider`, `ProductsProvider`, `CoursesProvider`, `MembershipsProvider`, `ProgressProvider`, `NotificationsProvider`). The UI is provider-agnostic.

## Technology stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL (Neon) via Prisma ORM
- **Job processing:** Inngest (durable, retryable functions)
- **Auth:** Whop SDK (`verifyUserToken`, `checkAccess`) for company routes; internal secret for ops routes
- **Styling:** Tailwind CSS 4
- **UI components:** shadcn/ui (New York style) with Lucide icons
- **Charts:** Recharts
- **Animation:** Framer Motion (restrained, 180–250ms transitions, `prefers-reduced-motion` respected)
- **Fonts:** Geist (interface) and JetBrains Mono (revenue, percentages, counts)
- **Rate limiting:** Redis-backed sliding window
- **Notifications:** Sonner toasts
- **Testing:** Vitest (unit + integration), Playwright (E2E + visual regression)
- **Code quality:** ESLint with Next.js rules

## Architecture

```
src/
├── app/
│   ├── (marketing)/          # Landing page
│   ├── (dashboard)/          # Demo workspace (fixture data)
│   ├── companies/[companyId]/# Connected workspace (real DB + Whop)
│   ├── (student)/            # Student-facing experience
│   ├── internal/             # Internal operations workspace
│   ├── experiences/          # Student experience (token-auth)
│   ├── onboarding/           # Onboarding flow
│   ├── legal/                # Legal pages
│   ├── private-pilot/        # Pilot application form
│   └── api/                  # API routes (webhooks, inngest, companies)
├── providers/
│   ├── contracts/            # Provider interfaces
│   ├── fixtures/             # Fixture (demo) implementation
│   └── whop/                 # Whop SDK implementation
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── shared/               # Cross-cutting: logo, status pills, layout primitives
│   ├── layout/               # App shell, header, notification drawer
│   ├── internal/             # Internal workspace components
│   ├── shell/                # Connected workspace shell
│   ├── marketing/            # Landing page components
│   ├── interaction/          # Command palette, animated counter
│   └── rescueloop/           # Feature components grouped by page
├── lib/
│   ├── sync/                 # Sync engine (checkpointed, batched)
│   ├── outbox/               # Transactional outbox (atomic claiming)
│   ├── eligibility/          # Activation eligibility engine
│   ├── attribution/          # Three-tier attribution engine
│   ├── data-lifecycle/       # Export and deletion engines
│   ├── usage/                # Plan enforcement and metering
│   ├── rate-limit/           # Redis-backed rate limiter
│   ├── auth/                 # Strict auth (Whop + internal)
│   ├── crypto/               # Student access tokens (SHA-256 hashed)
│   ├── whop/                 # Whop client and onboarding data
│   ├── observability/        # Sentry, PostHog, logger
│   ├── validation/           # Pilot application validation
│   ├── types.ts              # Typed domain models
│   ├── mock-data.ts          # Coherent demo dataset
│   └── db.ts                 # Prisma client singleton
├── server/
│   └── jobs/                 # Inngest job functions and client
└── tests/
    ├── contracts/            # Provider contract tests
    ├── e2e/                  # Playwright specs
    └── integration/          # PostgreSQL-backed integration tests
```

**Server Components by default.** Client Components (`"use client"`) are used only where interactivity is required: tabs, tables, drawers, filters, charts, forms, and animations.

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
| Interventions dispatched | 78 |
| Students re-engaged | 31 |
| First-time activations | 9 |
| Cancellations reversed | 3 |
| Confirmed recovered revenue | $237 |
| Estimated 90-day retained value | $711 |
| Creator action requests | 11 |
| Plan cost | $29/month |
| Confirmed value-to-cost | 8.2× |

These figures are consistent across every page, chart, table, and report.

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
| `bun run db:push` | Push Prisma schema to the database |
| `bun run db:generate` | Generate Prisma client |
| `bun run test` | Run unit tests (Vitest) |
| `bun run test:integration` | Run integration tests (PostgreSQL required) |
| `bun run test:e2e` | Run E2E tests (Playwright) |

## Environment variables

Demo routes build and run **without any environment variables**. Connected workspace and API routes require backend configuration. See `SETUP_PRIVATE_PILOT.md` for the full setup guide and `.env.example` for the variable list.

## Testing

- **Unit tests (Vitest):** sync engine, outbox, attribution engine, student access tokens, deployment safety, usage enforcement
- **Integration tests (PostgreSQL):** tenant isolation, outbox integrity, concurrency, sync resilience, data lifecycle
- **Contract tests:** provider contracts verified against both fixture and Whop implementations
- **E2E tests (Playwright):** marketing page, private-pilot flow, connected workspace, demo workflow, student experience, internal ops, visual regression
- **ESLint:** `bun run lint` passes with zero errors and zero warnings.
- **TypeScript:** Strict mode enabled; all types resolve correctly.

## Roadmap

1. **PostHog + Sentry wiring** — connect analytics and error tracking SDKs when ready.
2. **A/B message testing** — compare message templates within a campaign.
3. **Multi-course support** — manage recovery across multiple products and courses.
4. **Team collaboration** — multiple reviewers, role-based approval workflows.
5. **WebSocket activity feed** — real-time updates for the notification badge.

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

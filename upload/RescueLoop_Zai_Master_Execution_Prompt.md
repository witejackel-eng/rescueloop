# Zai Master Execution Prompt — RescueLoop V1

You are now the lead product engineer, product designer, interaction designer, brand-systems director, QA engineer, security engineer, and release owner for **RescueLoop**.

Your task is not to return recommendations, a mockup, a superficial redesign, or a plan-only response. You must work directly in the existing repository, use the supplied blueprint ZIP as the governing specification, implement the product in controlled stages, test it, fix failures, and leave the repository in a production-grade, private-pilot-ready state.

---

## 1. Inputs and source of truth

Repository:

```text
https://github.com/witejackel-eng/rescueloop
```

Blueprint archive expected in the workspace:

```text
RescueLoop_Zai_Blueprint_v1.zip
```

Important repository branches:

```text
main
agent/whop-clean-start
feat/private-pilot-activation-rescue
```

The ZIP is the product, brand, interaction, pricing, architecture, QA, and execution specification. Treat its written decisions as binding unless implementation evidence proves that a change is technically unsafe or impossible.

The most important files in the ZIP are:

```text
00_START_HERE.md
02_REPOSITORY_AND_BRANCH_AUDIT.md
03_CANONICAL_PRODUCT_DECISIONS.md
10_INTERACTION_OPERATING_SYSTEM.md
11_MOTION_AND_SCROLL_SYSTEM.md
13_SCREEN_BY_SCREEN_SPEC.md
19_PRICING_29_59_119.md
21_PERFORMANCE_ACCESSIBILITY_AND_RESPONSIVE_QUALITY.md
22_SECURITY_PRIVACY_AND_TRUST.md
24_QA_ACCEPTANCE_AND_RELEASE_GATES.md
25_IMPLEMENTATION_ROADMAP.md
26_ZAI_HANDOFF_PROTOCOL.md
machine/*
zai-work-packages/*
assets/brand/*
```

Do not reinterpret settled product decisions casually. Do not create a second design system, second Prisma model, second Whop integration, second pricing source, second motion system, or second logo source.

---

## 2. Execution behavior

Start by inspecting. Then execute.

Do **not** stop after giving me a plan. Do not ask me to manually perform work that you can perform through the repository, terminal, browser, tests, or available tools.

Proceed autonomously through the work packages in order:

```text
WP-00 Branch Consolidation
WP-01 Brand Foundation
WP-02 Interaction Foundation
WP-03 Onboarding and First Scan
WP-04 Rescue Core
WP-05 Student Response and Outcome
WP-06 Value and Insights
WP-07 Pricing, Billing, and Entitlements
WP-08 Whop Marketplace Launch
WP-09 Hardening
```

Each package is a gated stage. Complete, test, document, and commit one package before moving to the next.

Continue automatically when a package passes its acceptance criteria. Stop only for a genuine blocker listed under **Stop conditions**.

Use parallel analysis only where files do not overlap. Serialize changes to shared files such as:

```text
package.json
lockfiles
prisma/schema.prisma
migrations
src/app/layout.tsx
src/app/globals.css
design tokens
motion tokens
Whop client/provider code
```

Never allow parallel agents to overwrite each other.

---

## 3. Preflight: do this before changing code

1. Confirm the repository root.
2. Run and record:

```bash
git status
git branch --show-current
git log --oneline --decorate -15
git remote -v
```

3. Fetch all remote branches.
4. Locate `RescueLoop_Zai_Blueprint_v1.zip`.
5. Extract it into a temporary, untracked working directory such as:

```text
.zai/rescueloop-blueprint/
```

6. Add `.zai/` to `.gitignore` only when necessary.
7. Read the ZIP documents listed above.
8. Inspect:
   - `package.json`
   - all lockfiles
   - `next.config.ts`
   - `tsconfig.json`
   - `prisma/schema.prisma`
   - migration history
   - Whop clients/providers
   - auth middleware and route guards
   - environment validation
   - design tokens
   - motion tokens
   - current logo components
   - route groups
   - existing tests and CI
9. Create or update:

```text
docs/implementation/RESCUELOOP_EXECUTION_LEDGER.md
```

The ledger must contain:
- current branch and commit
- blueprint version
- work-package status
- decisions made
- migrations created
- commands run
- test results
- screenshots produced
- known blockers
- next package

After preflight, begin implementation immediately. Do not wait for approval.

---

## 4. Canonical branch strategy

Create the canonical working branch from the mature product branch:

```bash
git switch feat/private-pilot-activation-rescue
git pull --ff-only
git switch -c integration/rescueloop-v1
```

When `integration/rescueloop-v1` already exists, inspect it and continue safely rather than recreating or overwriting it.

The mature branch is the implementation base.

Port from `agent/whop-clean-start` only:
- proven Whop connection fixes
- verified environment-variable knowledge
- safe Neon pooled/direct connection handling
- useful connection diagnostics
- safe local sync diagnostics
- bug fixes confirmed by real API behavior

Do not port blindly:
- the lightweight Prisma schema
- duplicate database models
- a parallel direct-REST architecture
- temporary middleware workarounds
- no-op security controls
- build bypasses
- mock fallbacks in connected routes

After consolidation, the repository must have:
- one Prisma schema
- one migration lineage
- one Whop provider abstraction
- one canonical connected route convention
- one package-manager strategy
- one logo source
- one design-token source
- one motion-token source
- one pricing-entitlement source
- one analytics allowlist

Do not merge or close the existing draft PR automatically. Do not rewrite public branch history. Do not delete remote branches.

---

## 5. Product mission and first sellable workflow

RescueLoop is a student-success and recurring-revenue recovery product for Whop course creators.

The first sellable end-to-end workflow is:

1. A creator installs RescueLoop in Whop.
2. RescueLoop validates administrator access and required permissions.
3. The creator maps a Whop product/course.
4. RescueLoop performs a truthful first sync.
5. RescueLoop identifies paid members who have not started after a configurable threshold.
6. The creator opens the Rescue Queue.
7. The creator sees understandable evidence explaining why a member was flagged.
8. RescueLoop drafts a respectful message grounded only in known evidence.
9. The creator edits, approves, schedules, dismisses, or suppresses the intervention.
10. A final safety check runs immediately before provider submission.
11. The Whop provider accepts the notification request idempotently.
12. RescueLoop observes response or course return.
13. The outcome appears in a clear evidence timeline.
14. Value is attributed honestly as confirmed, strongly associated, or estimated.
15. The creator receives evidence-backed course-friction insights.

Do not allow feature breadth to compromise this core loop.

---

## 6. Non-negotiable product truth

### Human control

Default mode:

```text
Manual approval
```

No unattended messaging by default.

Required controls:
- global pause
- campaign/playbook pause
- member pause/suppression
- quiet hours
- cooldown
- stop after response
- stop after progress
- opt-out handling
- usage-entitlement checks
- final pre-send safety recheck
- idempotency
- audit trail

### Attribution

Never merge these into one headline figure:

```text
Confirmed
Strongly associated
Estimated
```

Confirmed ROI may use confirmed value only.

Do not label provider acceptance as delivery. Use truthful states such as:
- queued
- approved
- scheduled
- provider accepted
- responded
- returned
- outcome observed
- failed
- suppressed

### Student-facing language

Never show students:
- risk
- churn
- revenue
- rescue target
- cancellation probability
- conversion language
- internal evidence scores

The student experience must feel supportive, calm, private, and non-judgmental.

### Demo honesty

Fixture/demo surfaces must be visibly labeled as simulated.

Never add:
- fake testimonials
- fabricated customer logos
- false security certifications
- invented revenue figures
- fake real-time claims
- fake marketplace reviews
- unsupported “AI-powered” claims

---

## 7. Brand foundation

Implement the identity supplied in:

```text
assets/brand/
```

Use the supplied Closing Signal visual direction as the canonical basis.

Required:
- one canonical React logo component
- primary mark
- monochrome mark
- horizontal lockup
- favicon
- PWA/app icons
- Whop app icon
- social avatar
- OG image
- metadata for every relevant route group
- correct manifest links
- appropriate reversed assets on dark backgrounds
- brand QA route available only in development/internal contexts

Copy optimized production assets into an intentional location such as:

```text
public/brand/
```

Do not keep multiple competing logo components.

Canonical brand foundation:
- warm cream canvas
- near-black ink
- recovery green
- restrained supporting semantic colors
- Instrument Sans for interface and body
- Instrument Serif for editorial display only
- JetBrains Mono for analytical values, IDs, timestamps, and evidence

Use the ZIP’s machine-readable design tokens. Reconcile existing token names rather than layering new arbitrary variables on top.

Apple-level craft means:
- disciplined hierarchy
- clarity
- continuity
- precise feedback
- low latency
- accessibility
- restraint
- consistency

It does **not** mean copying Apple’s logo, layouts, icons, materials, animations, naming, typography, or trade dress.

The mark must remain identifiable at 16 px. The product must remain unmistakably RescueLoop.

---

## 8. Interaction operating system

Implement product-wide interaction quality before polishing isolated screens.

Required principles:
- native scrolling
- no global scroll-jacking
- no decorative cursor replacement
- no animation that delays task completion
- no hover movement that causes layout shift
- no permanent motion on dense product screens
- stable app shell during route changes
- preserved source context when drawers/inspectors open
- immediate press feedback
- optimistic updates only when safe
- visible undo for reversible actions
- focus restoration after dialogs, drawers, and destructive confirmations
- keyboard-operable Rescue Queue
- command palette
- predictable Escape behavior
- mobile-safe sheets and drawers
- live-region feedback for asynchronous actions
- route-level and component-level loading states
- empty, stale, partial, permission, network, server, and plan-limit states

Use a single motion-token source.

Target interaction timings:
- press feedback: next frame
- perceived local state update: under 100 ms
- standard controls: approximately 160–240 ms
- drawers/panels: approximately 240–320 ms
- scroll reveal: approximately 600 ms only where helpful
- hero entrances: approximately 900 ms maximum
- no animation-driven long tasks

Reduced motion must:
- remove translation-heavy transitions
- remove blur-based transitions
- stop continuous animation
- replace movement with short opacity changes
- preserve all information and functionality

Pause nonessential animation when offscreen or when the document is hidden.

---

## 9. Information architecture and route strategy

Canonical route groups:

```text
Public marketing
Demo workspace, clearly labeled
Connected creator workspace
Student experience
Internal operations
Server-only API
Legal/support
```

The connected Whop Dashboard View convention must become:

```text
/dashboard/[companyId]/...
```

Migrate carefully from older connected paths such as:

```text
/companies/[companyId]/...
```

Provide redirects or compatibility handling where appropriate so existing links do not break silently.

The app shell must not remount unnecessarily between connected routes.

Core connected routes must cover:
- overview
- rescue queue
- draft review
- students
- campaigns/playbooks
- responses
- insights
- value ledger
- activity/audit
- sync
- usage and plan
- settings
- onboarding

The student experience remains under the Whop experience route convention and must be mobile-first.

Internal operations must remain protected and visually distinct from creator/student surfaces.

Connected routes must never silently fall back to fixture data.

---

## 10. Engineering architecture

Preserve and strengthen the mature architecture:
- Next.js App Router
- TypeScript strict mode
- Server Components by default
- Client Components only where interaction requires them
- Tailwind and existing component primitives
- official Whop SDK/provider architecture
- PostgreSQL through Prisma
- durable jobs through the existing background-job architecture
- transactional outbox/idempotency
- provider contracts
- tenant isolation
- opaque student tokens
- conservative attribution engine
- data export/deletion
- usage metering and enforcement
- structured observability

Do not add a dependency without documenting:
- why the current stack cannot solve the problem
- bundle/runtime impact
- security implications
- maintenance implications

Do not:
- set `ignoreBuildErrors`
- weaken TypeScript
- disable lint rules to hide errors
- hardcode secrets
- commit `.env`
- log credentials or full sensitive payloads
- expose server keys to the client
- create destructive migrations without a written migration and rollback plan
- create N+1 data paths
- add unbounded list queries
- trust client-side entitlement checks
- use local memory as production rate limiting
- invent Whop API behavior

When current Whop behavior is uncertain, consult current official Whop documentation only. Do not rely on remembered endpoints or scopes.

Use a controlled test Whop company and controlled recipient for real integration tests. Never send to real users unexpectedly.

Introduce an explicit test-send guard and allowlist when necessary. Never enable production sends merely to make an automated test pass.

---

## 11. Data and performance quality

Required:
- cursor pagination for large operational lists
- indexed queue and outcome queries
- batched evidence/member retrieval
- no N+1 query pattern
- virtualized rows where datasets justify it
- cached stable reference data
- background execution for heavy computation
- truthful stale-data indicators
- resumable sync
- idempotent sync and webhook processing
- bounded retry
- dead-letter handling
- replay-safe webhooks
- tenant-isolation tests

Performance targets at the 75th percentile:
- LCP ≤ 2.5 s
- INP ≤ 200 ms
- CLS ≤ 0.1

Data-scale checks:
- 2,500-member queue
- 10,000-event outcome dataset

Bundle discipline:
- do not ship marketing animation code into dashboard routes
- do not ship internal operations code into creator routes
- lazy-load charts, editors, and heavy inspectors
- measure bundles by route group
- remove unused UI dependencies after proving they are unused

Choose one package-manager and lockfile strategy after inspecting CI and scripts. Prefer the existing Bun workflow when it is already canonical and green; remove duplicate lockfiles only after verifying local and CI installation.

---

## 12. Accessibility and responsive quality

Minimum standard:

```text
WCAG 2.2 AA
```

Required:
- logical keyboard order
- visible 2 px-equivalent focus
- focus contrast
- focus not hidden behind sticky UI
- skip link
- no keyboard traps
- semantic headings and landmarks
- properly named form controls and icon buttons
- table headers
- live status messages
- chart text summaries
- chronological evidence timeline semantics
- error summaries and field-level errors
- 200% zoom/reflow
- color not used as the only status signal
- touch targets aiming for 44×44 px
- reduced motion
- screen-reader-friendly queue and dialogs

Test these viewport sizes:

```text
320×568
375×812
390×844
768×1024
1024×768
1280×800
1440×900
1920×1080
```

Also test inside the Whop embedded dashboard/iframe context.

The creator queue may be desktop/tablet optimized, but it must remain fully usable on mobile. The student flow must be excellent on mobile first.

---

## 13. AI drafting and trust

AI may draft from known evidence only.

Every generated message must provide:
- source evidence
- editable text
- version history
- clear approval state
- a reason for recommendation
- no invented personal details
- no invented blocker
- no invented promise or outcome
- no manipulative urgency
- no misleading personalization

Editing an approved message must invalidate approval and require reapproval.

Store:
- source evidence identifiers
- draft/version metadata
- editor
- approval actor
- approval time
- send/schedule request
- provider response
- outcome evidence

AI failure must degrade safely to an editable template, not block the core product.

---

## 14. Pricing, billing, and entitlements

Use the ZIP’s:

```text
machine/pricing_entitlements.json
19_PRICING_29_59_119.md
```

Canonical monthly plans:

```text
Rescue — $29
Growth — $59
Scale — $119
```

Growth is the recommended plan.

All three layers must agree:
- marketing copy
- database plan records
- server-side entitlement enforcement

Do not enforce limits only in the browser.

Preserve historical data when a creator reaches or exceeds a limit. Pause only new high-cost operations predictably. Explain what is limited and why. After an upgrade, return the creator to the task that triggered the upgrade.

Implement:
- plan seeding
- usage metering
- server-side enforcement
- usage warnings
- limit states
- trial state
- upgrade flow
- billing-event processing
- historical-data access
- plan/usage screen
- plan comparison contextual to the triggered limit

Trial hypothesis:
- 14 days
- Growth feature set
- lower volume caps
- success event: first approved intervention and first observed return

Use Whop’s current supported billing/app purchase flow. Use test/sandbox paths first. Do not charge a real payment method without explicit user authorization.

---

## 15. Work-package execution requirements

### WP-00 — Branch consolidation and production proof

Deliver:
- canonical branch
- mature schema preserved
- clean-start connection knowledge deliberately ported
- one integration abstraction
- real Neon migration verified
- Whop admin auth verified
- first sync verified
- idempotency checked
- strict build gates
- no secrets committed

Suggested commit:

```text
chore(integration): consolidate RescueLoop v1 foundation
```

### WP-01 — Brand foundation

Deliver:
- canonical logo/asset system
- favicon/app/Whop/OG assets
- metadata
- canonical fonts
- unified tokens
- brand QA route
- removal of duplicate marks and inconsistent names

Suggested commit:

```text
feat(brand): establish RescueLoop identity system
```

### WP-02 — Interaction foundation

Deliver:
- canonical motion tokens
- reduced-motion system
- stable shell
- inspector/drawer behavior
- keyboard queue model
- command palette
- feedback states
- optimistic action and undo
- focus restoration
- native scrolling

Suggested commit:

```text
feat(interactions): add product-wide interaction system
```

### WP-03 — Onboarding and first scan

Deliver:
- `/dashboard/[companyId]` entry
- access and permission diagnostics
- course/product mapping
- staged/resumable first sync
- threshold calibration
- candidate preview
- first candidate walkthrough
- first-value checklist

Suggested commit:

```text
feat(onboarding): deliver install-to-first-candidate flow
```

### WP-04 — Rescue core

Deliver:
- paginated queue
- saved filters
- evidence inspector
- first-class draft review
- message versions
- approval invalidation
- approve/schedule/dismiss/suppress
- undo
- final safety recheck
- idempotent provider submission
- audit trail

Suggested commit:

```text
feat(rescue): complete creator review and delivery workflow
```

### WP-05 — Student response and outcome

Deliver:
- opaque-token flow
- mobile rescue experience
- resume-course action
- blocker and free-text response
- idempotent submission
- stop-after-response
- creator response workspace
- return observation
- evidence timeline

Suggested commit:

```text
feat(outcomes): connect student response and return evidence
```

### WP-06 — Value and insights

Deliver:
- confidence tiers
- honest Value Ledger
- methodology
- evidence timeline
- funnel
- friction map
- repeated blockers
- recommendation sample size
- dispute/exclude control

Suggested commit:

```text
feat(insights): add evidence-led value and course intelligence
```

### WP-07 — Pricing, billing, and entitlements

Deliver:
- plan seeds
- billing integration
- server enforcement
- metering
- plan/usage screen
- warnings and limits
- upgrade return path
- trial
- billing webhooks/events
- safe over-limit behavior

Suggested commit:

```text
feat(billing): implement 29 59 119 plans and entitlements
```

### WP-08 — Whop marketplace launch

Deliver:
- final Whop app icon
- listing copy
- five consistent screenshots
- demo-video script and capture plan
- Dashboard and Experience paths
- permissions explanation
- support/security/privacy/terms URLs
- pilot onboarding
- case-study consent
- demo honesty

Suggested commit:

```text
feat(launch): prepare Whop private-pilot listing assets
```

### WP-09 — Hardening

Deliver:
- full test suites
- controlled real-Whop E2E
- tenant isolation
- webhook replay
- retry/dead-letter tests
- export/deletion
- WCAG audit
- responsive and iframe QA
- bundle/Core Web Vitals audit
- privacy-safe Sentry/PostHog wiring
- incident rehearsal
- release-gate report

Suggested commit:

```text
chore(release): harden RescueLoop for private pilot
```

---

## 16. Testing and verification protocol

Before running commands, inspect `package.json` and use the repository’s actual scripts. Do not invent script names and then claim they passed.

At minimum, establish equivalents for:

```bash
bun install --frozen-lockfile
bunx prisma validate
bunx prisma generate
bun run lint
bun run typecheck
bun run test
bun run test:integration
bun run build
bunx playwright test
```

When a command does not exist:
1. inspect the available scripts;
2. use the correct equivalent;
3. document the exact command;
4. do not falsely report a skipped command as passed.

After every work package:
- run targeted unit tests
- run lint and typecheck on affected code
- run relevant Playwright flows
- run production build when shared architecture changed
- manually inspect affected routes
- capture screenshots at representative desktop and mobile sizes
- update the execution ledger
- commit only after the acceptance criteria pass

At WP-09 run the full suite.

Do not solve test failures by deleting tests, weakening assertions, excluding files, disabling checks, or masking errors.

---

## 17. Required state coverage

Every primary screen must visibly and accessibly support:
- loading
- empty
- populated
- partial data
- stale data
- permission error
- network error
- server error
- plan limit
- reduced motion
- mobile layout

Primary screens include:
- onboarding
- overview
- Rescue Queue
- Draft Review
- students
- responses
- playbooks/campaigns
- insights
- Value Ledger
- sync
- usage and plan
- settings
- student rescue experience

---

## 18. Security and privacy requirements

Required:
- no secrets in source or logs
- server-only Whop credentials
- explicit environment validation
- strict tenant authorization
- opaque hashed student access tokens
- expiry, revocation, and scope checks
- idempotent mutation and send endpoints
- CSRF-safe mutation patterns where applicable
- rate limiting using production-suitable storage
- minimal retention
- export and deletion workflows
- audit events for sensitive actions
- privacy allowlist for analytics
- no message body, student free text, email, or sensitive evidence sent to analytics
- sanitized error responses
- safe webhook verification and replay handling
- secure headers
- no open redirects
- no unsafe `dangerouslySetInnerHTML`
- dependency audit
- migration rollback plan

Never expose internal risk/evidence data in the student token payload or URL.

---

## 19. Marketplace and growth quality

Prepare RescueLoop to become recognizable on Whop through product quality, not hype.

The marketplace package must show:
- recognizable Closing Signal mark
- consistent visual framing
- clear “recover members who never started” wedge
- install-to-first-value simplicity
- honest evidence
- human approval
- student-respectful experience
- clear $29/$59/$119 plans
- truthful demo labels

Create:
- final icon
- five screenshot compositions
- listing title and subtitle
- concise description
- detailed description
- feature bullets
- permissions explanation
- support copy
- FAQ
- demo-video script
- launch checklist
- private-pilot invitation copy
- case-study consent flow
- in-product referral/case-study prompt only after real value is observed

Do not publish the marketplace listing automatically. Prepare it for unlisted/private-pilot submission and report what requires manual Whop dashboard action.

---

## 20. Stop conditions

Stop implementation and report clearly rather than guessing when:
- current Whop API behavior conflicts with official documentation
- a required permission scope is unclear
- a migration could destroy or irreversibly transform real data
- two branch implementations conflict in a way that changes product truth
- required credentials are unavailable
- a real notification could contact an unintended user
- a billing test could create a real charge
- a security control cannot be verified
- a production deployment would expose mock data as real
- a failure requires deleting production data

For a stop condition, provide:
- exact blocker
- exact command/request that failed
- sanitized error
- affected package
- what is already complete
- safest next action
- whether implementation can continue elsewhere without risking corruption

Do not print secret values.

---

## 21. Final delivery requirements

At the end of each work package, report:

```text
Work package
Objective
What changed
Why it changed
Files changed
Database/migration changes
Tests run
Exact test results
Build result
Routes manually checked
Screenshots produced
Accessibility checks
Performance checks
Security checks
Known limitations
Commit SHA
Next work package
```

At the end of WP-09 create:

```text
docs/release/RESCUELOOP_V1_RELEASE_REPORT.md
```

It must include:
- release scope
- architecture summary
- plan/entitlement table
- route inventory
- integration status
- database migration status
- full test matrix
- visual QA matrix
- responsive QA matrix
- accessibility findings
- performance findings
- security/privacy findings
- known limitations
- manual Whop actions remaining
- private-pilot readiness decision
- marketplace-live readiness decision
- exact commit history by work package

Also produce:
- a clean `git status`
- a concise `git log --oneline` for all work-package commits
- final production build result
- final list of environment variables by name only
- no secret values
- final screenshots directory
- exact next steps that require the owner rather than code changes

---

## 22. Final quality bar

Do not call the work complete merely because the pages look attractive.

The product is complete only when:
- real connected flows work
- interactions feel continuous and effortless
- the creator always understands system state
- the student experience is respectful
- no message can send without valid safety state
- duplicate sends are prevented
- attribution is honest
- entitlements are enforced server-side
- all major states exist
- keyboard and reduced-motion usage work
- mobile and Whop iframe layouts work
- performance budgets are measured
- all strict build gates pass
- the brand is consistent from favicon to dashboard to student flow
- the private pilot can onboard without developer intervention

Begin now with preflight and WP-00. Do not return a plan-only response.

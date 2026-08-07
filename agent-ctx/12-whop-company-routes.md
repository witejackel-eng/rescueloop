# Task 12 — Whop company routes (database-backed)

Agent: whop-company-routes-builder
Branch: feat/private-pilot-activation-rescue

## Summary

Built the real, database-backed Whop company routes for the Activation
Rescue private pilot. All routes use the official `@whop/sdk` for
authentication (`requireCompanyAdmin` / `requireStudentInterventionAccess`),
Prisma for data, and Zod for input validation. No mock data.

## Files created

### API routes (POST handlers, all Zod-validated + audit-logged)

- `src/app/api/companies/[companyId]/onboarding/route.ts`
  Upserts Product + Course from Whop data, confirms ProductCourseMapping,
  creates Activation Rescue campaign (manual approval forced), writes
  CampaignVersion v1 snapshot, 2 audit entries.

- `src/app/api/companies/[companyId]/queue/[interventionId]/approve/route.ts`
  Sets state → "approved", records approvedById/approvedAt, enqueues
  Inngest delivery job (best-effort — doesn't fail if Inngest is down),
  audit entry.

- `src/app/api/companies/[companyId]/queue/[interventionId]/dismiss/route.ts`
  Sets state → "dismissed", optional reason, audit entry.

- `src/app/api/companies/[companyId]/queue/[interventionId]/schedule/route.ts`
  Sets state → "scheduled" + scheduledFor (validated future date),
  audit entry.

- `src/app/api/companies/[companyId]/queue/[interventionId]/suppress/route.ts`
  Upserts organization-scoped Suppression, revokes all pending student
  access tokens, stops the intervention if pending, audit entry.

- `src/app/api/companies/[companyId]/settings/pause/route.ts`
  Toggles organization.isPaused, audit entry (paused/resumed action).

- `src/app/api/experiences/[experienceId]/rescue/[token]/respond/route.ts`
  Records StudentResponse (responseType + optional blockerType + note +
  remindInHours). Updates intervention outcomeState. For "stuck" also
  creates BlockerResponse. For "remind_later" creates ReminderRequest. For
  "stop_reminders" creates Suppression + revokes tokens + sets state to
  "stopped". Transactional. Captures IP + user-agent. Audit entry.

### Pages (server components unless noted)

- `src/app/companies/[companyId]/layout.tsx`
  Shared layout wrapping company routes in WorkspaceShell + CommandPalette
  + Sonner (same shell as demo dashboard).

- `src/app/companies/[companyId]/onboarding/page.tsx`
  Server. requireCompanyAdmin → installation-required state OR auth-error
  card OR onboarding form. Fetches Whop courses + experiences + DB products
  via fetchOnboardingData (graceful degradation).

- `src/app/companies/[companyId]/queue/page.tsx`
  Server. Queries interventions WHERE state = "awaiting_approval". Shows
  candidate cards with student name, membership evidence, course evidence,
  safety checks (from eligibility snapshot evidenceJson), campaign version,
  detection time. Empty state: "No Activation Rescue candidates detected
  yet". Uses Prisma.InterventionGetPayload for the card prop type.

- `src/app/companies/[companyId]/responses/page.tsx`
  Server. Queries StudentResponse joined with Intervention + Student.
  Highlights human_help + stop_reminders (warning left-border). Shows
  response type, time, original intervention context, outcome state.

- `src/app/companies/[companyId]/settings/page.tsx`
  Server. Shows organisation overview (name, status, plan, timezone,
  Whop installation), safety rules (quiet hours, cooldown, max messages,
  approval mode from active campaign), sync status (last webhook, data
  source, granted scopes). Pause/resume toggle.

- `src/app/experiences/[experienceId]/rescue/[token]/page.tsx`
  Server wrapper. requireStudentInterventionAccess(token) — catches
  thrown Response objects and renders StudentLinkError (expired / stopped
  / not-found). On success loads intervention + student + course + campaign
  and renders RescueExperience client component. Metadata override (no
  revenue/churn language, robots noindex).

### Client components

- `src/components/rescueloop/company/onboarding-form.tsx`
  Course + product + experience selection (from Whop data or manual entry
  fallback). Safety config: activation delay (7d), cooldown (14d), max
  messages (2), quiet hours (20:00–08:00). Manual approval switch (always
  on, disabled). Posts to onboarding API. Sonner toasts.

- `src/components/rescueloop/company/queue-actions.tsx`
  Approve / Schedule (datetime picker) / Dismiss / Suppress
  (double-confirm AlertDialog) buttons. Each posts to the corresponding
  API route, toasts, router.refresh().

- `src/components/rescueloop/company/org-pause-toggle.tsx`
  Pause (AlertDialog confirm) / Resume button. Posts to pause API.

- `src/components/rescueloop/student/rescue-experience.tsx`
  The student-facing rescue experience. Views: main → stuck (blocker
  RadioGroup + note) / remind (time options) / stop_confirm / done.
  Actions: continue_course, stuck, remind_later, already_completed,
  human_help, stop_reminders — each posts to respond API. Calm, supportive
  tone. Never uses "at risk", "churn", "revenue", "cancellation",
  "retention" language. Also exports StudentLinkError for invalid tokens.

### Shared helpers

- `src/components/rescueloop/company/state-cards.tsx`
  AuthErrorCard, InstallationRequiredCard, EmptyStateCard, LoadingCard,
  InlineWarningCallout, CompanyPageHeader.

- `src/lib/whop/onboarding-data.ts`
  fetchOnboardingData(companyId, organizationId) — fetches Whop courses
  (whopsdk.courses.list), experiences (whopsdk.experiences.list), DB
  products, existing confirmed mappings. All Whop calls wrapped in
  try/catch with whopUnavailable flag for graceful degradation.

## Design system

- Warm cream theme (--canvas, --surface, --ink-primary, --hairline,
  --recovery-green, --warning, --critical, --info).
- All numbers in font-mono tabular-nums.
- Serif titles (font-serif) for page headers.
- shadcn/ui components (Card, Button, Input, Select, Label, Switch,
  RadioGroup, Textarea, AlertDialog, Badge, Progress).
- No indigo/blue beyond the existing --info accent (used for remind_later
  response type).
- Responsive (mobile-first, sm:/lg: breakpoints).
- Company routes use WorkspaceShell; student experience is standalone.

## Verification

- `bun run lint` → exit 0, no errors, no warnings.
- `bunx tsc --noEmit --skipLibCheck` → no errors in any new file (only
  pre-existing examples/skills errors remain, untouched).
- Dev log: "✓ Compiled in 302ms" with 0 errors after writing all files.
- Demo routes (/overview, /rescue-queue, etc.) untouched.

## Notes / decisions

1. **"responded" is an OutcomeState, not an InterventionState.** The
   schema's InterventionState enum has no "responded" value. The respond
   API route updates outcomeState (which does have "responded") and only
   changes the intervention state to "stopped" for stop_reminders. For all
   other responses, the intervention keeps its current delivery state
   (notification_accepted / delivered).

2. **No compound unique on Course (organizationId, externalCourseId).**
   The onboarding API uses findFirst + create/update instead of upsert for
   the Course record. Product uses upsert (whopProductId is unique).

3. **Inngest delivery enqueue is best-effort.** The approve route wraps
   `inngest.send()` in try/catch so approval succeeds even if Inngest
   isn't configured (no INNGEST_EVENT_KEY). The intervention state still
   moves to "approved" and the audit log is written.

4. **Student experience page is a server wrapper + client component.**
   The spec said "(Client Component)" but server-side auth
   (requireStudentInterventionAccess) can't run in a client component. The
   page.tsx is a server component that does auth + data loading, then
   renders the RescueExperience client component with props. This
   satisfies both the auth requirement and the interactive UI requirement.

5. **Added a bonus pause/resume API route** (`/api/companies/[companyId]/
   settings/pause`) because the settings page spec required pause/resume
   functionality but the API route list didn't include one. This is a
   natural, minimal extension.

6. **Experience ID is accepted but not trusted.** The URL includes
   [experienceId] but the opaque token is the only source of truth for
   authorization. The experienceId is passed through to the client
   component for the respond API URL but never used for auth decisions.

7. **Graceful Whop degradation.** fetchOnboardingData catches all Whop
   API errors and returns whopUnavailable=true + empty arrays. The
   onboarding form then shows manual-entry fields for course/product IDs.
   This lets the route compile and render even without WHOP_API_KEY.

## Stage Summary

All 7 routes (onboarding, queue, responses, settings, student experience)
+ 7 API routes are database-backed, auth-protected, Zod-validated, and
audit-logged. They compile cleanly, pass lint + typecheck, and use the
existing warm cream design system. Demo routes remain untouched.

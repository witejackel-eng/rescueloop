# Phases 14 & 15: Private Pilot Application + Internal Operations Workspace

## Phase 14: Private Pilot Application Form

### Prisma Model Updates (`prisma/schema.prisma`)
- `PilotApplication.typicalMembershipPrice` changed from `Int?` → `Float?` to support decimal prices
- `PilotApplication.preferredPilotTiming` removed `@default("Flexible")` — value is always explicit from form
- `PilotApplication.consentToContact` removed `@default(false)` — must be explicitly `true` (z.literal(true))
- `PilotApplication.honeypot` added `@map("hp")` column mapping per spec
- Schema validated and formatted with `npx prisma format`

### Zod Validation (`src/lib/validation/pilot-application.ts`)
- `fullName`: `z.string().min(2).max(100)` (spec-aligned, was min(1) max(200))
- `businessName`: `z.string().min(2).max(200)` (spec-aligned, was min(1))
- `whopBusinessUrl`: `z.string().url().optional().or(z.literal(""))` (added URL validation)
- `email`: `z.string().email()` (simplified, removed redundant min(1))
- `courses`: `z.string().max(500)` (was max(2000))
- `currentFollowUpProcess`: `z.string().max(1000)` (was max(5000))
- `primaryRetentionConcern`: `z.string().max(1000)` (was max(5000))
- `preferredPilotTiming`: `z.enum(["asap", "within_2_weeks", "within_a_month", "flexible"])` (snake_case per spec)
- `consentToContact`: `z.literal(true)` (was `z.boolean().refine(...)`)
- `PILOT_TIMING_OPTIONS` now uses `{ value, label }` objects for snake_case values + human-readable labels

### Private Pilot Page (`src/app/private-pilot/page.tsx`)
- Complete form UI with shadcn/ui components (Card, Input, Select, Checkbox, Button, Label, Textarea)
- Hidden honeypot field (sr-only, aria-hidden, tabIndex=-1)
- Privacy disclosure text with shield icon and link to /legal/privacy
- Success state component shown after successful submission
- Snake_case timing values stored, human-readable labels displayed
- Checkbox uses `onCheckedChange` with explicit true/false mapping for z.literal(true) compatibility

### API Route (`src/app/api/private-pilot/route.ts`)
- POST: validates with Zod, checks honeypot (silent success if filled = spam), checks duplicate by email, persists to DB
- Rate limiting comment placeholder for Phase 18
- Graceful 503 if DB unavailable
- Returns 409 on duplicate email
- Returns 201 on success

## Phase 15: Internal Operations Workspace

### Internal Auth Middleware (`src/lib/auth/internal-auth.ts`)
- Reads `RESCUELOOP_INTERNAL_TOKEN` from env (min 32 characters)
- Exports `requireInternalAuth()` that checks `Authorization: Bearer <token>` header
- Constant-time string comparison to prevent timing attacks
- Returns 401 if missing/invalid, 503 if token not configured
- Security is NOT based on route obscurity — requires valid bearer token

### Internal Audit Trail (`src/lib/auth/internal-audit.ts`)
- Every internal action creates an `InternalAuditLog` record with:
  - `actorId` — internal operator identity (token hash prefix)
  - `action` — e.g. "sync.retry", "pilot.transition.qualified", "organisations.pause"
  - `objectType` + `objectId` — what was acted on
  - `tenantScope` — organization ID if tenant-scoped
  - `previousState` + `newState` — state transition recording
  - `reason` — required text explanation for every action
  - `metadataJson` — optional additional context
- Failures are logged but never throw (audit never breaks the caller)

### Internal Route Helpers (`src/lib/auth/internal-route-helpers.ts`)
- `withInternalAuth(request, handler)` — wraps all internal API routes with auth + error handling
- Consistent error response format across all routes

### Internal Auth Gate Component (`src/components/internal/internal-auth-gate.tsx`)
- Client-side auth gate with token input form
- Token stored in `sessionStorage` for session persistence
- Logout button in top-right corner
- Uses lazy state initialization (no setState in effect — lint-clean)

### Internal Layout (`src/app/internal/layout.tsx`)
- Wraps all `/internal/*` routes with `<InternalAuthGate>`
- Sidebar navigation (desktop: fixed left 64px, mobile: Sheet drawer)
- All 9 sub-pages linked

### Internal Pages (all client components using internalFetch/internalPost)
1. **Dashboard** (`/internal`) — Stats cards: org count, sync failures, outbox backlog, dead letters, pilot applications, failed webhooks
2. **Organisations** (`/internal/organisations`) — Table with name, status, plan, installation, pause status, members, created date. **Pause/Resume** action with reason dialog + audit record
3. **Sync** (`/internal/sync`) — Sync failures table with retry button. POST with audit.
4. **Jobs** (`/internal/jobs`) — Outbox backlog + job executions. Retry button for failed jobs.
5. **Dead Letters** (`/internal/dead-letters`) — Dead letter events with requeue button (creates fresh outbox event, deletes dead letter)
6. **Webhooks** (`/internal/webhooks`) — Failed webhooks with retry button
7. **Pilots** (`/internal/pilots`) — Full review workflow: New→Reviewing→Qualified→Contacted→Accepted/Rejected/Withdrawn. Dialog with applicant details + reason textarea. Timing values displayed with human-readable labels.
8. **Usage** (`/internal/usage`) — Usage counters per org, plan limits, override dialog with reason input + audit
9. **Data Requests** (`/internal/data-requests`) — Data export/deletion requests list

### Internal API Routes (all with `withInternalAuth` wrapper)
- `POST /api/internal/auth` — Token validation endpoint
- `GET /api/internal/dashboard` — Aggregate stats
- `GET/POST /api/internal/organisations` — List orgs + pause/resume action
- `GET/POST /api/internal/sync` — List sync failures + retry
- `GET/POST /api/internal/jobs` — List jobs + retry
- `GET/POST /api/internal/dead-letters` — List dead letters + requeue
- `GET/POST /api/internal/webhooks` — List failed webhooks + retry
- `GET/POST /api/internal/pilots` — List pilot apps + transition workflow
- `GET/POST /api/internal/usage` — List usage counters + override
- `GET /api/internal/data-requests` — List data requests

### Every Internal Action
- Requires internal actor identity (via bearer token)
- Requires reason (text input in UI, validated in API)
- Creates audit record via `recordInternalAudit()`
- Tenant-scoped where applicable
- Records previous and new state

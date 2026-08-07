# RescueLoop — Whop Marketplace Listing

> Source of truth for the Whop App Store listing. Mirrors `src/lib/marketplace/manifest.ts`. Truth language only.

## Listing copy

| Field | Value |
|---|---|
| Name | RescueLoop |
| Tagline | Activation rescue for Whop creators. |
| Short description | Find members who never started or lost momentum, review a respectful support message, and see what happened next. |
| Trust statement | Nothing sends without your approval. |

### Core bullets
- Detect students who may need help using evidence-backed eligibility rules.
- See the evidence behind every candidate before you act.
- Review and edit every message. Nothing sends without your approval.
- Track student responses, observed returns, and reported blockers.
- Understand course friction without fake attribution or inflated revenue.

### Forbidden claims (never used)
- guaranteed retention
- recovered revenue
- autonomous saves
- churn risk
- cancellation probability
- conversion pressure

## Permissions requested

| ID | Label | Required | Used by | If declined |
|---|---|---|---|---|
| `read_company_courses` | Read courses and experiences | Yes | Onboarding sync, Rescue Queue eligibility engine | Onboarding cannot complete; RescueLoop cannot identify candidates. |
| `read_company_members` | Read members and membership status | Yes | Onboarding sync, Rescue Queue eligibility engine | RescueLoop cannot determine who is enrolled or who has lost access. |
| `read_course_progress` | Read lesson progress per enrolled member | Yes | Rescue Queue eligibility, Outcome Engine | RescueLoop cannot detect who needs help or observe what happened next. |
| `send_notification_to_member` | Send a notification to a specific member | Yes | Rescue Queue → Approve → Whop submission | RescueLoop can show candidates but cannot deliver any message. |
| `manage_webhooks` | Register and receive webhook events | Yes | Whop webhook ingestion, Entitlement Engine | Entitlements and notification receipts must be polled — slow and brittle. |

Re-approval is mandatory if `send_notification_to_member` or `manage_webhooks` scope changes.

## App views

| Path | Label | Surface | Iframe |
|---|---|---|---|
| `/dashboard/[companyId]` | Overview | creator_dashboard | yes |
| `/dashboard/[companyId]/rescue-queue` | Rescue Queue | creator_dashboard | yes |
| `/dashboard/[companyId]/students` | Students | creator_dashboard | yes |
| `/dashboard/[companyId]/responses` | Response Center | creator_dashboard | yes |
| `/dashboard/[companyId]/insights` | Course Intelligence | creator_dashboard | yes |
| `/dashboard/[companyId]/value` | Value Ledger | creator_dashboard | yes |
| `/dashboard/[companyId]/usage` | Plan & Usage | creator_dashboard | yes |
| `/dashboard/[companyId]/settings` | Settings | creator_dashboard | yes |
| `/experiences/[experienceId]/rescue/[token]` | Student Experience | student_experience | no (opaque token link) |
| `/` | Marketing Site | marketing | no |

## Iframe behaviour

- `frame-ancestors https://*.whop.com https://whop.com` on embedded dashboard routes.
- `X-Frame-Options: DENY` (and `frame-ancestors 'none'`) on student experience routes, internal routes, API routes, and marketing pages.
- Enforced in `src/middleware.ts` via `decideIframePolicy()`.

## Media

| Asset | Status | Path |
|---|---|---|
| App icon 512×512 | Ready | `public/brand/whop-app-icon-512.png` |
| Social avatar 512×512 | Ready | `public/brand/social-avatar-512.png` |
| OG image 1200×630 | Ready | `public/brand/og-default-1200x630.png` |
| 5 marketplace screenshots | Pending capture | `public/marketplace/screenshot-{1..5}.png` |
| 30–60s product video | Pending capture | `public/marketplace/product-video.mp4` |

### Screenshot storyboard (fixture data only)
1. **Queue** — Rescue Queue with 4 fixture candidates, evidence chips visible.
2. **Inspector / manual approval** — Single candidate inspector with draft message and Approve button.
3. **Student experience** — Opaque-token student page with Continue / Report blocker / Opt out actions.
4. **Outcomes / evidence** — Response Center showing observed / strongly-associated / estimated labels with methodology.
5. **Course Intelligence** — Insights page with friction signals, no revenue claims.

## Legal & support

| Page | Path |
|---|---|
| Privacy | `/legal/privacy` |
| Terms | `/legal/terms` |
| Security | `/legal/security` |
| Data processing | `/legal/data-processing` |
| Support email | `support@rescueloop.app` |

## Data lifecycle

| Action | Trigger | Reversible | Retention |
|---|---|---|---|
| Pause | creator_pause | Yes | All historical data retained. |
| Uninstall | creator_uninstall | Yes (30-day grace) | 30-day grace period for re-install recovery. |
| Export | creator_export | No | Export link expires after 7 days. |
| Delete | creator_delete | No | All organization data deleted within 30 days. Anonymized aggregate counts retained. |
| Student opt-out | creator_delete (single_student scope) | No | Opt-out flag retained indefinitely. |

## Pilot analytics

Controlled pilot target: 3–5 creators. No autonomous messaging.

Events measured (allowlist enforced):
- `pilot.install_started`
- `pilot.permissions_granted` / `pilot.permissions_declined`
- `pilot.first_sync_completed` / `pilot.first_sync_failed`
- `pilot.first_candidate_shown`
- `pilot.draft_reviewed` / `pilot.draft_edited`
- `pilot.message_approved`
- `pilot.notification_accepted` / `pilot.notification_failed`
- `pilot.student_responded` / `pilot.student_reported_blocker` / `pilot.student_opted_out`
- `pilot.observed_return`
- `pilot.support_ticket_opened`
- `pilot.cancellation_reason_recorded`

**Hard rule:** raw student free text, names, emails, tokens, and IP addresses are NEVER sent to analytics. Enforced at runtime in `sanitizePilotEvent()`.

## Listing readiness

| Item | Status | Rationale |
|---|---|---|
| App name set | Ready | RescueLoop — matches brand assets and manifest. |
| Tagline under 80 chars | Ready | Verified by manifest test. |
| Permissions minimal and justified | Ready | Five permissions, each with feature justification and decline fallback. |
| Iframe policy defined | Ready | frame-ancestors whitelisted to whop.com; student routes deny iframe. |
| Truth language only | Ready | Forbidden claims list enforced; copy reviewed against product contract. |
| 5 marketplace screenshots | Pending | Storyboard ready; capture from fixture-only data. |
| 30–60s product video | Pending | Script and storyboard ready; capture pending controlled pilot. |
| Legal pages live | Ready | All four legal pages render at `/legal/*`. |
| Support / uninstall / data lifecycle documented | Ready | Covered in `docs/DATA_LIFECYCLE.md` and `docs/operations/NEON_MIGRATION_BASELINE.md`. |
| No P0/P1 defects | Ready | CI 7/7 green; no open P0/P1 issues tracked. |

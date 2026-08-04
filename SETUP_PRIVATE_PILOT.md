# RescueLoop Private Pilot Setup

This guide walks the repository owner through configuring a real Whop
developer app, Neon database, and Vercel deployment for the Activation
Rescue private pilot.

## Prerequisites

- A Whop developer account with app creation access
- A Neon PostgreSQL project (free tier is fine for pilot)
- A Vercel account linked to the GitHub repository
- An Inngest account (free tier) for durable job processing

## Step 1 — Create the Whop developer app

1. Go to the [Whop developer dashboard](https://whop.com/dashboard/developers/).
2. Create a new app named **RescueLoop**.
3. Configure the **Dashboard app path**:
   - Production URL: `https://rescueloop.vercel.app/companies/[companyId]`
   - This is where creators land after installing the app.
4. Configure the **Experience app path**:
   - Production URL: `https://rescueloop.vercel.app/experiences/[experienceId]`
   - This is where students land when they click a notification.
5. Note the **App ID** — this goes in `NEXT_PUBLIC_WHOP_APP_ID`.

## Step 2 — Request permissions

Request only the permissions required for Activation Rescue:

| Permission | Why it's needed |
|---|---|
| `courses:read` | List courses for onboarding mapping |
| `course_analytics:read` | Read course student progress and lesson interactions |
| `notification:create` | Send Activation Rescue notifications to students |
| `membership:read` | Sync active memberships for eligibility |
| `product:read` | List products for course-product mapping |
| `payment:read` | Observe subsequent payments (for estimated attribution only) |

Submit the permissions for Whop review. Do not guess permission names —
use the exact scopes listed in the Whop developer docs.

## Step 3 — Configure webhooks

1. In the Whop developer dashboard, create a webhook endpoint:
   - URL: `https://rescueloop.vercel.app/api/webhooks/whop`
2. Note the **Webhook Secret** — this goes in `WHOP_WEBHOOK_SECRET`.
3. Select these webhook events:
   - `membership.activated`
   - `membership.deactivated`
   - `membership.cancel_at_period_end_changed`
   - `payment.succeeded`
   - `course_lesson_interaction.completed`

## Step 4 — Get the API key

1. In the Whop developer dashboard, generate an **App API Key**.
2. Note the key — this goes in `WHOP_API_KEY`.

## Step 5 — Create the Neon PostgreSQL database

1. Go to [Neon](https://neon.tech) and create a new project.
2. Name it `rescueloop-pilot`.
3. Copy the **Pooled connection string** — this goes in `DATABASE_URL`.
4. Copy the **Direct connection string** — this goes in `DIRECT_URL`.

Both should look like:
```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

## Step 6 — Set up Inngest

1. Go to [Inngest](https://app.inngest.com) and create a new app.
2. Name it `rescueloop`.
3. Set the webhook endpoint to:
   `https://rescueloop.vercel.app/api/inngest`
4. Note the **Event Key** — this goes in `INNGEST_EVENT_KEY`.
5. Note the **Signing key** — this goes in `JOB_PROVIDER_SECRET`.

## Step 7 — Generate the student link signing secret

Generate a 32+ character random secret:
```bash
openssl rand -base64 48
```
This goes in `STUDENT_LINK_SIGNING_SECRET`.

## Step 8 — Configure Vercel environment variables

Vercel separates **Development**, **Preview**, and **Production** environments.
Variables configured in **Preview** do NOT automatically appear in **Production**.
Configure each environment separately.

### Environment variable matrix

| Variable | Scope | Required for demo build | Required for backend | Secret |
|---|---|---:|---:|---:|
| `NEXT_PUBLIC_WHOP_APP_ID` | Public | No | Yes | No |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | No | Optional | No |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | No | Optional | No |
| `DATABASE_URL` | Server | No | Yes | Yes |
| `DIRECT_URL` | Server | No | Yes | Yes |
| `WHOP_API_KEY` | Server | No | Yes | Yes |
| `WHOP_WEBHOOK_SECRET` | Server | No | Yes | Yes |
| `APP_URL` | Server | No | Yes | No |
| `STUDENT_LINK_SIGNING_SECRET` | Server | No | Yes | Yes |
| `CRON_SECRET` | Server | No | Yes | Yes |
| `INNGEST_EVENT_KEY` | Server | No | Yes | Yes |
| `JOB_PROVIDER_SECRET` | Server | No | Optional | Yes |
| `SENTRY_DSN` | Server | No | Optional | Yes |

### Build-only public demo

The public demo (landing page, `/overview`, `/rescue-queue`, `/students`,
`/campaigns`, `/insights`, `/value`, `/settings`, `/student-rescue`,
`/onboarding`, `/legal/*`) builds and deploys **without any environment
variables**. No Whop credentials, no database URL, and no Inngest key are
required for the demo to build and run.

### Backend preview

To enable the backend company routes (`/companies/[companyId]/*`) and
webhook ingestion, configure all "Required for backend" variables in the
Vercel **Preview** environment.

### Real Whop integration

To enable real Whop integration in production, configure all variables in
the Vercel **Production** environment after completing Steps 1–7.

**Important:** Never prefix server secrets with `NEXT_PUBLIC_`.
Only `NEXT_PUBLIC_WHOP_APP_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, and
`NEXT_PUBLIC_POSTHOG_HOST` should be public.

## Step 9 — Run the database migration

After deploying to Vercel (or locally with the env vars set):

```bash
bunx prisma migrate deploy
```

This creates all tables in the Neon database.

## Step 10 — Re-approve permissions (if needed)

If you add new permissions after the initial install, creators must
re-approve. Whop will prompt them on their next dashboard visit.

## Step 11 — Send a test webhook

In the Whop developer dashboard, use the webhook testing tool to send:

1. A `membership.activated` event for a test user.
2. A `course_lesson_interaction.completed` event for the same user.

Check the RescueLoop logs to confirm:
- The webhook receipt was stored (status: `processed`)
- The membership/student records were created
- The progress event was recorded

## Step 12 — Create a safe test student

1. Create a test product in Whop (price: $0 or $1).
2. Create a test course with at least one lesson.
3. Enroll the test student in the product + course.
4. Confirm the student appears in the RescueLoop queue after the
   configured activation delay (default: 7 days — you can reduce this
   for testing).

## Step 13 — Test the full workflow

1. Install RescueLoop on your Whop company.
2. Complete onboarding (select course + product, confirm mapping).
3. Wait for sync (or trigger a manual sync).
4. Review the candidate in the queue.
5. Approve the intervention.
6. Check that a notification was attempted (delivery state: `api_accepted`).
7. Open the student link from the notification.
8. Choose "Continue course" or "I'm stuck".
9. Verify the response appears in the creator response centre.
10. Complete a lesson as the student and verify the attribution.

## Security notes

- Never commit `.env` files. The `.env.example` contains only variable names.
- The `WHOP_WEBHOOK_SECRET` is base64-encoded by the client (`btoa()`) —
  store the raw secret in the env var, not the base64 version.
- Student access tokens are opaque (32 random bytes). Only their SHA-256
  hash is stored in the database. The raw token is never persisted.
- All company routes verify Whop admin access via the official SDK.
  The `companyId` from the URL is never trusted alone.

## Current limitations

- The Whop SDK methods (`verifyUserToken`, `checkAccess`, `notifications.create`)
  require real Whop credentials to function. Without credentials, routes
  return appropriate auth errors (401/403/503).
- No Sentry or PostHog integration is initialized yet (env vars documented
  but SDKs not wired into the app).
- No Playwright E2E tests are written yet (infrastructure is configured).

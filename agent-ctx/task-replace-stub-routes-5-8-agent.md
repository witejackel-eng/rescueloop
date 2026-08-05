# Task: Replace stub company routes 5-8 with database-backed views

## Routes replaced
1. `/companies/[companyId]/insights` — commit d80bda3
2. `/companies/[companyId]/value` — commit d322ad5
3. `/companies/[companyId]/audit` — commit 2af087e
4. `/companies/[companyId]/usage` — commit 6ee8db7

## What was done

Each stub page was replaced with a real server component that:

### Auth pattern (all pages)
- Uses `getProviderMode()` from `@/providers` directly
- In fixture mode: uses `FIXTURE_COMPANY_ID`, renders fixture component
- In whop mode: calls `requireCompanyAdmin(companyId)`, handles typed errors
- In unconfigured mode: calls `redirect("/onboarding")`
- Removed all imports from the non-existent `@/lib/auth/strict-company-auth`

### Insights page
- **Whop mode**: Queries `db.course.findMany`, `db.studentCourseState.findMany`, `db.student.count`, `db.intervention.groupBy`, `db.blockerResponse.groupBy`
- **Course funnels**: Enrolled, completed, stalled, no-progress per course
- **Lesson friction map**: Counts students stalled at each lesson index
- **Course-average comparison**: Per-course avg vs global avg with ±% display
- **Blocker distribution**: Grouped by blocker type from student responses
- **Intervention workflow states**: Grouped by state
- **Small sample warning**: Shows data-quality warning when students < 30
- **Fixture mode**: Renders from `getCourses()`, `getCourseStudents()`, `getLessonInteractions()` with "Illustrative fixture outcome" label

### Value page
- **Whop mode**: Queries `db.valueEvent.findMany` with cursor pagination, `db.valueEvent.groupBy` for counts by attribution level
- **Attribution summary**: Unattributed, strongly_associated, estimated, confirmed — NOT combined into one total
- **Evidence chain**: Shows `attributionEvidences` per value event with timestamps
- **Policy version**: Displays policy v2026-08-01 with conservative attribution rules
- **Filters**: Attribution level filter via search params
- **Export request**: CSV export link
- **Fixture mode**: Shows strongly_associated count with $0 financial value, sample evidence chain with "Illustrative fixture outcome" label

### Audit page
- **Whop mode**: Queries `db.auditLog.findMany` with cursor pagination, `db.auditLog.count`
- **Immutable notice**: States audit rows cannot be updated or deleted via normal product routes
- **Audit row fields**: Timestamp, actor, actor type (system/user/service with icons), action, object type, object ID, previous state, new state, reason, request ID (from metadata), intervention ID
- **Filters**: Action, actor, object type — all with `defaultValue` to preserve filter state
- **Fixture mode**: Shows "Illustrative fixture outcome" label, audit schema reference, empty state card explaining audit events require Whop-mode operation

### Usage page
- **Whop mode**: Uses `getOrganizationPlan()`, `checkLimit()`, `getUsageForPeriod()` plus direct counts
- **Current plan**: Tier name, price, plan override badge
- **Billing period**: Period string + entitlement start/end dates
- **Resource limits**: Monitored members, courses, active campaigns, team seats — each with progress bar
- **Metered consumption**: Candidates evaluated, interventions created, notifications accepted, stored source events, exports
- **Soft warnings**: 80% threshold alerts
- **Hard limits**: Reached-limit alerts with clear messaging
- **Plan overrides**: Badge when entitlement overrides pilot defaults
- **Fixture mode**: Pilot plan with "Illustrative fixture outcome" label, hardcoded fixture usage values

## No "Coming in Phase 2" text remains
Grep confirms zero instances of "Coming in Phase 2" or "What this page will show" in any of the four page files.

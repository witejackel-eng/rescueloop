# Frontend Completion Status

## Demo workspace (fixture data)

All demo routes use the fixture provider and require no backend. They show a coherent, realistic dataset for "Creator Growth Lab" with 742 students, 118 at-risk, 78 interventions dispatched.

| Route | Status | What it shows |
|-------|--------|---------------|
| `/` | Complete | Marketing landing page with hero, features, pricing, FAQ, CTA |
| `/overview` | Complete | Outcome cards, recovery funnel, risk segments, activity feed, friction findings |
| `/rescue-queue` | Complete | Tabbed queue (6 tabs), student rows, search, filters, inspector drawer |
| `/students` | Complete | Searchable directory, saved views, momentum badges, student inspector |
| `/campaigns` | Complete | Campaign list with 5 campaign types, status badges |
| `/campaigns/[id]` | Complete | Campaign editor, rule builder, safety controls, message preview |
| `/insights` | Complete | Course funnel, lesson friction map, blocker explorer, recommendations |
| `/value` | Complete | Three-tier attribution, ledger table, ROI card, methodology |
| `/settings` | Complete | Sections: general, automation, Whop connection, notifications, plan, data, danger zone |
| `/onboarding` | Complete | Five-step flow: intro → select course → confirm mapping → audit → results |
| `/student-rescue` | Complete | Student-facing rescue screen (mobile-first, calm, no dashboard chrome) |
| `/student-rescue/blocker` | Complete | Blocker selection + optional free-text + submit |
| `/legal/*` | Complete | Terms, privacy, security, data-processing pages |

## Connected workspace (real database)

All connected workspace routes use PostgreSQL and Whop auth. They show live data from the organization's database.

| Route | Status | What it shows |
|-------|--------|---------------|
| `/companies/[companyId]/overview` | Complete | Live outcome cards, intervention counts by state, recent activity |
| `/companies/[companyId]/queue` | Complete | Real queue with approve, dismiss, schedule, suppress actions |
| `/companies/[companyId]/students` | Complete | Real student directory with enrollment and progress data |
| `/companies/[companyId]/campaigns` | Complete | Real campaign list and editor |
| `/companies/[companyId]/insights` | Complete | Real friction findings and recommendations |
| `/companies/[companyId]/value` | Complete | Real value events and attribution |
| `/companies/[companyId]/settings` | Complete | Real org settings with pause/resume toggle |
| `/companies/[companyId]/audit` | Complete | Real audit trail |
| `/companies/[companyId]/sync` | Complete | Sync execution history, manual trigger button |
| `/companies/[companyId]/usage` | Complete | Plan tier, monitored member count, limits |
| `/companies/[companyId]/onboarding` | Complete | Whop course/product picker + mapping confirmation |
| `/companies/[companyId]/responses` | Complete | Student response center |

## Student experience (token-authenticated)

| Route | Status | What it shows |
|-------|--------|---------------|
| `/experiences/[experienceId]/rescue/[token]` | Complete | Student rescue screen with action buttons, authenticates via SHA-256 token hash |

## Internal operations workspace

| Route | Status | What it shows |
|-------|--------|---------------|
| `/internal/pilots` | Complete | Pilot applications with approve/reject actions |
| `/internal/sync` | Complete | Cross-org sync status |
| `/internal/jobs` | Complete | Job queue monitoring |
| `/internal/webhooks` | Complete | Webhook receipt log |
| `/internal/dead-letters` | Complete | Dead letter events with re-queue action |
| `/internal/usage` | Complete | Usage counters and plan limits |
| `/internal/organisations` | Complete | Organisation listing and management |
| `/internal/data-requests` | Complete | Export and deletion request queue |

## Private pilot application

| Route | Status | What it shows |
|-------|--------|---------------|
| `/private-pilot` | Complete | Application form: name, email, company, course URL, member count, motivation |

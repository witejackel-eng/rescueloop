# Task 2 — Member Detail Page Agent

## Task
Build a comprehensive Member Detail page at `/dashboard/[companyId]/members/[memberId]` with rich timeline, interventions, metrics, and activity history.

## What Was Implemented

### 1. New Member Detail Page
**File**: `src/app/(dashboard)/dashboard/[companyId]/members/[memberId]/page.tsx`

A "use client" page component that:
- Uses `useParams()` to extract both `companyId` and `memberId`
- Uses `useCompanyDataBundle(companyId)` hook to load the company bundle
- Finds the specific member by ID via `useMemo`
- Has loading state with skeleton (header card + 4 metric skeletons + 2 column skeletons)
- Has error state with retry button
- Has not-found state using the `EnhancedEmptyState` shared component
- Uses `PageTransition` wrapper for consistent entrance animation
- Back link to `/dashboard/[companyId]/students` at the top

### 2. Member Header Section
- Avatar (shadcn Avatar with initials in fallback)
- Member name in serif font (text-[28px])
- Email (derived deterministically from member name)
- "Member since" date (deterministic demo date)
- Status badge (Active / At Risk / Responded / Inactive) with colored dot
- Risk score gauge — circular SVG progress (96px) with animated stroke offset
  - Color-coded: green (≤30), yellow (31–60), red (>60)
  - Reduced-motion aware
- Quick action buttons: "Send message" (focuses composer), "Add to rescue queue" (toast), "View activity" (scrolls to timeline)
- Top color strip (3px) reflecting risk level
- Member ID chip + last intervention/response badges

### 3. Key Metrics Row (4 cards)
Using the shared `MetricCard` component:
- **Days inactive** — derived from member state (Clock icon)
- **Engagement score** — member.progress as % (TrendingUp icon)
- **Last response** — member.lastResponse text (MessageSquare icon, info accent when present)
- **Recovery probability** — derived from risk score (Target icon)

### 4. Engagement Timeline (vertical)
- All member activity events, filtered by name match in `bundle.activity`
- Falls back to synthesized demo events (4–6) when no real activity matches
- Each event has: timestamp, type icon, description, status badge
- Color-coded left border by event type
- Animated entrance with framer-motion stagger (max 0.3s delay)
- "Load more" button when more than 10 events
- Filter chips at top: All, Messages, Responses, Status Changes, System Events
- Event type categorization: draft_prepared/creator_edited → messages, student_opened/responded/course_activity_observed → responses, candidate_detected/approved → status, sync_completed → system

### 5. Intervention History Card
- List of past interventions (synthesized per member, 1–3 entries)
- Each intervention shows: date, playbook name, message preview, response status badge, outcome badge
- Expandable rows with full message content (animated height transition)
- Outcome badge variants: Recovered / No Response / In Progress / Dismissed
- Response status variants: Sent / Opened / Responded / Not opened / Drafted

### 6. Course Progress Card
- List of 1–3 courses per member
- Progress bar with animated width
- Last accessed date
- Completion percentage
- Status icon (on track / behind / abandoned)
- Color-coded progress bar (green/yellow/red)

### 7. Risk Factors Card
- List of detected risk factors based on member state:
  - No login in X days (warning/critical based on days)
  - Missed lessons (warning if progress < 50%)
  - No response to emails (warning if no lastResponse)
  - Cancellation scheduled (critical) or Trial expiring (info)
  - Reminders suppressed (info)
- Each factor: severity indicator (critical/warning/info) with icon
- Detected date
- Suggested action with Sparkles icon
- Falls back to positive "No risk factors" message for healthy members

### 8. Communication Panel (Sidebar)
- Quick message composer with Textarea
- Template selector using shadcn DropdownMenu populated from `bundle.playbooks`
- Applying a template synthesizes a personalized message and shows a toast
- Send button with toast notification on success
- Simulated async send (700ms) with disabled state and spinner
- Recent messages list (last 5) with status dots (delivered/opened/responded)
- New sent messages prepend to the list, capped at 5
- Engagement Trend mini-card below with SparklineMini (8-week rolling) + Lessons/Streak/Remaining grid

## Architecture Decisions

### State Management
- `recentMessages` is computed via `useMemo` combining a deterministic seed (from member) plus user-sent messages from `useState`. This avoids the `setState`-in-effect anti-pattern flagged by the React Compiler lint rule.
- `engagementSparkline` is computed via `useMemo` BEFORE any early returns so hook order stays stable.
- `memberActivity` depends on `bundle` (not `bundle?.activity`) to satisfy React Compiler's memoization preservation rule.

### Data Sources
- Uses `useCompanyDataBundle(companyId)` to get:
  - `bundle.members` — find the specific member by ID
  - `bundle.activity` — filter for this member's activity (with demo fallback)
  - `bundle.playbooks` — for the template selector in the composer
  - `bundle.responses` — available but not directly used (member.lastResponse is used instead)
- All other data (interventions, courses, risk factors, email, member since) is synthesized deterministically per member with comments noting it's demo data.

### Layout
- Two-column grid on desktop (lg:): main content (col-span-2) + sidebar (col-span-1)
- Single column on mobile
- Sidebar uses `lg:sticky lg:top-4` so the composer stays visible while scrolling the timeline

### Risk Score Derivation
- Same logic as the Students page for consistency
- Factors: status, progress, membership type, suppressed flag
- Maps to green/yellow/red color categories

### Animations
- All framer-motion animations respect `prefers-reduced-motion` (via `useReducedMotion` hook for the RiskGauge)
- Stagger entrance with capped delay (max 0.3s for timeline events)
- AnimatedCounter inside MetricCard handles count-up
- SparklineMini animates polyline pathLength + last-point dot

## Verification

### Lint
- `bun run lint` — **PASS** (0 errors)

### Routes (via curl, all 200 OK)
- `/dashboard/co_cgl/members/m1` (needs_attention member) — 200
- `/dashboard/co_cgl/members/nonexistent` (not found state) — 200
- `/dashboard/co_cgl/members/m5` (responded member) — 200
- `/dashboard/co_cgl/members/m8` (paused_reminders member) — 200

### Loading State
- Created `loading.tsx` at the route root using `DashboardLoading` shared component with title="Member profile"

## Files Added
1. `src/app/(dashboard)/dashboard/[companyId]/members/[memberId]/page.tsx` — Main page (~1500 lines)
2. `src/app/(dashboard)/dashboard/[companyId]/members/[memberId]/loading.tsx` — Route loading skeleton

## Dependencies
- No new npm dependencies added
- Uses existing shadcn components: Card, Badge, Button, Textarea, Separator, Avatar, DropdownMenu
- Uses existing shared components: PageTransition, SectionHeader, EnhancedEmptyState, MetricCard, SparklineMini, CardSkeleton, MetricSkeleton
- Uses existing hooks: useCompanyDataBundle, useReducedMotion

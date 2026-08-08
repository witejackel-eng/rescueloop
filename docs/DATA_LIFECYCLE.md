# Data Lifecycle

How data flows through RescueLoop: ingestion, storage, export, and deletion.

## Data ingestion

### Webhook-driven ingestion

Most data enters RescueLoop via Whop webhooks:

| Webhook event | Data created/updated |
|--------------|---------------------|
| `membership.activated` | `Student` upsert, `Membership` create, `MembershipEvent` |
| `membership.deactivated` | `Membership` update (cancelled), pending interventions stopped |
| `membership.cancel_at_period_end_changed` | `Membership` update (cancelling), eligibility re-evaluation |
| `payment.succeeded` | `PaymentEvent` create, attribution check against recent interventions |
| `course_lesson_interaction.completed` | `ProgressEvent` create (idempotent via externalInteractionId) |

### Sync-driven ingestion

Full syncs pull bulk data from the Whop API:
- Memberships (paginated, checkpointed)
- Progress events (paginated, checkpointed)
- Products and courses (for mapping)

### Onboarding data

When a creator completes onboarding, they select a course and product. This creates a `ProductCourseMapping` that links Whop products to courses for eligibility evaluation.

## Data storage

### Tenant scoping

All data is scoped by `organizationId`. No cross-tenant queries exist. Integration tests verify this invariant.

### JSON fields

Several fields store JSON data:
- `rulesJson` — campaign rule snapshots (versioned via CampaignVersion)
- `evidenceJson` — eligibility evidence at detection time
- `payloadJson` — outbox event payloads, webhook receipt payloads
- `metadataJson` — audit log metadata, internal audit metadata

These are stored as PostgreSQL `JSONB` columns. Prisma types them as `Json` which maps to `InputJsonValue`.

### Sensitive data

- **Student access tokens:** Only SHA-256 hashes are stored. Raw tokens are never persisted.
- **Webhook payloads:** Retained for replay and audit. Redacted on org deletion (replaced with `{}`).
- **Student free-text responses:** Stored in `BlockerResponse.content`. Never sent to analytics (PostHog allowlist excludes it).

## Data export

**File:** `src/lib/data-lifecycle/export-engine.ts`

### What is exported

A complete JSON export of all organization data:
- Organization metadata and settings
- All members, students, memberships, enrollments
- All courses, products, and mappings
- All campaigns, interventions, and student responses
- All value events and audit logs
- All progress and payment events
- All webhook receipts (payloads redacted)
- All outbox and dead letter events

### How to request

`POST /api/companies/[companyId]/data-export`

The export is generated asynchronously via Inngest. When complete, it's stored in the `DataExportRequest` record and can be downloaded from the internal dashboard.

### Format

JSON, structured as:

```json
{
  "organization": { ... },
  "members": [ ... ],
  "students": [ ... ],
  "exportedAt": "2025-01-01T00:00:00Z",
  "evidence": { ... }
}
```

## Data deletion

**File:** `src/lib/data-lifecycle/deletion-engine.ts`

### Deletion process

1. **Request:** `POST /api/companies/[companyId]/data-deletion` creates a `DataDeletionRequest`
2. **Grace period:** 24 hours (configurable). During this time, deletion can be cancelled.
3. **Execution:** After the grace period, all organization data is deleted in dependency order.
4. **Verification:** Post-deletion, the engine verifies no records remain for the organization.

### Deletion order (respects foreign keys)

1. Suppressions
2. Reminder requests
3. Blocker responses
4. Student responses
5. Student access tokens
6. Delivery attempts
7. Value events
8. Interventions
9. Eligibility snapshots
10. Campaign versions
11. Campaign rules
12. Campaigns
13. Payment events
14. Progress events
15. Membership events
16. Enrollments
17. Student course states
18. Memberships
19. Students
20. Product course mappings
21. Courses
22. Products
23. Organization members
24. Outbox events
25. Dead letter events
26. Audit logs (redacted, not deleted)
27. Webhook receipts (payloads redacted, not deleted)
28. Internal audit logs
29. Usage counters, events, reservations
30. Data export/deletion requests
31. Whop installation
32. Integration credentials
33. Sync checkpoints, runs, outcomes
34. Organization (suspended, not dropped)

### Post-deletion state

After deletion:
- The organization record exists but is `suspended`
- Audit log metadata is retained for compliance
- Webhook receipt payloads are redacted (replaced with `{}`)
- No student, membership, or intervention data remains

## Retention

- **Audit logs:** Retained indefinitely (compliance requirement)
- **Webhook receipts:** Retained indefinitely (redacted on org deletion)
- **Outbox events:** Retained for debugging; dead letters can be manually purged
- **Progress events:** Retained for attribution and analytics
- **Student data:** Deleted on org deletion request after grace period

## Integration tests

`src/tests/integration/data-lifecycle.test.ts` verifies:
- Export includes all org data
- Deletion removes all org data
- Deletion respects grace period
- Post-deletion verification succeeds
- Cross-tenant data is not affected by deletion

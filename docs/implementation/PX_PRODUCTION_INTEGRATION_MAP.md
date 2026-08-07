# PX Production Integration Map

Maps each PX concept from df3fc87 to existing RescueLoop production source of truth.

| PX Concept | Existing RescueLoop Source of Truth | New DB Model Required? | Reason |
|---|---|---|---|
| **Operation progress** | `SyncExecution`, `SyncStage`, `SyncCheckpoint`, `OnboardingProgress`, `DataExportRequest`, `DataDeletionRequest`, `OutboxEvent`, `JobExecution` | **NO** | Existing models already track persisted multi-stage operations. PX01 adds *UI adapters* only. |
| **System Health** | Derive from `WhopInstallation`, `SyncExecution`, `WebhookReceipt`, `OutboxEvent`, `JobExecution`, `SubscriptionEntitlement`, `UsageCounter`, provider availability | **NO** | Health is a read model over existing production state. No persistent health table needed. |
| **Exception operations** | `DeadLetterEvent`, `OutboxEvent` (failed), `WebhookReceipt` (failed), `SyncExecution` (failed), `SubscriptionEntitlement` (billing_error), `InternalAuditLog` | **NO** | Exceptions derive from existing failure states. `InternalAuditLog` already exists for operator actions. |
| **Operator actions** | `AuditLog`, `InternalAuditLog` | **NO** | Both audit tables exist. Reuse them. |
| **Tenant usage** | `UsageCounter`, `UsageEvent`, `UsageReservation`, `Plan`, `SubscriptionEntitlement` | **NO** | Mature usage metering architecture exists. |
| **Recovery matrix** | Inngest retry config, `OutboxEvent` backoff, `DeadLetterEvent` | **NO** | Retry/recovery behavior is already configured in the job/outbox system. PX04 adds *documentation and diagnostics UI*. |
| **Rate limiting** | `UpstashRateLimiter` + `InMemoryRateLimiter` in `src/lib/rate-limit/rate-limiter.ts` | **NO** | Existing production Upstash limiter is the canonical implementation. Consolidate, don't duplicate. |
| **Cost estimation** | `UsageCounter`, `UsageEvent`, `Plan`, `SubscriptionEntitlement` | **NO** | Cost is a read model over existing usage data with a configurable rate card. Internal-only. No billing truth. |
| **Scale benchmark** | Test/scripts only | **NO** | Benchmarks must NOT require production schema. Fixtures and runners stay in `src/lib/scale/` and `scripts/`. |
| **Growth funnel** | PostHog (`trackEvent` with explicit allowlist) | **MAYBE** | PostHog already tracks activation events. Minimal additive persistence only if real-time funnel queries need DB-backed state. Current PostHog is sufficient. |
| **Referral attribution** | No existing model | **MAYBE** | Small additive model if referral tracking requires persistence beyond PostHog. Can start with PostHog-only. |
| **Case-study consent** | No existing model | **MAYBE** | Small additive model if consent needs to be durable. Can start with PostHog flag. |

## Decision Summary

- **No new Prisma models** in this integration round
- All PX features are implemented as **read models, UI adapters, and internal tooling** over existing production state
- If future requirements demand DB-backed funnel/referral, a separate additive migration will be created
- The df3fc87 Prisma schema is **completely rejected** — it replaced PostgreSQL with SQLite and deleted production models

# PX Production Integration Map

## Model Reuse Audit

| PX Concept | New Model Needed? | Existing Model Reuse |
|------------|-------------------|---------------------|
| Operation progress (PX01) | No — Operation model exists | OnboardingProgress, SyncExecution |
| Health Check (PX02) | No — HealthCheck model exists | Derive from real system state |
| Exception (PX03) | No — ExceptionRecord exists | AuditEntry for operator actions |
| Diagnostic (PX04) | No — DiagnosticRecord exists | Recovery matrix from existing rules |
| Tenant Usage (PX05) | No — TenantUsage exists | Derive from SubscriptionEntitlement |
| Scale Benchmark (PX06) | No — scripts/tests only | No DB model needed |
| Growth Funnel (PX07) | No — FunnelEvent exists | PostHog + FunnelEvent |

## Route Classification

| Route | Auth Level | Scope |
|-------|-----------|-------|
| / | PUBLIC | Marketing |
| /overview | PUBLIC | Demo (simulated) |
| /dashboard/[companyId] | COMPANY AUTH | Connected |
| /dashboard/[companyId]/settings/health | COMPANY AUTH | Connected |
| /dashboard/[companyId]/help/diagnostics | COMPANY AUTH | Connected |
| /internal/* | INTERNAL AUTH | Operator |
| /api/health | PUBLIC | Health check |
| /api/dashboard/[companyId]/* | COMPANY AUTH | Connected API |
| /api/internal/* | INTERNAL AUTH | Operator API |

## Schema Status
- Provider: postgresql ✅
- DIRECT_URL: present ✅
- Additive only: yes ✅
- Destructive SQL: none ✅

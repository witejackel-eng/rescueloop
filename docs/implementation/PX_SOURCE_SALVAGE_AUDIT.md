# PX Source Salvage Audit

## Salvage from repair branch (12c3cb36)

### KEEP (18 UI components)
- src/components/rescueloop/operations/* (provider-state, safe-to-leave-badge, operation-progress, candidate-preview, stage-indicator, sync-progress-view)
- src/components/rescueloop/health/* (system-health-page, health-domain-card, health-status-badge, health-action-panel)
- src/components/rescueloop/diagnostics/* (diagnostics-page, diagnostic-card, diagnostic-export, recovery-status)
- src/components/rescueloop/cost/* (cost-dashboard, cost-breakdown, tenant-cost-row, margin-indicator, rate-card-viewer)
- src/components/rescueloop/scale/* (scale-dashboard, chaos-panel, benchmark-results, load-profile-selector, metrics-panel)
- src/components/rescueloop/growth/* (growth-dashboard, funnel-visualization, referral-panel)
- src/components/rescueloop/internal/* (exception-dashboard, exception-table, exception-summary, org-360, audit-log)

### ADAPT (19 routes/stores)
- Overview page → expanded to full demo workspace
- /internal → enhanced with org summary
- Health store → company-scoped
- Demo store → fixture-based
- Operation store → server-authoritative pattern
- All API routes → auth-classified

### REPLACE
- Prisma schema → PostgreSQL with DIRECT_URL + mature domain models restored
- Root page.tsx → DELETED (marketing page is canonical /)

### REJECT (2 items)
- SQLite schema (provider must be postgresql)
- Duplicate src/app/page.tsx (conflicts with marketing route)

## Status: COMPLETE ✅

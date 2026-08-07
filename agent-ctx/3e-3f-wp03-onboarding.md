# WP-03: Threshold/Candidate Preview, First-Value Completion, Fixture/Connected Separation

**Task ID:** 3e-3f
**Status:** Completed

## Files Created/Modified

| File | Purpose |
|------|---------|
| `src/components/rescueloop/onboarding/threshold-step.tsx` | Threshold configuration with slider, preview, safety implications |
| `src/components/rescueloop/onboarding/candidate-preview-step.tsx` | Candidate list with full detail fields, "nothing sent" banner |
| `src/components/rescueloop/onboarding/zero-candidate-state.tsx` | Zero-candidate success state (not failure) |
| `src/components/rescueloop/onboarding/completion-step.tsx` | First-value completion with all-step confirmation |
| `src/lib/onboarding/mode-guard.ts` | Fixture/connected mode guard, fixture data factory |
| `src/app/api/dashboard/[companyId]/onboarding/route.ts` | Onboarding API (GET state, POST advance) |
| `src/app/page.tsx` | Root page: fixture journey / Whop landing / setup instructions |

## Key Patterns
- `isFixtureMode()` checks `RESCUELOOP_FIXTURE_MODE` env var
- `ensureConnectedMode()` throws in fixture mode for routes requiring real data
- Fixture data factory generates 6 deterministic candidates with threshold-based filtering
- API route uses `OnboardingProgress` model (not Organization.onboardingStep)
- Never sends notifications during onboarding (enforced by design, `notificationsSent: 0`)

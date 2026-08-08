# Vercel Preview Toolbar — Owner Action

## Summary

The black Vercel Preview Toolbar (with the comment/feedback button) is part
of the **Vercel platform**, not the RescueLoop application. It is injected
into Preview deployments by Vercel at the platform layer and cannot be
reliably hidden through application CSS or JavaScript — any attempt to do
so would be brittle, would break on Vercel runtime updates, and would
violate the RescueLoop "no application hacks for platform concerns" rule.

This document records the **owner action** required to disable the toolbar
on the RescueLoop Vercel Preview deployment, and explicitly states that
this agent has NOT performed the action (no authenticated Vercel project
access was available during this work).

---

## Required owner action

Set the environment variable on the Vercel project for the **Preview**
environment only:

```
VERCEL_PREVIEW_FEEDBACK_ENABLED=0
```

### How to set it

Pick ONE of the following (all equivalent — they write to the same
Vercel project setting):

**Option A — Vercel dashboard**

1. Open the RescueLoop project on Vercel.
2. Settings → Environment Variables.
3. Add a new entry:
   - Key: `VERCEL_PREVIEW_FEEDBACK_ENABLED`
   - Value: `0`
   - Environments: tick **Preview** only (leave Production and
     Development unchecked).
4. Save.

**Option B — Vercel CLI**

```sh
echo "0" | vercel env add VERCEL_PREVIEW_FEEDBACK_ENABLED preview
```

**Option C — `vercel.json` (build-time, all environments)**

Add to `vercel.json`:

```json
{
  "build": {
    "env": {
      "VERCEL_PREVIEW_FEEDBACK_ENABLED": "0"
    }
  }
}
```

Note: Option C sets the variable for **all** environments, including
production builds. Since the variable only affects Preview deployments
behaviourally (production has no toolbar), this is harmless, but Options
A or B are preferred because they scope the change to Preview only.

### After setting the variable

1. Trigger a redeploy of the latest Preview deployment (either via the
   Vercel dashboard or `vercel --target preview`).
2. Open the Preview URL in a browser.
3. Confirm the black toolbar is no longer present at the bottom of the
   page.
4. Confirm the RescueLoop header is the only fixed element at the top of
   the viewport.

---

## What this agent did NOT do

- Did NOT add CSS or JavaScript to hide the Vercel Toolbar.
- Did NOT modify `next.config.ts` to inject toolbar-hiding styles.
- Did NOT add `<style>` tags targeting `[data-vercel-toolbar]`,
  `#vercel-toolbar`, `.vercel-feedback`, or any similar selector.
- Did NOT claim that the toolbar is disabled on the live Preview
  deployment.
- Did NOT claim to have Vercel project access.

---

## Verification (to be performed by owner after the action)

- [ ] `VERCEL_PREVIEW_FEEDBACK_ENABLED=0` is visible in the Vercel
      project's Environment Variables list, scoped to Preview.
- [ ] Latest Preview deployment was redeployed AFTER the variable was
      added.
- [ ] Opening the Preview URL in a clean browser session (no Vercel
      SSO cookie) shows no black toolbar.
- [ ] The RescueLoop floating-nav is the only fixed element at the top
      of the viewport at every breakpoint listed in
      `src/tests/e2e/header-responsive.spec.ts`.

---

## Why the toolbar is not a RescueLoop bug

The Vercel Preview Toolbar is platform-level UI injected by Vercel's
runtime. It is independent of the RescueLoop Next.js application and is
controlled by Vercel project / environment settings, not by application
code. The current Vercel Preview deployment is also protected by Vercel
SSO — that, too, is a platform-level access control and not an
application-routing concern.

The RescueLoop application routes are unchanged by this owner action.
The `/overview` demo redirect, the marketing header, and all
`/dashboard/[companyId]` auth guards behave identically regardless of
whether the Vercel Toolbar is shown.

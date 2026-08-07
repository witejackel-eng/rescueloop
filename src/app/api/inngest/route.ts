// Inngest serve route. Exposes the job functions to the Inngest platform.
// GET /api/inngest — Inngest introspection
// POST /api/inngest — Inngest function execution
//
// If Inngest is not configured, the route returns 503. The serve() handler
// is only created when Inngest is ready — otherwise we export stub handlers
// that return 503. This prevents the build from crashing during page-data
// collection when INNGEST_EVENT_KEY is not set.

import { serve } from "inngest/next";
import { NextRequest } from "next/server";
import { isInngestReady, getInngestClient } from "@/server/jobs/client";
import { getJobFunctions } from "@/server/jobs/functions";

export const runtime = "nodejs";

function notConfiguredResponse() {
  return Response.json(
    { error: { code: "INNGEST_NOT_CONFIGURED", message: "Inngest integration is not configured for this environment." } },
    { status: 503 },
  );
}

// Create the serve handlers lazily — only when Inngest is configured.
let serveHandlers: ReturnType<typeof serve> | null = null;

function getServeHandlers() {
  if (!serveHandlers) {
    if (!isInngestReady()) {
      return null;
    }
    serveHandlers = serve({
      client: getInngestClient(),
      functions: getJobFunctions(),
    });
  }
  return serveHandlers;
}

export async function GET(req: NextRequest) {
  const handlers = getServeHandlers();
  if (!handlers) return notConfiguredResponse();
  return handlers.GET!(req, {} as Parameters<typeof handlers.GET>[1]);
}

export async function POST(req: NextRequest) {
  const handlers = getServeHandlers();
  if (!handlers) return notConfiguredResponse();
  return handlers.POST!(req, {} as Parameters<typeof handlers.POST>[1]);
}

export async function PUT(req: NextRequest) {
  const handlers = getServeHandlers();
  if (!handlers) return notConfiguredResponse();
  return handlers.PUT!(req, {} as Parameters<typeof handlers.PUT>[1]);
}

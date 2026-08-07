import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireInternalAuth, InternalAuthError } from "./internal-auth";
import { recordInternalAudit } from "./internal-audit";

// ─── Shared helpers for internal API routes ──────────────────
// Every internal route follows the same pattern:
// 1. Authenticate via Authorization header
// 2. Parse the action from the request body
// 3. Execute the action
// 4. Record an audit event
// 5. Return the result

export interface InternalActionContext {
  actorId: string;
  reason: string;
  tenantScope?: string;
}

/** Authenticate and extract actor context from request */
export function authenticateInternalRequest(request: NextRequest): { actorId: string } {
  try {
    return requireInternalAuth(request);
  } catch (err) {
    throw err;
  }
}

/** Build a standard error response for internal auth failures */
export function internalAuthErrorResponse(err: unknown): NextResponse {
  if (err instanceof InternalAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  return NextResponse.json({ error: "Internal authentication failed" }, { status: 401 });
}

/** Safely handle an internal API route with auth + audit */
export async function withInternalAuth(
  request: NextRequest,
  handler: (ctx: { actorId: string }) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const { actorId } = requireInternalAuth(request);
    return await handler({ actorId });
  } catch (err) {
    return internalAuthErrorResponse(err);
  }
}

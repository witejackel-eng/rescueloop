import { NextRequest, NextResponse } from "next/server";
import { requireInternalAuth } from "@/lib/auth/internal-auth";

/**
 * POST /api/internal/auth
 * Validates the Authorization header token.
 * Returns 200 if valid, 401/503 if not.
 */
export async function POST(request: NextRequest) {
  try {
    const { actorId } = requireInternalAuth(request);
    return NextResponse.json({ authenticated: true, actorId });
  } catch (err) {
    if (err instanceof Error && "status" in err) {
      const status = (err as { status: number }).status;
      return NextResponse.json(
        { error: err.message },
        { status },
      );
    }
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }
}

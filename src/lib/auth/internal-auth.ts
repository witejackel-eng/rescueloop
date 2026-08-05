import "server-only";

// ─── Internal operations authentication ──────────────────────
// Validates that the request comes from an authenticated internal operator.
// Security is NOT based on route obscurity — it requires a valid
// RESCUELOOP_INTERNAL_TOKEN in the Authorization header.
//
// Usage:
//   const actor = requireInternalAuth(request);
//   // actor = { actorId: "internal:<token-hash-prefix>" }
//
// Environment:
//   RESCUELOOP_INTERNAL_TOKEN — a strong, randomly-generated secret
//   (min 32 characters). Must be provisioned in production and
//   rotated on a regular schedule.

const MIN_TOKEN_LENGTH = 32;

export class InternalAuthError extends Error {
  readonly code: "MISSING_TOKEN" | "INVALID_TOKEN" | "TOKEN_NOT_CONFIGURED";
  readonly status: number;

  constructor(code: "MISSING_TOKEN" | "INVALID_TOKEN" | "TOKEN_NOT_CONFIGURED") {
    const messages: Record<typeof code, string> = {
      MISSING_TOKEN: "Authorization header is required",
      INVALID_TOKEN: "Invalid internal token",
      TOKEN_NOT_CONFIGURED: "Internal token is not configured on the server",
    };
    super(messages[code]);
    this.code = code;
    this.name = "InternalAuthError";
    this.status = code === "TOKEN_NOT_CONFIGURED" ? 503 : 401;
  }
}

/** Get the configured internal token (server-side only) */
function getInternalToken(): string | null {
  const token = process.env.RESCUELOOP_INTERNAL_TOKEN;
  if (!token || token.length < MIN_TOKEN_LENGTH) return null;
  return token;
}

/** Check if internal auth is configured */
export function isInternalAuthConfigured(): boolean {
  return getInternalToken() !== null;
}

/**
 * Validate the request's Authorization header against the server-side token.
 * Returns the actor identity on success, throws InternalAuthError on failure.
 */
export function requireInternalAuth(request: Request): { actorId: string } {
  const configuredToken = getInternalToken();

  if (!configuredToken) {
    throw new InternalAuthError("TOKEN_NOT_CONFIGURED");
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    throw new InternalAuthError("MISSING_TOKEN");
  }

  // Support both "Bearer <token>" and raw token formats
  const providedToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  // Constant-time comparison to prevent timing attacks
  if (!constantTimeEqual(providedToken, configuredToken)) {
    throw new InternalAuthError("INVALID_TOKEN");
  }

  // Use a hash prefix of the token as the actor ID (never expose full token)
  const actorId = `internal:${configuredToken.slice(0, 8)}…`;

  return { actorId };
}

/** Constant-time string comparison to mitigate timing attacks */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

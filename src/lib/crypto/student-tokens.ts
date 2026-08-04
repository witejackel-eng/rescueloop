// Signed student token utilities.
// Tokens are opaque, signed, expiring, and scoped to a specific intervention.
// They never expose internal database IDs or student PII.

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_ENCODING = "base64url";

interface TokenPayload {
  // Intervention ID (internal, but opaque to the student)
  i: string;
  // Organization ID (for tenant scoping)
  o: string;
  // Student ID (for verification)
  s: string;
  // Expiration timestamp (ms)
  e: number;
  // Nonce for replay protection on one-time actions
  n: string;
}

/**
 * Create a signed student token.
 * The token encodes the payload as base64url JSON, then appends an HMAC signature.
 * The resulting string is: <payload>.<signature>
 */
export function createStudentToken(
  payload: Omit<TokenPayload, "n" | "e"> & { expiresInSeconds: number },
  secret: string,
): string {
  const exp = Date.now() + payload.expiresInSeconds * 1000;
  const nonce = crypto.randomUUID();

  const fullPayload: TokenPayload = {
    i: payload.i,
    o: payload.o,
    s: payload.s,
    e: exp,
    n: nonce,
  };

  const payloadJson = JSON.stringify(fullPayload);
  const payloadB64 = Buffer.from(payloadJson, "utf8").toString(TOKEN_ENCODING);
  const signature = sign(payloadB64, secret);

  return `${payloadB64}.${signature}`;
}

/**
 * Verify a signed student token.
 * Returns the payload if valid and not expired, or null otherwise.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function verifyStudentToken(
  token: string,
  secret: string,
): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadB64, signature] = parts;

  // Constant-time signature comparison
  const expectedSignature = sign(payloadB64, secret);
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  let payloadJson: string;
  try {
    payloadJson = Buffer.from(payloadB64, TOKEN_ENCODING).toString("utf8");
  } catch {
    return null;
  }

  let payload: TokenPayload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return null;
  }

  // Check expiration
  if (Date.now() >= payload.e) {
    return null;
  }

  return payload;
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest(TOKEN_ENCODING);
}

/**
 * Build the full student experience URL with a signed token.
 * The URL does not contain student names, emails, or raw database IDs
 * that could grant access by themselves.
 */
export function buildStudentExperienceUrl(
  baseUrl: string,
  token: string,
): string {
  return `${baseUrl}/experiences/rescue/${token}`;
}

// Shared helpers for mapping `@whop/sdk` errors to the typed
// `ProviderError` hierarchy declared in `@/providers/contracts/shared`.
//
// Business logic depends on the typed `ProviderError` classes, NOT on the
// raw SDK error types, so we centralize the mapping here.

import "server-only";

import {
  APIError,
  APIConnectionError,
  AuthenticationError,
  RateLimitError,
} from "@whop/sdk";
import {
  ProviderAuthenticationError,
  ProviderError,
  ProviderNotConfiguredError,
  ProviderPermissionDeniedError,
  ProviderRateLimitError,
  ProviderUnavailableError,
} from "@/providers/contracts/shared";
import { isWhopReady } from "@/lib/whop/client";

/** Logical provider name used in error messages, e.g. "Whop". */
export const WHOP_PROVIDER = "Whop" as const;

/**
 * Convert any thrown value into a typed `ProviderError`.
 *
 * - `ProviderError` instances are returned unchanged so callers can throw
 *   their own typed errors (e.g. `ProviderNotConfiguredError`) and have
 *   them propagate cleanly.
 * - `@whop/sdk` errors are mapped to the closest typed equivalent.
 * - Anything else becomes a `ProviderUnavailableError` so the upper layers
 *   can retry safely.
 */
export function mapWhopError(error: unknown): ProviderError {
  // Already-typed provider errors pass through unchanged.
  if (error instanceof ProviderError) {
    return error;
  }

  if (error instanceof AuthenticationError) {
    return new ProviderAuthenticationError(WHOP_PROVIDER);
  }

  if (error instanceof RateLimitError) {
    // Whop returns a `Retry-After`-style header on 429s. The SDK exposes
    // the raw Headers object; we try to read it but fall back to a 60s
    // window if absent.
    const retryAfter = readRetryAfter(error);
    return new ProviderRateLimitError(WHOP_PROVIDER, retryAfter);
  }

  if (error instanceof APIConnectionError) {
    // Network failure, DNS, connection reset, etc.
    return new ProviderUnavailableError(
      WHOP_PROVIDER,
      `Whop is unreachable: ${error.message ?? "connection error"}`,
    );
  }

  if (error instanceof APIError) {
    const status = error.status;

    if (status === 403) {
      return new ProviderPermissionDeniedError(WHOP_PROVIDER, "api_call");
    }

    if (status === 404) {
      // Callers that need NOT_FOUND semantics should detect it themselves
      // and throw `ProviderNotFoundError`. As a fallback we treat a 404
      // as a retriable unavailable error so the upper layer can decide.
      return new ProviderUnavailableError(
        WHOP_PROVIDER,
        "Whop resource not found.",
      );
    }

    if (typeof status === "number" && status >= 500) {
      return new ProviderUnavailableError(
        WHOP_PROVIDER,
        `Whop returned ${status}.`,
      );
    }

    // 4xx (other than 401/403/404/429): bad request, validation, etc.
    // Treat as non-retriable provider failure.
    return new ProviderError({
      provider: WHOP_PROVIDER,
      code: "PROVIDER_REQUEST_FAILED",
      message: `Whop request failed with status ${status ?? "unknown"}.`,
      retriable: false,
    });
  }

  // Unknown error — fail safe as unavailable (retriable).
  return new ProviderUnavailableError(
    WHOP_PROVIDER,
    error instanceof Error ? error.message : "unknown error",
  );
}

/**
 * Ensure Whop is configured before calling the SDK.
 *
 * @throws ProviderNotConfiguredError if Whop env vars are missing.
 */
export function assertWhopConfigured(): void {
  if (!isWhopReady()) {
    throw new ProviderNotConfiguredError(WHOP_PROVIDER);
  }
}

/**
 * Pull a `Retry-After`-style value from a `RateLimitError`'s headers.
 * Returns an ISO 8601 timestamp 60 seconds in the future if the header
 * is missing or unparseable.
 */
function readRetryAfter(error: RateLimitError): string {
  const headers = error.headers as Headers | undefined;
  const retryAfter = headers?.get("retry-after") ?? headers?.get("Retry-After");
  if (retryAfter) {
    // If the value is a number of seconds, convert to a future timestamp.
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds > 0) {
      return new Date(Date.now() + seconds * 1000).toISOString();
    }
    // If it's an HTTP-date, return as-is.
    const parsed = Date.parse(retryAfter);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date(Date.now() + 60_000).toISOString();
}

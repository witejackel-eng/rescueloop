// Sentry initialization — only active when SENTRY_DSN is configured.
//
// Redacts sensitive data before it reaches Sentry:
//   - Whop API keys
//   - Webhook secrets
//   - Database URLs
//   - User tokens
//   - Student tokens
//   - Full email addresses
//   - Raw provider payloads
//   - Full student message content

import * as Sentry from "@sentry/nextjs";
import { getObservabilityEnv } from "@/lib/env/server";

const SENSITIVE_KEYS = [
  /whop.*api.*key/i,
  /whop.*webhook.*secret/i,
  /webhook.*secret/i,
  /database.*url/i,
  /direct.*url/i,
  /user.*token/i,
  /student.*token/i,
  /signing.*secret/i,
  /cron.*secret/i,
  /inngest.*event.*key/i,
  /job.*provider.*secret/i,
  /sentry.*dsn/i,
  /posthog.*key/i,
  /email/i,
  /payloadJson/i,
  /payload_json/i,
  /messageContent/i,
  /message_content/i,
  /note/i,
  /messagePreview/i,
  /message_preview/i,
  /messageEdited/i,
  /message_edited/i,
] as RegExp[];

let initialized = false;

/**
 * Initialize Sentry if SENTRY_DSN is configured.
 * Safe to call multiple times — will only initialize once.
 */
export function initSentry(): void {
  if (initialized) return;

  const env = getObservabilityEnv();
  if (!env.SENTRY_DSN) return;

  Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      return redactSentryEvent(event);
    },

    beforeSendTransaction(event) {
      return redactSentryEvent(event);
    },
  });

  initialized = true;
}

/**
 * Redact sensitive fields from a Sentry event.
 */
function redactSentryEvent(event: Sentry.Event): Sentry.Event | null {
  // Redact request headers
  if (event.request?.headers) {
    for (const key of Object.keys(event.request.headers)) {
      if (isSensitiveKey(key)) {
        event.request.headers[key] = "[Redacted]";
      }
    }
  }

  // Redact breadcrumbs
  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) {
      if (crumb.data) {
        redactObject(crumb.data);
      }
    }
  }

  // Redact extra data
  if (event.extra) {
    redactObject(event.extra);
  }

  // Redact contexts
  if (event.contexts) {
    for (const contextValues of Object.values(event.contexts)) {
      if (contextValues && typeof contextValues === "object") {
        redactObject(contextValues);
      }
    }
  }

  // Redact exception values
  if (event.exception?.values) {
    for (const exc of event.exception.values) {
      // Don't redact the message entirely — just mask PII patterns
      exc.value = redactPiiStrings(exc.value ?? "");
    }
  }

  return event;
}

/**
 * Check if a key name matches sensitive patterns.
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.some((pattern) => pattern.test(key));
}

/**
 * Recursively redact sensitive values in an object.
 */
function redactObject(obj: Record<string, unknown>): void {
  for (const key of Object.keys(obj)) {
    if (isSensitiveKey(key)) {
      obj[key] = "[Redacted]";
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      redactObject(obj[key] as Record<string, unknown>);
    } else if (typeof obj[key] === "string") {
      obj[key] = redactPiiStrings(obj[key] as string);
    }
  }
}

/**
 * Redact PII patterns in strings:
 *   - Email addresses → u***@d***
 *   - Long hex strings (likely tokens/keys) → [Redacted]
 */
function redactPiiStrings(str: string): string {
  // Redact email-like patterns
  let result = str.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => {
      const [local, domain] = match.split("@");
      return `${local[0]}***@${domain[0]}***`;
    },
  );

  // Redact long hex strings (32+ chars — likely tokens or keys)
  result = result.replace(/[0-9a-f]{32,}/gi, "[Redacted]");

  return result;
}

/**
 * Set Sentry user context for the current request.
 */
export function setSentryUser(params: {
  userId?: string;
  organizationId?: string;
  role?: string;
}): void {
  if (!initialized) return;
  Sentry.setUser({
    id: params.userId,
    organizationId: params.organizationId,
    role: params.role,
  });
}

/**
 * Capture an exception in Sentry (no-op if not initialized).
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(error, { extra: context });
}

/**
 * Add a breadcrumb to Sentry (no-op if not initialized).
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!initialized) return;
  Sentry.addBreadcrumb(breadcrumb);
}

export { Sentry };

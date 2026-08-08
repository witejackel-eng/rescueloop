// Structured logger with redaction of sensitive fields.
//
// Required fields: requestId, organizationId, actorId, route, action,
//   syncExecutionId, jobExecutionId, outboxEventId, result, errorCode
//
// JSON structured output in production.
// Pretty output in development.
// Sensitive fields are always redacted.

const SENSITIVE_KEYS = new Set([
  "whopApiKey",
  "whop_api_key",
  "webhookSecret",
  "webhook_secret",
  "databaseUrl",
  "database_url",
  "directUrl",
  "direct_url",
  "userToken",
  "user_token",
  "studentToken",
  "student_token",
  "tokenHash",
  "token_hash",
  "signingSecret",
  "signing_secret",
  "cronSecret",
  "cron_secret",
  "inngestEventKey",
  "inngest_event_key",
  "sentryDsn",
  "sentry_dsn",
  "posthogKey",
  "posthog_key",
  "email",
  "payloadJson",
  "payload_json",
  "note",
  "messageContent",
  "message_content",
  "messagePreview",
  "message_preview",
  "messageEdited",
  "message_edited",
  "password",
  "secret",
  "authorization",
  "cookie",
]);

export interface LogContext {
  requestId?: string;
  organizationId?: string;
  actorId?: string;
  route?: string;
  action?: string;
  syncExecutionId?: string;
  jobExecutionId?: string;
  outboxEventId?: string;
  result?: string;
  errorCode?: string;
  [key: string]: unknown;
}

type LogLevel = "debug" | "info" | "warn" | "error";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Create a logger bound to a specific context.
 */
export function createLogger(baseContext: LogContext = {}): Logger {
  return new Logger(baseContext);
}

export class Logger {
  private baseContext: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }

  /**
   * Create a child logger with additional context.
   */
  with(additional: LogContext): Logger {
    return new Logger({ ...this.baseContext, ...additional });
  }

  debug(message: string, context?: LogContext): void {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log("error", message, context);
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const merged: Record<string, unknown> = {
      ...this.baseContext,
      ...context,
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    // Redact sensitive fields
    const redacted = redactRecord(merged);

    if (isProduction) {
      // JSON structured output for production
      console.log(JSON.stringify(redacted));
    } else {
      // Pretty output for development
      const { level: l, timestamp: t, message: m, ...rest } = redacted;
      const prefix = `[${l?.toString().toUpperCase()}] ${t}`;
      const contextStr =
        Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest, null, 2)}` : "";
      console.log(`${prefix} ${m}${contextStr}`);
    }
  }
}

/**
 * Redact sensitive values in a record.
 */
function redactRecord(
  record: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = "[Redacted]";
    } else if (typeof value === "string") {
      result[key] = redactPiiInString(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = redactRecord(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        typeof item === "object" && item !== null
          ? redactRecord(item as Record<string, unknown>)
          : item,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Redact PII in strings — email addresses and long hex tokens.
 */
function redactPiiInString(str: string): string {
  // Redact email-like patterns
  let result = str.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (match) => {
      const [local, domain] = match.split("@");
      return `${local[0]}***@${domain[0]}***`;
    },
  );

  // Redact long hex strings (32+ hex chars — likely tokens)
  result = result.replace(/[0-9a-f]{32,}/gi, "[Redacted]");

  return result;
}

/**
 * Default global logger instance.
 */
export const logger = createLogger();

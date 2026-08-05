// Centralized server-only environment validation.
//
// Validates environment variables BY SUBSYSTEM, not globally.
// This means importing this module does NOT throw — only calling
// a specific subsystem's validator (e.g. getWhopEnv()) throws if
// that subsystem's variables are missing.
//
// This allows the public demo to build without Whop credentials,
// while backend routes fail clearly and safely when unconfigured.

import "server-only";
import { z } from "zod";

// ─── Public (browser-safe) configuration ─────────────────────
// These are safe to expose to the client bundle.

const publicSchema = z.object({
  NEXT_PUBLIC_WHOP_APP_ID: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

let cachedPublic: PublicEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (cachedPublic) return cachedPublic;
  const result = publicSchema.safeParse(process.env);
  cachedPublic = result.success ? result.data : {};
  return cachedPublic;
}

// ─── Core application ────────────────────────────────────────

const coreSchema = z.object({
  APP_URL: z.string().url(),
  CRON_SECRET: z.string().trim().min(1),
});

export type CoreEnv = z.infer<typeof coreSchema>;

export function getCoreEnv(): CoreEnv {
  return parseOrThrow(coreSchema, "core application");
}

// ─── Database ────────────────────────────────────────────────

const databaseSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  DIRECT_URL: z.string().trim().min(1),
});

export type DatabaseEnv = z.infer<typeof databaseSchema>;

export function getDatabaseEnv(): DatabaseEnv {
  return parseOrThrow(databaseSchema, "database");
}

export function isDatabaseConfigured(): boolean {
  return safeCheck(databaseSchema);
}

// ─── Whop integration ────────────────────────────────────────

const whopSchema = z.object({
  WHOP_API_KEY: z.string().trim().min(1),
  WHOP_WEBHOOK_SECRET: z.string().trim().min(1),
  NEXT_PUBLIC_WHOP_APP_ID: z.string().trim().min(1),
});

export type WhopEnv = z.infer<typeof whopSchema>;

export function getWhopEnv(): WhopEnv {
  return parseOrThrow(whopSchema, "Whop");
}

export function isWhopConfigured(): boolean {
  return safeCheck(whopSchema);
}

// ─── Inngest (durable jobs) ──────────────────────────────────

const inngestSchema = z.object({
  INNGEST_EVENT_KEY: z.string().trim().min(1),
  JOB_PROVIDER_SECRET: z.string().trim().min(1).optional(),
});

export type InngestEnv = z.infer<typeof inngestSchema>;

export function getInngestEnv(): InngestEnv {
  return parseOrThrow(inngestSchema, "Inngest");
}

export function isInngestConfigured(): boolean {
  return safeCheck(inngestSchema);
}

// ─── Student token signing ───────────────────────────────────

const studentTokenSchema = z.object({
  STUDENT_LINK_SIGNING_SECRET: z.string().trim().min(32),
});

export type StudentTokenEnv = z.infer<typeof studentTokenSchema>;

export function getStudentTokenEnv(): StudentTokenEnv {
  return parseOrThrow(studentTokenSchema, "student token signing");
}

export function isStudentTokenConfigured(): boolean {
  return safeCheck(studentTokenSchema);
}

// ─── Observability (optional) ────────────────────────────────

const observabilitySchema = z.object({
  SENTRY_DSN: z.string().trim().min(1).optional(),
});

export type ObservabilityEnv = z.infer<typeof observabilitySchema>;

export function getObservabilityEnv(): ObservabilityEnv {
  const result = observabilitySchema.safeParse(process.env);
  return result.success ? result.data : {};
}

// ─── Upstash Redis (rate limiting) ─────────────────────────

const upstashSchema = z.object({
  UPSTASH_REDIS_REST_URL: z.string().trim().min(1).optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1).optional(),
});

export type UpstashEnv = z.infer<typeof upstashSchema>;

export function getUpstashEnv(): UpstashEnv {
  const result = upstashSchema.safeParse(process.env);
  return result.success ? result.data : {};
}

export function isUpstashConfigured(): boolean {
  const result = upstashSchema.safeParse(process.env);
  return result.success && !!result.data.UPSTASH_REDIS_REST_URL && !!result.data.UPSTASH_REDIS_REST_TOKEN;
}

// ─── Helpers ─────────────────────────────────────────────────

function parseOrThrow<T>(schema: z.ZodSchema<T>, subsystem: string): T {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    throw new ConfigurationError(subsystem);
  }
  return result.data;
}

function safeCheck<T>(schema: z.ZodSchema<T>): boolean {
  return schema.safeParse(process.env).success;
}

// ─── Typed configuration error ──────────────────────────────

export class ConfigurationError extends Error {
  readonly subsystem: string;
  readonly code = "INTEGRATION_NOT_CONFIGURED" as const;

  constructor(subsystem: string) {
    super(`${subsystem} integration is not configured for this environment`);
    this.subsystem = subsystem;
    this.name = "ConfigurationError";
  }

  /** Safe to expose in API responses — contains no secret names or values */
  toResponse() {
    return {
      error: {
        code: this.code,
        message: `${this.subsystem} integration is not configured for this environment.`,
      },
    };
  }
}

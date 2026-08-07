// RescueLoop environment validation.
// Validates required server-side environment variables on startup.
// Throws clearly if a critical variable is missing.

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().min(1, "DIRECT_URL is required"),
  WHOP_API_KEY: z.string().min(1, "WHOP_API_KEY is required"),
  NEXT_PUBLIC_WHOP_APP_ID: z.string().min(1, "NEXT_PUBLIC_WHOP_APP_ID is required"),
  WHOP_WEBHOOK_SECRET: z.string().min(1, "WHOP_WEBHOOK_SECRET is required"),
  WHOP_COMPANY_ID: z.string().min(1).optional(),
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  STUDENT_LINK_SIGNING_SECRET: z.string().min(32, "STUDENT_LINK_SIGNING_SECRET must be at least 32 characters"),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required"),
  JOB_PROVIDER_SECRET: z.string().min(1, "JOB_PROVIDER_SECRET is required"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment validation failed:\n${errors}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Non-throwing check for environments where validation should be lazy
export function isEnvConfigured(): boolean {
  try {
    getEnv();
    return true;
  } catch {
    return false;
  }
}

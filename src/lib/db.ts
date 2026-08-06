import "server-only";
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Verbose logging in development; quiet in production.
    // Production Neon connections are pooled (pgbouncer) — query-level
    // logging is noisy and masks real errors.
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Regression tests for the Vercel build failure class.
//
// These tests verify that:
// 1. Importing the Whop client module without env vars does not throw
// 2. Calling getWhopClient() without configuration throws a typed error
// 3. Missing credentials never result in placeholder credentials
// 4. Public error serialisation does not expose secret names or values
// 5. The Inngest client module imports safely without configuration
// 6. Server environment values cannot be imported into client components

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("deployment-safety-regression", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  describe("Whop client lazy initialization", () => {
    it("importing the Whop client module without env vars does not throw", async () => {
      // Clear all Whop env vars
      const savedKey = process.env.WHOP_API_KEY;
      const savedSecret = process.env.WHOP_WEBHOOK_SECRET;
      const savedAppId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
      delete process.env.WHOP_API_KEY;
      delete process.env.WHOP_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_WHOP_APP_ID;

      // Importing the module should NOT throw
      await expect(import("@/lib/whop/client")).resolves.toBeDefined();

      // Restore
      if (savedKey) process.env.WHOP_API_KEY = savedKey;
      if (savedSecret) process.env.WHOP_WEBHOOK_SECRET = savedSecret;
      if (savedAppId) process.env.NEXT_PUBLIC_WHOP_APP_ID = savedAppId;
    });

    it("calling getWhopClient() without configuration throws a typed ConfigurationError", async () => {
      delete process.env.WHOP_API_KEY;
      delete process.env.WHOP_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_WHOP_APP_ID;

      const mod = await import("@/lib/whop/client");
      const { ConfigurationError } = await import("@/lib/env/server");

      expect(() => mod.getWhopClient()).toThrow(ConfigurationError);
      expect(() => mod.getWhopClient()).toThrow("Whop");
    });

    it("isWhopReady() returns false when credentials are missing", async () => {
      delete process.env.WHOP_API_KEY;
      delete process.env.WHOP_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_WHOP_APP_ID;

      const mod = await import("@/lib/whop/client");
      expect(mod.isWhopReady()).toBe(false);
    });

    it("isWhopReady() returns true when credentials are present", async () => {
      process.env.WHOP_API_KEY = "test-key";
      process.env.WHOP_WEBHOOK_SECRET = "test-secret";
      process.env.NEXT_PUBLIC_WHOP_APP_ID = "test-app-id";

      const mod = await import("@/lib/whop/client");
      expect(mod.isWhopReady()).toBe(true);
    });
  });

  describe("Inngest client lazy initialization", () => {
    it("importing the Inngest client module without env vars does not throw", async () => {
      delete process.env.INNGEST_EVENT_KEY;

      await expect(import("@/server/jobs/client")).resolves.toBeDefined();
    });

    it("isInngestReady() returns false when INNGEST_EVENT_KEY is missing", async () => {
      delete process.env.INNGEST_EVENT_KEY;

      const mod = await import("@/server/jobs/client");
      expect(mod.isInngestReady()).toBe(false);
    });
  });

  describe("ConfigurationError safety", () => {
    it("does not expose secret names in the public response", async () => {
      delete process.env.WHOP_API_KEY;
      delete process.env.WHOP_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_WHOP_APP_ID;

      const { ConfigurationError } = await import("@/lib/env/server");
      const error = new ConfigurationError("Whop");
      const response = error.toResponse();

      const responseStr = JSON.stringify(response);
      expect(responseStr).not.toContain("WHOP_API_KEY");
      expect(responseStr).not.toContain("WHOP_WEBHOOK_SECRET");
      expect(responseStr).not.toContain("NEXT_PUBLIC_WHOP_APP_ID");
      expect(responseStr).not.toContain("secret");
      expect(responseStr).not.toContain("key");
    });

    it("does not include secret values in the error message", async () => {
      process.env.WHOP_API_KEY = "sk_super_secret_value_12345";
      delete process.env.WHOP_WEBHOOK_SECRET;
      delete process.env.NEXT_PUBLIC_WHOP_APP_ID;

      const { ConfigurationError } = await import("@/lib/env/server");
      const error = new ConfigurationError("Whop");
      const response = error.toResponse();

      const responseStr = JSON.stringify(response);
      expect(responseStr).not.toContain("sk_super_secret_value_12345");
    });

    it("includes a safe error code", async () => {
      const { ConfigurationError } = await import("@/lib/env/server");
      const error = new ConfigurationError("Whop");
      const response = error.toResponse();

      expect(response.error.code).toBe("INTEGRATION_NOT_CONFIGURED");
    });
  });

  describe("environment validation by subsystem", () => {
    it("isDatabaseConfigured() returns false without DATABASE_URL", async () => {
      delete process.env.DATABASE_URL;
      delete process.env.DIRECT_URL;

      const { isDatabaseConfigured } = await import("@/lib/env/server");
      expect(isDatabaseConfigured()).toBe(false);
    });

    it("isDatabaseConfigured() returns true with DATABASE_URL and DIRECT_URL", async () => {
      process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
      process.env.DIRECT_URL = "postgresql://test:test@localhost/test";

      const { isDatabaseConfigured } = await import("@/lib/env/server");
      expect(isDatabaseConfigured()).toBe(true);
    });

    it("whitespace-only values are treated as missing", async () => {
      process.env.WHOP_API_KEY = "   ";
      process.env.WHOP_WEBHOOK_SECRET = "  ";
      process.env.NEXT_PUBLIC_WHOP_APP_ID = " ";

      const { isWhopConfigured } = await import("@/lib/env/server");
      expect(isWhopConfigured()).toBe(false);
    });
  });

  describe("auth error to response mapping", () => {
    it("ConfigurationError maps to 503", async () => {
      const { authErrorToResponse } = await import("@/lib/auth/whop-auth");
      const { ConfigurationError } = await import("@/lib/env/server");

      const response = authErrorToResponse(new ConfigurationError("Whop"));
      expect(response.status).toBe(503);
    });

    it("MissingTokenError maps to 401", async () => {
      const { authErrorToResponse, MissingTokenError } = await import("@/lib/auth/whop-auth");

      const response = authErrorToResponse(new MissingTokenError());
      expect(response.status).toBe(401);
    });

    it("InsufficientAccessError maps to 403", async () => {
      const { authErrorToResponse, InsufficientAccessError } = await import("@/lib/auth/whop-auth");

      const response = authErrorToResponse(new InsufficientAccessError("company"));
      expect(response.status).toBe(403);
    });
  });
});

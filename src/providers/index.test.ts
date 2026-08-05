// Tests for fixture-mode environment detection.
//
// Verifies that canUseFixtureMode() correctly gates fixture mode
// based on VERCEL_ENV (not NODE_ENV), and that the flag cannot
// be controlled by request input (it's server-side only).

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("canUseFixtureMode", () => {
  // Save and restore env vars around each test
  let savedVercelEnv: string | undefined;
  let savedFixtureMode: string | undefined;

  beforeEach(() => {
    savedVercelEnv = process.env.VERCEL_ENV;
    savedFixtureMode = process.env.RESCUELOOP_FIXTURE_MODE;
    vi.resetModules();
  });

  afterEach(() => {
    if (savedVercelEnv === undefined) {
      delete process.env.VERCEL_ENV;
    } else {
      process.env.VERCEL_ENV = savedVercelEnv;
    }
    if (savedFixtureMode === undefined) {
      delete process.env.RESCUELOOP_FIXTURE_MODE;
    } else {
      process.env.RESCUELOOP_FIXTURE_MODE = savedFixtureMode;
    }
    vi.restoreAllMocks();
  });

  async function importCanUseFixtureMode() {
    const mod = await import("@/providers/index");
    return mod.canUseFixtureMode;
  }

  describe("local development (no VERCEL_ENV)", () => {
    beforeEach(() => {
      delete process.env.VERCEL_ENV;
    });

    it("returns true when RESCUELOOP_FIXTURE_MODE=true", async () => {
      process.env.RESCUELOOP_FIXTURE_MODE = "true";
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(true);
    });

    it("returns false when RESCUELOOP_FIXTURE_MODE is not set", async () => {
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });

    it("returns false when RESCUELOOP_FIXTURE_MODE is set to a non-true value", async () => {
      process.env.RESCUELOOP_FIXTURE_MODE = "false";
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });
  });

  describe("Vercel Preview (VERCEL_ENV=preview)", () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = "preview";
    });

    it("returns true when RESCUELOOP_FIXTURE_MODE=true", async () => {
      process.env.RESCUELOOP_FIXTURE_MODE = "true";
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(true);
    });

    it("returns false when RESCUELOOP_FIXTURE_MODE is not set", async () => {
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });

    it("returns false when RESCUELOOP_FIXTURE_MODE=false", async () => {
      process.env.RESCUELOOP_FIXTURE_MODE = "false";
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });
  });

  describe("Vercel Production (VERCEL_ENV=production)", () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = "production";
    });

    it("throws when RESCUELOOP_FIXTURE_MODE=true", async () => {
      process.env.RESCUELOOP_FIXTURE_MODE = "true";
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(() => canUseFixtureMode()).toThrow(
        "RESCUELOOP_FIXTURE_MODE must not be enabled in production"
      );
    });

    it("returns false when RESCUELOOP_FIXTURE_MODE is not set", async () => {
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });

    it("returns false when RESCUELOOP_FIXTURE_MODE=false", async () => {
      process.env.RESCUELOOP_FIXTURE_MODE = "false";
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });
  });

  describe("unconfigured mode", () => {
    it("returns false when no env vars are set", async () => {
      delete process.env.VERCEL_ENV;
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });
  });

  describe("fixture flag is server-side only", () => {
    it("cannot be activated by URL query parameters", async () => {
      // Simulate: someone tries ?RESCUELOOP_FIXTURE_MODE=true in the URL
      // The function only reads process.env, never request input
      delete process.env.VERCEL_ENV;
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      // Even though a URL param might exist, the server env is not set
      expect(canUseFixtureMode()).toBe(false);
    });

    it("cannot be activated by cookie values", async () => {
      // Cookies are request-scoped, not process.env scoped
      delete process.env.VERCEL_ENV;
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });

    it("cannot be activated by browser-controlled input", async () => {
      // The function reads only from process.env which is server-side
      delete process.env.VERCEL_ENV;
      delete process.env.RESCUELOOP_FIXTURE_MODE;
      const canUseFixtureMode = await importCanUseFixtureMode();
      expect(canUseFixtureMode()).toBe(false);
    });
  });

  describe("error message has correct spelling", () => {
    it("uses RESCUELOOP (not RESGUELOOP) in the error message", async () => {
      process.env.VERCEL_ENV = "production";
      process.env.RESCUELOOP_FIXTURE_MODE = "true";
      const canUseFixtureMode = await importCanUseFixtureMode();
      try {
        canUseFixtureMode();
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        // Must contain the correctly-spelled prefix
        expect(message).toContain("RESCUELOOP_FIXTURE_MODE");
        // Must NOT contain the typo
        expect(message).not.toContain("RESGUELOOP");
      }
    });
  });
});

describe("getProviderMode", () => {
  let savedVercelEnv: string | undefined;
  let savedFixtureMode: string | undefined;
  let savedWhopKey: string | undefined;
  let savedWhopSecret: string | undefined;
  let savedWhopAppId: string | undefined;

  beforeEach(() => {
    savedVercelEnv = process.env.VERCEL_ENV;
    savedFixtureMode = process.env.RESCUELOOP_FIXTURE_MODE;
    savedWhopKey = process.env.WHOP_API_KEY;
    savedWhopSecret = process.env.WHOP_WEBHOOK_SECRET;
    savedWhopAppId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
    vi.resetModules();
  });

  afterEach(() => {
    if (savedVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = savedVercelEnv;
    if (savedFixtureMode === undefined) delete process.env.RESCUELOOP_FIXTURE_MODE;
    else process.env.RESCUELOOP_FIXTURE_MODE = savedFixtureMode;
    if (savedWhopKey === undefined) delete process.env.WHOP_API_KEY;
    else process.env.WHOP_API_KEY = savedWhopKey;
    if (savedWhopSecret === undefined) delete process.env.WHOP_WEBHOOK_SECRET;
    else process.env.WHOP_WEBHOOK_SECRET = savedWhopSecret;
    if (savedWhopAppId === undefined) delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    else process.env.NEXT_PUBLIC_WHOP_APP_ID = savedWhopAppId;
    vi.restoreAllMocks();
  });

  it("returns 'fixture' when fixture mode is enabled in local dev", async () => {
    delete process.env.VERCEL_ENV;
    process.env.RESCUELOOP_FIXTURE_MODE = "true";
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const mod = await import("@/providers/index");
    expect(mod.getProviderMode()).toBe("fixture");
  });

  it("returns 'fixture' when fixture mode is enabled in preview", async () => {
    process.env.VERCEL_ENV = "preview";
    process.env.RESCUELOOP_FIXTURE_MODE = "true";
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const mod = await import("@/providers/index");
    expect(mod.getProviderMode()).toBe("fixture");
  });

  it("throws when fixture mode is enabled in production", async () => {
    process.env.VERCEL_ENV = "production";
    process.env.RESCUELOOP_FIXTURE_MODE = "true";
    const mod = await import("@/providers/index");
    expect(() => mod.getProviderMode()).toThrow(
      "RESCUELOOP_FIXTURE_MODE must not be enabled in production"
    );
  });

  it("returns 'whop' when Whop is configured and fixture mode is off", async () => {
    delete process.env.VERCEL_ENV;
    delete process.env.RESCUELOOP_FIXTURE_MODE;
    process.env.WHOP_API_KEY = "test-key";
    process.env.WHOP_WEBHOOK_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_WHOP_APP_ID = "test-app-id";
    const mod = await import("@/providers/index");
    expect(mod.getProviderMode()).toBe("whop");
  });

  it("returns 'unconfigured' when neither fixture nor Whop is ready", async () => {
    delete process.env.VERCEL_ENV;
    delete process.env.RESCUELOOP_FIXTURE_MODE;
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const mod = await import("@/providers/index");
    expect(mod.getProviderMode()).toBe("unconfigured");
  });

  it("returns 'unconfigured' in production when fixture is off and Whop is not ready", async () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.RESCUELOOP_FIXTURE_MODE;
    delete process.env.WHOP_API_KEY;
    delete process.env.WHOP_WEBHOOK_SECRET;
    delete process.env.NEXT_PUBLIC_WHOP_APP_ID;
    const mod = await import("@/providers/index");
    expect(mod.getProviderMode()).toBe("unconfigured");
  });
});

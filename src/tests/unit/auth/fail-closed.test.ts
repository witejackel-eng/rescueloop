// Fail-closed auth test for /dashboard/[companyId] routes.
//
// Verifies the critical invariant: In connected mode, accessing a dashboard
// route without auth MUST throw/redirect. Connected routes NEVER render
// fixture company data. The auth guard is fail-closed.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────

// Mock the providers module to control mode
const { mockGetProviderMode } = vi.hoisted(() => ({
  mockGetProviderMode: vi.fn(),
}));
vi.mock("@/providers", () => ({
  getProviderMode: mockGetProviderMode,
}));

// Mock fixture ID
const { FIXTURE_COMPANY_ID } = vi.hoisted(() => ({
  FIXTURE_COMPANY_ID: "co_fixture_cgl",
}));
vi.mock("@/providers/fixtures", () => ({
  FIXTURE_COMPANY_ID,
  getMemberships: () => [],
  getCourses: () => [],
  getProducts: () => [],
  getCourseStudents: () => [],
}));

// Mock whop-auth to control auth outcomes
const { mockRequireCompanyAdmin } = vi.hoisted(() => ({
  mockRequireCompanyAdmin: vi.fn(),
}));
vi.mock("@/lib/auth/whop-auth", () => ({
  requireCompanyAdmin: mockRequireCompanyAdmin,
  MissingTokenError: class MissingTokenError extends Error {
    readonly code = "MISSING_TOKEN" as const;
    constructor() { super("Missing Whop user token"); }
  },
  InvalidTokenError: class InvalidTokenError extends Error {
    readonly code = "INVALID_TOKEN" as const;
    constructor(m?: string) { super(m ?? "Invalid or expired Whop user token"); }
  },
  WhopUnavailableError: class WhopUnavailableError extends Error {
    readonly code = "WHOP_UNAVAILABLE" as const;
    constructor(m?: string) { super(m ?? "Whop API is currently unavailable"); }
  },
  InsufficientAccessError: class InsufficientAccessError extends Error {
    readonly code = "INSUFFICIENT_ACCESS" as const;
    constructor(r: string) { super(`Not authorized for this ${r}`); }
  },
  InstallationMissingError: class InstallationMissingError extends Error {
    readonly code = "INSTALLATION_MISSING" as const;
    constructor(c: string) { super(`RescueLoop is not installed for company ${c}`); }
  },
}));

// Mock env/server for ConfigurationError
vi.mock("@/lib/env/server", () => ({
  ConfigurationError: class ConfigurationError extends Error {
    readonly subsystem: string;
    readonly code = "INTEGRATION_NOT_CONFIGURED" as const;
    constructor(s: string) {
      super(`${s} integration is not configured`);
      this.subsystem = s;
    }
    toResponse() {
      return { error: { code: this.code, message: this.message } };
    }
  },
}));

// Mock server-only (no-op in tests)
vi.mock("server-only", () => ({}));

// Import after mocks are set up
import {
  requireCompanyAccess,
  CompanyAccessDeniedError,
} from "@/lib/auth/require-company-access";

// ─── Tests ────────────────────────────────────────────────────

describe("Auth fail-closed: requireCompanyAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: connected mode
    mockGetProviderMode.mockReturnValue("whop");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Connected mode: auth failures MUST throw ─────────────

  describe("connected mode (whop)", () => {
    it("throws MISSING_TOKEN when no Whop user token is present", async () => {
      const { MissingTokenError } = await import("@/lib/auth/whop-auth");
      mockRequireCompanyAdmin.mockRejectedValue(new MissingTokenError());

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect(error).toBeInstanceOf(CompanyAccessDeniedError);
        expect((error as CompanyAccessDeniedError).code).toBe("MISSING_TOKEN");
      }
    });

    it("throws INVALID_TOKEN when Whop token is expired/invalid", async () => {
      const { InvalidTokenError } = await import("@/lib/auth/whop-auth");
      mockRequireCompanyAdmin.mockRejectedValue(new InvalidTokenError());

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe("INVALID_TOKEN");
      }
    });

    it("throws WHOP_UNAVAILABLE when Whop API is down", async () => {
      const { WhopUnavailableError } = await import("@/lib/auth/whop-auth");
      mockRequireCompanyAdmin.mockRejectedValue(new WhopUnavailableError());

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe("WHOP_UNAVAILABLE");
      }
    });

    it("throws INSUFFICIENT_ACCESS when user is not admin", async () => {
      const { InsufficientAccessError } = await import("@/lib/auth/whop-auth");
      mockRequireCompanyAdmin.mockRejectedValue(
        new InsufficientAccessError("company"),
      );

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe("INSUFFICIENT_ACCESS");
      }
    });

    it("throws INSTALLATION_MISSING when RescueLoop not installed", async () => {
      const { InstallationMissingError } = await import("@/lib/auth/whop-auth");
      mockRequireCompanyAdmin.mockRejectedValue(
        new InstallationMissingError("co_test_123"),
      );

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe(
          "INSTALLATION_MISSING",
        );
      }
    });

    it("throws NOT_CONFIGURED when Whop is not configured", async () => {
      const { ConfigurationError } = await import("@/lib/env/server");
      mockRequireCompanyAdmin.mockRejectedValue(new ConfigurationError("Whop"));

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe("NOT_CONFIGURED");
      }
    });

    it("throws INSUFFICIENT_ACCESS for unknown errors (fail-closed)", async () => {
      mockRequireCompanyAdmin.mockRejectedValue(new Error("Unexpected error"));

      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe(
          "INSUFFICIENT_ACCESS",
        );
      }
    });

    it("returns connected context when auth succeeds", async () => {
      mockRequireCompanyAdmin.mockResolvedValue({
        whopUserId: "user_123",
        internalUserId: "int_456",
        organizationId: "org_789",
        companyId: "co_test_123",
      });

      const result = await requireCompanyAccess("co_test_123");
      expect(result.mode).toBe("connected");
      if (result.mode === "connected") {
        expect(result.organizationId).toBe("org_789");
        expect(result.companyId).toBe("co_test_123");
        expect(result.whopUserId).toBe("user_123");
      }
    });

    it("never returns fixture data in connected mode even when companyId matches fixture ID", async () => {
      // Even if someone passes the fixture companyId in connected mode,
      // the guard should still verify via Whop auth
      mockRequireCompanyAdmin.mockResolvedValue({
        whopUserId: "user_123",
        internalUserId: "int_456",
        organizationId: "org_789",
        companyId: FIXTURE_COMPANY_ID,
      });

      const result = await requireCompanyAccess(FIXTURE_COMPANY_ID);
      // In connected mode, it's always "connected", never "fixture"
      expect(result.mode).toBe("connected");
    });
  });

  // ─── Fixture mode ──────────────────────────────────────────

  describe("fixture mode", () => {
    beforeEach(() => {
      mockGetProviderMode.mockReturnValue("fixture");
    });

    it("returns fixture context for the fixture company ID", async () => {
      const result = await requireCompanyAccess(FIXTURE_COMPANY_ID);
      expect(result.mode).toBe("fixture");
      if (result.mode === "fixture") {
        expect(result.organizationId).toBe("org_fixture");
        expect(result.companyId).toBe(FIXTURE_COMPANY_ID);
      }
    });

    it("throws FIXTURE_COMPANY_MISMATCH for non-fixture company IDs", async () => {
      await expect(requireCompanyAccess("co_other_company")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_other_company");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe(
          "FIXTURE_COMPANY_MISMATCH",
        );
      }
    });

    it("never makes Whop auth calls in fixture mode", async () => {
      await requireCompanyAccess(FIXTURE_COMPANY_ID);
      expect(mockRequireCompanyAdmin).not.toHaveBeenCalled();
    });
  });

  // ─── Unconfigured mode ────────────────────────────────────

  describe("unconfigured mode", () => {
    beforeEach(() => {
      mockGetProviderMode.mockReturnValue("unconfigured");
    });

    it("throws NOT_CONFIGURED in unconfigured mode", async () => {
      await expect(requireCompanyAccess("co_test_123")).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      try {
        await requireCompanyAccess("co_test_123");
      } catch (error) {
        expect((error as CompanyAccessDeniedError).code).toBe("NOT_CONFIGURED");
      }
    });

    it("never makes Whop auth calls in unconfigured mode", async () => {
      try {
        await requireCompanyAccess("co_test_123");
      } catch {
        // Expected
      }
      expect(mockRequireCompanyAdmin).not.toHaveBeenCalled();
    });
  });

  // ─── Fail-closed invariants ───────────────────────────────

  describe("fail-closed invariants", () => {
    it("NEVER returns fixture data in connected mode under any error", async () => {
      const { MissingTokenError } = await import("@/lib/auth/whop-auth");
      mockGetProviderMode.mockReturnValue("whop");

      // Test multiple error types — none should return fixture data
      const errors = [
        new MissingTokenError(),
        new (await import("@/lib/auth/whop-auth")).InvalidTokenError(),
        new (await import("@/lib/auth/whop-auth")).WhopUnavailableError(),
        new (await import("@/lib/auth/whop-auth")).InsufficientAccessError("company"),
      ];

      for (const err of errors) {
        mockRequireCompanyAdmin.mockRejectedValue(err);
        try {
          const result = await requireCompanyAccess("co_test_123");
          // If we somehow get here, it MUST NOT be fixture mode
          expect(result.mode).not.toBe("fixture");
        } catch (error) {
          // Throwing is the correct behavior
          expect(error).toBeInstanceOf(CompanyAccessDeniedError);
          expect((error as CompanyAccessDeniedError).code).not.toBe(
            "FIXTURE_COMPANY_MISMATCH",
          );
        }
      }
    });

    it("does not trust client-provided companyId without authorization", async () => {
      // A malicious companyId should go through requireCompanyAdmin
      // which will verify access before returning
      const maliciousCompanyId = "co_victim_company";
      mockRequireCompanyAdmin.mockRejectedValue(
        new (await import("@/lib/auth/whop-auth")).InsufficientAccessError("company"),
      );

      await expect(requireCompanyAccess(maliciousCompanyId)).rejects.toThrow(
        CompanyAccessDeniedError,
      );
      // The guard MUST have called requireCompanyAdmin with the companyId
      // to verify authorization
      expect(mockRequireCompanyAdmin).toHaveBeenCalledWith(maliciousCompanyId);
    });
  });
});

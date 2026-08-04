// Tests for the opaque student access token system.
// Verifies: creation, verification, expiration, revocation, consumption,
// hash-only storage, and scope verification.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createStudentAccessToken,
  verifyStudentAccessToken,
  consumeStudentAccessToken,
  revokeStudentTokens,
} from "@/lib/crypto/student-access-tokens";

// Mock the database
vi.mock("@/lib/db", () => ({
  db: {
    studentAccessToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";

describe("student-access-tokens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createStudentAccessToken", () => {
    it("creates a token and stores only its hash", async () => {
      const mockCreate = vi.mocked(db.studentAccessToken.create);
      mockCreate.mockResolvedValue({} as any);

      const result = await createStudentAccessToken({
        organizationId: "org_1",
        interventionId: "int_1",
        studentId: "stu_1",
        expiresInSeconds: 3600,
      });

      // The token should be a base64url string (not containing raw IDs)
      expect(result.token).toBeTruthy();
      expect(result.token).not.toContain("org_1");
      expect(result.token).not.toContain("int_1");
      expect(result.token).not.toContain("stu_1");

      // The hash should be a hex string (SHA-256 = 64 chars)
      expect(result.tokenHash).toMatch(/^[a-f0-9]{64}$/);

      // The DB should receive only the hash, never the raw token
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tokenHash: result.tokenHash,
          organizationId: "org_1",
          interventionId: "int_1",
          studentId: "stu_1",
        }),
      });
      const storedData = mockCreate.mock.calls[0][0].data;
      expect(storedData.tokenHash).not.toBe(result.token);
    });

    it("generates unique tokens each call", async () => {
      vi.mocked(db.studentAccessToken.create).mockResolvedValue({} as any);

      const r1 = await createStudentAccessToken({
        organizationId: "org_1",
        interventionId: "int_1",
        studentId: "stu_1",
        expiresInSeconds: 3600,
      });
      const r2 = await createStudentAccessToken({
        organizationId: "org_1",
        interventionId: "int_1",
        studentId: "stu_1",
        expiresInSeconds: 3600,
      });

      expect(r1.token).not.toBe(r2.token);
      expect(r1.tokenHash).not.toBe(r2.tokenHash);
    });
  });

  describe("verifyStudentAccessToken", () => {
    it("returns the token record when valid", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      vi.mocked(db.studentAccessToken.findUnique).mockResolvedValue({
        id: "tok_1",
        organizationId: "org_1",
        interventionId: "int_1",
        studentId: "stu_1",
        expiresAt: futureDate,
        revokedAt: null,
        consumedAt: null,
      } as any);
      vi.mocked(db.studentAccessToken.update).mockResolvedValue({} as any);

      const result = await verifyStudentAccessToken("valid-token");

      expect(result).not.toBeNull();
      expect(result!.tokenId).toBe("tok_1");
      expect(result!.organizationId).toBe("org_1");
    });

    it("returns null when token not found", async () => {
      vi.mocked(db.studentAccessToken.findUnique).mockResolvedValue(null);

      const result = await verifyStudentAccessToken("nonexistent");
      expect(result).toBeNull();
    });

    it("returns null when token expired", async () => {
      const pastDate = new Date(Date.now() - 1000);
      vi.mocked(db.studentAccessToken.findUnique).mockResolvedValue({
        id: "tok_1",
        organizationId: "org_1",
        interventionId: "int_1",
        studentId: "stu_1",
        expiresAt: pastDate,
        revokedAt: null,
        consumedAt: null,
      } as any);

      const result = await verifyStudentAccessToken("expired-token");
      expect(result).toBeNull();
    });

    it("returns null when token revoked", async () => {
      const futureDate = new Date(Date.now() + 3600 * 1000);
      vi.mocked(db.studentAccessToken.findUnique).mockResolvedValue({
        id: "tok_1",
        organizationId: "org_1",
        interventionId: "int_1",
        studentId: "stu_1",
        expiresAt: futureDate,
        revokedAt: new Date(),
        consumedAt: null,
      } as any);

      const result = await verifyStudentAccessToken("revoked-token");
      expect(result).toBeNull();
    });
  });

  describe("consumeStudentAccessToken", () => {
    it("consumes an unconsumed token", async () => {
      vi.mocked(db.studentAccessToken.updateMany).mockResolvedValue({ count: 1 });

      const result = await consumeStudentAccessToken("valid-token");
      expect(result).toBe(true);
    });

    it("returns false for an already-consumed token", async () => {
      vi.mocked(db.studentAccessToken.updateMany).mockResolvedValue({ count: 0 });

      const result = await consumeStudentAccessToken("consumed-token");
      expect(result).toBe(false);
    });
  });

  describe("revokeStudentTokens", () => {
    it("revokes all pending tokens for a student", async () => {
      vi.mocked(db.studentAccessToken.updateMany).mockResolvedValue({ count: 3 });

      const result = await revokeStudentTokens({
        organizationId: "org_1",
        studentId: "stu_1",
      });

      expect(result).toBe(3);
    });
  });
});

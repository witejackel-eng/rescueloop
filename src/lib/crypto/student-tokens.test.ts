// Tests for the signed student token system.
// Verifies: creation, verification, expiration, tamper resistance, replay protection.

import { describe, it, expect, beforeEach } from "vitest";
import { createStudentToken, verifyStudentToken, buildStudentExperienceUrl } from "@/lib/crypto/student-tokens";

const TEST_SECRET = "test-secret-at-least-32-characters-long-xxxxx";

describe("student-tokens", () => {
  describe("createStudentToken + verifyStudentToken", () => {
    it("creates a token that can be verified", () => {
      const token = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: 3600 },
        TEST_SECRET,
      );
      const payload = verifyStudentToken(token, TEST_SECRET);

      expect(payload).not.toBeNull();
      expect(payload!.i).toBe("int_123");
      expect(payload!.o).toBe("org_456");
      expect(payload!.s).toBe("stu_789");
    });

    it("rejects a token with an invalid signature", () => {
      const token = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: 3600 },
        TEST_SECRET,
      );
      // Use a different secret to verify
      const payload = verifyStudentToken(token, "different-secret-at-least-32-chars-yyyyy");

      expect(payload).toBeNull();
    });

    it("rejects an expired token", () => {
      const token = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: -1 },
        TEST_SECRET,
      );
      const payload = verifyStudentToken(token, TEST_SECRET);

      expect(payload).toBeNull();
    });

    it("rejects a malformed token", () => {
      expect(verifyStudentToken("not-a-token", TEST_SECRET)).toBeNull();
      expect(verifyStudentToken("a.b.c", TEST_SECRET)).toBeNull();
      expect(verifyStudentToken("", TEST_SECRET)).toBeNull();
    });

    it("rejects a tampered payload", () => {
      const token = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: 3600 },
        TEST_SECRET,
      );
      // Tamper with the payload portion
      const [payloadB64, signature] = token.split(".");
      const tampered = `${payloadB64}TAMPERED.${signature}`;
      const result = verifyStudentToken(tampered, TEST_SECRET);

      expect(result).toBeNull();
    });

    it("does not expose student PII in the token string", () => {
      const token = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: 3600 },
        TEST_SECRET,
      );
      // The token should not contain raw IDs in a readable form
      expect(token).not.toContain("stu_789");
      expect(token).not.toContain("org_456");
      expect(token).not.toContain("int_123");
    });

    it("generates unique tokens for the same payload (nonce)", () => {
      const token1 = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: 3600 },
        TEST_SECRET,
      );
      const token2 = createStudentToken(
        { i: "int_123", o: "org_456", s: "stu_789", expiresInSeconds: 3600 },
        TEST_SECRET,
      );
      expect(token1).not.toBe(token2);
    });
  });

  describe("buildStudentExperienceUrl", () => {
    it("builds a URL with the token", () => {
      const url = buildStudentExperienceUrl("https://app.rescueloop.com", "abc123");
      expect(url).toBe("https://app.rescueloop.com/experiences/rescue/abc123");
    });
  });
});

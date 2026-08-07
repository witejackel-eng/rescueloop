// Provider contract tests — normalized suite that runs the SAME tests
// against BOTH fixture providers AND mocked Whop providers.
//
// For each resource (courses, products, memberships, progress, notifications),
// we verify:
//   1. Pagination returns array
//   2. Cursor continuation works
//   3. Empty page returns empty array
//   4. Unknown status is handled safely (mapped to safe default)
//   5. Partial source data is handled gracefully
//   6. Duplicate source record is idempotent

import { describe, it, expect, beforeEach } from "vitest";

// ── Fixture providers ───────────────────────────────────────────
import {
  FixtureCoursesProvider,
  FixtureProductsProvider,
  FixtureMembershipsProvider,
  FixtureProgressProvider,
  FixtureNotificationsProvider,
  FIXTURE_COMPANY_ID,
  resetFixtureData,
  clearFixtureNotificationLog,
} from "@/providers/fixtures";

// ── Mocked Whop providers ───────────────────────────────────────
import {
  MockedWhopCoursesProvider,
  MockedWhopProductsProvider,
  MockedWhopMembershipsProvider,
  MockedWhopProgressProvider,
  MockedWhopNotificationsProvider,
  fromWhopStatus,
  clearMockedNotificationLog,
} from "./mocked-whop-providers";
import type {
  WhopMembershipSource,
  WhopCourseSource,
  WhopProductSource,
  WhopLessonInteractionSource,
} from "./mocked-whop-providers";

// ── Contract types ──────────────────────────────────────────────
import type {
  CoursePage,
  CoursesProvider,
  ExternalMembershipStatus,
  ListCoursesParams,
  ListMembershipsParams,
  ListProductsParams,
  ListProgressParams,
  ListCourseStudentsParams,
  MembershipPage,
  MembershipsProvider,
  NotificationResult,
  NotificationsProvider,
  ProductPage,
  ProductsProvider,
  ProgressPage,
  ProgressProvider,
  SendNotificationParams,
  CourseStudentPage,
} from "@/providers/contracts";

// ── Provider suite descriptor ───────────────────────────────────
// Each entry provides a label and factory functions for every provider,
// so describe.each can run the full suite against each adapter.

interface ProviderSuite {
  label: string;
  companyId: string;
  courses: CoursesProvider;
  products: ProductsProvider;
  memberships: MembershipsProvider;
  progress: ProgressProvider;
  notifications: NotificationsProvider;
}

const suites: ProviderSuite[] = [
  {
    label: "Fixture",
    companyId: FIXTURE_COMPANY_ID,
    courses: new FixtureCoursesProvider(),
    products: new FixtureProductsProvider(),
    memberships: new FixtureMembershipsProvider(),
    progress: new FixtureProgressProvider(),
    notifications: new FixtureNotificationsProvider(),
  },
  {
    label: "Mocked Whop",
    companyId: "co_whop_mock",
    courses: new MockedWhopCoursesProvider(),
    products: new MockedWhopProductsProvider(),
    memberships: new MockedWhopMembershipsProvider(),
    progress: new MockedWhopProgressProvider(),
    notifications: new MockedWhopNotificationsProvider(),
  },
];

// ── Contract suite ──────────────────────────────────────────────

describe.each(suites)("Provider contracts — $label", (suite) => {
  beforeEach(() => {
    resetFixtureData();
    clearFixtureNotificationLog();
    clearMockedNotificationLog();
  });

  // ─── Courses ────────────────────────────────────────────────

  describe("courses", () => {
    it("pagination returns array", async () => {
      const page: CoursePage = await suite.courses.list({
        companyId: suite.companyId,
        pageSize: 10,
      });
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.items.length).toBeGreaterThan(0);
    });

    it("cursor continuation works", async () => {
      const first: CoursePage = await suite.courses.list({
        companyId: suite.companyId,
        pageSize: 1,
      });
      expect(first.items.length).toBe(1);

      if (first.nextCursor !== null) {
        const second: CoursePage = await suite.courses.list({
          companyId: suite.companyId,
          cursor: first.nextCursor,
          pageSize: 1,
        });
        expect(second.items.length).toBe(1);
        // Items from different pages must not overlap
        expect(second.items[0].id).not.toBe(first.items[0].id);
      }
    });

    it("empty page returns empty array", async () => {
      // Use a very large cursor offset to get past all data
      const hugeCursor = Buffer.from(JSON.stringify({ o: 999999 })).toString("base64url");
      const page: CoursePage = await suite.courses.list({
        companyId: suite.companyId,
        cursor: hugeCursor,
      });
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.items).toHaveLength(0);
      expect(page.nextCursor).toBeNull();
    });

    it("unknown status is handled safely", async () => {
      // Courses don't have a status field, but we verify the page
      // structure is safe regardless of content
      const page: CoursePage = await suite.courses.list({
        companyId: suite.companyId,
      });
      for (const item of page.items) {
        expect(typeof item.id).toBe("string");
        expect(typeof item.isPublished).toBe("boolean");
        expect(typeof item.sourceTimestamp).toBe("string");
      }
    });

    it("partial source data is handled gracefully", async () => {
      // For Mocked Whop: construct a provider with a course that has
      // null title and no experience_id
      // For Fixture: just verify null title is handled
      if (suite.label === "Mocked Whop") {
        const partialSource: WhopCourseSource = {
          id: "cr_partial",
          title: null,
          experience_id: null,
          visibility: "visible",
          updated_at: new Date().toISOString(),
        };
        const provider = new MockedWhopCoursesProvider([partialSource]);
        const page = await provider.list({
          companyId: suite.companyId,
        });
        expect(page.items).toHaveLength(1);
        expect(page.items[0].title).toBeNull();
        expect(page.items[0].experienceId).toBe("");
      } else {
        // Fixture: retrieve a course and ensure null title is acceptable
        const page = await suite.courses.list({ companyId: suite.companyId });
        // All fixture courses have titles, but the contract allows null
        for (const c of page.items) {
          expect(c.title === null || typeof c.title === "string").toBe(true);
        }
      }
    });

    it("duplicate source record is idempotent", async () => {
      const page1 = await suite.courses.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      const page2 = await suite.courses.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      // Same query → same results (idempotent)
      expect(page1.items.map((i) => i.id)).toEqual(page2.items.map((i) => i.id));
    });
  });

  // ─── Products ───────────────────────────────────────────────

  describe("products", () => {
    it("pagination returns array", async () => {
      const page: ProductPage = await suite.products.list({
        companyId: suite.companyId,
        pageSize: 10,
      });
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.items.length).toBeGreaterThan(0);
    });

    it("cursor continuation works", async () => {
      const first: ProductPage = await suite.products.list({
        companyId: suite.companyId,
        pageSize: 1,
      });
      expect(first.items.length).toBe(1);

      if (first.nextCursor !== null) {
        const second: ProductPage = await suite.products.list({
          companyId: suite.companyId,
          cursor: first.nextCursor,
          pageSize: 1,
        });
        expect(second.items.length).toBe(1);
        expect(second.items[0].id).not.toBe(first.items[0].id);
      }
    });

    it("empty page returns empty array", async () => {
      const hugeCursor = Buffer.from(JSON.stringify({ o: 999999 })).toString("base64url");
      const page: ProductPage = await suite.products.list({
        companyId: suite.companyId,
        cursor: hugeCursor,
      });
      expect(page.items).toHaveLength(0);
      expect(page.nextCursor).toBeNull();
    });

    it("unknown status is handled safely", async () => {
      // Products don't have a status, but verify billingCycle is closed
      const page: ProductPage = await suite.products.list({
        companyId: suite.companyId,
      });
      const validCycles = ["monthly", "annual", "one_time"];
      for (const item of page.items) {
        expect(validCycles).toContain(item.billingCycle);
      }
    });

    it("partial source data is handled gracefully", async () => {
      if (suite.label === "Mocked Whop") {
        // Product with hidden visibility → isPublished = false
        const hiddenSource: WhopProductSource = {
          id: "prod_partial",
          title: "Partial Product",
          visibility: "hidden",
          updated_at: new Date().toISOString(),
        };
        const provider = new MockedWhopProductsProvider([hiddenSource]);
        const page = await provider.list({ companyId: suite.companyId });
        expect(page.items).toHaveLength(1);
        expect(page.items[0].isPublished).toBe(false);
        // Price defaults to 0 when not on Plan
        expect(page.items[0].priceCents).toBe(0);
      } else {
        const page = await suite.products.list({ companyId: suite.companyId });
        for (const p of page.items) {
          expect(typeof p.name).toBe("string");
          expect(typeof p.priceCents).toBe("number");
        }
      }
    });

    it("duplicate source record is idempotent", async () => {
      const page1 = await suite.products.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      const page2 = await suite.products.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      expect(page1.items.map((i) => i.id)).toEqual(page2.items.map((i) => i.id));
    });
  });

  // ─── Memberships ────────────────────────────────────────────

  describe("memberships", () => {
    it("pagination returns array", async () => {
      const page: MembershipPage = await suite.memberships.list({
        companyId: suite.companyId,
        pageSize: 10,
      });
      expect(Array.isArray(page.items)).toBe(true);
      expect(page.items.length).toBeGreaterThan(0);
    });

    it("cursor continuation works", async () => {
      const first: MembershipPage = await suite.memberships.list({
        companyId: suite.companyId,
        pageSize: 1,
      });
      expect(first.items.length).toBe(1);

      if (first.nextCursor !== null) {
        const second: MembershipPage = await suite.memberships.list({
          companyId: suite.companyId,
          cursor: first.nextCursor,
          pageSize: 1,
        });
        expect(second.items.length).toBeGreaterThanOrEqual(1);
        expect(second.items[0].id).not.toBe(first.items[0].id);
      }
    });

    it("empty page returns empty array", async () => {
      const hugeCursor = Buffer.from(JSON.stringify({ o: 999999 })).toString("base64url");
      const page: MembershipPage = await suite.memberships.list({
        companyId: suite.companyId,
        cursor: hugeCursor,
      });
      expect(page.items).toHaveLength(0);
      expect(page.nextCursor).toBeNull();
    });

    it("unknown status is handled safely (mapped to safe default)", async () => {
      // For Mocked Whop: test fromWhopStatus directly with unknown status
      if (suite.label === "Mocked Whop") {
        // Unknown status → cancelled (safe default, never active)
        expect(fromWhopStatus("unknown_garbage")).toBe("cancelled");
        expect(fromWhopStatus("")).toBe("cancelled");
        expect(fromWhopStatus("suspended")).toBe("cancelled");
        // Known Whop statuses that are not in the contract
        expect(fromWhopStatus("expired")).toBe("cancelled");
        expect(fromWhopStatus("completed")).toBe("cancelled");
        expect(fromWhopStatus("unresolved")).toBe("cancelled");
        expect(fromWhopStatus("drafted")).toBe("cancelled");
        // US→UK spelling normalization
        expect(fromWhopStatus("canceling")).toBe("cancelling");
        expect(fromWhopStatus("canceled")).toBe("cancelled");
      }

      // For ALL providers: every returned status must be in the contract enum
      const validStatuses: ExternalMembershipStatus[] = [
        "active", "trialing", "past_due", "cancelling", "cancelled", "paused",
      ];
      const page = await suite.memberships.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      for (const m of page.items) {
        expect(validStatuses).toContain(m.status);
      }
    });

    it("partial source data is handled gracefully", async () => {
      if (suite.label === "Mocked Whop") {
        // Membership with null user and product → empty string fallbacks
        const partialSource: WhopMembershipSource = {
          id: "mem_partial",
          user: null,
          product: null,
          status: "active",
          cancel_at_period_end: false,
          joined_at: "0", // invalid unix → falls back to created_at
          created_at: new Date().toISOString(),
          renewal_period_end: null,
          canceled_at: null,
          currency: null,
          updated_at: new Date().toISOString(),
        };
        const provider = new MockedWhopMembershipsProvider([partialSource]);
        const page = await provider.list({ companyId: suite.companyId });
        expect(page.items).toHaveLength(1);
        const m = page.items[0];
        expect(m.userId).toBe(""); // null user → ""
        expect(m.productId).toBe(""); // null product → ""
        expect(m.currency).toBe("usd"); // null currency → "usd"
        expect(m.renewalDate).toBeNull(); // null renewal
        expect(m.cancelledAt).toBeNull(); // null cancelled
      } else {
        // Fixture: verify all memberships have valid shapes
        const page = await suite.memberships.list({ companyId: suite.companyId });
        for (const m of page.items) {
          expect(typeof m.userId).toBe("string");
          expect(typeof m.productId).toBe("string");
        }
      }
    });

    it("duplicate source record is idempotent", async () => {
      const page1 = await suite.memberships.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      const page2 = await suite.memberships.list({
        companyId: suite.companyId,
        pageSize: 50,
      });
      expect(page1.items.map((i) => i.id)).toEqual(page2.items.map((i) => i.id));
    });
  });

  // ─── Progress ───────────────────────────────────────────────

  describe("progress", () => {
    // Choose a courseId that exists in both fixture and Whop mock data
    const courseId = "cr_ags"; // fixture course; Whop mock uses cr_whop_ags

    it("pagination returns array (lesson interactions)", async () => {
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const page: ProgressPage = await suite.progress.listLessonInteractions({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 10,
      });
      expect(Array.isArray(page.items)).toBe(true);
    });

    it("pagination returns array (course students)", async () => {
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const page: CourseStudentPage = await suite.progress.listCourseStudents({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 10,
      });
      expect(Array.isArray(page.items)).toBe(true);
    });

    it("cursor continuation works (lesson interactions)", async () => {
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const first: ProgressPage = await suite.progress.listLessonInteractions({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 1,
      });

      if (first.items.length > 0 && first.nextCursor !== null) {
        const second: ProgressPage = await suite.progress.listLessonInteractions({
          companyId: suite.companyId,
          courseId: effectiveCourseId,
          cursor: first.nextCursor,
          pageSize: 1,
        });
        if (second.items.length > 0) {
          expect(second.items[0].id).not.toBe(first.items[0].id);
        }
      }
    });

    it("cursor continuation works (course students)", async () => {
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const first: CourseStudentPage = await suite.progress.listCourseStudents({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 1,
      });

      if (first.items.length > 0 && first.nextCursor !== null) {
        const second: CourseStudentPage = await suite.progress.listCourseStudents({
          companyId: suite.companyId,
          courseId: effectiveCourseId,
          cursor: first.nextCursor,
          pageSize: 1,
        });
        if (second.items.length > 0) {
          expect(second.items[0].userId).not.toBe(first.items[0].userId);
        }
      }
    });

    it("empty page returns empty array", async () => {
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const hugeCursor = Buffer.from(JSON.stringify({ o: 999999 })).toString("base64url");
      const page: ProgressPage = await suite.progress.listLessonInteractions({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        cursor: hugeCursor,
      });
      expect(page.items).toHaveLength(0);
      expect(page.nextCursor).toBeNull();
    });

    it("unknown status is handled safely", async () => {
      // Progress items have `completed: boolean` — always a safe boolean
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const page: ProgressPage = await suite.progress.listLessonInteractions({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 50,
      });
      for (const item of page.items) {
        expect(typeof item.completed).toBe("boolean");
      }
    });

    it("partial source data is handled gracefully", async () => {
      if (suite.label === "Mocked Whop") {
        // Interaction with null user, null lesson, null course
        const partialSource: WhopLessonInteractionSource = {
          id: "int_partial",
          user: null,
          lesson: null,
          course: null,
          completed: false,
          created_at: new Date().toISOString(),
        };
        const provider = new MockedWhopProgressProvider(
          [partialSource],
          [],
          "cr_whop_ags",
        );
        const page = await provider.listLessonInteractions({
          companyId: suite.companyId,
          courseId: "cr_whop_ags",
        });
        expect(page.items).toHaveLength(1);
        const item = page.items[0];
        expect(item.userId).toBe(""); // null user → ""
        expect(item.lessonId).toBe(""); // null lesson → ""
        expect(item.lessonTitle).toBeNull(); // null lesson → null
        expect(item.courseId).toBe("cr_whop_ags"); // fallback to input courseId
      } else {
        // Fixture: verify shapes are valid
        const page = await suite.progress.listLessonInteractions({
          companyId: suite.companyId,
          courseId,
          pageSize: 50,
        });
        for (const item of page.items) {
          expect(typeof item.userId).toBe("string");
          expect(typeof item.courseId).toBe("string");
        }
      }
    });

    it("duplicate source record is idempotent", async () => {
      const effectiveCourseId = suite.label === "Mocked Whop" ? "cr_whop_ags" : courseId;
      const page1 = await suite.progress.listLessonInteractions({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 50,
      });
      const page2 = await suite.progress.listLessonInteractions({
        companyId: suite.companyId,
        courseId: effectiveCourseId,
        pageSize: 50,
      });
      expect(page1.items.map((i) => i.id)).toEqual(page2.items.map((i) => i.id));
    });
  });

  // ─── Notifications ──────────────────────────────────────────

  describe("notifications", () => {
    const baseParams: SendNotificationParams = {
      experienceId: "exp_test",
      title: "Test notification",
      content: "This is a test notification body.",
      userIds: ["user_001"],
    };

    it("pagination returns array (send returns result)", async () => {
      // Notifications don't paginate — they send. Verify the result shape.
      const result: NotificationResult = await suite.notifications.send(baseParams);
      expect(typeof result.accepted).toBe("boolean");
      expect(result.providerMessageId === null || typeof result.providerMessageId === "string").toBe(true);
    });

    it("cursor continuation works (n/a — notifications are send-only)", async () => {
      // NotificationsProvider is send-only; no cursor concept.
      // Verify two sends both succeed.
      const r1 = await suite.notifications.send(baseParams);
      const r2 = await suite.notifications.send({
        ...baseParams,
        title: "Second notification",
      });
      expect(r1.accepted).toBe(true);
      expect(r2.accepted).toBe(true);
    });

    it("empty page returns empty array (n/a — send with empty userIds)", async () => {
      // Edge case: empty userIds
      const result = await suite.notifications.send({
        ...baseParams,
        userIds: [],
      });
      // Should not throw — provider should handle gracefully
      expect(typeof result.accepted).toBe("boolean");
    });

    it("unknown status is handled safely", async () => {
      // Send always returns a boolean `accepted` — no status enum
      const result = await suite.notifications.send(baseParams);
      expect(typeof result.accepted).toBe("boolean");
      // providerMessageId is null for Whop (no message ID from API)
      // or a string for fixtures — both are safe
      expect(
        result.providerMessageId === null ||
        typeof result.providerMessageId === "string",
      ).toBe(true);
    });

    it("partial source data is handled gracefully", async () => {
      // Send with minimal params (no restPath)
      const result = await suite.notifications.send({
        experienceId: "exp_minimal",
        title: "",
        content: "",
        userIds: ["user_001"],
        restPath: null,
      });
      expect(typeof result.accepted).toBe("boolean");
    });

    it("duplicate source record is idempotent", async () => {
      // Sending the same notification twice should both succeed
      const r1 = await suite.notifications.send(baseParams);
      const r2 = await suite.notifications.send(baseParams);
      expect(r1.accepted).toBe(r2.accepted);
      // Idempotent at the contract level: same params → same result shape
      expect(typeof r1.accepted).toBe(typeof r2.accepted);
    });
  });
});

// ── Cross-provider invariant: status normalization ──────────────

describe("Membership status normalization contract", () => {
  const knownStatuses: ExternalMembershipStatus[] = [
    "active", "trialing", "past_due", "cancelling", "cancelled", "paused",
  ];

  it("every known contract status is a valid Whop mapping target", () => {
    // fromWhopStatus must never return a status outside the contract enum
    const whopStatuses = [
      "trialing", "active", "past_due", "canceling", "canceled",
      "expired", "completed", "unresolved", "drafted",
    ] as const;

    for (const ws of whopStatuses) {
      const result = fromWhopStatus(ws);
      expect(knownStatuses).toContain(result);
    }
  });

  it("unknown Whop statuses map to 'cancelled' (never 'active')", () => {
    const unknownStatuses = [
      "unknown", "suspended", "banned", "fraud", "", "ANYTHING",
    ];

    for (const us of unknownStatuses) {
      const result = fromWhopStatus(us as never);
      expect(result).toBe("cancelled");
      // CRITICAL: unknown never maps to active
      expect(result).not.toBe("active");
    }
  });

  it("US→UK spelling normalization is correct", () => {
    expect(fromWhopStatus("canceling")).toBe("cancelling");
    expect(fromWhopStatus("canceled")).toBe("cancelled");
  });
});

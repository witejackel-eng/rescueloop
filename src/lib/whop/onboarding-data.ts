// Server-only Whop data fetchers for the onboarding flow.
//
// All calls degrade gracefully: if Whop credentials are missing or the API
// is unreachable, the functions return an empty list + a flag so the
// onboarding form can fall back to manual entry.

import { whopsdk } from "@/lib/whop/client";
import { db } from "@/lib/db";

export interface WhopCourseOption {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
}

export interface WhopProductOption {
  id: string;
  title: string;
  /** Already exists in our DB (synced from webhooks). */
  exists: boolean;
}

export interface WhopExperienceOption {
  id: string;
  name: string;
  productId: string | null;
}

export interface OnboardingDataResult {
  courses: WhopCourseOption[];
  products: WhopProductOption[];
  experiences: WhopExperienceOption[];
  /** True when the Whop API call failed (missing creds, network, etc.). */
  whopUnavailable: boolean;
  /** Existing confirmed mappings so the form can warn if one already exists. */
  existingMappings: Array<{
    productId: string;
    courseId: string;
    activationDelayDays: number;
    productName: string;
    courseName: string;
  }>;
}

/**
 * Fetch Whop courses + products + experiences for a company, plus any
 * existing RescueLoop mappings. Always returns a result — never throws.
 */
export async function fetchOnboardingData(
  companyId: string,
  organizationId: string,
): Promise<OnboardingDataResult> {
  let courses: WhopCourseOption[] = [];
  let products: WhopProductOption[] = [];
  let experiences: WhopExperienceOption[] = [];
  let whopUnavailable = false;

  // ─── Courses from Whop ──────────────────────────────────────
  try {
    const page = await whopsdk.courses.list({ company_id: companyId });
    const items = (page as any).data ?? [];
    courses = items.map((c: any): WhopCourseOption => ({
      id: c.id,
      title: c.title ?? "Untitled course",
      description: c.description ?? null,
      // Whop doesn't expose a flat lesson count; sum chapters → lessons
      lessonCount: Array.isArray(c.chapters)
        ? c.chapters.reduce(
            (sum: number, ch: any) =>
              sum + (Array.isArray(ch.lessons) ? ch.lessons.length : 0),
            0,
          )
        : 0,
    }));
  } catch (error) {
    whopUnavailable = true;
    console.warn("[onboarding-data] Whop courses.list failed", {
      companyId,
      type: error instanceof Error ? error.constructor.name : "unknown",
    });
  }

  // ─── Experiences from Whop (needed for notification delivery) ──
  if (!whopUnavailable) {
    try {
      const page = await whopsdk.experiences.list({ company_id: companyId });
      const items = (page as any).data ?? [];
      experiences = items.map((e: any): WhopExperienceOption => ({
        id: e.id,
        name: e.name ?? e.id,
        productId: e.product_id ?? e.productId ?? null,
      }));
    } catch (error) {
      // Experiences aren't fatal — courses can still be mapped without one.
      console.warn("[onboarding-data] Whop experiences.list failed", {
        companyId,
        type: error instanceof Error ? error.constructor.name : "unknown",
      });
    }
  }

  // ─── Products from the local DB (synced via webhooks) ───────
  // We trust the DB over the Whop products API because memberships reference
  // these rows. If none exist yet, the admin can enter one manually.
  const dbProducts = await db.product.findMany({
    where: { organizationId },
    select: { id: true, whopProductId: true, name: true },
  });
  products = dbProducts.map((p) => ({
    id: p.whopProductId,
    title: p.name,
    exists: true,
  }));

  // ─── Existing confirmed mappings ────────────────────────────
  const existingMappings = await db.productCourseMapping.findMany({
    where: { organizationId, isConfirmed: true },
    select: {
      activationDelayDays: true,
      product: { select: { id: true, name: true, whopProductId: true } },
      course: { select: { id: true, name: true, externalCourseId: true } },
    },
  }).then((rows) =>
    rows.map((r) => ({
      productId: r.product.whopProductId,
      courseId: r.course.externalCourseId,
      activationDelayDays: r.activationDelayDays,
      productName: r.product.name,
      courseName: r.course.name,
    })),
  ).catch(() => []);

  return { courses, products, experiences, whopUnavailable, existingMappings };
}

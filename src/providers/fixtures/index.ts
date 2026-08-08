import "server-only";

// ─────────────────────────────────────────────────────────────
// Fixture provider bundle — typed implementations of every
// provider contract backed by deterministic local fixture data.
//
// Use `fixtureProviders` in fixture mode (development, tests,
// pilot without Whop credentials). Each provider is also exported
// individually so callers can construct specialised bundles.
// ─────────────────────────────────────────────────────────────

import type { ProviderBundle } from "@/providers/contracts";

import { FixtureCoursesProvider } from "./courses";
import { FixtureProductsProvider } from "./products";
import { FixtureMembershipsProvider } from "./memberships";
import { FixtureProgressProvider } from "./progress";
import { FixtureNotificationsProvider } from "./notifications";
import { FixtureIdentityProvider } from "./identity";

export { FixtureCoursesProvider } from "./courses";
export { FixtureProductsProvider } from "./products";
export { FixtureMembershipsProvider } from "./memberships";
export { FixtureProgressProvider } from "./progress";
export { FixtureNotificationsProvider } from "./notifications";
export { FixtureIdentityProvider } from "./identity";

export {
  FIXTURE_COMPANY_ID,
  FIXTURE_APP_ID,
  FIXTURE_ADMIN_USER_ID,
  FIXTURE_DEFAULT_USER_ID,
  FIXTURE_EXPERIENCE_AGENCY,
  FIXTURE_EXPERIENCE_FREELANCE,
  FIXTURE_EXPERIENCE_CLIENT,
  resetFixtureData,
  getExperiences,
  getStudents,
  getCourses,
  getProducts,
  getMemberships,
  getLessonInteractions,
  getCourseStudents,
  getFixtureSourceTimestamp,
  encodeCursor,
  decodeCursor,
  makeFixtureRateLimit,
} from "./fixtures-data";

export {
  getFixtureNotificationLog,
  clearFixtureNotificationLog,
} from "./notifications";
export type { FixtureNotificationLogEntry } from "./notifications";

export const fixtureProviders: ProviderBundle = {
  courses: new FixtureCoursesProvider(),
  products: new FixtureProductsProvider(),
  memberships: new FixtureMembershipsProvider(),
  progress: new FixtureProgressProvider(),
  notifications: new FixtureNotificationsProvider(),
  identity: new FixtureIdentityProvider(),
};

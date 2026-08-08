// ─────────────────────────────────────────────────────────────
// PX06 — Synthetic Load Fixture Generator
// Creates reproducible test data at 250 / 1,000 / 2,500 member scales.
// Deterministic output via seeded pseudo-random number generator.
// ─────────────────────────────────────────────────────────────

import type {
  LoadProfile,
  LoadProfileSize,
} from "@/lib/types/scale";
import { LOAD_PROFILES, SCALE_CAPACITY_POLICY } from "@/lib/types/scale";

// ── Seeded PRNG (mulberry32) ─────────────────────────────────

function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Fixture Types ────────────────────────────────────────────

export interface FixtureMember {
  id: string;
  name: string;
  email: string;
  enrolledCourses: string[];
  lastActiveAt: string;
  riskSegment: "high" | "medium" | "low";
  monthlyValue: number;
  status: "active" | "churning" | "churned";
}

export interface FixtureCourse {
  id: string;
  title: string;
  memberCount: number;
  revenue: number;
}

export interface FixtureTenant {
  id: string;
  name: string;
  members: FixtureMember[];
  courses: FixtureCourse[];
  plan: "rescue" | "growth" | "scale";
}

export interface LoadFixture {
  profile: LoadProfile;
  tenants: FixtureTenant[];
  generatedAt: string;
  seed: number;
}

// ── Deterministic generators ─────────────────────────────────

const COURSE_NAMES = [
  "React Mastery", "Python Fundamentals", "Design Systems", "TypeScript Deep Dive",
  "Node.js Backend", "AWS Architecture", "Data Science 101", "ML Engineering",
  "Kubernetes Ops", "Rust Systems", "Go Concurrency", "CSS Architecture",
  "DevOps Pipeline", "Security Basics", "API Design",
];

const MEMBER_NAMES = [
  "Alex Chen", "Sarah Kim", "Marcus Johnson", "Priya Patel", "James Wilson",
  "Elena Rodriguez", "David Park", "Aisha Khan", "Tom Anderson", "Lisa Wang",
  "Ryan Mitchell", "Nina Volkov", "Chris Taylor", "Maya Gupta", "Jake Flores",
  "Zoe Martin", "Ben Cooper", "Hana Sato", "Leo Russo", "Amira Hassan",
];

function generateCourse(
  rng: () => number,
  index: number,
  memberPool: number
): FixtureCourse {
  const title = COURSE_NAMES[index % COURSE_NAMES.length];
  const memberCount = Math.max(1, Math.floor(memberPool * (0.05 + rng() * 0.25)));
  const revenue = memberCount * (29 + Math.floor(rng() * 90));
  return {
    id: `course-${index.toString().padStart(3, "0")}`,
    title,
    memberCount,
    revenue,
  };
}

function generateMember(
  rng: () => number,
  index: number,
  courseIds: string[]
): FixtureMember {
  const name = MEMBER_NAMES[index % MEMBER_NAMES.length];
  const riskVal = rng();
  const riskSegment: FixtureMember["riskSegment"] =
    riskVal < 0.15 ? "high" : riskVal < 0.45 ? "medium" : "low";

  const statusVal = rng();
  const status: FixtureMember["status"] =
    statusVal < 0.08 ? "churned" : statusVal < 0.2 ? "churning" : "active";

  const enrolledCount = Math.max(1, Math.floor(rng() * Math.min(4, courseIds.length)));
  const enrolledCourses: string[] = [];
  for (let i = 0; i < enrolledCount; i++) {
    const cid = courseIds[Math.floor(rng() * courseIds.length)];
    if (!enrolledCourses.includes(cid)) enrolledCourses.push(cid);
  }

  const daysAgo = Math.floor(rng() * 90);
  const lastActiveAt = new Date(Date.now() - daysAgo * 86400000).toISOString();

  return {
    id: `member-${index.toString().padStart(5, "0")}`,
    name: `${name} ${index}`,
    email: `member${index}@example.com`,
    enrolledCourses,
    lastActiveAt,
    riskSegment,
    monthlyValue: riskSegment === "high" ? 0 : Math.floor(29 + rng() * 90),
    status,
  };
}

// ── Public API ───────────────────────────────────────────────

/** Generate a full load fixture for a given profile size */
export function generateFixture(
  size: LoadProfileSize,
  seed: number = 42
): LoadFixture {
  const profile = LOAD_PROFILES[size];
  const rng = mulberry32(seed);

  // Generate courses
  const courses: FixtureCourse[] = [];
  for (let i = 0; i < profile.courseCount; i++) {
    courses.push(generateCourse(rng, i, profile.memberCount));
  }
  const courseIds = courses.map((c) => c.id);

  // Generate members
  const members: FixtureMember[] = [];
  for (let i = 0; i < profile.memberCount; i++) {
    members.push(generateMember(rng, i, courseIds));
  }

  // Single tenant for per-profile benchmarks
  const tenant: FixtureTenant = {
    id: "tenant-scale-demo",
    name: "Scale Demo Tenant",
    members,
    courses,
    plan: "scale",
  };

  return {
    profile,
    tenants: [tenant],
    generatedAt: new Date().toISOString(),
    seed,
  };
}

/** Generate multi-tenant fixtures for concurrent benchmarks */
export function generateMultiTenantFixture(
  tenantCount: number,
  membersPerTenant: number,
  planDistribution: { rescue: number; growth: number; scale: number },
  seed: number = 42
): LoadFixture {
  const rng = mulberry32(seed);
  const tenants: FixtureTenant[] = [];

  const plans: Array<"rescue" | "growth" | "scale"> = [];
  for (let i = 0; i < planDistribution.rescue; i++) plans.push("rescue");
  for (let i = 0; i < planDistribution.growth; i++) plans.push("growth");
  for (let i = 0; i < planDistribution.scale; i++) plans.push("scale");
  // Pad if needed
  while (plans.length < tenantCount) plans.push("growth");

  const courseNames = ["Intro Course", "Advanced Course", "Premium Course"];

  for (let t = 0; t < tenantCount; t++) {
    const plan = plans[t % plans.length];
    const capForPlan =
      plan === "scale"
        ? SCALE_CAPACITY_POLICY.maxMonitoredMembers
        : plan === "growth"
          ? 1000
          : 500;
    const actualMembers = Math.min(membersPerTenant, capForPlan);

    const tenantCourses: FixtureCourse[] = courseNames.map((title, ci) => ({
      id: `t${t}-course-${ci}`,
      title,
      memberCount: Math.floor(actualMembers / 3),
      revenue: Math.floor(actualMembers / 3) * 59,
    }));

    const tenantMembers: FixtureMember[] = [];
    const cids = tenantCourses.map((c) => c.id);
    for (let m = 0; m < actualMembers; m++) {
      tenantMembers.push(generateMember(rng, t * 10000 + m, cids));
    }

    tenants.push({
      id: `tenant-${t.toString().padStart(3, "0")}`,
      name: `Tenant ${t + 1}`,
      members: tenantMembers,
      courses: tenantCourses,
      plan,
    });
  }

  const totalMembers = tenants.reduce((sum, t) => sum + t.members.length, 0);

  return {
    profile: {
      size: "max",
      label: `${tenantCount} tenants × ${membersPerTenant.toLocaleString()} members`,
      memberCount: totalMembers,
      tenantCount,
      eventCount: totalMembers * 5,
      jobCount: Math.floor(totalMembers / 5),
      courseCount: tenants.reduce((sum, t) => sum + t.courses.length, 0),
      scaleMemberCap: 2500,
    },
    tenants,
    generatedAt: new Date().toISOString(),
    seed,
  };
}

/** Get fixture stats without generating full data */
export function getFixtureStats(size: LoadProfileSize) {
  const profile = LOAD_PROFILES[size];
  return {
    memberCount: profile.memberCount,
    eventCount: profile.eventCount,
    jobCount: profile.jobCount,
    courseCount: profile.courseCount,
    withinScaleCap: profile.memberCount <= SCALE_CAPACITY_POLICY.maxMonitoredMembers,
    capUtilization: (profile.memberCount / SCALE_CAPACITY_POLICY.maxMonitoredMembers) * 100,
  };
}

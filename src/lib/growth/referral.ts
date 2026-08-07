// ─────────────────────────────────────────────────────────────
// PX07 — Referral Attribution
// Track referral sources without building a large affiliate
// platform. Minimal, privacy-safe.
// ─────────────────────────────────────────────────────────────

import type {
  ReferralChannel,
  ReferralEntry,
  ReferralAggregate,
  CaseStudyConsent,
} from "@/lib/types/growth";

// ── Referral Tracking ────────────────────────────────────────

/** Aggregate referral entries by channel */
export function aggregateReferrals(entries: ReferralEntry[]): ReferralAggregate[] {
  const channelMap = new Map<ReferralChannel, { count: number; converted: number }>();

  for (const entry of entries) {
    const existing = channelMap.get(entry.channel) ?? { count: 0, converted: 0 };
    existing.count++;
    if (entry.converted) existing.converted++;
    channelMap.set(entry.channel, existing);
  }

  return Array.from(channelMap.entries())
    .map(([channel, { count, converted }]) => ({
      channel,
      count,
      converted,
      conversionRate: count > 0 ? (converted / count) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

// ── Demo Data ───────────────────────────────────────────────

export const DEMO_REFERRALS: ReferralEntry[] = [
  { tenantId: "ten_001", channel: "partner",       source: "kajabi-partner",   timestamp: "2025-01-05T10:00:00Z", converted: true },
  { tenantId: "ten_002", channel: "content",       source: "blog-post",        timestamp: "2025-01-08T14:00:00Z", converted: true },
  { tenantId: "ten_003", channel: "organic",       source: "google-search",    timestamp: "2025-01-12T09:00:00Z", converted: true },
  { tenantId: "ten_004", channel: "word_of_mouth", source: "existing-customer", timestamp: "2025-01-15T11:00:00Z", converted: true },
  { tenantId: "ten_005", channel: "content",       source: "youtube-review",   timestamp: "2025-01-18T16:00:00Z", converted: false },
  { tenantId: "ten_006", channel: "organic",       source: "product-hunt",     timestamp: "2025-01-20T08:00:00Z", converted: false },
  { tenantId: "ten_007", channel: "community",     source: "indie-hackers",    timestamp: "2025-01-22T13:00:00Z", converted: true },
  { tenantId: "ten_008", channel: "ad",            source: "twitter-ad",       timestamp: "2025-01-25T10:00:00Z", converted: false },
  { tenantId: "ten_009", channel: "partner",       source: "teachable-integration", timestamp: "2025-01-28T07:00:00Z", converted: true },
  { tenantId: "ten_010", channel: "organic",       source: "google-search",    timestamp: "2025-02-01T12:00:00Z", converted: false },
  { tenantId: "ten_011", channel: "content",       source: "podcast-mention",  timestamp: "2025-02-04T15:00:00Z", converted: true },
  { tenantId: "ten_012", channel: "word_of_mouth", source: "existing-customer", timestamp: "2025-02-07T09:00:00Z", converted: false },
  { tenantId: "ten_013", channel: "community",     source: "reddit-edtech",    timestamp: "2025-02-10T14:00:00Z", converted: false },
  { tenantId: "ten_014", channel: "ad",            source: "linkedin-ad",      timestamp: "2025-02-13T11:00:00Z", converted: true },
  { tenantId: "ten_015", channel: "organic",       source: "capterra",         timestamp: "2025-02-16T08:00:00Z", converted: true },
];

export const DEMO_CASE_STUDIES: CaseStudyConsent[] = [
  {
    tenantId: "ten_001",
    tenantName: "BrightPath Academy",
    consentGiven: true,
    consentDate: "2025-02-01",
    storyHighlight: "Recovered 23 students in first month, $4,200 MRR protected",
  },
  {
    tenantId: "ten_004",
    tenantName: "SkillBridge Institute",
    consentGiven: true,
    consentDate: "2025-02-10",
    storyHighlight: "95% rescue rate across 3 courses, automated 80% of outreach",
  },
  {
    tenantId: "ten_007",
    tenantName: "Mastery Online",
    consentGiven: false,
    consentDate: null,
    storyHighlight: null,
  },
  {
    tenantId: "ten_002",
    tenantName: "LearnVista",
    consentGiven: false,
    consentDate: null,
    storyHighlight: null,
  },
];

/** Get demo referral aggregates */
export function getDemoReferralAggregates(): ReferralAggregate[] {
  return aggregateReferrals(DEMO_REFERRALS);
}

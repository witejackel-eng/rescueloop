// Typed interfaces for Whop SDK responses that are not fully typed.
// These interfaces represent the shape of data returned by the Whop API
// and are used instead of `as any` casts throughout the codebase.

// ─── Paginated response ──────────────────────────────────────

export interface WhopPaginatedResponse<T> {
  data: T[];
  // Whop SDK pagination fields (may vary by endpoint)
  next_cursor?: string | null;
  has_next?: boolean;
}

// ─── Membership event data ───────────────────────────────────

export interface WhopMembershipData {
  id: string;
  created_at: string;
  status: string;
  user?: { id: string };
  member?: { id: string };
  product?: { id: string };
  renewal_period_end_date?: string | null;
  // Whop plan identity — the authoritative source for tier mapping.
  // plan_id is the Whop plan UUID used by getTierForWhopPlanId().
  // price is retained ONLY for display, reconciliation, and diagnostics —
  // it is NEVER used to infer entitlement.
  plan?: { id: string; price: number };
}

export interface WhopMembershipEvent {
  data: WhopMembershipData;
  timestamp: string;
  id: string;
}

// ─── Payment event data ──────────────────────────────────────

export interface WhopPaymentData {
  id: string;
  amount: number;
  membership?: { id: string };
}

export interface WhopPaymentEvent {
  data: WhopPaymentData;
  timestamp: string;
}

// ─── Lesson interaction event data ───────────────────────────

export interface WhopLessonInteractionData {
  id: string;
  user?: { id: string };
  course?: { id: string };
  lesson?: { id: string; title?: string };
}

export interface WhopLessonInteractionEvent {
  data: WhopLessonInteractionData;
  timestamp: string;
}

// ─── Course data (for onboarding) ────────────────────────────

export interface WhopCourseData {
  id: string;
  title?: string;
  description?: string;
  chapters?: WhopChapterData[];
}

export interface WhopChapterData {
  lessons?: WhopLessonData[];
}

export interface WhopLessonData {
  id: string;
  title?: string;
}

// ─── Experience data ─────────────────────────────────────────

export interface WhopExperienceData {
  id: string;
  name?: string;
  product_id?: string;
  productId?: string;
}

// ─── Type guards ─────────────────────────────────────────────

export function isWhopPaginatedResponse<T>(
  value: unknown,
): value is WhopPaginatedResponse<T> {
  return typeof value === "object" && value !== null && "data" in value;
}

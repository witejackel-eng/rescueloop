import { NextRequest, NextResponse } from "next/server";
import { pilotApplicationSchema } from "@/lib/validation/pilot-application";
import { db } from "@/lib/db";

// ─── Rate limiting considerations ────────────────────────────
// Production deployments should add rate limiting here, e.g.:
//   - @upstash/ratelimit with Redis: limit per IP to 5 req / 60 min
//   - Or a simple in-memory sliding window for single-instance deploys
//   - Key on both IP and email to prevent abuse
// The honeypot field provides basic spam filtering; rate limiting
// provides the next layer of defense. (Phase 18)

export async function POST(request: NextRequest) {
  try {
    // ─── Parse and validate ──────────────────────────────────
    const body = await request.json();
    const parsed = pilotApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // ─── Honeypot check ──────────────────────────────────────
    // If the hidden honeypot field is filled, this is a bot.
    // Silently return success to avoid revealing the trap.
    if (data.honeypot && data.honeypot.length > 0) {
      return NextResponse.json({ success: true });
    }

    // ─── Duplicate check ─────────────────────────────────────
    // Prevent multiple applications with the same email.
    try {
      const existing = await db.pilotApplication.findFirst({
        where: { email: data.email },
        select: { id: true },
      });

      if (existing) {
        return NextResponse.json(
          { error: "An application with this email already exists." },
          { status: 409 },
        );
      }
    } catch (dbError) {
      // If DB is unavailable, log but don't block — graceful degradation
      console.error("[private-pilot] Duplicate check failed:", dbError);
    }

    // ─── Persist to database ─────────────────────────────────
    try {
      await db.pilotApplication.create({
        data: {
          fullName: data.fullName,
          businessName: data.businessName,
          whopBusinessUrl: data.whopBusinessUrl || null,
          email: data.email,
          approximatePayingMembers: data.approximatePayingMembers ?? null,
          courses: data.courses || null,
          typicalMembershipPrice: data.typicalMembershipPrice ?? null,
          monthlyNewMembers: data.monthlyNewMembers ?? null,
          currentFollowUpProcess: data.currentFollowUpProcess || null,
          primaryRetentionConcern: data.primaryRetentionConcern || null,
          preferredPilotTiming: data.preferredPilotTiming,
          consentToContact: data.consentToContact === true,
        },
      });
    } catch (dbError) {
      console.error("[private-pilot] Database write failed:", dbError);
      return NextResponse.json(
        { error: "Unable to save your application. Please try again later." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[private-pilot] Unexpected error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

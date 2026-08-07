// Marketplace listing copy for RescueLoop's Whop marketplace presence.
//
// HONESTY REQUIREMENTS:
//   - Never claim guaranteed retention or revenue outcomes
//   - Never claim autonomous saves — every message requires creator approval
//   - All language reflects what the app ACTUALLY does, not aspirational features
//
// This module is consumed by:
//   - The marketplace listing page (preview of how the listing appears)
//   - The Whop marketplace API submission (if applicable)
//   - The onboarding completion step (confirms what the creator is signing up for)

// ─── Core bullets ──────────────────────────────────────────────────

export interface MarketplaceBullet {
  /** Short heading for the bullet point. */
  heading: string;

  /** One-sentence description. Honest and specific. */
  description: string;
}

// ─── Marketplace listing object ───────────────────────────────────

export interface MarketplaceListing {
  /** App name shown in the Whop marketplace. */
  name: string;

  /** One-line tagline (appears in marketplace card). */
  tagline: string;

  /** Short description (appears in marketplace detail page). */
  shortDescription: string;

  /** Trust line — the key promise about creator control. */
  trustLine: string;

  /** Core feature bullets (max 4, each honest and specific). */
  bullets: MarketplaceBullet[];

  /**
   * What RescueLoop does NOT do. Shown to set expectations.
   * Important for honest marketplace positioning.
   */
  doesNot: string[];
}

/**
 * The canonical marketplace listing copy for RescueLoop.
 *
 * COPY REVIEW NOTES:
 *   - "Find members" not "re-engage members" — we detect, we don't guarantee outcomes
 *   - "Review a respectful support message" — emphasizes the human-in-the-loop
 *   - "See what happened next" — not "watch them re-engage"
 *   - Trust line: "Nothing sends without your approval" — the core differentiator
 *   - No claims about retention rates, revenue impact, or autonomous operation
 */
export const MARKETPLACE_LISTING: MarketplaceListing = {
  name: "RescueLoop",

  tagline: "Activation rescue for Whop creators",

  shortDescription:
    "Find members who never started or lost momentum, review a respectful support message, and see what happened next.",

  trustLine: "Nothing sends without your approval.",

  bullets: [
    {
      heading: "Detect students needing help",
      description:
        "Identify members who enrolled but never started, or who were active and then went quiet — based on their course progress and membership signals.",
    },
    {
      heading: "See the evidence",
      description:
        "Every candidate comes with context: when they enrolled, how far they got, and what changed. You decide who needs support.",
    },
    {
      heading: "Review and edit every message",
      description:
        "A draft support message is prepared for your review. Edit the wording, change the timing, or dismiss it. Nothing is sent without your explicit approval.",
    },
    {
      heading: "Track responses and observed returns",
      description:
        "After a message is sent, see whether the student responded, resumed the course, or remained inactive. Attribution is evidence-based, not assumed.",
    },
  ],

  doesNot: [
    "Guarantee specific retention or revenue outcomes — results depend on your students and your messages",
    "Send messages autonomously — every intervention requires your explicit approval",
    "Contact students who have opted out — student opt-out is respected immediately",
    "Access or store payment card data — we only read membership status",
    "Replace your teaching — RescueLoop is a support coordination tool, not a course substitute",
  ],
};

import { z } from "zod";

export const pilotApplicationSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be under 100 characters"),

  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(200, "Business name must be under 200 characters"),

  whopBusinessUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Please enter a valid email address"),

  approximatePayingMembers: z
    .number()
    .int("Must be a whole number")
    .min(0, "Must be 0 or more")
    .optional(),

  courses: z
    .string()
    .max(500, "Must be under 500 characters")
    .optional(),

  typicalMembershipPrice: z
    .number()
    .min(0, "Must be 0 or more")
    .optional(),

  monthlyNewMembers: z
    .number()
    .int("Must be a whole number")
    .min(0, "Must be 0 or more")
    .optional(),

  currentFollowUpProcess: z
    .string()
    .max(1000, "Must be under 1000 characters")
    .optional(),

  primaryRetentionConcern: z
    .string()
    .max(1000, "Must be under 1000 characters")
    .optional(),

  preferredPilotTiming: z.enum(["asap", "within_2_weeks", "within_a_month", "flexible"], {
    message: "Please select a timing preference",
  }),

  consentToContact: z.literal(true, {
    message: "You must consent to being contacted",
  }),

  // Honeypot — must be empty; filled = spam
  honeypot: z.string().optional(),
});

export type PilotApplicationInput = z.infer<typeof pilotApplicationSchema>;

/** Preferred pilot timing options for select dropdowns */
export const PILOT_TIMING_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "within_2_weeks", label: "Within 2 weeks" },
  { value: "within_a_month", label: "Within a month" },
  { value: "flexible", label: "Flexible" },
] as const;

/** Clean form values before sending to API — trim, remove empty strings */
export function cleanFormValues(values: PilotApplicationInput): Record<string, unknown> {
  return {
    ...values,
    whopBusinessUrl: values.whopBusinessUrl?.trim() || undefined,
    courses: values.courses?.trim() || undefined,
    currentFollowUpProcess: values.currentFollowUpProcess?.trim() || undefined,
    primaryRetentionConcern: values.primaryRetentionConcern?.trim() || undefined,
  };
}

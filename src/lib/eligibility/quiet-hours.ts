"server-only";
// Quiet hours check for rescue interventions.
//
// Determines if the current time falls within an organization's quiet hours
// window. Quiet hours prevent interventions from being approved/delivered
// during inconvenient times (e.g., late night).
//
// Supports overnight windows where start > end (e.g., 20:00–08:00).

/**
 * Check if a given time is within a quiet hours window.
 *
 * @param quietHoursStart - Start of quiet hours in "HH:mm" format (e.g., "20:00")
 * @param quietHoursEnd   - End of quiet hours in "HH:mm" format (e.g., "08:00")
 * @param timezone        - IANA timezone string (e.g., "America/New_York")
 * @param now             - Optional Date override for testing
 * @returns true if current time is within quiet hours
 */
export function isWithinQuietHours(params: {
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();

  // Parse the current time in the org's timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: params.timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const currentHour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const currentMinute = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  const currentMinutes = currentHour * 60 + currentMinute;

  // Parse quiet hours boundaries
  const [startHour, startMinute] = params.quietHoursStart.split(":").map(Number);
  const [endHour, endMinute] = params.quietHoursEnd.split(":").map(Number);
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  // Overnight window: e.g., 20:00–08:00
  // The quiet period wraps across midnight
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  // Same-day window: e.g., 12:00–14:00
  // Edge case: start === end means the entire day is quiet (24h window)
  if (startMinutes === endMinutes) {
    return true;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

/**
 * Result of a quiet hours check, suitable for inclusion in
 * eligibility results and safety re-check responses.
 */
export interface QuietHoursResult {
  /** Whether the current time is within quiet hours */
  inQuietHours: boolean;
  /** The organization's quiet hours start time */
  quietHoursStart: string;
  /** The organization's quiet hours end time */
  quietHoursEnd: string;
  /** The timezone used for the check */
  timezone: string;
  /** Human-readable detail message */
  detail: string;
}

/**
 * Check quiet hours for an organization and return a structured result.
 */
export function checkQuietHours(params: {
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
  now?: Date;
}): QuietHoursResult {
  const inQuietHours = isWithinQuietHours(params);

  return {
    inQuietHours,
    quietHoursStart: params.quietHoursStart,
    quietHoursEnd: params.quietHoursEnd,
    timezone: params.timezone,
    detail: inQuietHours
      ? `Currently within quiet hours (${params.quietHoursStart}–${params.quietHoursEnd} ${params.timezone})`
      : `Outside quiet hours (${params.quietHoursStart}–${params.quietHoursEnd} ${params.timezone})`,
  };
}

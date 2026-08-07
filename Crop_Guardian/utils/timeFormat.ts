// utils/timeFormat.ts
// NEW FILE: a small, self-contained helper for the Community screen.
// Kept isolated here instead of assuming utils/utilities.ts already has
// something similar, since we have not seen that file's contents.

/**
 * Turns an ISO date string (e.g. "2026-08-01T09:00:00.000Z", the format
 * every backend timestamp comes back in) into a short relative label
 * like "2h ago", "3d ago", or "Just now".
 *
 * @param isoDate - a date string as returned by the backend (createdAt, etc.)
 * @returns a short, human-friendly relative time string
 */
export function formatRelativeTime(isoDate: string): string {
  // `Date` is a built-in JS/TS global, no import needed. Parsing an
  // invalid string produces "Invalid Date", whose .getTime() is NaN,
  // so we guard against that below rather than let it silently print
  // "NaNh ago" on a bad value from the API.
  const then = new Date(isoDate).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const now = Date.now();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;

  // Beyond ~5 weeks, fall back to a short date instead of an ever-growing
  // week count, e.g. "12 Jun 2026".
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

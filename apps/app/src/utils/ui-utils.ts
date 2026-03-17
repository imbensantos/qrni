// ─── Date Formatting ──────────────────────────────────────────────────────────

const MONTHS_SHORT: string[] = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formats a timestamp as "Mon D, YYYY" (e.g. "Jan 5, 2024").
 * Used wherever a compact date with year is needed (e.g. EditLinkModal).
 */
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Formats a timestamp as "Mon D" (e.g. "Jan 5").
 * Used in link row previews where year context is not needed.
 */
export function formatDateShort(timestamp: number): string {
  const d = new Date(timestamp);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Returns a "Member since Month YYYY" string from a creation timestamp.
 */
export function formatMemberSince(timestamp: number): string {
  const d = new Date(timestamp);
  return `Member since ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Color Utilities ──────────────────────────────────────────────────────────

export const NAMESPACE_COLORS: string[] = [
  "#D89575",
  "#3D8A5A",
  "#5B8BD4",
  "#9B6BC4",
  "#D4805B",
  "#5BAD8A",
];
export const NAMESPACE_BG_COLORS: string[] = [
  "#FFF0E8",
  "#E8F5E9",
  "#EBF0FA",
  "#F3EDF9",
  "#FFF0E8",
  "#E8F5E9",
];

/**
 * Derives a deterministic color from a string by hashing it.
 * Works for both namespace index-based colors and avatar colors.
 *
 * @param key    - A string to hash OR a numeric index
 * @param colors - The palette to select from
 */
export function getColorFromHash(
  key: string | number,
  colors: string[],
): string {
  if (typeof key === "number") {
    return colors[key % colors.length];
  }
  let hash = 0;
  const str = key || "";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

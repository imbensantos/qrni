export type ErrorCategory = "slug" | "url";

/**
 * Categorize a Convex error message for display in the appropriate field.
 */
export function categorizeConvexError(message: string): ErrorCategory {
  const lower = message.toLowerCase();
  if (lower.includes("url") || lower.includes("destination") || lower.includes("harmful")) {
    return "url";
  }
  return "slug";
}

/**
 * Strip Convex framework noise from error messages so users see
 * only the application-level text.
 */
export function cleanConvexError(message: string): string {
  return message
    .replace(/\[CONVEX [^\]]*\]\s*/g, "")
    .replace(/\[Request ID: [^\]]*\]\s*/g, "")
    .replace(/Server Error\s*/gi, "")
    .replace(/Uncaught Error:\s*/gi, "")
    .replace(/\s*at handler\s*\(.*$/s, "")
    .replace(/\s*Called by client\s*$/i, "")
    .trim();
}

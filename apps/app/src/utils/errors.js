/**
 * Strip Convex framework noise from error messages so users see
 * only the application-level text.
 */
export function cleanConvexError(message) {
  return message
    .replace(/\[CONVEX [^\]]*\]\s*/g, "")
    .replace(/\[Request ID: [^\]]*\]\s*/g, "")
    .replace(/Server Error\s*/gi, "")
    .replace(/Uncaught Error:\s*/gi, "")
    .replace(/\s*at handler\s*\(.*$/s, "")
    .replace(/\s*Called by client\s*$/i, "")
    .trim();
}

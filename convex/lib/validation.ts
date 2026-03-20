import { MAX_URL_LENGTH, ERR } from "./constants";

/**
 * Strips HTML angle brackets from user-supplied text to prevent stored XSS.
 * Replaces `<` and `>` with their HTML entity equivalents and trims whitespace.
 */
export function sanitizeText(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
}

/**
 * Validates a destination URL.
 * Checks protocol (http/https) and length constraints.
 */
export function validateDestinationUrl(url: string): void {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(ERR.INVALID_URL);
  }
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(ERR.URL_TOO_LONG);
  }
}

/**
 * Validates an email address using a practical regex.
 *
 * This is deliberately not RFC 5322-complete — it rejects edge cases like
 * quoted local parts and IP-literal domains that no real user would type.
 * The goal is to catch obvious typos (@@.com, a@.com) without false-negating
 * normal addresses.
 */
export function isValidEmail(email: string): boolean {
  // Requires: local part with allowed chars, single @, domain with at least
  // one dot, TLD of 2+ alpha chars.
  return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
    email,
  );
}

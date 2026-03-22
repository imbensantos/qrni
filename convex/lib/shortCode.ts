const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShortCode(length: number = 7): string {
  if (length === 0) return "";
  // Rejection sampling eliminates modulo bias.
  // ALPHABET.length = 62; 256 % 62 = 8, so bytes 248–255 would bias indices
  // 0–7 by ~25% if kept. We discard them instead.
  const limit = 256 - (256 % ALPHABET.length); // 248
  let code = "";
  while (code.length < length) {
    const needed = length - code.length;
    const array = new Uint8Array(needed + 10); // over-request to reduce loop iterations
    crypto.getRandomValues(array);
    for (let i = 0; i < array.length && code.length < length; i++) {
      if (array[i] < limit) {
        code += ALPHABET[array[i] % ALPHABET.length];
      }
    }
  }
  return code;
}

/**
 * Validates a namespace slug (lowercase alphanumeric + hyphens, 3–30 chars).
 *
 * The ASCII-only regex is intentional — it prevents Unicode homograph attacks
 * (e.g., Cyrillic "а" U+0430 vs Latin "a" U+0061) that could let an attacker
 * create a visually identical slug to impersonate another namespace.
 *
 * Do not expand this regex to allow Unicode without adding confusable character
 * detection (e.g., ICU skeleton / NFKC folding checks).
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(slug);
}

/**
 * Validates a custom short-link slug (alphanumeric + underscores/hyphens, 1–60 chars).
 *
 * The ASCII-only regex is intentional — it prevents Unicode homograph attacks
 * (e.g., Cyrillic "а" U+0430 vs Latin "a" U+0061) that could let an attacker
 * create a visually identical slug pointing to a malicious destination.
 *
 * Do not expand this regex to allow Unicode without adding confusable character
 * detection (e.g., ICU skeleton / NFKC folding checks).
 */
export function isValidCustomSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{1,60}$/.test(slug);
}

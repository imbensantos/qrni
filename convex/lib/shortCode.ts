const ALPHABET =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShortCode(length: number = 7): string {
  let code = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += ALPHABET[array[i] % ALPHABET.length];
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

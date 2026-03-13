const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateShortCode(length: number = 7): string {
  let code = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += ALPHABET[array[i] % ALPHABET.length];
  }
  return code;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]{3,30}$/.test(slug);
}

export function isValidCustomSlug(slug: string): boolean {
  return /^[a-zA-Z0-9_-]{1,60}$/.test(slug);
}

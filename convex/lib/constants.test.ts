import { describe, it, expect } from "vitest";
import {
  MAX_NAMESPACES_PER_USER,
  MAX_CUSTOM_LINKS_PER_USER,
  MAX_URL_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MAX_USER_NAME_LENGTH,
  ANONYMOUS_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  RATE_LIMIT_WINDOW_MS,
  INVITE_TTL_MS,
  DUPLICATE_WINDOW_MS,
  MAX_SHORT_CODE_ATTEMPTS,
  ERR,
} from "./constants";

// ---------------------------------------------------------------------------
// Limit constants
// ---------------------------------------------------------------------------
describe("limit constants", () => {
  it.each([
    ["MAX_NAMESPACES_PER_USER", MAX_NAMESPACES_PER_USER],
    ["MAX_CUSTOM_LINKS_PER_USER", MAX_CUSTOM_LINKS_PER_USER],
    ["MAX_URL_LENGTH", MAX_URL_LENGTH],
    ["MAX_DESCRIPTION_LENGTH", MAX_DESCRIPTION_LENGTH],
    ["MAX_USER_NAME_LENGTH", MAX_USER_NAME_LENGTH],
  ])("%s is a positive integer", (_name, value) => {
    expect(value).toBeGreaterThan(0);
    expect(Number.isInteger(value)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rate limit constants
// ---------------------------------------------------------------------------
describe("rate limit constants", () => {
  it.each([
    ["ANONYMOUS_RATE_LIMIT", ANONYMOUS_RATE_LIMIT],
    ["AUTH_RATE_LIMIT", AUTH_RATE_LIMIT],
  ])("%s is a positive number", (_name, value) => {
    expect(value).toBeGreaterThan(0);
  });

  it("AUTH_RATE_LIMIT is greater than or equal to ANONYMOUS_RATE_LIMIT", () => {
    expect(AUTH_RATE_LIMIT).toBeGreaterThanOrEqual(ANONYMOUS_RATE_LIMIT);
  });

  it("RATE_LIMIT_WINDOW_MS is positive", () => {
    expect(RATE_LIMIT_WINDOW_MS).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------
describe("timing constants", () => {
  it("INVITE_TTL_MS equals 7 days in milliseconds", () => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    expect(INVITE_TTL_MS).toBe(SEVEN_DAYS_MS);
  });

  it("DUPLICATE_WINDOW_MS is less than 1 minute", () => {
    expect(DUPLICATE_WINDOW_MS).toBeLessThan(60_000);
    expect(DUPLICATE_WINDOW_MS).toBeGreaterThan(0);
  });

  it("MAX_SHORT_CODE_ATTEMPTS is a positive integer", () => {
    expect(MAX_SHORT_CODE_ATTEMPTS).toBeGreaterThan(0);
    expect(Number.isInteger(MAX_SHORT_CODE_ATTEMPTS)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ERR object
// ---------------------------------------------------------------------------
describe("ERR error messages", () => {
  const EXPECTED_KEYS = [
    "MUST_BE_SIGNED_IN",
    "USER_NOT_FOUND",
    "NOT_AUTHORIZED",
    "ANONYMOUS_RATE_LIMITED",
    "AUTH_RATE_LIMITED",
    "SHORT_CODE_EXHAUSTED",
    "INVALID_URL",
    "URL_TOO_LONG",
    "UNSAFE_URL",
    "INVALID_CUSTOM_SLUG",
    "SLUG_TAKEN",
    "NAME_IN_USE",
    "CUSTOM_LINK_LIMIT",
    "NAMESPACE_SLUG_TAKEN",
    "INVALID_NAMESPACE_SLUG",
    "NAMESPACE_RESERVED",
    "NAMESPACE_TAKEN",
    "NAMESPACE_NOT_FOUND",
    "NAMESPACE_LINK_CONFLICT",
    "NAMESPACE_LIMIT",
    "DESCRIPTION_TOO_LONG",
    "INVALID_EMAIL",
    "INVITE_NOT_FOUND",
    "INVITE_REVOKED",
    "INVITE_EXPIRED",
    "INVITE_WRONG_EMAIL",
    "ALREADY_OWNER",
    "ALREADY_MEMBER",
    "INVITE_NOT_IN_NAMESPACE",
    "MEMBERSHIP_NOT_FOUND",
    "MEMBERSHIP_NOT_IN_NAMESPACE",
    "ONLY_OWNER_CAN_TRANSFER",
    "TARGET_MUST_BE_MEMBER",
    "INVITE_RATE_LIMITED",
    "LINK_NOT_FOUND_OR_DENIED",
    "INVITE_INVALID",
    "NAME_TOO_LONG",
    "AVATAR_MUST_BE_HTTPS",
  ] as const;

  it("has all expected keys", () => {
    for (const key of EXPECTED_KEYS) {
      expect(ERR).toHaveProperty(key);
    }
  });

  it("every value is a non-empty string", () => {
    for (const value of Object.values(ERR)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect } from "vitest";
import { generateShortCode, isValidSlug, isValidCustomSlug } from "./shortCode";

// ---------------------------------------------------------------------------
// generateShortCode
// ---------------------------------------------------------------------------
describe("generateShortCode", () => {
  const URL_SAFE_RE = /^[a-zA-Z0-9]+$/;

  it("returns a 7-character string by default", () => {
    expect(generateShortCode()).toHaveLength(7);
  });

  it("returns a string of the requested length", () => {
    expect(generateShortCode(12)).toHaveLength(12);
    expect(generateShortCode(1)).toHaveLength(1);
  });

  it("only contains alphanumeric characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateShortCode()).toMatch(URL_SAFE_RE);
    }
  });

  it("produces different values across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateShortCode()));
    // With 62^7 possibilities, 20 codes should all be unique
    expect(codes.size).toBe(20);
  });

  it("returns an empty string when length is 0", () => {
    expect(generateShortCode(0)).toBe("");
  });

  it("handles a very large length without throwing", () => {
    const code = generateShortCode(500);
    expect(code).toHaveLength(500);
    expect(code).toMatch(/^[a-zA-Z0-9]+$/);
  });
});

// ---------------------------------------------------------------------------
// isValidSlug  (namespace slugs: lowercase alphanum + hyphens, 3–30 chars)
// ---------------------------------------------------------------------------
describe("isValidSlug", () => {
  describe("valid slugs", () => {
    it.each([
      ["my-namespace"],
      ["abc"], // exactly 3 (lower boundary)
      ["a".repeat(30)], // exactly 30 (upper boundary)
      ["hello-world-123"],
      ["123"],
    ])("accepts %j", (slug) => {
      expect(isValidSlug(slug)).toBe(true);
    });
  });

  describe("invalid slugs", () => {
    it.each([
      ["", "empty string"],
      ["ab", "too short (2 chars)"],
      ["a".repeat(31), "too long (31 chars)"],
      ["MySlug", "uppercase letters"],
      ["hello_world", "underscores"],
      ["hello world", "spaces"],
      ["hello!", "special characters"],
      ["café", "unicode characters"],
    ])("rejects %j (%s)", (slug) => {
      expect(isValidSlug(slug)).toBe(false);
    });
  });

  // The regex /^[a-z0-9-]{3,30}$/ permits leading, trailing, and consecutive
  // hyphens. These are valid per the current implementation.
  describe("hyphen edge cases (allowed by regex)", () => {
    it.each([
      ["-abc", "leading hyphen"],
      ["abc-", "trailing hyphen"],
      ["a--b", "consecutive hyphens"],
    ])("accepts %j (%s)", (slug) => {
      expect(isValidSlug(slug)).toBe(true);
    });
  });

  it("rejects strings shorter than 3 characters", () => {
    expect(isValidSlug("ab")).toBe(false);
    expect(isValidSlug("a")).toBe(false);
  });

  it("rejects strings longer than 30 characters", () => {
    expect(isValidSlug("a".repeat(31))).toBe(false);
  });

  it("accepts exactly 3 characters", () => {
    expect(isValidSlug("abc")).toBe(true);
  });

  it("accepts exactly 30 characters", () => {
    expect(isValidSlug("a".repeat(30))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isValidCustomSlug  (alphanumeric + underscores/hyphens, 1–60 chars)
// ---------------------------------------------------------------------------
describe("isValidCustomSlug", () => {
  describe("valid custom slugs", () => {
    it.each([
      ["a"], // exactly 1 (lower boundary)
      ["my-link"],
      ["my_link"],
      ["MyLink123"],
      ["a".repeat(60)], // exactly 60 (upper boundary)
      ["A-B_c-0"],
    ])("accepts %j", (slug) => {
      expect(isValidCustomSlug(slug)).toBe(true);
    });
  });

  describe("invalid custom slugs", () => {
    it.each([
      ["", "empty string"],
      ["a".repeat(61), "too long (61 chars)"],
      ["hello!", "exclamation mark"],
      ["hello@world", "at sign"],
      ["hello#world", "hash"],
      ["hello world", "spaces"],
      ["hello/world", "slashes"],
      ["café", "unicode characters"],
    ])("rejects %j (%s)", (slug) => {
      expect(isValidCustomSlug(slug)).toBe(false);
    });
  });

  it("accepts exactly 1 character", () => {
    expect(isValidCustomSlug("x")).toBe(true);
  });

  it("accepts exactly 60 characters", () => {
    expect(isValidCustomSlug("b".repeat(60))).toBe(true);
  });

  it("rejects 61 characters", () => {
    expect(isValidCustomSlug("b".repeat(61))).toBe(false);
  });
});

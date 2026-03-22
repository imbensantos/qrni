import { describe, it, expect } from "vitest";
import { generateShortCode, isValidSlug, isValidCustomSlug } from "./shortCode";

// ---------------------------------------------------------------------------
// C1. Modulo bias in generateShortCode
//
// ALPHABET has 62 characters. Each random byte ranges 0–255 (256 values).
// 256 % 62 = 8, so characters at indices 0–7 ('a'–'h') are selected by 5
// byte values instead of 4, making them appear ~25% more often than expected.
//
// These tests FAIL against the current implementation and PASS after the bias
// is eliminated (e.g., by using rejection sampling or bit masking).
// ---------------------------------------------------------------------------

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
// C1. Modulo bias — character frequency uniformity
//
// WHY THIS FAILS against current code:
//   ALPHABET.length = 62, random byte range = 256 values.
//   256 % 62 = 8, so indices 0–7 ('a'–'h') each appear with probability
//   5/256 ≈ 0.01953, while indices 8–61 appear with probability 4/256 = 0.01563.
//   That is a ~25% over-representation for the first 8 characters.
//
//   The chi-squared test below will detect this bias with a large enough sample
//   and reject H₀ (uniform distribution) because the observed frequencies for
//   'a'–'h' are systematically higher than expected.
// ---------------------------------------------------------------------------
describe("generateShortCode — C1: character distribution uniformity (modulo bias)", () => {
  const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const ALPHA_LEN = ALPHABET.length; // 62

  // Generate enough characters for a meaningful chi-squared test.
  // With 62 buckets and ~25% bias on 8 of them, n=620_000 gives very high
  // power (expected count per bucket = 10_000, chi-sq critical value at
  // p=0.001 with 61 df ≈ 100; actual chi-sq with bias ≈ 2500).
  const SAMPLE_SIZE = 620_000;

  it("character frequencies pass a chi-squared goodness-of-fit test (p > 0.001)", () => {
    // Build frequency map
    const freq = new Array<number>(ALPHA_LEN).fill(0);
    const codeLength = 1000;
    const iterations = SAMPLE_SIZE / codeLength;

    for (let i = 0; i < iterations; i++) {
      const code = generateShortCode(codeLength);
      for (const ch of code) {
        const idx = ALPHABET.indexOf(ch);
        if (idx >= 0) freq[idx]++;
      }
    }

    const total = freq.reduce((s, f) => s + f, 0);
    const expected = total / ALPHA_LEN;

    // Chi-squared statistic: sum((observed - expected)² / expected)
    const chiSquared = freq.reduce((sum, observed) => {
      const diff = observed - expected;
      return sum + (diff * diff) / expected;
    }, 0);

    // Degrees of freedom = 61; chi-squared critical value at p=0.001 is ~100.
    // Biased generator produces chi-squared >> 1000 — the test will fail.
    // Unbiased generator produces chi-squared << 100 — the test passes.
    const CHI_SQUARED_CRITICAL = 100; // p=0.001, df=61
    expect(chiSquared).toBeLessThan(CHI_SQUARED_CRITICAL);
  });

  it("max per-character deviation from expected frequency is within 2%", () => {
    // A stricter complementary check: no single character should deviate more
    // than 2% from the expected frequency (1/62 ≈ 1.613%).
    // The biased generator produces ~25% over-representation for 'a'–'h',
    // i.e. deviation of (5/256 - 4/256) / (4/256) ≈ 25% — far above the 2% threshold.
    const freq = new Array<number>(ALPHA_LEN).fill(0);
    const codeLength = 1000;
    const iterations = 5000; // 5_000_000 total characters — large enough for 2% threshold to be reliable

    for (let i = 0; i < iterations; i++) {
      const code = generateShortCode(codeLength);
      for (const ch of code) {
        const idx = ALPHABET.indexOf(ch);
        if (idx >= 0) freq[idx]++;
      }
    }

    const total = freq.reduce((s, f) => s + f, 0);
    const expectedFreq = total / ALPHA_LEN;

    const MAX_RELATIVE_DEVIATION = 0.02; // 2%

    for (let i = 0; i < ALPHA_LEN; i++) {
      const relativeDeviation = Math.abs(freq[i] - expectedFreq) / expectedFreq;
      expect(relativeDeviation).toBeLessThan(MAX_RELATIVE_DEVIATION);
    }
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

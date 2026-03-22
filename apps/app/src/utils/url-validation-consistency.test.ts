/**
 * C8: Divergent URL validation between frontend and backend.
 *
 * The frontend `isValidUrl` (bulk-utils.ts) does not enforce MAX_URL_LENGTH.
 * The backend `validateDestinationUrl` does. This means a URL that is too long
 * will be accepted by the frontend as valid, reach the backend, and then be
 * rejected there — producing a poor user experience and inconsistent behavior.
 *
 * Tests marked "FAILS against current code" will fail until isValidUrl is
 * updated to also enforce MAX_URL_LENGTH.
 */
import { describe, it, expect } from "vitest";
import { isValidUrl } from "./bulk-utils";
import { MAX_URL_LENGTH } from "../../../../convex/lib/constants";

// ---------------------------------------------------------------------------
// C8a — isValidUrl must enforce MAX_URL_LENGTH (FAILS against current code)
// ---------------------------------------------------------------------------

describe("C8: isValidUrl — MAX_URL_LENGTH enforcement (FAILS against current code)", () => {
  it("rejects a URL that exceeds MAX_URL_LENGTH", () => {
    // FAILS: current isValidUrl has no length check, so it returns true for
    // any syntactically valid http/https URL regardless of length.
    const longUrl = "https://example.com/" + "a".repeat(MAX_URL_LENGTH);
    expect(isValidUrl(longUrl)).toBe(false);
  });

  it("accepts a URL that is exactly MAX_URL_LENGTH characters", () => {
    // Build a URL that is exactly MAX_URL_LENGTH long
    const base = "https://example.com/";
    const path = "a".repeat(MAX_URL_LENGTH - base.length);
    const exactUrl = base + path;
    expect(exactUrl.length).toBe(MAX_URL_LENGTH);
    expect(isValidUrl(exactUrl)).toBe(true);
  });

  it("rejects a URL that is MAX_URL_LENGTH + 1 characters", () => {
    // FAILS: current code has no length check.
    const base = "https://example.com/";
    const path = "a".repeat(MAX_URL_LENGTH - base.length + 1);
    const tooLong = base + path;
    expect(tooLong.length).toBe(MAX_URL_LENGTH + 1);
    expect(isValidUrl(tooLong)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// C8b — Both validators must agree on null bytes (PASSES for null byte check,
//        but the backend diverges because validateDestinationUrl does not strip
//        null bytes — it only checks the prefix and length. These tests document
//        the current agreed-upon behaviour for null bytes in the frontend.)
// ---------------------------------------------------------------------------

describe("C8: isValidUrl — null byte handling (documents current behaviour)", () => {
  it("rejects a URL containing a null byte", () => {
    // Both sides should reject this. The frontend already does.
    expect(isValidUrl("https://example.com/\0evil")).toBe(false);
  });

  it("rejects a URL that is only a null byte", () => {
    expect(isValidUrl("\0")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// C8c — Both validators agree on edge cases
// ---------------------------------------------------------------------------

describe("C8: isValidUrl and backend agree on edge cases", () => {
  it("rejects an empty string", () => {
    expect(isValidUrl("")).toBe(false);
  });

  it("rejects a URL with a space in the host (not parseable by URL())", () => {
    expect(isValidUrl("https://exam ple.com")).toBe(false);
  });

  it("rejects ftp:// protocol", () => {
    expect(isValidUrl("ftp://example.com")).toBe(false);
  });

  it("rejects javascript: protocol", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });

  it("accepts a valid https URL", () => {
    expect(isValidUrl("https://example.com/path?q=1")).toBe(true);
  });

  it("accepts a valid http URL", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("rejects a URL with no protocol", () => {
    expect(isValidUrl("example.com")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// C8d — Cross-boundary contract: very long URLs must be consistently rejected
//        (FAILS against current code — isValidUrl accepts them)
// ---------------------------------------------------------------------------

describe("C8: cross-boundary contract — very long URLs (FAILS against current code)", () => {
  it("frontend and backend agree: a 3000-char URL is invalid", () => {
    // Backend always rejects URLs over MAX_URL_LENGTH (2048).
    // Frontend currently does NOT reject them — this will FAIL until fixed.
    const url = "https://example.com/" + "x".repeat(3000 - 20);
    expect(url.length).toBeGreaterThan(MAX_URL_LENGTH);
    expect(isValidUrl(url)).toBe(false);
  });
});

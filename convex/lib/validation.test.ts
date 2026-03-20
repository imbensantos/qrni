import { describe, it, expect } from "vitest";
import { sanitizeText, validateDestinationUrl, isValidEmail } from "./validation";
import { ERR, MAX_URL_LENGTH } from "./constants";

// ---------------------------------------------------------------------------
// sanitizeText
// ---------------------------------------------------------------------------
describe("sanitizeText", () => {
  it("escapes angle brackets", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;",
    );
  });

  it("trims whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("");
  });

  it("passes through safe text unchanged", () => {
    expect(sanitizeText("Hello World 123")).toBe("Hello World 123");
  });

  it("handles multiple angle brackets", () => {
    expect(sanitizeText("<b>bold</b> and <i>italic</i>")).toBe(
      "&lt;b&gt;bold&lt;/b&gt; and &lt;i&gt;italic&lt;/i&gt;",
    );
  });

  it("preserves quotes but escapes ampersands", () => {
    expect(sanitizeText('He said "hello" & goodbye')).toBe('He said "hello" &amp; goodbye');
  });

  it("escapes ampersands", () => {
    expect(sanitizeText("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });
});

// ---------------------------------------------------------------------------
// validateDestinationUrl
// ---------------------------------------------------------------------------
describe("validateDestinationUrl", () => {
  it("accepts a valid http URL", () => {
    expect(() => validateDestinationUrl("http://example.com")).not.toThrow();
  });

  it("accepts a valid https URL with path and query", () => {
    expect(() => validateDestinationUrl("https://example.com/path?q=1&b=2#frag")).not.toThrow();
  });

  it("accepts a URL that is exactly MAX_URL_LENGTH characters", () => {
    const url = "https://example.com/" + "a".repeat(MAX_URL_LENGTH - 20);
    // Trim or pad to exactly MAX_URL_LENGTH
    const exact = url.slice(0, MAX_URL_LENGTH);
    expect(() => validateDestinationUrl(exact)).not.toThrow();
  });

  it("throws on empty string", () => {
    expect(() => validateDestinationUrl("")).toThrow(ERR.INVALID_URL);
  });

  it("throws on URL without protocol", () => {
    expect(() => validateDestinationUrl("example.com")).toThrow(ERR.INVALID_URL);
  });

  it("throws on ftp protocol", () => {
    expect(() => validateDestinationUrl("ftp://files.example.com")).toThrow(ERR.INVALID_URL);
  });

  it("throws on javascript: protocol", () => {
    expect(() => validateDestinationUrl("javascript:alert(1)")).toThrow(ERR.INVALID_URL);
  });

  it("throws on URL exceeding MAX_URL_LENGTH", () => {
    const longUrl = "https://example.com/" + "a".repeat(MAX_URL_LENGTH);
    expect(() => validateDestinationUrl(longUrl)).toThrow(ERR.URL_TOO_LONG);
  });

  it("accepts URL with unicode path segments", () => {
    expect(() => validateDestinationUrl("https://example.com/日本語")).not.toThrow();
  });

  it("accepts URL with special query characters", () => {
    expect(() =>
      validateDestinationUrl("https://example.com/path?a=1&b=hello%20world"),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------------
describe("isValidEmail", () => {
  describe("valid emails", () => {
    it.each([
      ["user@example.com"],
      ["user.name+tag@domain.co"],
      ["user@sub.domain.com"],
      ["firstname.lastname@company.org"],
      ["user123@test.io"],
    ])("accepts %j", (email) => {
      expect(isValidEmail(email)).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it.each([
      ["", "empty string"],
      ["userexample.com", "no @ sign"],
      ["@@.com", "double @ sign"],
      ["@domain.com", "no local part"],
      ["user@", "no domain"],
      ["user@.com", "domain starts with dot"],
      ["user @example.com", "space in local part"],
      ["user@exam ple.com", "space in domain"],
      ["user@@example.com", "multiple @ signs"],
      ["user@example", "no TLD dot"],
    ])("rejects %j (%s)", (email) => {
      expect(isValidEmail(email)).toBe(false);
    });
  });

  it("accepts a long local part", () => {
    const local = "a".repeat(64);
    expect(isValidEmail(`${local}@example.com`)).toBe(true);
  });

  it("accepts a long domain", () => {
    const domain = "a".repeat(60) + ".com";
    expect(isValidEmail(`user@${domain}`)).toBe(true);
  });
});

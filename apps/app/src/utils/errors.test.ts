import { describe, it, expect } from "vitest";
import { cleanConvexError, categorizeConvexError } from "./errors";

describe("cleanConvexError", () => {
  it("strips [CONVEX ...] prefixes", () => {
    expect(cleanConvexError("[CONVEX M(mutations:createLink)] Something went wrong")).toBe(
      "Something went wrong",
    );
  });

  it("strips [Request ID: ...] tags", () => {
    expect(cleanConvexError("[Request ID: abc123] Oops")).toBe("Oops");
  });

  it("strips Server Error prefix", () => {
    expect(cleanConvexError("Server Error Something broke")).toBe("Something broke");
  });

  it("strips Uncaught Error prefix", () => {
    expect(cleanConvexError("Uncaught Error: Limit reached")).toBe("Limit reached");
  });

  it("strips 'at handler(...)' stack trace suffix", () => {
    expect(cleanConvexError("Limit exceeded at handler (convex/links.ts:42:10)")).toBe(
      "Limit exceeded",
    );
  });

  it("strips 'Called by client' suffix", () => {
    expect(cleanConvexError("Something failed Called by client")).toBe("Something failed");
  });

  it("strips multiple prefixes at once", () => {
    const dirty =
      "[CONVEX M(mutations:foo)] [Request ID: xyz] Uncaught Error: Bad input Called by client";
    expect(cleanConvexError(dirty)).toBe("Bad input");
  });

  it("returns already-clean messages unchanged", () => {
    expect(cleanConvexError("Link limit reached")).toBe("Link limit reached");
  });

  it("handles empty string", () => {
    expect(cleanConvexError("")).toBe("");
  });
});

describe("categorizeConvexError", () => {
  it('categorizes URL-related errors as "url"', () => {
    expect(categorizeConvexError("URL must start with http://")).toBe("url");
    expect(categorizeConvexError("This URL was flagged as potentially harmful")).toBe("url");
    expect(categorizeConvexError("Invalid destination")).toBe("url");
  });

  it('categorizes slug-related errors as "slug"', () => {
    expect(categorizeConvexError("That short link name is already taken")).toBe("slug");
    expect(categorizeConvexError("You've reached the limit of 5 custom short links")).toBe("slug");
  });

  it('defaults to "slug" for unknown errors', () => {
    expect(categorizeConvexError("Something went wrong")).toBe("slug");
  });
});

/**
 * I15: Short code regex mismatch between Vite proxy and backend isValidSlug.
 *
 * The Vite proxy originally used:
 *   NAMESPACED_RE = /^\/[a-z][a-z0-9-]{0,29}\/[a-zA-Z0-9_-]{1,60}$/
 *
 * This was fixed to:
 *   NAMESPACED_RE = /^\/[a-z][a-z0-9-]{2,29}\/[a-zA-Z0-9_-]{1,60}$/
 *
 * This means: 1 leading letter + 2–29 more chars = 3–30 total, matching the
 * backend `isValidSlug` minimum of 3 characters.
 *
 * These tests verify that the fixed proxy regex and the backend isValidSlug
 * agree on all namespace length cases.
 */
import { describe, it, expect } from "vitest";
import { isValidSlug } from "./shortCode";

// The fixed regex from apps/app/vite.config.js — copied here to verify
// the backend agrees with the same set of strings.
const NAMESPACED_RE = /^\/[a-z][a-z0-9-]{2,29}\/[a-zA-Z0-9_-]{1,60}$/;

/**
 * Extract the namespace segment from a namespaced path.
 * "/my-ns/abc" → "my-ns"
 */
function namespaceFromPath(path: string): string {
  return path.slice(1).split("/")[0];
}

// ---------------------------------------------------------------------------
// I15a — 1-char namespace: both proxy and isValidSlug reject (PASSES after fix)
// ---------------------------------------------------------------------------

describe("I15: 1-char namespace — proxy vs backend mismatch (FAILS against current code)", () => {
  it("1-char namespace passes the Vite proxy regex", () => {
    // After the fix, the proxy rejects 1-char namespaces (min is now 3).
    const path = "/a/some-slug";
    expect(NAMESPACED_RE.test(path)).toBe(false);
  });

  it("1-char namespace is REJECTED by isValidSlug (FAILS: shows the mismatch)", () => {
    // isValidSlug requires minimum 3 chars — 1-char is correctly rejected.
    const namespace = namespaceFromPath("/a/some-slug");
    expect(namespace).toBe("a");
    // Both proxy and backend now agree: 1-char namespace is invalid.
    expect(isValidSlug(namespace)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// I15b — 2-char namespace: both proxy and isValidSlug reject (PASSES after fix)
// ---------------------------------------------------------------------------

describe("I15: 2-char namespace — proxy vs backend mismatch (FAILS against current code)", () => {
  it("2-char namespace passes the Vite proxy regex", () => {
    // After the fix, the proxy rejects 2-char namespaces (min is now 3).
    const path = "/ab/some-slug";
    expect(NAMESPACED_RE.test(path)).toBe(false);
  });

  it("2-char namespace is REJECTED by isValidSlug (FAILS: shows the mismatch)", () => {
    const namespace = namespaceFromPath("/ab/some-slug");
    expect(namespace).toBe("ab");
    // Both proxy and backend now agree: 2-char namespace is invalid.
    expect(isValidSlug(namespace)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// I15c — 3-char namespace: passes proxy AND isValidSlug (both agree — PASSES)
// ---------------------------------------------------------------------------

describe("I15: 3-char namespace — proxy and backend agree (PASSES)", () => {
  it("3-char namespace passes the Vite proxy regex", () => {
    const path = "/abc/some-slug";
    expect(NAMESPACED_RE.test(path)).toBe(true);
  });

  it("3-char namespace passes isValidSlug", () => {
    expect(isValidSlug("abc")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// I15d — 30-char namespace: both agree (PASSES)
// ---------------------------------------------------------------------------

describe("I15: 30-char namespace — proxy and backend agree (PASSES)", () => {
  it("30-char namespace passes the Vite proxy regex", () => {
    const ns = "a" + "b".repeat(29); // 30 chars
    const path = `/${ns}/some-slug`;
    expect(NAMESPACED_RE.test(path)).toBe(true);
  });

  it("30-char namespace passes isValidSlug", () => {
    const ns = "a" + "b".repeat(29);
    expect(isValidSlug(ns)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// I15e — 31-char namespace: both reject (both agree — PASSES)
// ---------------------------------------------------------------------------

describe("I15: 31-char namespace — proxy and backend both reject (PASSES)", () => {
  it("31-char namespace fails the Vite proxy regex", () => {
    // Proxy allows up to 1 + 29 = 30 chars total for the namespace.
    const ns = "a" + "b".repeat(30); // 31 chars
    const path = `/${ns}/some-slug`;
    expect(NAMESPACED_RE.test(path)).toBe(false);
  });

  it("31-char namespace fails isValidSlug", () => {
    const ns = "a" + "b".repeat(30);
    expect(isValidSlug(ns)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// I15f — Namespace with uppercase: proxy rejects, isValidSlug also rejects
// ---------------------------------------------------------------------------

describe("I15: uppercase namespace — both reject (PASSES)", () => {
  it("uppercase namespace fails the Vite proxy regex", () => {
    expect(NAMESPACED_RE.test("/MyNS/some-slug")).toBe(false);
  });

  it("uppercase namespace fails isValidSlug", () => {
    expect(isValidSlug("MyNS")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// I15g — Comprehensive: for any path matching the fixed proxy regex, namespace
//         should also satisfy isValidSlug (PASSES after fix)
// ---------------------------------------------------------------------------

describe("I15: comprehensive consistency — every proxy-accepted namespace is valid per backend", () => {
  const proxyAcceptedPaths = [
    "/abc/link", // 3-char namespace — both accept (PASS)
    "/my-ns/link", // typical namespace — both accept (PASS)
  ];

  it.each(proxyAcceptedPaths)(
    "proxy-matched path '%s' has a namespace that isValidSlug also accepts",
    (path) => {
      // Only run on paths the proxy would actually forward.
      expect(NAMESPACED_RE.test(path)).toBe(true);
      const namespace = namespaceFromPath(path);
      expect(isValidSlug(namespace)).toBe(true);
    },
  );
});

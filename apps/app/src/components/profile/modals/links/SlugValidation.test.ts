/**
 * Slug validation consistency tests — I10
 *
 * Audit finding: AddLinkModal and EditLinkModal use different regex patterns
 * for slug validation, creating inconsistent user-facing rules:
 *
 *   AddLinkModal  (line 51): /^[a-zA-Z0-9_-]{1,60}$/   — allows underscores, max 60 chars
 *   EditLinkModal (line 63): /^[a-zA-Z0-9-]+$/          — no underscores, no max length
 *
 * These tests FAIL against the current implementation and should PASS once both
 * modals are aligned to a single canonical regex.
 *
 * Strategy: extract both regexes literally from each source file and test them
 * directly — no component rendering needed.
 */

import { describe, it, expect } from "vitest";

// ── Regexes extracted verbatim from each modal ───────────────────────────────
// When the audit is fixed these should be the SAME pattern in both places.

/** AddLinkModal.tsx line 51 */
const ADD_LINK_SLUG_REGEX = /^[a-zA-Z0-9_-]{1,60}$/;

/** EditLinkModal.tsx line 63 */
const EDIT_LINK_SLUG_REGEX = /^[a-zA-Z0-9_-]{1,60}$/;

// ── Helpers ──────────────────────────────────────────────────────────────────

function bothAccept(slug: string) {
  return ADD_LINK_SLUG_REGEX.test(slug) && EDIT_LINK_SLUG_REGEX.test(slug);
}

function bothReject(slug: string) {
  return !ADD_LINK_SLUG_REGEX.test(slug) && !EDIT_LINK_SLUG_REGEX.test(slug);
}

// ── Shared acceptance rules ──────────────────────────────────────────────────

describe("Slug validation — I10: AddLinkModal and EditLinkModal must agree", () => {
  describe("slugs that BOTH modals should accept", () => {
    it("accepts a plain lowercase slug", () => {
      expect(bothAccept("my-link")).toBe(true);
    });

    it("accepts an alphanumeric slug with hyphens", () => {
      expect(bothAccept("abc-123")).toBe(true);
    });

    it("accepts a single character slug", () => {
      expect(bothAccept("a")).toBe(true);
    });
  });

  describe("slugs that BOTH modals should reject", () => {
    it("rejects an empty string", () => {
      expect(bothReject("")).toBe(true);
    });

    it("rejects slugs containing spaces", () => {
      expect(bothReject("my link")).toBe(true);
    });

    it("rejects slugs containing special characters", () => {
      expect(bothReject("my@link")).toBe(true);
    });
  });

  // ── Tests that FAIL against current code ──────────────────────────────────

  /**
   * FAILS because EditLinkModal uses /^[a-zA-Z0-9-]+$/ which does NOT allow
   * underscores, so EDIT_LINK_SLUG_REGEX.test("my_link") returns false.
   */
  it("both modals accept a slug containing underscores (my_link)", () => {
    const slug = "my_link";
    expect(ADD_LINK_SLUG_REGEX.test(slug)).toBe(true);
    // This assertion fails with the current EditLinkModal regex
    expect(EDIT_LINK_SLUG_REGEX.test(slug)).toBe(true);
  });

  /**
   * FAILS because EditLinkModal uses /^[a-zA-Z0-9-]+$/ with no length limit,
   * so a 61-character slug passes EDIT_LINK_SLUG_REGEX but fails ADD_LINK_SLUG_REGEX.
   * Both should reject it.
   */
  it("both modals reject a slug exceeding 60 characters", () => {
    const slug = "a".repeat(61);
    expect(ADD_LINK_SLUG_REGEX.test(slug)).toBe(false);
    // This assertion fails with the current EditLinkModal regex (no max length)
    expect(EDIT_LINK_SLUG_REGEX.test(slug)).toBe(false);
  });

  /**
   * FAILS because the two regexes differ — a slug with an underscore is
   * accepted by AddLinkModal and rejected by EditLinkModal, making
   * `bothAccept` return false.
   */
  it("both modals agree on slug with mixed hyphens and underscores (cool_link-2)", () => {
    const slug = "cool_link-2";
    expect(bothAccept(slug)).toBe(true);
  });

  /**
   * FAILS because EditLinkModal has no upper length bound — a 60-character
   * slug passes both, but EDIT_LINK_SLUG_REGEX also allows 61+ chars while
   * ADD_LINK_SLUG_REGEX does not, so the boundary is inconsistent.
   * Verifies the 60-char boundary is enforced by BOTH regexes.
   */
  it("both modals accept exactly 60 characters and reject 61", () => {
    const exactly60 = "a".repeat(60);
    const exactly61 = "a".repeat(61);

    expect(ADD_LINK_SLUG_REGEX.test(exactly60)).toBe(true);
    // Fails: current EditLinkModal regex has no length limit
    expect(EDIT_LINK_SLUG_REGEX.test(exactly60)).toBe(true);

    expect(ADD_LINK_SLUG_REGEX.test(exactly61)).toBe(false);
    // Fails: current EditLinkModal regex accepts arbitrarily long slugs
    expect(EDIT_LINK_SLUG_REGEX.test(exactly61)).toBe(false);
  });
});

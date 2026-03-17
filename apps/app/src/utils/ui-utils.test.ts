import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateShort,
  formatMemberSince,
  getColorFromHash,
  NAMESPACE_COLORS,
} from "./ui-utils";

// Use a fixed UTC timestamp: 2026-03-17T12:00:00.000Z
const TIMESTAMP = Date.UTC(2026, 2, 17, 12, 0, 0);

// ---------------------------------------------------------------------------
// formatDate
// ---------------------------------------------------------------------------

describe("formatDate", () => {
  it("formats a timestamp as 'Mon D, YYYY'", () => {
    const result = formatDate(TIMESTAMP);
    // Date constructor uses local time — assert the pieces exist
    expect(result).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}$/);
  });

  it("returns a consistent result for the same input", () => {
    expect(formatDate(TIMESTAMP)).toBe(formatDate(TIMESTAMP));
  });
});

// ---------------------------------------------------------------------------
// formatDateShort
// ---------------------------------------------------------------------------

describe("formatDateShort", () => {
  it("formats a timestamp as 'Mon D'", () => {
    const result = formatDateShort(TIMESTAMP);
    expect(result).toMatch(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}$/);
  });
});

// ---------------------------------------------------------------------------
// formatMemberSince
// ---------------------------------------------------------------------------

describe("formatMemberSince", () => {
  it("returns 'Member since Month YYYY'", () => {
    const result = formatMemberSince(TIMESTAMP);
    expect(result).toMatch(
      /^Member since (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/,
    );
  });
});

// ---------------------------------------------------------------------------
// getColorFromHash
// ---------------------------------------------------------------------------

describe("getColorFromHash", () => {
  const palette = ["#AAA", "#BBB", "#CCC"];

  it("returns the color at index mod length for numeric keys", () => {
    expect(getColorFromHash(0, palette)).toBe("#AAA");
    expect(getColorFromHash(1, palette)).toBe("#BBB");
    expect(getColorFromHash(3, palette)).toBe("#AAA");
  });

  it("is deterministic for string keys", () => {
    const a = getColorFromHash("hello", palette);
    const b = getColorFromHash("hello", palette);
    expect(a).toBe(b);
  });

  it("returns a value within the palette", () => {
    const result = getColorFromHash("anything", NAMESPACE_COLORS);
    expect(NAMESPACE_COLORS).toContain(result);
  });

  it("handles empty string key", () => {
    const result = getColorFromHash("", palette);
    expect(palette).toContain(result);
  });
});

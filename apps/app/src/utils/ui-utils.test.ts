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
// S17: Pin exact output format so month-array refactor to Intl.DateTimeFormat
// cannot silently change the format string. Uses noon UTC timestamps so the
// local-time date matches the UTC date in any timezone (UTC-11 to UTC+11).
// ---------------------------------------------------------------------------

describe("formatDate — S17: exact output format", () => {
  it("produces 'Jan 1, 2024' for the start of 2024 (noon UTC)", () => {
    // 2024-01-01T12:00:00.000Z → local date is Jan 1 in any UTC±11 timezone
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0);
    expect(formatDate(ts)).toBe("Jan 1, 2024");
  });

  it("output contains a comma after the day number", () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0);
    expect(formatDate(ts)).toMatch(/\d,/);
  });

  it("produces correct short month names for all 12 months", () => {
    const expected = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    expected.forEach((month, index) => {
      const ts = Date.UTC(2024, index, 15, 12, 0, 0);
      expect(formatDate(ts)).toMatch(new RegExp(`^${month} `));
    });
  });
});

describe("formatDateShort — S17: exact output format", () => {
  it("produces 'Jan 1' for the start of 2024 (noon UTC)", () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0);
    expect(formatDateShort(ts)).toBe("Jan 1");
  });

  it("does NOT include the year", () => {
    const ts = Date.UTC(2024, 0, 1, 12, 0, 0);
    expect(formatDateShort(ts)).not.toMatch(/\d{4}/);
  });

  it("produces correct short month names for all 12 months", () => {
    const expected = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    expected.forEach((month, index) => {
      const ts = Date.UTC(2024, index, 15, 12, 0, 0);
      expect(formatDateShort(ts)).toMatch(new RegExp(`^${month} `));
    });
  });
});

describe("formatMemberSince — S17: exact output format", () => {
  it("produces 'Member since January 2024' for Jan 2024 (noon UTC)", () => {
    const ts = Date.UTC(2024, 0, 15, 12, 0, 0);
    expect(formatMemberSince(ts)).toBe("Member since January 2024");
  });

  it("produces correct long month names for all 12 months", () => {
    const expected = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    expected.forEach((month, index) => {
      const ts = Date.UTC(2024, index, 15, 12, 0, 0);
      expect(formatMemberSince(ts)).toBe(`Member since ${month} 2024`);
    });
  });

  it("output always starts with 'Member since '", () => {
    const ts = Date.UTC(2024, 5, 15, 12, 0, 0);
    expect(formatMemberSince(ts)).toMatch(/^Member since /);
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

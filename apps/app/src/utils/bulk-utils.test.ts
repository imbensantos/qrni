import { describe, it, expect } from "vitest";
import {
  isValidUrl,
  sanitizeLabel,
  deduplicateLabels,
  parseCSV,
  parseJSON,
  parseFile,
  type BulkEntry,
} from "./bulk-utils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entry(overrides: Partial<BulkEntry> = {}): BulkEntry {
  return {
    index: 1,
    label: "test",
    url: "https://example.com",
    filename: "test",
    valid: true,
    error: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isValidUrl
// ---------------------------------------------------------------------------

describe("isValidUrl", () => {
  it.each([
    ["http://example.com", true],
    ["https://example.com", true],
    ["https://example.com/path?q=1", true],
    ["http://localhost:3000", true],
  ])("returns true for valid URL %s", (url, expected) => {
    expect(isValidUrl(url)).toBe(expected);
  });

  it.each([
    ["", false],
    ["ftp://x", false],
    ["example.com", false],
    ["javascript:alert(1)", false],
    ["mailto:a@b.com", false],
  ])("returns false for invalid URL %s", (url, expected) => {
    expect(isValidUrl(url)).toBe(expected);
  });

  it("returns false for non-string inputs coerced at runtime", () => {
    expect(isValidUrl(null as any)).toBe(false);

    expect(isValidUrl(undefined as any)).toBe(false);
  });

  it("accepts case-insensitive protocols (HTTP:// is valid per RFC)", () => {
    expect(isValidUrl("HTTP://EXAMPLE.COM")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sanitizeLabel
// ---------------------------------------------------------------------------

describe("sanitizeLabel", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(sanitizeLabel("My Label")).toBe("my-label");
  });

  it("converts numbers to strings", () => {
    expect(sanitizeLabel(123)).toBe("123");
  });

  it("strips special characters", () => {
    expect(sanitizeLabel("hello@world!")).toBe("helloworld");
  });

  it("collapses multiple spaces into one hyphen", () => {
    expect(sanitizeLabel("a   b")).toBe("a-b");
  });

  it("returns fallback for empty string", () => {
    expect(sanitizeLabel("")).toBe("qr-code");
  });

  it("returns fallback for whitespace-only input", () => {
    expect(sanitizeLabel("   ")).toBe("qr-code");
  });

  it("strips unicode combining marks but keeps base letters", () => {
    // \u0301 (combining acute accent) is stripped, but the base 'e' remains
    expect(sanitizeLabel("cafe\u0301")).toBe("cafe");
  });

  it("strips non-latin unicode characters entirely", () => {
    expect(sanitizeLabel("\u{1F600}")).toBe("qr-code"); // emoji → empty → fallback
  });

  it("truncates labels longer than 80 characters", () => {
    const long = "a".repeat(100);
    expect(sanitizeLabel(long).length).toBe(80);
  });

  // ── S16: Unicode / non-ASCII character preservation ─────────────────────────
  //
  // Audit finding: the regex `[^a-z0-9-]` strips ALL characters outside the
  // ASCII alphanumeric range, including accented Latin letters and CJK script.
  // This breaks labels written in Filipino (Tagalog uses Latin with some diacritics),
  // Japanese, Korean, or any other non-ASCII script. The fix should change the
  // regex to `[^\p{L}\p{N}-]` with the `u` flag so that Unicode word characters
  // are preserved.
  //
  // These tests FAIL against the current implementation because the regex
  // `[^a-z0-9-]` strips every non-ASCII byte.

  it("preserves accented Latin characters (café → café)", () => {
    // WHY THIS FAILS: "é" (\u00e9) is stripped by [^a-z0-9-], leaving "caf".
    // After the fix the regex should keep Unicode letters so the result is "café".
    expect(sanitizeLabel("café")).toBe("café");
  });

  it("preserves Japanese characters (マイリンク → マイリンク)", () => {
    // WHY THIS FAILS: every Katakana character is outside [a-z0-9-] so the
    // current code strips them all, leaving an empty string and returning the
    // fallback "qr-code".
    expect(sanitizeLabel("マイリンク")).toBe("マイリンク");
  });

  it("preserves Filipino/Tagalog diacritics (Pagbabago → pagbabago)", () => {
    // This input is pure ASCII so it already passes — included to document
    // intent and catch regressions.
    expect(sanitizeLabel("Pagbabago")).toBe("pagbabago");
  });

  it("preserves Korean characters (나의링크 → 나의링크)", () => {
    // WHY THIS FAILS: Hangul syllables are outside [a-z0-9-] and are stripped,
    // leaving an empty string that falls back to "qr-code".
    expect(sanitizeLabel("나의링크")).toBe("나의링크");
  });

  it("preserves mixed ASCII and non-ASCII (mi enlace → mi-enlace)", () => {
    // Pure ASCII — should pass before and after the fix.
    expect(sanitizeLabel("mi enlace")).toBe("mi-enlace");
  });

  it("preserves mixed script label with spaces (kumusta mundo → kumusta-mundo)", () => {
    // Pure ASCII — should pass before and after the fix.
    expect(sanitizeLabel("Kumusta Mundo")).toBe("kumusta-mundo");
  });

  it("preserves Arabic characters (رابطتي → رابطتي)", () => {
    // WHY THIS FAILS: Arabic script characters are outside [a-z0-9-] and are
    // stripped entirely, leaving the fallback "qr-code".
    expect(sanitizeLabel("رابطتي")).toBe("رابطتي");
  });
});

// ---------------------------------------------------------------------------
// deduplicateLabels
// ---------------------------------------------------------------------------

describe("deduplicateLabels", () => {
  it("returns entries unchanged when no duplicates", () => {
    const entries = [entry({ filename: "alpha" }), entry({ filename: "beta" })];
    const result = deduplicateLabels(entries);
    expect(result.map((e) => e.filename)).toEqual(["alpha", "beta"]);
  });

  it("appends -2 to the second duplicate", () => {
    const entries = [entry({ filename: "same" }), entry({ filename: "same" })];
    const result = deduplicateLabels(entries);
    expect(result.map((e) => e.filename)).toEqual(["same", "same-2"]);
  });

  it("appends -2 and -3 for three duplicates", () => {
    const entries = [
      entry({ filename: "dup" }),
      entry({ filename: "dup" }),
      entry({ filename: "dup" }),
    ];
    const result = deduplicateLabels(entries);
    expect(result.map((e) => e.filename)).toEqual(["dup", "dup-2", "dup-3"]);
  });

  it("handles mixed duplicates and unique entries", () => {
    const entries = [entry({ filename: "a" }), entry({ filename: "b" }), entry({ filename: "a" })];
    const result = deduplicateLabels(entries);
    expect(result.map((e) => e.filename)).toEqual(["a", "b", "a-2"]);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateLabels([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseCSV
// ---------------------------------------------------------------------------

describe("parseCSV", () => {
  it("parses CSV with header row (label,url)", () => {
    const csv = "label,url\nGoogle,https://google.com\nGithub,https://github.com";
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      index: 1,
      label: "Google",
      url: "https://google.com",
      valid: true,
      error: null,
    });
  });

  it("recognises alternative header names (Name,Link)", () => {
    const csv = "Name,Link\nTest,https://test.com";
    const result = parseCSV(csv);
    expect(result[0]).toMatchObject({
      label: "Test",
      url: "https://test.com",
      valid: true,
    });
  });

  it("recognises URL and Label headers (case-sensitive field access)", () => {
    const csv = "URL,Label\nhttps://a.com,Alpha";
    const result = parseCSV(csv);
    // The header "URL" matches known headers; label column should resolve
    expect(result[0].url).toBe("https://a.com");
    expect(result[0].label).toBe("Alpha");
  });

  it("treats rows without header as label,url columns", () => {
    const csv = "My Site,https://mysite.com\nOther,https://other.com";
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ label: "My Site", url: "https://mysite.com" });
  });

  it("skips empty lines", () => {
    const csv = "label,url\nA,https://a.com\n\nB,https://b.com\n\n";
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it("marks entries with invalid URLs", () => {
    const csv = "label,url\nBad,not-a-url";
    const result = parseCSV(csv);
    expect(result[0].valid).toBe(false);
    expect(result[0].error).toContain("Invalid URL");
  });

  it("marks entries with missing URL", () => {
    const csv = "label,url\nNoUrl,";
    const result = parseCSV(csv);
    expect(result[0].valid).toBe(false);
    expect(result[0].error).toBe("Missing URL");
  });

  it("marks entries with missing label", () => {
    const csv = "label,url\n,https://a.com";
    const result = parseCSV(csv);
    expect(result[0].valid).toBe(false);
    expect(result[0].error).toBe("Missing label");
  });

  it("enforces max 500 entries", () => {
    const rows = Array.from({ length: 600 }, (_, i) => `item${i},https://x.com/${i}`);
    const csv = "label,url\n" + rows.join("\n");
    const result = parseCSV(csv);
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it("deduplicates filenames", () => {
    const csv = "label,url\nSame,https://a.com\nSame,https://b.com";
    const result = parseCSV(csv);
    expect(result[0].filename).toBe("same");
    expect(result[1].filename).toBe("same-2");
  });
});

// ---------------------------------------------------------------------------
// parseJSON
// ---------------------------------------------------------------------------

describe("parseJSON", () => {
  it("parses valid array with label and url", () => {
    const json = JSON.stringify([{ label: "A", url: "https://a.com" }]);
    const result = parseJSON(json);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      index: 1,
      label: "A",
      url: "https://a.com",
      valid: true,
      error: null,
    });
  });

  it("accepts alternative keys (name, link)", () => {
    const json = JSON.stringify([{ name: "B", link: "https://b.com" }]);
    const result = parseJSON(json);
    expect(result[0]).toMatchObject({ label: "B", url: "https://b.com", valid: true });
  });

  it("returns error entry for invalid JSON", () => {
    const result = parseJSON("not json {{{");
    expect(result).toHaveLength(1);
    expect(result[0].error).toBe("Invalid JSON");
    expect(result[0].valid).toBe(false);
  });

  it("returns error entry when JSON is not an array", () => {
    const result = parseJSON(JSON.stringify({ label: "x", url: "https://x.com" }));
    expect(result).toHaveLength(1);
    expect(result[0].error).toBe("JSON must be an array");
  });

  it("handles empty array", () => {
    expect(parseJSON("[]")).toEqual([]);
  });

  it("enforces max 500 entries", () => {
    const items = Array.from({ length: 600 }, (_, i) => ({
      label: `item${i}`,
      url: `https://x.com/${i}`,
    }));
    const result = parseJSON(JSON.stringify(items));
    expect(result.length).toBeLessThanOrEqual(500);
  });

  it("marks entries with invalid URLs", () => {
    const json = JSON.stringify([{ label: "bad", url: "ftp://nope" }]);
    const result = parseJSON(json);
    expect(result[0].valid).toBe(false);
    expect(result[0].error).toContain("Invalid URL");
  });

  it("marks entries with missing label", () => {
    const json = JSON.stringify([{ url: "https://a.com" }]);
    const result = parseJSON(json);
    expect(result[0].valid).toBe(false);
    expect(result[0].error).toBe("Missing label");
  });

  it("deduplicates filenames", () => {
    const json = JSON.stringify([
      { label: "same", url: "https://a.com" },
      { label: "same", url: "https://b.com" },
    ]);
    const result = parseJSON(json);
    expect(result[0].filename).toBe("same");
    expect(result[1].filename).toBe("same-2");
  });
});

// ---------------------------------------------------------------------------
// parseFile
// ---------------------------------------------------------------------------

describe("parseFile", () => {
  it("routes .json files to parseJSON", () => {
    const json = JSON.stringify([{ label: "test", url: "https://t.com" }]);
    const result = parseFile(json, "data.json");
    expect(result[0]).toMatchObject({ label: "test", url: "https://t.com" });
  });

  it("routes .JSON files (case insensitive) to parseJSON", () => {
    const json = JSON.stringify([{ label: "test", url: "https://t.com" }]);
    const result = parseFile(json, "DATA.JSON");
    expect(result[0]).toMatchObject({ label: "test", url: "https://t.com" });
  });

  it("routes .csv files to parseCSV", () => {
    const csv = "label,url\nA,https://a.com";
    const result = parseFile(csv, "data.csv");
    expect(result[0]).toMatchObject({ label: "A", url: "https://a.com" });
  });

  it("defaults to CSV for unknown extensions", () => {
    const csv = "label,url\nA,https://a.com";
    const result = parseFile(csv, "data.txt");
    expect(result[0]).toMatchObject({ label: "A", url: "https://a.com" });
  });
});

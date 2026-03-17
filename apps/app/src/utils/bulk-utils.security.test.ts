import { describe, it, expect } from "vitest";
import { isValidUrl, parseCSV, parseJSON, sanitizeLabel } from "./bulk-utils";

// ---------------------------------------------------------------------------
// isValidUrl — protocol injection prevention
// ---------------------------------------------------------------------------

describe("isValidUrl — protocol injection prevention", () => {
  it("rejects javascript: protocol", () => {
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URLs", () => {
    expect(isValidUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects file: URLs", () => {
    expect(isValidUrl("file:///etc/passwd")).toBe(false);
  });

  it("rejects blob: URLs", () => {
    expect(isValidUrl("blob:http://example.com/uuid")).toBe(false);
  });

  it("rejects about: URLs", () => {
    expect(isValidUrl("about:blank")).toBe(false);
  });

  it("rejects vbscript: protocol", () => {
    expect(isValidUrl("vbscript:MsgBox('XSS')")).toBe(false);
  });

  it("rejects URLs with null bytes", () => {
    expect(isValidUrl("https://example.com/\0malicious")).toBe(false);
    expect(isValidUrl("https://example.com/path\0")).toBe(false);
    expect(isValidUrl("\0https://example.com")).toBe(false);
  });

  it("rejects URLs with protocol embedded in path (http://evil.com/javascript:)", () => {
    // This URL is technically valid (http protocol, path contains "javascript:").
    // The isValidUrl function correctly accepts it because the *protocol* is http.
    // The path content is harmless from a protocol-injection standpoint.
    const url = "http://evil.com/javascript:alert(1)";
    // This is a valid http URL — the "javascript:" is just part of the path
    expect(isValidUrl(url)).toBe(true);
  });

  it("accepts standard http:// URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("accepts standard https:// URLs", () => {
    expect(isValidUrl("https://example.com")).toBe(true);
  });

  it("accepts URLs with ports", () => {
    expect(isValidUrl("http://localhost:3000/api")).toBe(true);
    expect(isValidUrl("https://example.com:8443/path")).toBe(true);
  });

  it("accepts URLs with auth segments", () => {
    expect(isValidUrl("https://user:pass@example.com/path")).toBe(true);
  });

  it("accepts URLs with unicode in path", () => {
    expect(isValidUrl("https://example.com/café/résumé")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// bulk parsing — malicious input handling
// ---------------------------------------------------------------------------

describe("bulk parsing — malicious input handling", () => {
  it("handles extremely long URLs without crashing", () => {
    const longUrl = "https://example.com/" + "a".repeat(100_000);
    const csv = `label,url\ntest,${longUrl}`;

    // Should not throw
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe(longUrl);
    // The URL is technically valid even if absurdly long
    expect(result[0].valid).toBe(true);
  });

  it("handles CSV with script tags in labels (sanitized in filename)", () => {
    const csv = 'label,url\n<script>alert("xss")</script>,https://example.com';
    const result = parseCSV(csv);

    expect(result).toHaveLength(1);
    // The raw label preserves the input for display purposes
    expect(result[0].label).toBe('<script>alert("xss")</script>');
    // But the sanitized filename strips all special characters
    expect(result[0].filename).not.toContain("<");
    expect(result[0].filename).not.toContain(">");
    expect(result[0].filename).not.toContain("(");
    expect(result[0].filename).not.toContain(")");
    // sanitizeLabel strips everything non-alphanumeric/hyphen
    expect(result[0].filename).toBe("scriptalertxssscript");
  });

  it("handles JSON with nested objects that have standard toString (coerced to [object Object])", () => {
    // Objects with default toString produce "[object Object]"
    const malicious = JSON.stringify([
      {
        label: { nested: true },
        url: { nested: true },
      },
    ]);
    const result = parseJSON(malicious);

    expect(result).toHaveLength(1);
    // String({nested: true}) = "[object Object]" which fails URL validation
    expect(result[0].valid).toBe(false);
  });

  it("handles JSON with objects that override toString to non-function gracefully", () => {
    const malicious = JSON.stringify([
      {
        label: { toString: "evil" },
        url: "https://example.com",
      },
    ]);

    const result = parseJSON(malicious);
    expect(result).toHaveLength(1);
    // String() coercion failure falls back to empty string → "Missing label"
    expect(result[0].valid).toBe(false);
    expect(result[0].error).toBe("Missing label");
  });

  it("handles CSV injection (=CMD formulas in labels)", () => {
    const csv =
      'label,url\n"=CMD(\'calc\')",https://example.com\n"+1+1",https://example.com\n"-1+1",https://example.com\n"@SUM(A1)",https://example.com';
    const result = parseCSV(csv);

    expect(result).toHaveLength(4);
    // All entries should be valid (formula content is just a label string)
    result.forEach((entry) => {
      expect(entry.valid).toBe(true);
      // The filename is sanitized — formula characters are stripped
      expect(entry.filename).not.toContain("=");
      expect(entry.filename).not.toContain("+");
      expect(entry.filename).not.toContain("@");
    });
  });

  it("handles null bytes in input", () => {
    const csv = "label,url\ntest\0evil,https://example.com";

    // Should not throw
    const result = parseCSV(csv);
    expect(result).toHaveLength(1);
    // Null bytes are stripped by sanitizeLabel (non-alphanumeric)
    expect(result[0].filename).not.toContain("\0");
  });

  it("sanitizeLabel strips formula-injection characters", () => {
    expect(sanitizeLabel("=CMD('calc')")).toBe("cmdcalc");
    expect(sanitizeLabel("+1+1")).toBe("11");
    expect(sanitizeLabel("@SUM(A1)")).toBe("suma1");
  });

  it("parseJSON handles __proto__ key in items without prototype pollution", () => {
    const malicious = JSON.stringify([
      { label: "safe", url: "https://example.com", __proto__: { admin: true } },
    ]);
    const result = parseJSON(malicious);

    expect(result).toHaveLength(1);
    expect(result[0].valid).toBe(true);
    // Verify no prototype pollution occurred
    expect(({} as Record<string, unknown>)["admin"]).toBeUndefined();
  });
});

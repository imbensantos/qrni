import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAppOrigin, getAppHost, buildShortLinkUrl } from "./url-utils";

beforeEach(() => {
  // Mock window.location.origin and host
  vi.stubGlobal("location", { origin: "https://qrni.co", host: "qrni.co" });
});

describe("getAppOrigin", () => {
  it("returns window.location.origin", () => {
    expect(getAppOrigin()).toBe(window.location.origin);
  });
});

describe("getAppHost", () => {
  it("returns window.location.host", () => {
    expect(getAppHost()).toBe(window.location.host);
  });
});

describe("buildShortLinkUrl", () => {
  it("returns origin/slug when no namespace", () => {
    expect(buildShortLinkUrl("abc")).toBe("https://qrni.co/abc");
  });

  it("returns origin/namespace/slug when namespace is provided", () => {
    expect(buildShortLinkUrl("abc", "team")).toBe("https://qrni.co/team/abc");
  });

  it("does not include namespace segment when namespace is empty string", () => {
    expect(buildShortLinkUrl("abc", "")).toBe("https://qrni.co/abc");
  });

  it("handles empty slug", () => {
    expect(buildShortLinkUrl("")).toBe("https://qrni.co/");
  });

  it("handles empty slug with namespace", () => {
    expect(buildShortLinkUrl("", "ns")).toBe("https://qrni.co/ns/");
  });
});

// ---------------------------------------------------------------------------
// buildShortLinkUrl — security: no injection
// ---------------------------------------------------------------------------

describe("buildShortLinkUrl — no injection", () => {
  it("does not URL-encode special characters in slug (current behavior — string concatenation)", () => {
    // NOTE: buildShortLinkUrl uses raw string concatenation without encoding.
    // Characters like spaces, angle brackets, and quotes are passed through verbatim.
    // This is a potential XSS/injection risk if the output is used in an unsafe context
    // (e.g., innerHTML). Callers must sanitize or encode as needed.
    const result = buildShortLinkUrl("my slug<script>");
    expect(result).toBe("https://qrni.co/my slug<script>");
  });

  it("does not URL-encode special characters in namespace (current behavior)", () => {
    const result = buildShortLinkUrl("abc", "ns<img onerror=alert(1)>");
    expect(result).toBe("https://qrni.co/ns<img onerror=alert(1)>/abc");
  });

  it("does not allow path traversal in slug (current behavior — passes through)", () => {
    // NOTE: Path traversal sequences are not stripped or rejected.
    // If this URL is used server-side for file operations, this is a risk.
    // For client-side display/linking, the browser handles normalization.
    const result = buildShortLinkUrl("../../etc/passwd");
    expect(result).toBe("https://qrni.co/../../etc/passwd");
  });

  it("does not allow path traversal in namespace", () => {
    const result = buildShortLinkUrl("slug", "../admin");
    expect(result).toBe("https://qrni.co/../admin/slug");
  });

  it("handles slug with query string injection", () => {
    const result = buildShortLinkUrl("slug?admin=true&redirect=http://evil.com");
    expect(result).toBe("https://qrni.co/slug?admin=true&redirect=http://evil.com");
  });

  it("handles slug with fragment injection", () => {
    const result = buildShortLinkUrl("slug#onclick=alert(1)");
    expect(result).toBe("https://qrni.co/slug#onclick=alert(1)");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildShortLinkUrl } from "./url-utils";

beforeEach(() => {
  // Mock window.location.origin
  vi.stubGlobal("location", { origin: "https://qrni.co" });
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

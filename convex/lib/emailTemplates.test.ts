import { describe, it, expect } from "vitest";
import { buildInviteEmailHtml } from "./emailTemplates";

describe("buildInviteEmailHtml", () => {
  const baseArgs = {
    inviterName: "Ben Santos",
    namespaceName: "my-project",
    role: "editor" as const,
    acceptUrl: "https://app.qrni.to/invite/abc123",
    appUrl: "https://app.qrni.to",
  };

  it("returns an HTML string containing the inviter name", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("Ben Santos");
  });

  it("includes the namespace name", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("my-project");
  });

  it("includes the role", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("Editor");
  });

  it("includes the accept URL in the CTA link", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain('href="https://app.qrni.to/invite/abc123"');
  });

  it("includes the 7-day expiry notice", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("7 days");
  });

  it("includes the powered by Imbento footer", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("Imbento");
  });

  it("includes the copyright footer", () => {
    const html = buildInviteEmailHtml(baseArgs);
    expect(html).toContain("QRni");
    expect(html).toContain("All rights reserved");
  });

  it("escapes HTML entities in user-provided strings", () => {
    const html = buildInviteEmailHtml({
      ...baseArgs,
      inviterName: '<script>alert("xss")</script>',
      namespaceName: "proj&<>",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("proj&amp;&lt;&gt;");
  });

  it("escapes quotes in acceptUrl to prevent href attribute breakout", () => {
    const html = buildInviteEmailHtml({
      ...baseArgs,
      acceptUrl: 'https://evil.com" onclick="alert(1)',
    });
    expect(html).not.toContain('href="https://evil.com" onclick');
    expect(html).toContain("&quot;");
  });
});

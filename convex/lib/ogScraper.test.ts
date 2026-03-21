import { describe, it, expect } from "vitest";
import { parseOgTags, buildBotHtml } from "./ogScraper";

describe("parseOgTags", () => {
  it("extracts standard OG tags from HTML", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="My Page Title" />
        <meta property="og:description" content="A description" />
        <meta property="og:image" content="https://example.com/img.png" />
        <meta property="og:site_name" content="Example" />
      </head><body></body></html>
    `;
    const result = parseOgTags(html);
    expect(result).toEqual({
      ogTitle: "My Page Title",
      ogDescription: "A description",
      ogImage: "https://example.com/img.png",
      ogSiteName: "Example",
    });
  });

  it("returns empty strings for missing OG tags", () => {
    const html = "<html><head></head><body></body></html>";
    const result = parseOgTags(html);
    expect(result).toEqual({
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogSiteName: "",
    });
  });

  it("handles single-quoted attributes", () => {
    const html = `<meta property='og:title' content='Single Quoted' />`;
    const result = parseOgTags(html);
    expect(result.ogTitle).toBe("Single Quoted");
  });

  it("handles HTML entities in content", () => {
    const html = `<meta property="og:title" content="Has &amp; entities &lt;b&gt;" />`;
    const result = parseOgTags(html);
    expect(result.ogTitle).toBe("Has & entities <b>");
  });

  it("handles name= attribute instead of property=", () => {
    const html = `<meta name="og:title" content="Name Attr" />`;
    const result = parseOgTags(html);
    expect(result.ogTitle).toBe("Name Attr");
  });
});

describe("buildBotHtml", () => {
  it("generates HTML with OG tags and meta refresh", () => {
    const html = buildBotHtml({
      destinationUrl: "https://example.com/page",
      ogTitle: "Page Title",
      ogDescription: "Page description",
      ogImage: "https://example.com/img.png",
      ogSiteName: "Example",
    });
    expect(html).toContain('<meta property="og:title" content="Page Title"');
    expect(html).toContain('<meta property="og:description" content="Page description"');
    expect(html).toContain('<meta property="og:image" content="https://example.com/img.png"');
    expect(html).toContain('<meta property="og:site_name" content="Example"');
    expect(html).toContain('<meta http-equiv="refresh" content="0;url=https://example.com/page"');
  });

  it("falls back to URL as title when ogTitle is empty", () => {
    const html = buildBotHtml({
      destinationUrl: "https://example.com/page",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      ogSiteName: "",
    });
    expect(html).toContain('<meta property="og:title" content="https://example.com/page"');
    expect(html).toContain('<meta property="og:site_name" content="example.com"');
    expect(html).not.toContain("og:description");
    expect(html).not.toContain("og:image");
  });

  it("escapes HTML entities in content attributes", () => {
    const html = buildBotHtml({
      destinationUrl: "https://example.com",
      ogTitle: 'Title with "quotes" & <tags>',
      ogDescription: "",
      ogImage: "",
      ogSiteName: "",
    });
    expect(html).toContain("Title with &quot;quotes&quot; &amp; &lt;tags&gt;");
  });
});

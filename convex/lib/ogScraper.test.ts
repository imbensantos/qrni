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

// ---------------------------------------------------------------------------
// S4. Missing Twitter Card meta tags in buildBotHtml
//
// WHY THIS FAILS against current code:
//   buildBotHtml only emits og:* tags and does not include any twitter:* tags.
//   Twitter/X uses its own card tags (twitter:card, twitter:title,
//   twitter:description, twitter:image) for link previews. Without them, links
//   shared on Twitter/X show no rich preview even when OG data is present,
//   because Twitter stopped reliably falling back to og:* tags.
//
// After the fix, buildBotHtml should emit at minimum:
//   <meta name="twitter:card" content="summary_large_image" />
//   <meta name="twitter:title" content="..." />
// and conditionally:
//   <meta name="twitter:description" content="..." />  (when ogDescription present)
//   <meta name="twitter:image" content="..." />        (when ogImage present)
// ---------------------------------------------------------------------------
describe("buildBotHtml — S4: Twitter Card meta tags", () => {
  const FULL_OPTS = {
    destinationUrl: "https://example.com/page",
    ogTitle: "Page Title",
    ogDescription: "Page description",
    ogImage: "https://example.com/img.png",
    ogSiteName: "Example",
  };

  it("includes twitter:card meta tag", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml(FULL_OPTS);
    expect(html).toContain('name="twitter:card"');
  });

  it("sets twitter:card to summary_large_image when an image is present", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml(FULL_OPTS);
    expect(html).toContain('content="summary_large_image"');
  });

  it("sets twitter:card to summary when no image is present", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml({ ...FULL_OPTS, ogImage: "" });
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain('content="summary"');
  });

  it("includes twitter:title meta tag matching the OG title", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml(FULL_OPTS);
    expect(html).toContain('name="twitter:title"');
    expect(html).toContain('content="Page Title"');
  });

  it("includes twitter:description when ogDescription is present", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml(FULL_OPTS);
    expect(html).toContain('name="twitter:description"');
    expect(html).toContain('content="Page description"');
  });

  it("omits twitter:description when ogDescription is empty", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags (so this check
    // would vacuously pass if the tag is simply absent — but the test for
    // twitter:card will still fail and catch the missing implementation)
    const html = buildBotHtml({ ...FULL_OPTS, ogDescription: "" });
    // When no description is provided we should not emit an empty tag
    const hasEmptyTwitterDesc =
      html.includes('name="twitter:description"') && html.includes('content=""');
    expect(hasEmptyTwitterDesc).toBe(false);
  });

  it("includes twitter:image when ogImage is present", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml(FULL_OPTS);
    expect(html).toContain('name="twitter:image"');
    expect(html).toContain('content="https://example.com/img.png"');
  });

  it("omits twitter:image when ogImage is empty", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags (vacuously passes
    // for the absence check, but twitter:card still causes a failure)
    const html = buildBotHtml({ ...FULL_OPTS, ogImage: "" });
    const hasEmptyTwitterImage =
      html.includes('name="twitter:image"') && html.includes('content=""');
    expect(hasEmptyTwitterImage).toBe(false);
  });

  it("escapes HTML entities in twitter:title", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml({
      ...FULL_OPTS,
      ogTitle: 'Title with "quotes" & <angle>',
    });
    expect(html).toContain('name="twitter:title"');
    expect(html).toContain("&quot;quotes&quot;");
    expect(html).toContain("&amp;");
    expect(html).toContain("&lt;angle&gt;");
  });

  it("falls back to destination URL as twitter:title when ogTitle is empty", () => {
    // FAILS: buildBotHtml does not emit any twitter:* tags
    const html = buildBotHtml({ ...FULL_OPTS, ogTitle: "" });
    expect(html).toContain('name="twitter:title"');
    expect(html).toContain('content="https://example.com/page"');
  });
});

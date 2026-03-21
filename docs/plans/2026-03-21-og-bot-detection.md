# OG Bot Detection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:executing-plans to implement this plan task-by-task.

**Goal:** Serve rich Open Graph link previews to messaging app bots while keeping instant 302 redirects for real users.

**Architecture:** Bot detection via User-Agent in the existing HTTP redirect handler. OG metadata is lazily fetched from the destination URL on first bot hit, cached on the link document, and served as a minimal HTML page. A refresh action lets users manually re-scrape.

**Tech Stack:** Convex (schema, actions, HTTP routes), Vitest (unit tests), React (refresh button UI)

---

### Task 1: Add OG fields to links schema

**Files:**

- Modify: `convex/schema.ts:66-80`

**Step 1: Write the schema changes**

Add optional OG fields before the closing `})` of the links table definition at line 75:

```typescript
// convex/schema.ts — inside the links defineTable, after clickCount
ogTitle: v.optional(v.string()),
ogDescription: v.optional(v.string()),
ogImage: v.optional(v.string()),
ogSiteName: v.optional(v.string()),
ogFetchedAt: v.optional(v.number()),
```

**Step 2: Verify Convex accepts the schema**

Run: `npx convex dev --once` (or check that the dev server picks up the change without errors)
Expected: Schema pushes successfully, no errors.

**Step 3: Commit**

```bash
git add convex/schema.ts
git commit -m "feat: add OG metadata fields to links schema"
```

---

### Task 2: Create OG scraper utility

**Files:**

- Create: `convex/lib/ogScraper.ts`
- Create: `convex/lib/ogScraper.test.ts`

**Step 1: Write the failing tests**

```typescript
// convex/lib/ogScraper.test.ts
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

  it("handles unquoted and messy HTML", () => {
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
```

**Step 2: Run tests to verify they fail**

Run: `npm run test:convex -- --testPathPattern ogScraper`
Expected: FAIL — module not found

**Step 3: Write the OG scraper implementation**

```typescript
// convex/lib/ogScraper.ts

export interface OgData {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogSiteName: string;
}

/**
 * Parse Open Graph meta tags from raw HTML using regex.
 * Handles property= and name= attributes, single/double quotes.
 */
export function parseOgTags(html: string): OgData {
  const ogMap: Record<string, string> = {};

  // Match <meta property="og:xxx" content="yyy" /> or <meta name="og:xxx" content="yyy" />
  // Handles both single and double quotes, and either attribute order.
  const metaRegex =
    /<meta\s+(?:[^>]*?\s)?(?:property|name)\s*=\s*["']?(og:[a-z_]+)["']?\s+[^>]*?content\s*=\s*["']([^"']*?)["'][^>]*?\/?>/gi;
  const metaRegexReversed =
    /<meta\s+(?:[^>]*?\s)?content\s*=\s*["']([^"']*?)["']\s+[^>]*?(?:property|name)\s*=\s*["']?(og:[a-z_]+)["']?[^>]*?\/?>/gi;

  let match;
  while ((match = metaRegex.exec(html)) !== null) {
    ogMap[match[1].toLowerCase()] = decodeHtmlEntities(match[2]);
  }
  while ((match = metaRegexReversed.exec(html)) !== null) {
    ogMap[match[2].toLowerCase()] = decodeHtmlEntities(match[1]);
  }

  return {
    ogTitle: ogMap["og:title"] ?? "",
    ogDescription: ogMap["og:description"] ?? "",
    ogImage: ogMap["og:image"] ?? "",
    ogSiteName: ogMap["og:site_name"] ?? "",
  };
}

/** Decode common HTML entities. */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Escape a string for use inside an HTML attribute value. */
function escapeHtmlAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build a minimal HTML page with OG meta tags and a meta-refresh redirect.
 * Bots read the OG tags; humans get instantly redirected.
 */
export function buildBotHtml(opts: OgData & { destinationUrl: string }): string {
  const title = opts.ogTitle || opts.destinationUrl;
  const siteName = opts.ogSiteName || extractDomain(opts.destinationUrl);

  const tags: string[] = [
    `<meta property="og:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(opts.destinationUrl)}" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(siteName)}" />`,
  ];

  if (opts.ogDescription) {
    tags.push(`<meta property="og:description" content="${escapeHtmlAttr(opts.ogDescription)}" />`);
  }
  if (opts.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtmlAttr(opts.ogImage)}" />`);
  }

  return `<!DOCTYPE html>
<html>
<head>
${tags.join("\n")}
<meta http-equiv="refresh" content="0;url=${escapeHtmlAttr(opts.destinationUrl)}" />
</head>
<body></body>
</html>`;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm run test:convex -- --testPathPattern ogScraper`
Expected: All PASS

**Step 5: Commit**

```bash
git add convex/lib/ogScraper.ts convex/lib/ogScraper.test.ts
git commit -m "feat: add OG tag parser and bot HTML builder with tests"
```

---

### Task 3: Create Convex action to fetch and cache OG data

**Files:**

- Create: `convex/ogScraper.ts` (Convex action file — NOT in lib/)
- Modify: `convex/redirects.ts` (add internal mutation to update OG fields)

**Step 1: Add the updateOgData internal mutation to redirects.ts**

```typescript
// convex/redirects.ts — add at the end of file

export const updateOgData = internalMutation({
  args: {
    linkId: v.id("links"),
    ogTitle: v.string(),
    ogDescription: v.string(),
    ogImage: v.string(),
    ogSiteName: v.string(),
    ogFetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.linkId, {
      ogTitle: args.ogTitle,
      ogDescription: args.ogDescription,
      ogImage: args.ogImage,
      ogSiteName: args.ogSiteName,
      ogFetchedAt: args.ogFetchedAt,
    });
  },
});
```

**Step 2: Create the Convex action**

```typescript
// convex/ogScraper.ts
import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { parseOgTags } from "./lib/ogScraper";
import { getAuthUserId } from "@convex-dev/auth/server";

const OG_FETCH_TIMEOUT_MS = 5000;

/** Internal action: fetch OG tags from a URL and cache them on the link doc. */
export const fetchAndCacheOgData = internalAction({
  args: { linkId: v.id("links"), destinationUrl: v.string() },
  handler: async (ctx, args) => {
    let ogTitle = "";
    let ogDescription = "";
    let ogImage = "";
    let ogSiteName = "";

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), OG_FETCH_TIMEOUT_MS);

      const response = await fetch(args.destinationUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; QRniBot/1.0; +https://qrni.to)",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      if (response.ok) {
        const html = await response.text();
        const og = parseOgTags(html);
        ogTitle = og.ogTitle;
        ogDescription = og.ogDescription;
        ogImage = og.ogImage;
        ogSiteName = og.ogSiteName;
      }
    } catch {
      // Fetch failed — store empty OG data so we don't retry on every bot hit.
      // User can manually refresh later.
    }

    await ctx.runMutation(internal.redirects.updateOgData, {
      linkId: args.linkId,
      ogTitle,
      ogDescription,
      ogImage,
      ogSiteName,
      ogFetchedAt: Date.now(),
    });

    return { ogTitle, ogDescription, ogImage, ogSiteName };
  },
});

/** Public action: authenticated users can refresh OG data for their links. */
export const refreshOgData = action({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required");

    const link = await ctx.runQuery(internal.redirects.getLinkById, {
      linkId: args.linkId,
    });
    if (!link || link.owner !== userId) {
      throw new Error("Link not found or not owned by you");
    }

    return await ctx.runAction(internal.ogScraper.fetchAndCacheOgData, {
      linkId: args.linkId,
      destinationUrl: link.destinationUrl,
    });
  },
});
```

**Step 3: Add getLinkById query to redirects.ts**

```typescript
// convex/redirects.ts — add with the other queries

export const getLinkById = internalQuery({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.linkId);
  },
});
```

**Step 4: Verify Convex picks up the new functions**

Run: `npx convex dev --once`
Expected: No errors, new functions registered.

**Step 5: Commit**

```bash
git add convex/ogScraper.ts convex/redirects.ts
git commit -m "feat: add OG fetch/cache action and refresh endpoint"
```

---

### Task 4: Add bot detection to HTTP redirect handler

**Files:**

- Modify: `convex/http.ts:95-157`

**Step 1: Write the bot detection and OG serving logic**

Add a bot detection list and modify the redirect handler. The key changes to `convex/http.ts`:

1. Import `buildBotHtml` from `./lib/ogScraper`
2. Add bot User-Agent patterns
3. After resolving the link and before the 302 redirect, check if the request is from a bot
4. If bot: serve HTML with OG tags (lazy-fetch if not cached), otherwise 302

```typescript
// At top of convex/http.ts — add imports
import { buildBotHtml } from "./lib/ogScraper";

// Add this constant before the route definitions
const BOT_USER_AGENTS = [
  "Slackbot",
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "Discordbot",
  "WhatsApp",
  "Applebot",
  "TelegramBot",
  "Googlebot",
  "bingbot",
  "Pinterestbot",
  "Embedly",
];

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some((bot) => userAgent.toLowerCase().includes(bot.toLowerCase()));
}
```

Then replace the redirect handler section (lines 142-156) — after the protocol validation and before `return new Response(null, { status: 302, ... })`:

```typescript
// Bot detection: serve OG meta tags for link preview crawlers
const userAgent = request.headers.get("user-agent");
if (isBot(userAgent)) {
  let ogTitle = link.ogTitle ?? "";
  let ogDescription = link.ogDescription ?? "";
  let ogImage = link.ogImage ?? "";
  let ogSiteName = link.ogSiteName ?? "";

  // Lazy fetch: if OG data hasn't been fetched yet, fetch it now
  if (link.ogFetchedAt === undefined) {
    try {
      const result = await ctx.runAction(internal.ogScraper.fetchAndCacheOgData, {
        linkId: link._id,
        destinationUrl: link.destinationUrl,
      });
      ogTitle = result.ogTitle;
      ogDescription = result.ogDescription;
      ogImage = result.ogImage;
      ogSiteName = result.ogSiteName;
    } catch {
      // If fetch fails, serve fallback HTML with URL as title
    }
  }

  await ctx.runMutation(internal.redirects.incrementClickCount, {
    linkId: link._id,
  });

  const html = buildBotHtml({
    destinationUrl: link.destinationUrl,
    ogTitle,
    ogDescription,
    ogImage,
    ogSiteName,
  });

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Regular user: 302 redirect (existing behavior)
await ctx.runMutation(internal.redirects.incrementClickCount, {
  linkId: link._id,
});

return new Response(null, {
  status: 302,
  headers: { Location: link.destinationUrl },
});
```

**Step 2: Verify Convex picks it up**

Run: `npx convex dev --once`
Expected: No errors.

**Step 3: Commit**

```bash
git add convex/http.ts
git commit -m "feat: serve OG meta tags to link preview bots"
```

---

### Task 5: Add refresh preview button to link management UI

**Files:**

- Modify: `apps/app/src/components/profile/MyLinksSection.tsx:101-126`
- Modify: `apps/app/src/components/profile/AllNamespaceLinksView.tsx:129-152`

**Step 1: Create a reusable RefreshPreviewButton component**

```typescript
// Add to an appropriate location or inline — a small component that calls the refreshOgData action

import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { IconRefresh } from "@tabler/icons-react";
import type { Id } from "../../convex/_generated/dataModel";

function RefreshPreviewButton({ linkId }: { linkId: Id<"links"> }) {
  const refreshOg = useAction(api.ogScraper.refreshOgData);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshOg({ linkId });
    } catch {
      // silently fail — button shows state via loading indicator
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="pp-icon-btn"
      onClick={handleRefresh}
      disabled={loading}
      title="Refresh link preview"
    >
      <IconRefresh size={14} className={loading ? "spin" : ""} />
    </button>
  );
}
```

**Step 2: Add the button to MyLinksSection**

In `MyLinksSection.tsx`, add the refresh button in the `pp-link-meta` div, before the edit button (around line 106):

```tsx
<RefreshPreviewButton linkId={link._id} />
```

**Step 3: Add the button to AllNamespaceLinksView**

In `AllNamespaceLinksView.tsx`, add the refresh button in the `pp-link-meta` div, before the edit button (around line 131):

```tsx
<RefreshPreviewButton linkId={link._id} />
```

**Step 4: Add spin animation CSS**

Add to the relevant CSS file:

```css
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.spin {
  animation: spin 1s linear infinite;
}
```

**Step 5: Verify the UI renders correctly**

Run: `npm run dev:app`
Navigate to the profile page and confirm the refresh button appears next to edit/delete.

**Step 6: Commit**

```bash
git add apps/app/src/components/profile/MyLinksSection.tsx apps/app/src/components/profile/AllNamespaceLinksView.tsx
git commit -m "feat: add refresh preview button to link management UI"
```

---

### Task 6: End-to-end testing

**Files:**

- May create: e2e test file if e2e patterns exist

**Step 1: Manual verification**

1. Create a short link to a page with OG tags (e.g., a YouTube video)
2. Use curl to simulate a bot hitting the short link:
   ```bash
   curl -A "Slackbot-LinkExpanding 1.0" -v https://<your-convex-url>/<short-code>
   ```
3. Verify the response is HTML with OG meta tags and a meta refresh
4. Use curl without a bot user-agent:
   ```bash
   curl -v https://<your-convex-url>/<short-code>
   ```
5. Verify you get a 302 redirect

**Step 2: Verify lazy fetch works for old links**

1. Find an existing link in the database (created before OG fields were added)
2. Curl it with a bot user-agent
3. Verify OG data is fetched and the response contains the destination's OG tags
4. Curl it again — verify the cached data is served (should be faster)

**Step 3: Verify refresh action**

1. In the app UI, click the refresh button on a link
2. Verify no errors and the action completes

**Step 4: Commit any test files**

```bash
git commit -m "test: verify OG bot detection end-to-end"
```

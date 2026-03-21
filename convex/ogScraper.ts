import { internalAction, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import type { OgData } from "./lib/ogScraper";
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
  handler: async (ctx, args): Promise<OgData> => {
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

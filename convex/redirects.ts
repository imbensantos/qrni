import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getLinkByCode = internalQuery({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) => q.eq("shortCode", args.shortCode))
      .first();
  },
});

export const getNamespaceBySlug = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("namespaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const getNamespacedLink = internalQuery({
  args: { namespaceId: v.id("namespaces"), slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", args.namespaceId).eq("namespaceSlug", args.slug),
      )
      .first();
  },
});

export const incrementClickCount = internalMutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (link) {
      // Safe: Convex mutations are fully serialized (OCC-based transactions),
      // so the read-then-write here is atomic — no concurrent mutation can
      // interleave between the get() and patch() calls.
      await ctx.db.patch(args.linkId, { clickCount: link.clickCount + 1 });
      if (link.namespace) {
        await ctx.db.patch(link.namespace, { lastActiveAt: Date.now() });
      }
    }
  },
});

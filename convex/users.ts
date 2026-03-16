import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.avatarUrl !== undefined) updates.avatarUrl = args.avatarUrl;

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);
    }
  },
});

export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    const links = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();

    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);

    const ownedNamespaces = await ctx.db
      .query("namespaces")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();

    const memberships = await ctx.db
      .query("namespace_members")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .collect();

    const totalNamespaces = ownedNamespaces.length + memberships.length;

    return { totalLinks, totalClicks, totalNamespaces };
  },
});

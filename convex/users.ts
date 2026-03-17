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

    if (args.name !== undefined) {
      if (args.name.length > 100) {
        throw new Error("Name must be 100 characters or fewer");
      }
      updates.name = args.name;
    }

    if (args.avatarUrl !== undefined) {
      if (!args.avatarUrl.startsWith("https://")) {
        throw new Error("Avatar URL must start with https://");
      }
      updates.avatarUrl = args.avatarUrl;
    }

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
      .take(500);

    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0);

    const ownedNamespaces = await ctx.db
      .query("namespaces")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .take(100);

    const memberships = await ctx.db
      .query("namespace_members")
      .withIndex("by_user", (q) => q.eq("user", userId))
      .take(100);

    const totalNamespaces = ownedNamespaces.length + memberships.length;

    return { totalLinks, totalClicks, totalNamespaces };
  },
});

import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { logAudit } from "./lib/auditLog";
import { MAX_USER_NAME_LENGTH, ERR } from "./lib/constants";

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
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const updates: Record<string, unknown> = {};

    if (args.name !== undefined) {
      if (args.name.length > MAX_USER_NAME_LENGTH) {
        throw new Error(ERR.NAME_TOO_LONG);
      }
      updates.name = args.name;
    }

    if (args.avatarUrl !== undefined) {
      if (!args.avatarUrl.startsWith("https://")) {
        throw new Error(ERR.AVATAR_MUST_BE_HTTPS);
      }
      updates.avatarUrl = args.avatarUrl;
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(userId, updates);

      await logAudit(ctx, {
        userId,
        action: "user.update",
        resourceType: "user",
        resourceId: String(userId),
        metadata: { updates },
      });
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

    // Use .collect() to count all links, not just the first 500.
    // This ensures accurate stats for power users with many links.
    const links = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .collect();

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

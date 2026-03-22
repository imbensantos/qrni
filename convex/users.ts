import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { logAudit } from "./lib/auditLog";
import { sanitizeText } from "./lib/validation";
import { MAX_USER_NAME_LENGTH, ERR } from "./lib/constants";

/** Trusted domains for user avatar URLs (OAuth providers and known CDNs). */
const ALLOWED_AVATAR_DOMAINS = [
  "img.clerk.com",
  "images.clerk.dev",
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "secure.gravatar.com",
  "www.gravatar.com",
];

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
      const sanitizedName = sanitizeText(args.name);
      if (sanitizedName.length > MAX_USER_NAME_LENGTH) {
        throw new Error(ERR.NAME_TOO_LONG);
      }
      updates.name = sanitizedName;
    }

    if (args.avatarUrl !== undefined) {
      if (!args.avatarUrl.startsWith("https://")) {
        throw new Error(ERR.AVATAR_MUST_BE_HTTPS);
      }
      let hostname: string;
      try {
        hostname = new URL(args.avatarUrl).hostname;
      } catch {
        throw new Error(ERR.AVATAR_MUST_BE_HTTPS);
      }
      const isTrusted = ALLOWED_AVATAR_DOMAINS.some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
      );
      if (!isTrusted) {
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

    // Paginate through links to count without loading all into memory
    let totalLinks = 0;
    let totalClicks = 0;
    let paginationResult = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", userId))
      .paginate({ numItems: 200, cursor: null });

    totalLinks += paginationResult.page.length;
    totalClicks += paginationResult.page.reduce((sum, link) => sum + link.clickCount, 0);

    while (!paginationResult.isDone) {
      paginationResult = await ctx.db
        .query("links")
        .withIndex("by_owner", (q) => q.eq("owner", userId))
        .paginate({ numItems: 200, cursor: paginationResult.continueCursor });

      totalLinks += paginationResult.page.length;
      totalClicks += paginationResult.page.reduce((sum, link) => sum + link.clickCount, 0);
    }

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

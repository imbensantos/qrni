import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import type { Id } from "./_generated/dataModel";
import { generateShortCode, isValidCustomSlug } from "./lib/shortCode";
import { logAudit } from "./lib/auditLog";
import { checkPermission } from "./lib/permissions";
import { checkUrlSafety } from "./safeBrowsing";

async function ensureUrlSafe(url: string): Promise<void> {
  const result = await checkUrlSafety(url);
  if (!result.safe) {
    throw new Error(
      "This URL was flagged as potentially harmful and can't be shortened.",
    );
  }
}

const MAX_URL_LENGTH = 2048;
// Duplicate submission window: reject same URL + slug within 5 seconds
const DUPLICATE_WINDOW_MS = 5_000;

function validateDestinationUrl(url: string): void {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error("URL must start with http:// or https://");
  }
  if (url.length > MAX_URL_LENGTH) {
    throw new Error(`URL must be ${MAX_URL_LENGTH} characters or fewer`);
  }
}

// ============ ANONYMOUS LINK CREATION ============

// Internal mutation for anonymous link creation (called by action wrappers)
export const createAnonymousLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
    creatorIp: v.string(),
  },
  handler: async (ctx, args) => {
    validateDestinationUrl(args.destinationUrl);

    // Rate limit: 10 links/hr per IP
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const rateLimit = await ctx.db
      .query("rate_limits")
      .withIndex("by_ip", (q) => q.eq("ip", args.creatorIp))
      .first();

    if (rateLimit) {
      if (rateLimit.windowStart > oneHourAgo && rateLimit.count >= 10) {
        throw new Error(
          "You're creating links too fast. Please wait a bit and try again.",
        );
      }
      if (rateLimit.windowStart <= oneHourAgo) {
        await ctx.db.patch(rateLimit._id, {
          windowStart: Date.now(),
          count: 1,
        });
      } else {
        await ctx.db.patch(rateLimit._id, { count: rateLimit.count + 1 });
      }
    } else {
      await ctx.db.insert("rate_limits", {
        ip: args.creatorIp,
        windowStart: Date.now(),
        count: 1,
      });
    }

    // Duplicate submission guard: reject same URL created by the same IP within 5 seconds
    const recentDuplicate = await ctx.db
      .query("links")
      .withIndex("by_creator_ip", (q) => q.eq("creatorIp", args.creatorIp))
      .order("desc")
      .first();
    if (
      recentDuplicate &&
      recentDuplicate.destinationUrl === args.destinationUrl &&
      Date.now() - recentDuplicate.createdAt < DUPLICATE_WINDOW_MS
    ) {
      return {
        shortCode: recentDuplicate.shortCode,
        linkId: recentDuplicate._id,
      };
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      const existing = await ctx.db
        .query("links")
        .withIndex("by_short_code", (q) => q.eq("shortCode", shortCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      throw new Error(
        "Couldn't create a short link right now. Please try again.",
      );
    }

    const linkId = await ctx.db.insert("links", {
      shortCode,
      destinationUrl: args.destinationUrl,
      creatorIp: args.creatorIp,
      createdAt: Date.now(),
      clickCount: 0,
    });

    return { shortCode, linkId };
  },
});

// Public action: checks Safe Browsing then creates anonymous link
export const createAnonymousLink = action({
  args: {
    destinationUrl: v.string(),
    creatorIp: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createAnonymousLinkInternal, {
      destinationUrl: args.destinationUrl,
      creatorIp: args.creatorIp,
    });
  },
});

// Authenticated user creating a link with an auto-generated short code
export const createAutoSlugLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    validateDestinationUrl(args.destinationUrl);

    // Duplicate submission guard
    const recentDuplicate = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .order("desc")
      .first();
    if (
      recentDuplicate &&
      recentDuplicate.destinationUrl === args.destinationUrl &&
      Date.now() - recentDuplicate.createdAt < DUPLICATE_WINDOW_MS
    ) {
      return {
        shortCode: recentDuplicate.shortCode,
        linkId: recentDuplicate._id,
      };
    }

    // Generate unique short code
    let shortCode: string;
    let attempts = 0;
    do {
      shortCode = generateShortCode();
      const existing = await ctx.db
        .query("links")
        .withIndex("by_short_code", (q) => q.eq("shortCode", shortCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 5);

    if (attempts >= 5) {
      throw new Error(
        "Couldn't create a short link right now. Please try again.",
      );
    }

    const linkId = await ctx.db.insert("links", {
      shortCode,
      destinationUrl: args.destinationUrl,
      owner: user._id,
      autoSlug: true,
      createdAt: Date.now(),
      clickCount: 0,
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "link.create",
      resourceType: "link",
      resourceId: String(linkId),
      metadata: { slug: shortCode },
    });

    return { shortCode, linkId };
  },
});

export const createAutoSlugLink = action({
  args: {
    destinationUrl: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createAutoSlugLinkInternal, {
      destinationUrl: args.destinationUrl,
    });
  },
});

// ============ AUTHENTICATED MUTATIONS (internal) ============

export const createCustomSlugLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
    customSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Please sign in to create custom short links");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (!isValidCustomSlug(args.customSlug)) {
      throw new Error(
        "Short link name can only use letters, numbers, hyphens, and underscores (max 60 characters)",
      );
    }

    validateDestinationUrl(args.destinationUrl);

    // Check limit: 5 flat custom slugs per user
    const existingLinks = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .take(500);
    const flatCustomCount = existingLinks.filter(
      (l) => !l.namespace && !l.autoSlug,
    ).length;
    if (flatCustomCount >= 5) {
      throw new Error(
        "You've reached the limit of 5 custom short links. Use a namespace to create more!",
      );
    }

    // Duplicate submission guard: reject same URL + slug within 5 seconds
    const recentDuplicate = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .order("desc")
      .first();
    if (
      recentDuplicate &&
      recentDuplicate.destinationUrl === args.destinationUrl &&
      recentDuplicate.shortCode === args.customSlug &&
      Date.now() - recentDuplicate.createdAt < DUPLICATE_WINDOW_MS
    ) {
      return {
        shortCode: recentDuplicate.shortCode,
        linkId: recentDuplicate._id,
      };
    }

    // Check slug availability against existing links
    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) => q.eq("shortCode", args.customSlug))
      .first();
    if (existingLink)
      throw new Error(
        "That short link name is already taken — try another one",
      );

    // Check slug availability against existing namespaces
    const nsConflict = await ctx.db
      .query("namespaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.customSlug.toLowerCase()))
      .first();
    if (nsConflict)
      throw new Error("That name is already in use — try another one");

    const linkId = await ctx.db.insert("links", {
      shortCode: args.customSlug,
      destinationUrl: args.destinationUrl,
      owner: user._id,
      createdAt: Date.now(),
      clickCount: 0,
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "link.create",
      resourceType: "link",
      resourceId: String(linkId),
      metadata: { slug: args.customSlug },
    });

    return { shortCode: args.customSlug, linkId };
  },
});

// Public action: checks Safe Browsing then creates custom slug link
export const createCustomSlugLink = action({
  args: {
    destinationUrl: v.string(),
    customSlug: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createCustomSlugLinkInternal, {
      destinationUrl: args.destinationUrl,
      customSlug: args.customSlug,
    });
  },
});

export const createNamespacedLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
    namespaceId: v.id("namespaces"),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    await checkPermission(ctx, args.namespaceId, user._id, "editor");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");

    validateDestinationUrl(args.destinationUrl);

    // Duplicate submission guard: reject same URL + slug within 5 seconds
    const compositeShortCode = `${namespace.slug}/${args.slug}`;
    const recentDuplicate = await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", args.namespaceId).eq("namespaceSlug", args.slug),
      )
      .first();
    if (
      recentDuplicate &&
      recentDuplicate.destinationUrl === args.destinationUrl &&
      Date.now() - recentDuplicate.createdAt < DUPLICATE_WINDOW_MS
    ) {
      return { shortCode: compositeShortCode, linkId: recentDuplicate._id };
    }

    const existing = await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", args.namespaceId).eq("namespaceSlug", args.slug),
      )
      .first();
    if (existing)
      throw new Error(
        "That name already exists in this namespace — try another one",
      );

    const linkId = await ctx.db.insert("links", {
      shortCode: compositeShortCode,
      namespace: args.namespaceId,
      namespaceSlug: args.slug,
      destinationUrl: args.destinationUrl,
      owner: user._id,
      createdAt: Date.now(),
      clickCount: 0,
    });

    await ctx.db.patch(args.namespaceId, { lastActiveAt: Date.now() });

    await logAudit(ctx, {
      userId: user._id,
      action: "link.create",
      resourceType: "link",
      resourceId: String(linkId),
      metadata: { namespace: String(args.namespaceId), slug: args.slug },
    });

    return { shortCode: compositeShortCode, linkId };
  },
});

// Public action: checks Safe Browsing then creates namespaced link
export const createNamespacedLink = action({
  args: {
    destinationUrl: v.string(),
    namespaceId: v.id("namespaces"),
    slug: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createNamespacedLinkInternal, {
      destinationUrl: args.destinationUrl,
      namespaceId: args.namespaceId,
      slug: args.slug,
    });
  },
});

// ============ QUERIES ============

export const getLink = query({
  args: { shortCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) => q.eq("shortCode", args.shortCode))
      .first();
  },
});

export const listMyLinks = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    return await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .order("desc")
      .take(500);
  },
});

export const deleteLink = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("Link not found");

    if (link.owner !== user._id) {
      if (link.namespace) {
        await checkPermission(ctx, link.namespace, user._id, "editor");
      } else {
        throw new Error("Not authorized");
      }
    }

    await ctx.db.delete(args.linkId);

    await logAudit(ctx, {
      userId: user._id,
      action: "link.delete",
      resourceType: "link",
      resourceId: String(args.linkId),
    });
  },
});

export const updateLinkInternal = internalMutation({
  args: {
    linkId: v.id("links"),
    newSlug: v.optional(v.string()),
    newDestinationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("Link not found");

    if (link.owner !== user._id) {
      if (link.namespace) {
        await checkPermission(ctx, link.namespace, user._id, "editor");
      } else {
        throw new Error("Not authorized");
      }
    }

    const updates: Record<string, unknown> = {};

    if (args.newDestinationUrl !== undefined) {
      validateDestinationUrl(args.newDestinationUrl);
      updates.destinationUrl = args.newDestinationUrl;
    }

    if (args.newSlug !== undefined) {
      if (!isValidCustomSlug(args.newSlug)) {
        throw new Error(
          "Short link name can only use letters, numbers, hyphens, and underscores (max 60 characters)",
        );
      }

      let newShortCode: string;
      if (link.namespace) {
        const ns = await ctx.db.get(link.namespace);
        if (!ns) throw new Error("Namespace not found");
        const existing = await ctx.db
          .query("links")
          .withIndex("by_namespace_slug", (q) =>
            q
              .eq("namespace", link.namespace!)
              .eq("namespaceSlug", args.newSlug!),
          )
          .first();
        if (existing && existing._id !== link._id)
          throw new Error(
            "That name already exists in this namespace — try another one",
          );
        newShortCode = `${ns.slug}/${args.newSlug}`;
        updates.namespaceSlug = args.newSlug;
      } else {
        const existing = await ctx.db
          .query("links")
          .withIndex("by_short_code", (q) => q.eq("shortCode", args.newSlug!))
          .first();
        if (existing && existing._id !== link._id)
          throw new Error(
            "That short link name is already taken — try another one",
          );
        newShortCode = args.newSlug;
      }
      updates.shortCode = newShortCode;
      if (link.autoSlug && !link.namespace) {
        const allLinks = await ctx.db
          .query("links")
          .withIndex("by_owner", (q) => q.eq("owner", user._id))
          .take(500);
        const customCount = allLinks.filter(
          (l) => !l.namespace && !l.autoSlug,
        ).length;
        if (customCount >= 5) {
          throw new Error(
            "You've reached the limit of 5 custom short links. Use a namespace to create more!",
          );
        }
        updates.autoSlug = false;
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.linkId, updates);

      await logAudit(ctx, {
        userId: user._id,
        action: "link.update",
        resourceType: "link",
        resourceId: String(args.linkId),
        metadata: { updates },
      });
    }
  },
});

// Public action: checks Safe Browsing for new URLs then updates link
export const updateLink = action({
  args: {
    linkId: v.id("links"),
    newSlug: v.optional(v.string()),
    newDestinationUrl: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    if (args.newDestinationUrl !== undefined) {
      await ensureUrlSafe(args.newDestinationUrl);
    }

    await ctx.runMutation(internal.links.updateLinkInternal, {
      linkId: args.linkId,
      newSlug: args.newSlug,
      newDestinationUrl: args.newDestinationUrl,
    });
  },
});

export const listNamespaceLinks = query({
  args: {
    namespaceId: v.id("namespaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    try {
      await checkPermission(ctx, args.namespaceId, user._id, "viewer");
    } catch {
      return [];
    }

    return await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", args.namespaceId),
      )
      .order("desc")
      .take(500);
  },
});

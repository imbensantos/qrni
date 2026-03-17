import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import { generateShortCode, isValidCustomSlug } from "./lib/shortCode";
import { logAudit } from "./lib/auditLog";

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

export const createAnonymousLink = mutation({
  args: {
    destinationUrl: v.string(),
    // creatorIp is now the server-extracted IP forwarded from the HTTP layer.
    // The field name is preserved for schema compatibility; see convex/http.ts
    // for where the real IP is extracted from request headers.
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
        throw new Error("Rate limit exceeded. Try again later.");
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
        "Failed to generate unique short code. Please try again.",
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

// Internal variant called by the HTTP layer with a server-extracted IP address.
// Prefer calling this over createAnonymousLink when the request goes through
// an HTTP action so the rate limit key is the real client IP rather than a
// client-supplied session identifier.
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
        throw new Error("Rate limit exceeded. Try again later.");
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
        "Failed to generate unique short code. Please try again.",
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

// ============ AUTHENTICATED MUTATIONS ============

export const createCustomSlugLink = mutation({
  args: {
    destinationUrl: v.string(),
    customSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in to create custom slugs");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    if (!isValidCustomSlug(args.customSlug)) {
      throw new Error(
        "Slug must be 1-60 chars: letters, numbers, hyphens, underscores",
      );
    }

    validateDestinationUrl(args.destinationUrl);

    // Check limit: 5 flat custom slugs per user
    const existingLinks = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .take(500);
    const flatCustomCount = existingLinks.filter((l) => !l.namespace).length;
    if (flatCustomCount >= 5) {
      throw new Error(
        "You've used all 5 custom slugs. Create a namespace for unlimited links!",
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
    if (existingLink) throw new Error("This slug is already taken");

    // Check slug availability against existing namespaces
    const nsConflict = await ctx.db
      .query("namespaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.customSlug.toLowerCase()))
      .first();
    if (nsConflict) throw new Error("This slug conflicts with a namespace");

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

export const createNamespacedLink = mutation({
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

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");

    const isOwner = namespace.owner === user._id;
    const membership = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace_user", (q) =>
        q.eq("namespace", args.namespaceId).eq("user", user._id),
      )
      .first();
    const isEditor = membership?.role === "editor";

    if (!isOwner && !isEditor) {
      throw new Error(
        "You don't have permission to add links to this namespace",
      );
    }

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
    if (existing) throw new Error("This slug already exists in this namespace");

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
    if (link.owner !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.linkId);

    await logAudit(ctx, {
      userId: user._id,
      action: "link.delete",
      resourceType: "link",
      resourceId: String(args.linkId),
    });
  },
});

export const updateLink = mutation({
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
    if (link.owner !== user._id) throw new Error("Not authorized");

    const updates: Record<string, unknown> = {};

    if (args.newDestinationUrl !== undefined) {
      validateDestinationUrl(args.newDestinationUrl);
      updates.destinationUrl = args.newDestinationUrl;
    }

    if (args.newSlug !== undefined) {
      if (!isValidCustomSlug(args.newSlug)) {
        throw new Error(
          "Slug must be 1-60 chars: letters, numbers, hyphens, underscores",
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
          throw new Error("This slug already exists in this namespace");
        newShortCode = `${ns.slug}/${args.newSlug}`;
        updates.namespaceSlug = args.newSlug;
      } else {
        const existing = await ctx.db
          .query("links")
          .withIndex("by_short_code", (q) => q.eq("shortCode", args.newSlug!))
          .first();
        if (existing && existing._id !== link._id)
          throw new Error("This slug is already taken");
        newShortCode = args.newSlug;
      }
      updates.shortCode = newShortCode;
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

export const listNamespaceLinks = query({
  args: {
    namespaceId: v.id("namespaces"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user) return [];

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) return [];

    const isOwner = namespace.owner === user._id;
    if (!isOwner) {
      const membership = await ctx.db
        .query("namespace_members")
        .withIndex("by_namespace_user", (q) =>
          q.eq("namespace", args.namespaceId).eq("user", user._id),
        )
        .first();
      if (!membership) return [];
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

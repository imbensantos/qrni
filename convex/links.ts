import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import { generateShortCode, isValidCustomSlug } from "./lib/shortCode";

// ============ ANONYMOUS LINK CREATION ============

export const createAnonymousLink = mutation({
  args: {
    destinationUrl: v.string(),
    creatorIp: v.string(),
  },
  handler: async (ctx, args) => {
    if (
      !args.destinationUrl.startsWith("http://") &&
      !args.destinationUrl.startsWith("https://")
    ) {
      throw new Error("URL must start with http:// or https://");
    }

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
        await ctx.db.patch(rateLimit._id, { windowStart: Date.now(), count: 1 });
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
      throw new Error("Failed to generate unique short code. Please try again.");
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in to create custom slugs");

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    if (!isValidCustomSlug(args.customSlug)) {
      throw new Error("Slug must be 1-60 chars: letters, numbers, hyphens, underscores");
    }

    // Check limit: 5 flat custom slugs per user
    const existingLinks = await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .collect();
    const flatCustomCount = existingLinks.filter((l) => !l.namespace).length;
    if (flatCustomCount >= 5) {
      throw new Error("You've used all 5 custom slugs. Create a namespace for unlimited links!");
    }

    if (
      !args.destinationUrl.startsWith("http://") &&
      !args.destinationUrl.startsWith("https://")
    ) {
      throw new Error("URL must start with http:// or https://");
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");

    const isOwner = namespace.owner === user._id;
    const membership = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace_user", (q) =>
        q.eq("namespace", args.namespaceId).eq("user", user._id)
      )
      .first();
    const isEditor = membership?.role === "editor";

    if (!isOwner && !isEditor) {
      throw new Error("You don't have permission to add links to this namespace");
    }

    if (
      !args.destinationUrl.startsWith("http://") &&
      !args.destinationUrl.startsWith("https://")
    ) {
      throw new Error("URL must start with http:// or https://");
    }

    const existing = await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) =>
        q.eq("namespace", args.namespaceId).eq("namespaceSlug", args.slug)
      )
      .first();
    if (existing) throw new Error("This slug already exists in this namespace");

    const linkId = await ctx.db.insert("links", {
      shortCode: `${namespace.slug}/${args.slug}`,
      namespace: args.namespaceId,
      namespaceSlug: args.slug,
      destinationUrl: args.destinationUrl,
      owner: user._id,
      createdAt: Date.now(),
      clickCount: 0,
    });

    await ctx.db.patch(args.namespaceId, { lastActiveAt: Date.now() });

    return { shortCode: `${namespace.slug}/${args.slug}`, linkId };
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) return [];

    return await ctx.db
      .query("links")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .order("desc")
      .collect();
  },
});

export const deleteLink = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("Link not found");
    if (link.owner !== user._id) throw new Error("Not authorized");

    await ctx.db.delete(args.linkId);
  },
});

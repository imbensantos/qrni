import { action, internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

import type { Id } from "./_generated/dataModel";
import { isValidCustomSlug } from "./lib/shortCode";
import { logAudit } from "./lib/auditLog";
import { checkPermission } from "./lib/permissions";
import { validateDestinationUrl } from "./lib/validation";
import { checkUrlSafety } from "./safeBrowsing";
import {
  checkDuplicateSubmission,
  generateUniqueShortCode,
  generateUniqueNamespaceSlug,
  checkAnonymousRateLimit,
  checkAuthRateLimit,
} from "./lib/linkHelpers";
import { MAX_CUSTOM_LINKS_PER_USER, ERR } from "./lib/constants";

/** Count custom (non-auto, non-namespaced) links owned by user, capped at limit+1. */
async function countCustomLinks(
  ctx: { db: MutationCtx["db"] },
  userId: Id<"users">,
): Promise<number> {
  const links = await ctx.db
    .query("links")
    .withIndex("by_owner", (q) => q.eq("owner", userId))
    .filter((q) =>
      q.and(
        q.eq(q.field("namespace"), undefined),
        q.or(q.eq(q.field("autoSlug"), undefined), q.eq(q.field("autoSlug"), false)),
      ),
    )
    .take(MAX_CUSTOM_LINKS_PER_USER + 1);
  return links.length;
}

async function ensureUrlSafe(url: string): Promise<void> {
  const result = await checkUrlSafety(url);
  if (!result.safe) {
    throw new Error(ERR.UNSAFE_URL);
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

    // Rate limit: anonymous links per IP (also cleans up expired records)
    await checkAnonymousRateLimit(ctx, args.creatorIp);

    // Duplicate submission guard
    const duplicate = await checkDuplicateSubmission(ctx, {
      kind: "anonymous",
      creatorIp: args.creatorIp,
      destinationUrl: args.destinationUrl,
    });
    if (duplicate) return duplicate;

    // Generate unique short code
    const shortCode = await generateUniqueShortCode(ctx);

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
    sessionId: v.string(),
  },
  handler: async (ctx, args): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createAnonymousLinkInternal, {
      destinationUrl: args.destinationUrl,
      creatorIp: args.sessionId,
    });
  },
});

// Authenticated user creating a link with an auto-generated short code
// "shortCode" here is the full routable path; for auto-generated links it's
// a random alphanumeric string (e.g. "xK9mP2q"). See schema.ts for the
// distinction between shortCode and namespaceSlug.
export const createAutoSlugLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    validateDestinationUrl(args.destinationUrl);

    // Rate limit authenticated users
    await checkAuthRateLimit(ctx, user._id);

    // Duplicate submission guard
    const duplicate = await checkDuplicateSubmission(ctx, {
      kind: "authenticated",
      ownerId: user._id,
      destinationUrl: args.destinationUrl,
    });
    if (duplicate) return duplicate;

    // Generate unique short code
    const shortCode = await generateUniqueShortCode(ctx);

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
  handler: async (ctx, args): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createAutoSlugLinkInternal, {
      destinationUrl: args.destinationUrl,
    });
  },
});

// ============ AUTHENTICATED MUTATIONS (internal) ============

// "customSlug" is a user-chosen identifier that becomes the shortCode
// (the full routable path). For non-namespaced links, shortCode === customSlug.
export const createCustomSlugLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
    customSlug: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    if (!isValidCustomSlug(args.customSlug)) {
      throw new Error(ERR.INVALID_CUSTOM_SLUG);
    }

    validateDestinationUrl(args.destinationUrl);

    // Rate limit authenticated users
    await checkAuthRateLimit(ctx, user._id);

    // Check limit: custom (non-auto, non-namespaced) short links per user
    const customCount = await countCustomLinks(ctx, user._id);
    if (customCount >= MAX_CUSTOM_LINKS_PER_USER) {
      throw new Error(ERR.CUSTOM_LINK_LIMIT);
    }

    // Duplicate submission guard
    const duplicate = await checkDuplicateSubmission(ctx, {
      kind: "authenticated",
      ownerId: user._id,
      destinationUrl: args.destinationUrl,
      shortCode: args.customSlug,
    });
    if (duplicate) return duplicate;

    // Check slug availability against existing links
    const existingLink = await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) => q.eq("shortCode", args.customSlug))
      .first();
    if (existingLink) throw new Error(ERR.SLUG_TAKEN);

    // Check slug availability against existing namespaces
    const nsConflict = await ctx.db
      .query("namespaces")
      .withIndex("by_slug", (q) => q.eq("slug", args.customSlug.toLowerCase()))
      .first();
    if (nsConflict) throw new Error(ERR.NAME_IN_USE);

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
  handler: async (ctx, args): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createCustomSlugLinkInternal, {
      destinationUrl: args.destinationUrl,
      customSlug: args.customSlug,
    });
  },
});

// For namespaced links, "slug" is the namespace-local portion (stored as
// namespaceSlug), while "shortCode" is the composite routable path
// ("namespace-slug/link-slug"). See schema.ts for the full explanation.
export const createNamespacedLinkInternal = internalMutation({
  args: {
    destinationUrl: v.string(),
    namespaceId: v.id("namespaces"),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    const { namespace } = await checkPermission(ctx, args.namespaceId, user._id, "editor");

    validateDestinationUrl(args.destinationUrl);

    // Rate limit authenticated users
    await checkAuthRateLimit(ctx, user._id);

    // Auto-generate slug if not provided
    let slug: string;
    let isAutoSlug = false;
    if (!args.slug) {
      isAutoSlug = true;
      slug = await generateUniqueNamespaceSlug(ctx, args.namespaceId);
    } else {
      slug = args.slug;

      // Duplicate submission guard
      const duplicate = await checkDuplicateSubmission(ctx, {
        kind: "namespaced",
        namespaceId: args.namespaceId,
        slug,
        destinationUrl: args.destinationUrl,
      });
      if (duplicate) {
        const compositeShortCode = `${namespace.slug}/${slug}`;
        return { shortCode: compositeShortCode, linkId: duplicate.linkId };
      }

      const existing = await ctx.db
        .query("links")
        .withIndex("by_namespace_slug", (q) =>
          q.eq("namespace", args.namespaceId).eq("namespaceSlug", slug),
        )
        .first();
      if (existing) throw new Error(ERR.NAMESPACE_SLUG_TAKEN);
    }

    const compositeShortCode = `${namespace.slug}/${slug}`;

    const linkId = await ctx.db.insert("links", {
      shortCode: compositeShortCode,
      namespace: args.namespaceId,
      namespaceSlug: slug,
      destinationUrl: args.destinationUrl,
      owner: user._id,
      autoSlug: isAutoSlug || undefined,
      createdAt: Date.now(),
      clickCount: 0,
    });

    await ctx.db.patch(args.namespaceId, { lastActiveAt: Date.now() });

    await logAudit(ctx, {
      userId: user._id,
      action: "link.create",
      resourceType: "link",
      resourceId: String(linkId),
      metadata: { namespace: String(args.namespaceId), slug },
    });

    return { shortCode: compositeShortCode, linkId };
  },
});

// Public action: checks Safe Browsing then creates namespaced link
export const createNamespacedLink = action({
  args: {
    destinationUrl: v.string(),
    namespaceId: v.id("namespaces"),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ shortCode: string; linkId: Id<"links"> }> => {
    await ensureUrlSafe(args.destinationUrl);

    return await ctx.runMutation(internal.links.createNamespacedLinkInternal, {
      destinationUrl: args.destinationUrl,
      namespaceId: args.namespaceId,
      slug: args.slug,
    });
  },
});

// ============ QUERIES ============

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
      .take(5000);
  },
});

export const deleteLink = mutation({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error(ERR.LINK_NOT_FOUND_OR_DENIED);

    if (link.owner !== user._id) {
      if (link.namespace) {
        try {
          await checkPermission(ctx, link.namespace, user._id, "editor");
        } catch {
          throw new Error(ERR.LINK_NOT_FOUND_OR_DENIED);
        }
      } else {
        throw new Error(ERR.LINK_NOT_FOUND_OR_DENIED);
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

export const deleteLinks = mutation({
  args: { linkIds: v.array(v.id("links")) },
  handler: async (ctx, args) => {
    if (args.linkIds.length === 0) return;

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    const links = await Promise.all(
      args.linkIds.map(async (linkId) => {
        const link = await ctx.db.get(linkId);
        if (!link) throw new Error(`Link not found: ${linkId}`);
        return link;
      }),
    );

    for (const link of links) {
      if (link.owner !== user._id) {
        if (link.namespace) {
          try {
            await checkPermission(ctx, link.namespace, user._id, "editor");
          } catch {
            throw new Error(`Permission denied for link: ${link.shortCode}`);
          }
        } else {
          throw new Error(`Permission denied for link: ${link.shortCode}`);
        }
      }
    }

    await Promise.all(
      links.map(async (link) => {
        await ctx.db.delete(link._id);
        await logAudit(ctx, {
          userId: user._id,
          action: "link.delete",
          resourceType: "link",
          resourceId: String(link._id),
        });
      }),
    );
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
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error(ERR.LINK_NOT_FOUND_OR_DENIED);

    if (link.owner !== user._id) {
      if (link.namespace) {
        try {
          await checkPermission(ctx, link.namespace, user._id, "editor");
        } catch {
          throw new Error(ERR.LINK_NOT_FOUND_OR_DENIED);
        }
      } else {
        throw new Error(ERR.LINK_NOT_FOUND_OR_DENIED);
      }
    }

    const updates: Record<string, unknown> = {};

    if (args.newDestinationUrl !== undefined) {
      validateDestinationUrl(args.newDestinationUrl);
      updates.destinationUrl = args.newDestinationUrl;
    }

    if (args.newSlug !== undefined) {
      if (!isValidCustomSlug(args.newSlug)) {
        throw new Error(ERR.INVALID_CUSTOM_SLUG);
      }

      let newShortCode: string;
      if (link.namespace) {
        const ns = await ctx.db.get(link.namespace);
        if (!ns) throw new Error(ERR.NAMESPACE_NOT_FOUND);
        const existing = await ctx.db
          .query("links")
          .withIndex("by_namespace_slug", (q) =>
            q.eq("namespace", link.namespace!).eq("namespaceSlug", args.newSlug!),
          )
          .first();
        if (existing && existing._id !== link._id) throw new Error(ERR.NAMESPACE_SLUG_TAKEN);
        newShortCode = `${ns.slug}/${args.newSlug}`;
        updates.namespaceSlug = args.newSlug;
      } else {
        const existing = await ctx.db
          .query("links")
          .withIndex("by_short_code", (q) => q.eq("shortCode", args.newSlug!))
          .first();
        if (existing && existing._id !== link._id) throw new Error(ERR.SLUG_TAKEN);
        newShortCode = args.newSlug;
      }
      updates.shortCode = newShortCode;
      if (link.autoSlug && !link.namespace) {
        const customCount = await countCustomLinks(ctx, user._id);
        if (customCount >= MAX_CUSTOM_LINKS_PER_USER) {
          throw new Error(ERR.CUSTOM_LINK_LIMIT);
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

// Security: Returns [] on permission denial intentionally rather than throwing.
// This prevents namespace existence enumeration — an unauthorized caller cannot
// distinguish "namespace doesn't exist" from "namespace exists but I lack access".
export const listNamespaceLinks = query({
  args: { namespaceId: v.id("namespaces") },
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
      .withIndex("by_namespace_slug", (q) => q.eq("namespace", args.namespaceId))
      .order("desc")
      .take(5000);
  },
});

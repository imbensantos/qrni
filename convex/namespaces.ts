import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isValidSlug } from "./lib/shortCode";
import { logAudit } from "./lib/auditLog";
import { checkPermission } from "./lib/permissions";
import { sanitizeText } from "./lib/validation";
import {
  MAX_NAMESPACES_PER_USER,
  MAX_DESCRIPTION_LENGTH,
  ERR,
  RESERVED_SLUGS,
} from "./lib/constants";

export const create = mutation({
  args: { slug: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    const slug = args.slug.toLowerCase();

    if (!isValidSlug(slug)) {
      throw new Error(ERR.INVALID_NAMESPACE_SLUG);
    }

    if (RESERVED_SLUGS.has(slug)) {
      throw new Error(ERR.NAMESPACE_RESERVED);
    }

    const sanitizedDescription =
      args.description !== undefined ? sanitizeText(args.description) : undefined;

    if (
      sanitizedDescription !== undefined &&
      sanitizedDescription.length > MAX_DESCRIPTION_LENGTH
    ) {
      throw new Error(ERR.DESCRIPTION_TOO_LONG);
    }

    const ownedNamespaces = await ctx.db
      .query("namespaces")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .take(100);
    if (ownedNamespaces.length >= MAX_NAMESPACES_PER_USER) {
      throw new Error(ERR.NAMESPACE_LIMIT);
    }

    const existing = await ctx.db
      .query("namespaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    if (existing) throw new Error(ERR.NAMESPACE_TAKEN);

    const linkConflict = await ctx.db
      .query("links")
      .withIndex("by_short_code", (q) => q.eq("shortCode", slug))
      .first();
    if (linkConflict) throw new Error(ERR.NAMESPACE_LINK_CONFLICT);

    const namespaceId = await ctx.db.insert("namespaces", {
      owner: user._id,
      slug,
      description: sanitizedDescription,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "namespace.create",
      resourceType: "namespace",
      resourceId: String(namespaceId),
      metadata: { slug },
    });

    return namespaceId;
  },
});

export const update = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    newSlug: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    await checkPermission(ctx, args.namespaceId, user._id, "owner");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    const updates: Record<string, unknown> = {};

    // Handle description update
    if (args.description !== undefined) {
      const sanitizedDescription = sanitizeText(args.description);
      if (sanitizedDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(ERR.DESCRIPTION_TOO_LONG);
      }
      updates.description = sanitizedDescription || undefined;
    }

    // Handle slug rename
    if (args.newSlug !== undefined) {
      const slug = args.newSlug.toLowerCase();

      if (!isValidSlug(slug)) {
        throw new Error(ERR.INVALID_NAMESPACE_SLUG);
      }

      if (RESERVED_SLUGS.has(slug)) {
        throw new Error(ERR.NAMESPACE_RESERVED);
      }

      if (slug !== namespace.slug) {
        // Safe: Convex mutations are fully serialized (OCC-based transactions),
        // so this check-then-update is atomic — no concurrent rename can claim
        // the same slug between the uniqueness check and the patch below.
        const existing = await ctx.db
          .query("namespaces")
          .withIndex("by_slug", (q) => q.eq("slug", slug))
          .first();
        if (existing) throw new Error(ERR.NAMESPACE_TAKEN);

        const linkConflict = await ctx.db
          .query("links")
          .withIndex("by_short_code", (q) => q.eq("shortCode", slug))
          .first();
        if (linkConflict) throw new Error(ERR.NAMESPACE_LINK_CONFLICT);

        // Issue #9: Update all links FIRST, then update the namespace slug.
        // This way if a link update fails, the old slug is still valid and
        // the namespace remains in a consistent state.
        // Uses .collect() to process all links regardless of count.
        const links = await ctx.db
          .query("links")
          .withIndex("by_namespace_slug", (q) => q.eq("namespace", args.namespaceId))
          .collect();
        for (const link of links) {
          if (link.namespaceSlug) {
            await ctx.db.patch(link._id, {
              shortCode: `${slug}/${link.namespaceSlug}`,
            });
          }
        }

        updates.slug = slug;
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(args.namespaceId, updates);

      await logAudit(ctx, {
        userId: user._id,
        action: "namespace.update",
        resourceType: "namespace",
        resourceId: String(args.namespaceId),
        metadata: { updates },
      });
    }
  },
});

export const listMine = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { owned: [], collaborated: [] };

    const user = await ctx.db.get(userId);
    if (!user) return { owned: [], collaborated: [] };

    const owned = await ctx.db
      .query("namespaces")
      .withIndex("by_owner", (q) => q.eq("owner", user._id))
      .take(100);

    const memberships = await ctx.db
      .query("namespace_members")
      .withIndex("by_user", (q) => q.eq("user", user._id))
      .take(100);

    const collaborated = await Promise.all(
      memberships.map(async (m) => {
        const ns = await ctx.db.get(m.namespace);
        return ns ? { ...ns, role: m.role } : null;
      }),
    );

    return { owned, collaborated: collaborated.filter(Boolean) };
  },
});

export const remove = mutation({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error(ERR.MUST_BE_SIGNED_IN);

    const user = await ctx.db.get(userId);
    if (!user) throw new Error(ERR.USER_NOT_FOUND);

    await checkPermission(ctx, args.namespaceId, user._id, "owner");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error(ERR.NAMESPACE_NOT_FOUND);

    // Cascade delete: links, members, invites.
    // Uses .collect() to ensure ALL related records are deleted, not just the
    // first 500 (which was the previous bug with .take(500)).
    const links = await ctx.db
      .query("links")
      .withIndex("by_namespace_slug", (q) => q.eq("namespace", args.namespaceId))
      .collect();
    for (const link of links) await ctx.db.delete(link._id);

    const members = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .collect();
    for (const member of members) await ctx.db.delete(member._id);

    const invites = await ctx.db
      .query("namespace_invites")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .collect();
    for (const invite of invites) await ctx.db.delete(invite._id);

    await logAudit(ctx, {
      userId: user._id,
      action: "namespace.delete",
      resourceType: "namespace",
      resourceId: String(args.namespaceId),
      metadata: { slug: namespace.slug },
    });

    await ctx.db.delete(args.namespaceId);
  },
});

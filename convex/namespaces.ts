import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { isValidSlug } from "./lib/shortCode";

const RESERVED_SLUGS = [
  // App routes
  "admin", "app", "www", "help", "support", "about", "blog", "settings", "dashboard",
  // Auth routes (used by Convex auth HTTP handlers)
  "api", "login", "signup", "signin", "signout", "auth", "oauth", "callback",
  ".well-known",
];

export const create = mutation({
  args: { slug: v.string(), description: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const slug = args.slug.toLowerCase();

    if (!isValidSlug(slug)) {
      throw new Error("Namespace must be 3-30 chars: lowercase letters, numbers, hyphens");
    }

    if (RESERVED_SLUGS.includes(slug)) {
      throw new Error("This namespace is reserved");
    }

    if (args.description !== undefined && args.description.length > 500) {
      throw new Error("Description must be 500 characters or fewer");
    }

    const ownedNamespaces = await ctx.db.query("namespaces").withIndex("by_owner", (q) => q.eq("owner", user._id)).take(100);
    if (ownedNamespaces.length >= 5) {
      throw new Error("You can create up to 5 namespaces");
    }

    const existing = await ctx.db.query("namespaces").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
    if (existing) throw new Error("This namespace is already taken");

    const linkConflict = await ctx.db.query("links").withIndex("by_short_code", (q) => q.eq("shortCode", slug)).first();
    if (linkConflict) throw new Error("This name conflicts with an existing short link");

    return await ctx.db.insert("namespaces", {
      owner: user._id,
      slug,
      description: args.description,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
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
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id) throw new Error("Only the owner can edit a namespace");

    const updates: Record<string, unknown> = {};

    // Handle description update
    if (args.description !== undefined) {
      if (args.description.length > 500) {
        throw new Error("Description must be 500 characters or fewer");
      }
      updates.description = args.description || undefined;
    }

    // Handle slug rename
    if (args.newSlug !== undefined) {
      const slug = args.newSlug.toLowerCase();

      if (!isValidSlug(slug)) {
        throw new Error("Namespace must be 3-30 chars: lowercase letters, numbers, hyphens");
      }

      if (RESERVED_SLUGS.includes(slug)) {
        throw new Error("This namespace is reserved");
      }

      if (slug !== namespace.slug) {
        // Safe: Convex mutations are fully serialized (OCC-based transactions),
        // so this check-then-update is atomic — no concurrent rename can claim
        // the same slug between the uniqueness check and the patch below.
        const existing = await ctx.db.query("namespaces").withIndex("by_slug", (q) => q.eq("slug", slug)).first();
        if (existing) throw new Error("This namespace is already taken");

        const linkConflict = await ctx.db.query("links").withIndex("by_short_code", (q) => q.eq("shortCode", slug)).first();
        if (linkConflict) throw new Error("This name conflicts with an existing short link");

        // Update all links in this namespace to use the new slug prefix
        const links = await ctx.db.query("links").withIndex("by_namespace_slug", (q) => q.eq("namespace", args.namespaceId)).take(500);
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
    }
  },
});

export const listMine = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { owned: [], collaborated: [] };

    const user = await ctx.db.get(userId);
    if (!user) return { owned: [], collaborated: [] };

    const owned = await ctx.db.query("namespaces").withIndex("by_owner", (q) => q.eq("owner", user._id)).take(100);

    const memberships = await ctx.db.query("namespace_members").withIndex("by_user", (q) => q.eq("user", user._id)).take(100);

    const collaborated = await Promise.all(
      memberships.map(async (m) => {
        const ns = await ctx.db.get(m.namespace);
        return ns ? { ...ns, role: m.role } : null;
      })
    );

    return { owned, collaborated: collaborated.filter(Boolean) };
  },
});

export const remove = mutation({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id) throw new Error("Only the owner can delete a namespace");

    // Cascade delete: links, members, invites
    const links = await ctx.db.query("links").withIndex("by_namespace_slug", (q) => q.eq("namespace", args.namespaceId)).take(500);
    for (const link of links) await ctx.db.delete(link._id);

    const members = await ctx.db.query("namespace_members").withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId)).take(100);
    for (const member of members) await ctx.db.delete(member._id);

    const invites = await ctx.db.query("namespace_invites").withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId)).take(50);
    for (const invite of invites) await ctx.db.delete(invite._id);

    await ctx.db.delete(args.namespaceId);
  },
});

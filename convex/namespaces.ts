import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { isValidSlug } from "./lib/shortCode";

const RESERVED_SLUGS = ["admin", "api", "app", "www", "help", "support", "about", "blog", "login", "signup", "settings"];

export const create = mutation({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const user = await ctx.db.query("users").withIndex("by_google_id", (q) => q.eq("googleId", identity.subject)).first();
    if (!user) throw new Error("User not found");

    const slug = args.slug.toLowerCase();

    if (!isValidSlug(slug)) {
      throw new Error("Namespace must be 3-30 chars: lowercase letters, numbers, hyphens");
    }

    if (RESERVED_SLUGS.includes(slug)) {
      throw new Error("This namespace is reserved");
    }

    const ownedNamespaces = await ctx.db.query("namespaces").withIndex("by_owner", (q) => q.eq("owner", user._id)).collect();
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
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    });
  },
});

export const listMine = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { owned: [], collaborated: [] };

    const user = await ctx.db.query("users").withIndex("by_google_id", (q) => q.eq("googleId", identity.subject)).first();
    if (!user) return { owned: [], collaborated: [] };

    const owned = await ctx.db.query("namespaces").withIndex("by_owner", (q) => q.eq("owner", user._id)).collect();

    const memberships = await ctx.db.query("namespace_members").withIndex("by_user", (q) => q.eq("user", user._id)).collect();

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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const user = await ctx.db.query("users").withIndex("by_google_id", (q) => q.eq("googleId", identity.subject)).first();
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id) throw new Error("Only the owner can delete a namespace");

    // Cascade delete: links, members, invites
    const links = await ctx.db.query("links").withIndex("by_namespace_slug", (q) => q.eq("namespace", args.namespaceId)).collect();
    for (const link of links) await ctx.db.delete(link._id);

    const members = await ctx.db.query("namespace_members").withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId)).collect();
    for (const member of members) await ctx.db.delete(member._id);

    const invites = await ctx.db.query("namespace_invites").withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId)).collect();
    for (const invite of invites) await ctx.db.delete(invite._id);

    await ctx.db.delete(args.namespaceId);
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { generateShortCode } from "./lib/shortCode";

const roleValidator = v.union(v.literal("editor"), v.literal("viewer"));

export const createEmailInvite = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    email: v.string(),
    role: roleValidator,
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
    if (namespace.owner !== user._id) throw new Error("Only the namespace owner can invite members");

    const token = generateShortCode(16);

    return await ctx.db.insert("namespace_invites", {
      namespace: namespace._id,
      role: args.role,
      type: "email",
      email: args.email.toLowerCase().trim(),
      token,
      createdBy: user._id,
      createdAt: Date.now(),
      revoked: false,
    });
  },
});

export const createInviteLink = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    role: roleValidator,
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
    if (namespace.owner !== user._id) throw new Error("Only the namespace owner can create invite links");

    const token = generateShortCode(16);

    await ctx.db.insert("namespace_invites", {
      namespace: namespace._id,
      role: args.role,
      type: "link",
      token,
      createdBy: user._id,
      createdAt: Date.now(),
      revoked: false,
    });

    return { token };
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_google_id", (q) => q.eq("googleId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const invite = await ctx.db
      .query("namespace_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) throw new Error("Invite not found");
    if (invite.revoked) throw new Error("This invite has been revoked");

    if (invite.type === "email") {
      if (!invite.email || invite.email !== user.email.toLowerCase().trim()) {
        throw new Error("This invite was sent to a different email address");
      }
    }

    const namespace = await ctx.db.get(invite.namespace);
    if (!namespace) throw new Error("Namespace not found");

    if (namespace.owner === user._id) {
      throw new Error("You already own this namespace");
    }

    const existingMembership = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace_user", (q) =>
        q.eq("namespace", invite.namespace).eq("user", user._id)
      )
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of this namespace");
    }

    return await ctx.db.insert("namespace_members", {
      namespace: invite.namespace,
      user: user._id,
      role: invite.role,
      invitedBy: invite.createdBy,
      joinedAt: Date.now(),
    });
  },
});

export const revokeInvite = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    inviteId: v.id("namespace_invites"),
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
    if (namespace.owner !== user._id) throw new Error("Only the namespace owner can revoke invites");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.namespace !== args.namespaceId) throw new Error("Invite does not belong to this namespace");

    await ctx.db.patch(args.inviteId, { revoked: true });
  },
});

export const removeMember = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    membershipId: v.id("namespace_members"),
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
    if (namespace.owner !== user._id) throw new Error("Only the namespace owner can remove members");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");
    if (membership.namespace !== args.namespaceId) throw new Error("Membership does not belong to this namespace");

    await ctx.db.delete(args.membershipId);
  },
});

export const listMembers = query({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    const members = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .collect();

    return await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.user);
        return {
          _id: member._id,
          role: member.role,
          joinedAt: member.joinedAt,
          invitedBy: member.invitedBy,
          user: memberUser
            ? { _id: memberUser._id, name: memberUser.name, email: memberUser.email }
            : null,
        };
      })
    );
  },
});

export const listInvites = query({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be signed in");

    return await ctx.db
      .query("namespace_invites")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .collect();
  },
});

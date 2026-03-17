import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateShortCode } from "./lib/shortCode";
import { logAudit } from "./lib/auditLog";

const roleValidator = v.union(v.literal("editor"), v.literal("viewer"));

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isValidEmail(email: string): boolean {
  return email.includes("@") && email.includes(".");
}

export const createEmailInvite = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    email: v.string(),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id)
      throw new Error("Only the namespace owner can invite members");

    const normalizedEmail = args.email.toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      throw new Error("Invalid email address");
    }

    const token = generateShortCode(16);

    const inviteId = await ctx.db.insert("namespace_invites", {
      namespace: namespace._id,
      role: args.role,
      type: "email",
      email: normalizedEmail,
      token,
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_TTL_MS,
      revoked: false,
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "member.invite",
      resourceType: "invite",
      resourceId: String(inviteId),
      metadata: {
        namespace: String(namespace._id),
        email: normalizedEmail,
        role: args.role,
      },
    });

    return inviteId;
  },
});

export const createInviteLink = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id)
      throw new Error("Only the namespace owner can create invite links");

    const token = generateShortCode(16);

    const inviteId = await ctx.db.insert("namespace_invites", {
      namespace: namespace._id,
      role: args.role,
      type: "link",
      token,
      createdBy: user._id,
      createdAt: Date.now(),
      expiresAt: Date.now() + INVITE_TTL_MS,
      revoked: false,
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "member.invite",
      resourceType: "invite",
      resourceId: String(inviteId),
      metadata: { namespace: String(namespace._id), role: args.role },
    });

    return { token };
  },
});

export const acceptInvite = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const invite = await ctx.db
      .query("namespace_invites")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!invite) throw new Error("Invite not found");
    if (invite.revoked) throw new Error("This invite has been revoked");

    if (invite.expiresAt !== undefined && Date.now() > invite.expiresAt) {
      throw new Error("This invite has expired");
    }

    if (invite.type === "email") {
      if (
        !invite.email ||
        !user.email ||
        invite.email !== user.email.toLowerCase().trim()
      ) {
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
        q.eq("namespace", invite.namespace).eq("user", user._id),
      )
      .first();

    if (existingMembership) {
      throw new Error("You are already a member of this namespace");
    }

    const membershipId = await ctx.db.insert("namespace_members", {
      namespace: invite.namespace,
      user: user._id,
      role: invite.role,
      invitedBy: invite.createdBy,
      joinedAt: Date.now(),
    });

    await logAudit(ctx, {
      userId: user._id,
      action: "member.join",
      resourceType: "member",
      resourceId: String(membershipId),
      metadata: { namespace: String(invite.namespace), role: invite.role },
    });

    return membershipId;
  },
});

export const revokeInvite = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    inviteId: v.id("namespace_invites"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id)
      throw new Error("Only the namespace owner can revoke invites");

    const invite = await ctx.db.get(args.inviteId);
    if (!invite) throw new Error("Invite not found");
    if (invite.namespace !== args.namespaceId)
      throw new Error("Invite does not belong to this namespace");

    await ctx.db.patch(args.inviteId, { revoked: true });

    await logAudit(ctx, {
      userId: user._id,
      action: "invite.revoke",
      resourceType: "invite",
      resourceId: String(args.inviteId),
      metadata: { namespace: String(args.namespaceId) },
    });
  },
});

export const removeMember = mutation({
  args: {
    namespaceId: v.id("namespaces"),
    membershipId: v.id("namespace_members"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== user._id)
      throw new Error("Only the namespace owner can remove members");

    const membership = await ctx.db.get(args.membershipId);
    if (!membership) throw new Error("Membership not found");
    if (membership.namespace !== args.namespaceId)
      throw new Error("Membership does not belong to this namespace");

    await ctx.db.delete(args.membershipId);

    await logAudit(ctx, {
      userId: user._id,
      action: "member.remove",
      resourceType: "member",
      resourceId: String(args.membershipId),
      metadata: { namespace: String(args.namespaceId) },
    });
  },
});

export const listMembers = query({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    // Verify caller is the namespace owner or a member
    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== userId) {
      const membership = await ctx.db
        .query("namespace_members")
        .withIndex("by_namespace_user", (q) =>
          q.eq("namespace", args.namespaceId).eq("user", userId),
        )
        .first();
      if (!membership)
        throw new Error("Not authorized to view members of this namespace");
    }

    const members = await ctx.db
      .query("namespace_members")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .take(100);

    return await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db.get(member.user);
        return {
          _id: member._id,
          role: member.role,
          joinedAt: member.joinedAt,
          invitedBy: member.invitedBy,
          user: memberUser
            ? {
                _id: memberUser._id,
                name: memberUser.name,
                email: memberUser.email,
              }
            : null,
        };
      }),
    );
  },
});

export const listInvites = query({
  args: { namespaceId: v.id("namespaces") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Must be signed in");

    // Verify caller is the namespace owner or a member
    const namespace = await ctx.db.get(args.namespaceId);
    if (!namespace) throw new Error("Namespace not found");
    if (namespace.owner !== userId) {
      const membership = await ctx.db
        .query("namespace_members")
        .withIndex("by_namespace_user", (q) =>
          q.eq("namespace", args.namespaceId).eq("user", userId),
        )
        .first();
      if (!membership)
        throw new Error("Not authorized to view invites for this namespace");
    }

    const now = Date.now();
    const invites = await ctx.db
      .query("namespace_invites")
      .withIndex("by_namespace", (q) => q.eq("namespace", args.namespaceId))
      .take(50);

    // Filter out expired invites — callers only need active/pending ones
    return invites.filter(
      (invite) => invite.expiresAt === undefined || invite.expiresAt > now,
    );
  },
});
